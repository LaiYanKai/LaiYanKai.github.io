"use strict";

const TO_MODIFY = 0;

Algs.AnyaInterval = class {
    /** @type {[number, number]} */
    left = [-1, -1];
    /** @type {[number, number]} */
    right = [-1, -1];
    /** @type {AnyaIntervalType} */
    type;

    constructor (p1, p2, type) {
        if (Utils.approxGt(p2[0], p1[0])) {
            this.left = p1.slice();
            this.right = p2.slice();
        } else {
            this.left = p2.slice();
            this.right = p1.slice();
        }
        this.type = type;

        Object.freeze(this.left);
        Object.freeze(this.right);
        Object.defineProperty(this, "type", { configurable: false, writable: false });
    }

    updateLeft(new_left) {
        this.left = new_left;
        Object.freeze(this.left);
    }

    updateRight(new_right) {
        this.right = new_right;
        Object.freeze(this.right);
    }

    toString() {
        if (this.type === AnyaIntervalType.OpenLeft)
            return `((${this.left}), (${this.right})]`;
        else if (this.type === AnyaIntervalType.OpenRight)
            return `[(${this.left}), (${this.right}))`;
        else if (this.type === AnyaIntervalType.Closed)
            return `[(${this.left}), (${this.right})]`;
        else
            return `???`;
    }
}

Algs.AnyaNode = class extends Algs.AbstractPriorityQueueNode {

    /** @type {Algs.AnyaInterval} */
    interval;
    /** @type {AnyaNodeType} */
    type;
    /** @type {boolean} */
    is_expansion = false;
    /** @type {boolean} */
    is_blocked;

    get f() { return this.costs[0]; }
    get g() { return this.costs[1]; }
    get h() { return this.costs[2]; }

    set f(new_f) {
        return (this.costs[0] = new_f);
    }
    set g(new_g) {
        return (this.costs[1] = new_g);
    }
    set h(new_h) {
        return (this.costs[2] = new_h);
    }

    get left_ray() { return Utils.subtractCoords(this.interval.left, this.coord); }
    get right_ray() { return Utils.subtractCoords(this.interval.right, this.coord); }

    get left_ray_norm() { return Utils.unitCoord(this.left_ray); }
    get right_ray_norm() { return Utils.unitCoord(this.right_ray); }

    constructor (coord, g, h, sprite, pq_sprite, type, interval, is_blocked = false) {
        super(coord, 3, sprite, pq_sprite);
        this.g = g;
        this.h = h;
        this.f = g + h;
        this.type = type;
        this.interval = interval;
        this.is_blocked = is_blocked

        // freeze node type & interval
        Object.defineProperty(this, "type", { configurable: false, writable: false });
        Object.defineProperty(this, "interval", { configurable: false, writable: false });
    }

    changeGandF(new_g, g_weight, h_weight) {
        this.g = new_g;
        this.f = this.g * g_weight + this.h * h_weight;
    }

    updateLeft(new_left) {
        this.interval.updateLeft(new_left);
    }

    updateRight(new_right) {
        this.interval.updateRight(new_right);
    }

    updateInterval(new_interval) {
        this.interval.updateLeft(new_interval.left);
        this.interval.updateRight(new_interval.right);
    }

    toString() {
        if (this.type === AnyaNodeType.Flat)
            return `Flat: (${this.interval.toString()}, ${this.coord})`;
        else if (this.type === AnyaNodeType.Cone)
            return `Cone: (${this.interval.toString()}, ${this.coord}) ${this.is_blocked ? "blocked" : ""}`;
        else if (this.type === AnyaNodeType.Start)
            return `Start: (${this.coord})`;
        else
            return `??? (${this.interval.toString()}, ${this.coord})`;
    }
};

Algs.Anya = class extends Algs.AbstractGridAlg {
    /** @type {Algs.AbstractPriorityQueue} */
    #open_list;
    // /** @type {Map<Algs.AnyaNode} */
    // #nodes;
    /** @returns {UI.AbstractCanvasArrow} */
    get #canvas_arrows() { return this.canvas(1); }
    /** @returns {Algs.AnyaCanvasCell | Algs.AnyaCanvasVertex} */
    get #canvas_nodes() { return this.canvas(0); }
    /** @returns {UI.AbstractLens} */
    get #lens_f() { return this.lens(1); }
    /** @returns {UI.AbstractLens} */
    get #lens_g() { return this.lens(2); }
    /** @returns {UI.AbstractLens} */
    get #lens_h() { return this.lens(3); }
    /** @type{UI.Step} */
    #step; // current step
    /** @type{Array<[number, number]>} */
    #path;
    /** @type{number} */
    #nodeCount = 0;
    /** @type {Map<[number, number], Algs.AStarNode>} */
    #min_g;
    /** @type {Map<[[[number, number], [number, number]], [number, number]], Algs.AStarNode>} */
    #nodes;

    // currying is requried to pass the isOccupied function to the tracer functions
    /** @type {function([number, number]):boolean} */
    #isOccupied;
    /** @type {function([number, number]):number} */
    #euclFromGoal;

    constructor (alg_params) {
        super(["1: Smallest", "2: Every Expansion"], 1, alg_params);

        // Set up canvases
        // let size;
        // const canvases = Array(2);
        // if (alg_params.node_type === AlgNodeType.Cell) {
        //     canvases[0] = new Algs.AnyaCanvasCell();
        //     this.#addArrow = this.#addArrowCell;
        //     size = ui_states.size;
        // }
        // else if (alg_params.node_type === AlgNodeType.Vertex) {
        //     canvases[0] = new Algs.AnyaCanvasVertex();
        //     this.#addArrow = this.#addArrowVertex;
        //     size = Utils.addCoords(ui_states.size, [1, 1]);
        // }
        // canvases[1] = new UI.AbstractCanvasArrow(1, 0); // put arrows above the nodes
        // super.setCanvases(canvases);
        const size = Utils.addCoords(ui_states.size, [1, 1]);
        const canvases = Array(2);
        canvases[0] = new Algs.AnyaCanvasNodes(0);
        canvases[1] = new UI.AbstractCanvasArrow(1, 0);
        super.setCanvases(canvases);

        // Check h_weight and g_weight
        if (typeof this.params.h_weight !== "number")
            throw new TypeError("h_weight must be a number!");
        if (typeof this.params.g_weight !== "number")
            throw new TypeError("g_weight must be a number!");

        // Set up lenses
        const lenses = [
            new UI.LensNone(this.#canvas_nodes, "None", "None"),
            new UI.LensRainbow(this.#canvas_nodes, AnyaAction.FCost, "F-cost", "$F"),
            new UI.LensRainbow(this.#canvas_nodes, AnyaAction.GCost, "G-cost", "$G"),
            new UI.LensRainbow(this.#canvas_nodes, AnyaAction.HCost, "H-cost", "$H"),
        ];
        super.setLenses(lenses, 0);

        // Set up Openlist
        let cost_indices = [];
        if (alg_params.fh === AlgFH.FOnly)
            cost_indices = [0];
        else if (alg_params.fh === AlgFH.FThenH)
            cost_indices = [0, 2];
        let is_fifo = alg_params.time_ordering === AlgTimeOrdering.FIFO
        this.#open_list = new Algs.AbstractPriorityQueue(
            is_fifo, ui_params.thresh, ...cost_indices
        );

        this.#min_g = new Map();
        for (let x = 0; x < size[0]; ++x) {
            for (let y = 0; y < size[1]; ++y) {
                this.#min_g.set(this.serialize([x, y]), Infinity);
            }
        }

        const lethal = this.getLethal();
        this.#isOccupied = coord => {
            try {
                const cell = ui.cells.at(coord);
                return cell === null || cell.cost >= lethal;
            } catch (e) {
                console.error(`isOccupied error. coord: ${coord}`);
                throw e;
            }
        }
        this.#euclFromGoal = (coord) => Utils.euclidean(Utils.subtractCoords(this.coord_goal, coord));

        // Set up Nodes and Sprites
        // this.#nodes = new Map();
        // for (let x = 0; x < size[0]; ++x) {
        //     for (let y = 0; y < size[1]; ++y) {
        //         const coord = [x, y];
        //         const id = this.serialize(coord);
        //         const h = this.metric(Utils.subtractCoords(this.coord_goal, coord));
        //         const sprite = this.#canvas_nodes.add(
        //             Infinity, Infinity, h, AnyaNodeStatus.Undiscovered,
        //             id, coord,
        //             true,
        //             SpriteActionClass.Transparent,
        //             0,
        //             SpriteActionOutline.None);
        //         this.#lens_h.updateBounds(h);
        //         sprite.vis(); // sprites are not visualized at the first step.
        //         const node = new Algs.AnyaNode(coord, Infinity, h, sprite, null);
        //         this.#nodes.set(id, node);
        //     }
        // }

        this.splitCorners = this.#splitCorners;
    }

    #splitCorners(anya_interval) {
        const isOccupied = this.#isOccupied;

        const left = anya_interval.left;
        const right = anya_interval.right;
        const left_rounded = [Math.floor(left[0]), left[1]];
        const intv_type = anya_interval.type;


        const not_upper_bound = left[1] != ui_states.size[1];
        const not_lower_bound = left[1] != 0;

        // no valid row above or below them; at edge of map
        if (!not_upper_bound || !not_lower_bound)
            return [[anya_interval], []];

        const coords = [];
        let cur = left;
        while (cur[0] < right[0]) {
            coords.push(cur);
            cur = HorizontalCornerTracer.run(cur, true, isOccupied, false, false, false, true);
            cur[0] = Math.min(cur[0], right[0]);
        }

        coords.push(right);

        const start_occupied = isOccupied(Utils.topRightCellFromVertex(left_rounded))
            || isOccupied(Utils.bottomRightCellFromVertex(left_rounded));

        const intervals = [];
        const blocked_intvs = [];

        for (let i = 1; i < coords.length; i++) {
            const start = coords[i - 1];
            const end = coords[i];
            const interval = new Algs.AnyaInterval(start, end, intv_type);
            if ((i + start_occupied) % 2) {
                intervals.push(interval);
            } else {
                blocked_intvs.push(interval);
            }
        }

        return [intervals, blocked_intvs];
    }

    #isTurningPoint(p, r, flag = false) {
        try {

            const isOccupied = this.#isOccupied;
            const checkerboard = this.params.checkerboard;

            // checks if p is a turning point from r
            const is_top = p[1] > r[1];
            const is_right = p[0] > r[0];

            // case 1: horizontal ray
            if (p[1] == r[1]) {
                const back_one_occupied = is_right
                    ? isOccupied(Utils.topLeftCellFromVertex(p))
                    ^ isOccupied(Utils.bottomLeftCellFromVertex(p))
                    : isOccupied(Utils.topRightCellFromVertex(p))
                    ^ isOccupied(Utils.bottomRightCellFromVertex(p));
                const front_two_empty = is_right
                    ? !isOccupied(Utils.topRightCellFromVertex(p))
                    && !isOccupied(Utils.bottomRightCellFromVertex(p))
                    : !isOccupied(Utils.topLeftCellFromVertex(p))
                    && !isOccupied(Utils.bottomLeftCellFromVertex(p));
                return back_one_occupied && front_two_empty;
            }

            // case 2: vertical ray
            if (p[0] == r[0]) {
                const back_one_occupied = is_top
                    ? isOccupied(Utils.bottomLeftCellFromVertex(p))
                    ^ isOccupied(Utils.bottomRightCellFromVertex(p))
                    : isOccupied(Utils.topLeftCellFromVertex(p))
                    ^ isOccupied(Utils.topRightCellFromVertex(p));
                const front_two_empty = is_top
                    ? !isOccupied(Utils.topRightCellFromVertex(p))
                    && !isOccupied(Utils.topLeftCellFromVertex(p))
                    : !isOccupied(Utils.bottomRightCellFromVertex(p))
                    && !isOccupied(Utils.bottomLeftCellFromVertex(p));
                return back_one_occupied && front_two_empty;
            }

            // case 3: diagonal ray

            const diagonal_cell_empty = is_right
                ? is_top
                    ? !isOccupied(Utils.topRightCellFromVertex(p))
                    : !isOccupied(Utils.bottomRightCellFromVertex(p))
                : is_top
                    ? !isOccupied(Utils.topLeftCellFromVertex(p))
                    : !isOccupied(Utils.bottomLeftCellFromVertex(p));
            const adjacent_cell1_occupied = is_right ^ is_top
                ? isOccupied(Utils.topRightCellFromVertex(p))
                : isOccupied(Utils.topLeftCellFromVertex(p));
            const adjacent_cell2_occupied = is_right ^ is_top
                ? isOccupied(Utils.bottomLeftCellFromVertex(p))
                : isOccupied(Utils.bottomRightCellFromVertex(p));

            if (flag) {
                console.log(`diagonal_cell_empty: ${diagonal_cell_empty}`);
                console.log(`adjacent_cell1_occupied: ${adjacent_cell1_occupied}`);
                console.log(`adjacent_cell2_occupied: ${adjacent_cell2_occupied}`);
            }

            if (checkerboard === AlgCheckerboard.Allow) {
                return diagonal_cell_empty && (adjacent_cell1_occupied || adjacent_cell2_occupied);
            } else if (checkerboard === AlgCheckerboard.Blocked) {
                return diagonal_cell_empty && (adjacent_cell1_occupied ^ adjacent_cell2_occupied);
            } else {
                return diagonal_cell_empty && (adjacent_cell1_occupied ^ adjacent_cell2_occupied);
            }

        }
        catch (e) {
            console.error(`turning point error. p: ${p}, r: ${r}`);
            throw e;
        }
    }

    #generateFlatSuccessors(p0, r, g_cost, is_right_ray) {
        const isOccupied = this.#isOccupied;
        const euclFromGoal = this.#euclFromGoal;

        const is_target = (Utils.equalIntegerCoords(p0, [-1, -1]) && Utils.equalIntegerCoords(r, [-1, -1]));

        // p' <- first corner point (else farthest obstacle vertex) on the row of p such that ⟨r, p, p′⟩ is taut
        const at_boundary = (p0[1] == 0 && isOccupied(p0))
            || (p0[1] == ui_states.size[1]
                && isOccupied(Utils.bottomRightCellFromVertex(p0)));
        if (at_boundary) {
            console.warn(`flat node cannot generate successors; ${r}, ${p0}`);
            return [];
        }
        if (p0[0] == r[0]) {
            const interval_not_occupied = is_right_ray
                ? !isOccupied(Utils.topLeftCellFromVertex(p0)) && !isOccupied(Utils.bottomLeftCellFromVertex(p0))
                : !isOccupied(Utils.topRightCellFromVertex(p0)) && !isOccupied(Utils.bottomRightCellFromVertex(p0));
            const [c1, c2] = is_right_ray
                ? [Utils.topLeftCellFromVertex(p0), Utils.bottomLeftCellFromVertex(p0)]
                : [Utils.topRightCellFromVertex(p0), Utils.bottomRightCellFromVertex(p0)];
            const external_one_occupied = is_right_ray
                ? isOccupied(Utils.topRightCellFromVertex(p0)) ^ isOccupied(Utils.bottomRightCellFromVertex(p0))
                : isOccupied(Utils.topLeftCellFromVertex(p0)) ^ isOccupied(Utils.bottomLeftCellFromVertex(p0));
            const [e1, e2] = is_right_ray
                ? [Utils.topRightCellFromVertex(p0), Utils.bottomRightCellFromVertex(p0)]
                : [Utils.topLeftCellFromVertex(p0), Utils.bottomLeftCellFromVertex(p0)];

            if (!(interval_not_occupied && external_one_occupied)) {
                return [];
            }
        }

        if (p0[1] == r[1]) {
            // check for checkerboard
            const checkerboard = this.params.checkerboard;

            if (checkerboard === AlgCheckerboard.Blocked) {
                const left_checkerboard = isOccupied(Utils.topLeftCellFromVertex(p0)) && isOccupied(Utils.bottomRightCellFromVertex(p0));
                const right_checkerboard = isOccupied(Utils.topRightCellFromVertex(p0)) && isOccupied(Utils.bottomLeftCellFromVertex(p0));
                if (left_checkerboard || right_checkerboard) return [];
            }
        }
        if (is_target) console.log(`checkerboard check passed`);

        const is_right = p0[0] == r[0] ? is_right_ray : p0[0] > r[0];
        const p = HorizontalCornerTracer.run(p0, is_right, isOccupied, false);

        if (Utils.equalIntegerCoords(p, p0)) return [];
        if (is_target) console.log(`p != p0`);

        const outOfBounds = coord => coord[0] < 0 || coord[0] > ui_states.size[0] || coord[1] < 0 || coord[1] > ui_states.size[1];
        if (outOfBounds(p)) {
            return [];
        }
        if (is_target) console.log(`p not out of bounds`);

        // Imax ← new maximal interval with endpoints p (open) and p′ (closed)
        const Imax = is_right ? new Algs.AnyaInterval(p0, p, AnyaIntervalType.OpenLeft)
            : new Algs.AnyaInterval(p, p0, AnyaIntervalType.OpenRight);
        if (is_target) console.log(`Imax: ${Imax.toString()}`);
        // if points r and p are on the same row then
        // successors ← new flat node n = (Imax, r)
        const new_root = p0[1] == r[1] ? r : p0;
        const new_g = p0[1] == r[1] ? g_cost : g_cost + Utils.euclidean(Utils.subtractCoords(r, p0));
        const new_h = euclFromGoal(new_root);

        const node = this.#createSpriteAndNode(new_root, Imax, new_g, new_h, AnyaNodeType.Flat, AnyaNodeStatus.Queued);
        return [node];
    }

    #generateConeSuccessors(a, b, r0, g_cost, is_right_ray) {
        const isOccupied = this.#isOccupied;
        const euclFromGoal = this.#euclFromGoal;

        const outOfBounds = coord => coord[0] < 0 || coord[0] > ui_states.size[0] || coord[1] < 0 || coord[1] > ui_states.size[1];
        const makeInBounds = coord => [Math.max(0, Math.min(coord[0], ui_states.size[0])), coord[1]];
        let Imax, r;
        // if a and b and r are from the same row then
        if (a[1] == b[1] && b[1] == r0[1]) {
            // r′ ← a or b, whichever is farthest from r
            const dist = (a, b) => Utils.euclidean(Utils.subtractCoords(a, b));
            r = (dist(a, r0) > dist(b, r0)) ? a : b;

            // if turning point is on rhs of root
            const is_right = r[0] > r0[0];

            // p ← a point from an adjacent row, reached via a right-angle turn at r
            const check = is_right
                ? Utils.topLeftCellFromVertex(r)
                : Utils.topRightCellFromVertex(r);
            const is_top = r0[1] == 0 ? true
                : r0[1] == ui_states.size[1] ? false
                    : isOccupied(check);
            const p = is_top
                ? makeInBounds(Utils.addCoords(r, [0, 1]))
                : makeInBounds(Utils.addCoords(r, [0, -1]));
            // const p = is_top
            //     ? Utils.addCoords(r, [0, 1])
            //     : Utils.addCoords(r, [0, -1]);
            if (outOfBounds(p)) return [];

            // Imax ← a maximum closed interval, beginning at p and entirely observable from r′
            const bound = is_right
                ? is_top
                    ? LowerHorizontalTracer.runRight(p, isOccupied, false)
                    : UpperHorizontalTracer.runRight(p, isOccupied, false)
                : is_top
                    ? LowerHorizontalTracer.runLeft(p, isOccupied, false)
                    : UpperHorizontalTracer.runLeft(p, isOccupied, false);

            Imax = new Algs.AnyaInterval(p, bound, AnyaIntervalType.Closed);
        } else if (Utils.equalIntegerCoords(a, b)) {
            // r′ ← a
            r = a.slice();

            // p ← a point from an adjacent row, computed via linear projection from r through a
            const ray = Utils.subtractCoords(r, r0);
            const sgn = ray[1] > 0 ? 1 : -1;
            const ray_is_right = ray[0] > 0;
            const dxdy = ray[0] / ray[1];
            const p_computed = makeInBounds(Utils.addCoords(r, [dxdy * sgn, sgn]));
            if (outOfBounds(p_computed)) return [];
            const px = sgn === 1
                ? UpperHorizontalTracer.run(r, ray_is_right, isOccupied)[0]
                : LowerHorizontalTracer.run(r, ray_is_right, isOccupied)[0];

            const p = [ray_is_right
                ? Math.min(px, p_computed[0])
                : Math.max(px, p_computed[0]),
            p_computed[1]];
            // const p = Utils.addCoords(a, [dxdy * sgn, sgn]);

            // Imax ← a maximum closed interval, beginning at p and entirely observable from r′
            const is_right = p[0] > r[0] || (ray[0] == 0 && is_right_ray);
            const is_top = p[1] > r[1];
            const bound = is_top
                ? LowerHorizontalTracer.run(p, is_right, isOccupied, false)
                : UpperHorizontalTracer.run(p, is_right, isOccupied, false);
            Imax = new Algs.AnyaInterval(p, bound, AnyaIntervalType.Closed);
        } else {
            // r′ ← r
            r = r0;

            // p ← a point from an adjacent row, computed via linear projection from r through a
            const a_ray = Utils.subtractCoords(a, r0);
            const a_sgn = a_ray[1] > 0 ? 1 : -1;
            const a_dxdy = a_ray[0] / a_ray[1];
            const p1_computed = makeInBounds(Utils.addCoords(a, [a_dxdy * a_sgn, a_sgn]));
            if (outOfBounds(p1_computed)) return [];
            const p1x = a_sgn === 1
                ? UpperHorizontalTracer.runLeft(a, isOccupied)[0]
                : LowerHorizontalTracer.runLeft(a, isOccupied)[0];
            const p1 = [Math.max(p1x, p1_computed[0]), p1_computed[1]];
            // const p1 = Utils.addCoords(a, [a_dxdy * a_sgn, a_sgn]);

            // p′ ← a point from an adjacent row, computed via linear projection from r through b
            const b_ray = Utils.subtractCoords(b, r0);
            const b_sgn = b_ray[1] > 0 ? 1 : -1;
            const b_dxdy = b_ray[0] / b_ray[1];
            const p2_computed = makeInBounds(Utils.addCoords(b, [b_dxdy * b_sgn, b_sgn]));
            if (outOfBounds(p2_computed)) return [];
            const p2x = b_sgn === 1
                ? UpperHorizontalTracer.runRight(b, isOccupied)[0]
                : LowerHorizontalTracer.runRight(b, isOccupied)[0];
            const p2 = [Math.min(p2x, p2_computed[0]), p2_computed[1]];
            // const p2 = Utils.addCoords(b, [b_dxdy * b_sgn, b_sgn]);

            if (p1[0] >= p2[0]) return [];

            // Imax ← a maximum closed interval, with endpoints a and b, which is entirely observable from r′
            // Imax ← a maximum closed interval, with endpoints p and p', which is entirely observable from r′
            Imax = new Algs.AnyaInterval(p1, p2, AnyaIntervalType.Closed);
        }

        const new_g = g_cost + Utils.euclidean(Utils.subtractCoords(r, r0));
        const new_h = euclFromGoal(r);

        const [intervals, blocked_intvs] = this.#splitCorners(Imax);

        const nodes = intervals.map(intv =>
            this.#createSpriteAndNode(r, intv, new_g, new_h, AnyaNodeType.Cone, AnyaNodeStatus.Queued)
        );
        nodes.push(...blocked_intvs.map(blocked =>
            this.#createSpriteAndNode(r, blocked, new_g, new_h, AnyaNodeType.Cone, AnyaNodeStatus.Queued, true)
        ));

        return nodes;
    }

    #generateVerticalTPCones(a, r0, g_cost) {
        const isOccupied = this.#isOccupied;
        const makeInBounds = coord => [Math.max(0, Math.min(coord[0], ui_states.size[0])), coord[1]];
        const is_right = a[0] > r0[0];

        const ray = Utils.subtractCoords(a, r0);
        const sgn = a[1] > r0[1] ? 1 : -1;
        const dxdy = ray[0] / ray[1];
        const proj = makeInBounds(Utils.addCoords(a, [dxdy * sgn, sgn]));
        const adj = Utils.addCoords(a, [0, sgn]);
        const bound = sgn === 1
            ? is_right
                ? LowerHorizontalTracer.runRight(adj, isOccupied, false)
                : LowerHorizontalTracer.runLeft(adj, isOccupied, false)
            : is_right
                ? UpperHorizontalTracer.runRight(adj, isOccupied, false)
                : UpperHorizontalTracer.runLeft(adj, isOccupied, false);

        const bound_final = is_right
            ? [Math.min(bound[0], proj[0]), bound[1]]
            : [Math.max(bound[0], proj[0]), bound[1]];

        const Imax = new Algs.AnyaInterval(adj, bound_final, AnyaIntervalType.Closed);

        const new_g = g_cost + Utils.euclidean(Utils.subtractCoords(r0, a));
        const new_h = this.#euclFromGoal(a);

        const [intervals, blocked_intvs] = this.#splitCorners(Imax);

        const nodes = intervals.map(intv =>
            this.#createSpriteAndNode(a, intv, new_g, new_h, AnyaNodeType.Cone, AnyaNodeStatus.Queued)
        );
        nodes.push(...blocked_intvs.map(blocked =>
            this.#createSpriteAndNode(a, blocked, new_g, new_h, AnyaNodeType.Cone, AnyaNodeStatus.Queued, true)
        ));

        return nodes;
    }

    #generateStartSuccessors(node) {
        const isOccupied = this.#isOccupied;

        const start = node.coord.map(Math.round);

        // Construct a maximal half-closed interval I1max containing all points observable and to the left of s
        // const left_bound = HorizontalTracer.run(start, false, checkerboard, isOccupied);
        const left_bound = HorizontalCornerTracer.runLeft(start, isOccupied);
        const i1max = new Algs.AnyaInterval(left_bound, start, AnyaIntervalType.OpenRight);

        // Construct a maximal half-closed interval I2max containing all points observable and to the right of s
        // const right_bound = HorizontalTracer.run(start, true, checkerboard, isOccupied);
        const right_bound = HorizontalCornerTracer.runRight(start, isOccupied);
        const i2max = new Algs.AnyaInterval(start, right_bound, AnyaIntervalType.OpenLeft);

        // Construct a maximal closed interval I3max containing all points observable and from the row above s
        const i3left = Utils.addCoords(UpperHorizontalTracer.runLeft(start, isOccupied), [0, 1]);
        const i3right = Utils.addCoords(UpperHorizontalTracer.runRight(start, isOccupied), [0, 1]);
        const i3max = new Algs.AnyaInterval(i3left, i3right, AnyaIntervalType.Closed);

        // Construct a maximal closed interval I4max containing all points observable and from the row below s
        const i4left = Utils.addCoords(LowerHorizontalTracer.runLeft(start, isOccupied), [0, -1]);
        const i4right = Utils.addCoords(LowerHorizontalTracer.runRight(start, isOccupied), [0, -1]);
        const i4max = new Algs.AnyaInterval(i4left, i4right, AnyaIntervalType.Closed);

        // for each interval, split along the corner points and take their union
        // corner: count(isOccupied) == 1

        const intervals = [];
        /*  skip this step because we are not following the anya algorithm exactly.
            instead, i1max and i2max are only span until the first corner upper or lower is found
        */
        // intervals.push(...this.constructor.splitCorners(i1max, isOccupied));
        // intervals.push(...this.constructor.splitCorners(i2max, isOccupied));
        intervals.push(i1max);
        intervals.push(i2max);
        const [i3intervals, i3blocked] = this.#splitCorners(i3max);
        const [i4intervals, i4blocked] = this.#splitCorners(i4max);
        intervals.push(...i3intervals);
        intervals.push(...i4intervals);

        const makeArgs = intv => {
            const type = intv.left[1] == start[1] ? AnyaNodeType.Flat : AnyaNodeType.Cone;
            return [start, intv, node.g, node.h, type, AnyaNodeStatus.Queued];
        }

        const successors = intervals.map(intv => this.#createSpriteAndNode(...makeArgs(intv)));

        const blocked_intvs = i3blocked.concat(i4blocked);
        successors.push(...blocked_intvs.map(blocked => {
            const arr = makeArgs(blocked);
            arr.push(true);
            return this.#createSpriteAndNode(...arr);
        }));

        return successors;
    }

    #generateSuccessors(node) {
        const successors = [];
        if (node.type === AnyaNodeType.Start) {
            successors.push(...this.#generateStartSuccessors(node));
        } else if (node.type === AnyaNodeType.Flat) {
            const root = node.coord;
            const left = node.interval.left;
            const right = node.interval.right;

            const tgt_root = [-1, -1];
            const tgt_other = [-1, -1];

            const is_target = Utils.equalFloatCoords(root, tgt_root) &&
                Utils.equalFloatCoords(left, tgt_other)
                && Utils.equalFloatCoords(right, tgt_root);

            // p ← endpoint of I farthest from r
            const dist = (a, b) => Utils.euclidean(Utils.subtractCoords(a, b));
            const p = dist(left, root) > dist(right, root) ? left : right;
            const is_right_ray = p[0] > root[0];

            // successors ← generate-flat-successors(p, r)
            successors.push(...this.#generateFlatSuccessors(p, root, node.g, is_right_ray));

            if (is_target)
                console.log(`p: ${p}, r: ${root}`);

            if (is_target)
                console.log(`flat successors: ${successors.map(n => n.toString())}`);

            // not possible
            console.assert(successors.length <= 1, `more than one flat successor generated for ${node.toString()}`);
            if (successors.length > 0)
                successors[0].is_expansion = true;
            // if p is a turning point on a taut local path beginning at r then
            // successors ← successors ∪ generate-cone-successors(p,p,r)
            if (this.#isTurningPoint(p, root)) {
                const nodes = this.#generateConeSuccessors(p, p, root, node.g);
                if (is_target)
                    console.log(`cone nodes: ${nodes.map(n => n.toString())}`);
                successors.push(...nodes);
            }
        } else if (node.type === AnyaNodeType.Cone) {
            // a ← left endpoint of I
            const a = node.interval.left;
            // b ← right endpoint of I
            const b = node.interval.right;
            // r ← root of the search
            const root = node.coord;

            const is_target = Utils.equalFloatCoords(root, [-1, -1]) &&
                Utils.equalFloatCoords(a, [-1, -1])
                && Utils.equalFloatCoords(b, [-1, 1]);

            if (is_target)
                console.log(`target: ${node.toString()}`);

            // successors ← generate-cone-successors(a,b,r)
            let nodes = [];
            if (!node.is_blocked)
                nodes = this.#generateConeSuccessors(a, b, root, node.g);
            if (is_target)
                console.log(`first cone nodes: ${nodes.map(n => n.toString())}`);

            successors.push(...nodes);
            if (successors.length > 0)
                successors[0].is_expansion = true;

            const a_is_integer = Math.round(a[0]) === a[0];
            const b_is_integer = Math.round(b[0]) === b[0];

            const a_is_right = a[0] > root[0] ? 1 : 0;
            const a_is_left = a[0] < root[0] ? 1 : 0;
            const b_is_left = b[0] < root[0] ? 1 : 0;
            const b_is_right = b[0] > root[0] ? 1 : 0;

            // if a is a turning point of a taut local path beginning at r then
            if (!a_is_right && a_is_integer && this.#isTurningPoint(a, root, is_target)) {
                // successors ← successors ∪ generate-flat-successors(a,r)
                if (!node.is_blocked) nodes = this.#generateFlatSuccessors(a, root, node.g, false);
                if (is_target)
                    console.log(`second flat nodes: ${nodes.map(n => n.toString())}`);
                successors.push(...nodes);


                // successors ← successors ∪ generate-cone-successors(a,a,r)
                if (node.is_blocked) nodes = this.#generateVerticalTPCones(a, root, node.g);
                else nodes = this.#generateConeSuccessors(a, a, root, node.g, false);
                if (is_target)
                    console.log(`second cone nodes: ${nodes.map(n => n.toString())}`);
                successors.push(...nodes);
            }

            // if (a_is_right && a_is_integer && this.#isTurningPoint(a, root)) {
            //     // successors ← successors ∪ generate-cone-successors(b,b,r)
            //     nodes = this.#generateVerticalTPCones(a, root, node.g);
            //     if (is_target)
            //         console.log(`third cone nodes: ${nodes.map(n => n.toString())}`);
            //     successors.push(...nodes);
            // }

            // if b is a turning point of a taut local path beginning at r then
            if (!b_is_left && b_is_integer && this.#isTurningPoint(b, root)) {
                // successors ← successors ∪ generate-flat-successors(b,r)
                if (!node.is_blocked) nodes = this.#generateFlatSuccessors(b, root, node.g, true);
                if (is_target)
                    console.log(`fourth flat nodes: ${nodes.map(n => n.toString())}`);
                successors.push(...nodes);

                // successors ← successors ∪ generate-cone-successors(b,b,r)
                if (node.is_blocked) nodes = this.#generateVerticalTPCones(b, root, node.g);
                else nodes = this.#generateConeSuccessors(b, b, root, node.g, true);
                if (is_target)
                    console.log(`fourth cone nodes: ${nodes.map(n => n.toString())}`);
                successors.push(...nodes);
            }

            // if (b_is_left && b_is_integer && this.#isTurningPoint(b, root)) {
            //     // successors ← successors ∪ generate-cone-successors(b,b,r)
            //     nodes = this.#generateVerticalTPCones(b, root, node.g);
            //     if (is_target)
            //         console.log(`fifth cone nodes: ${nodes.map(n => n.toString())}`);
            //     successors.push(...nodes);
            // }
        } else {
            console.warn(`unexpected node type: ${node}`);
            return [];
        }

        // successors.forEach(child => console.log(`(Parent) ${node.toString()} -> (Child) ${child.toString()}`));
        return successors;
    }


    #createSpriteAndNode(coord, interval, g, h, type, status, is_blocked = false) {
        // assume f-cost is 0 when creating
        const sprite_args = [this.#nextId, false, 1, coord, status, 0, g, h];
        // f-cost will be updated immediately after creation with #changeGandF
        if (type === AnyaNodeType.Cone) {
            sprite_args.push(Utils.subtractCoords(interval.left, coord), Utils.subtractCoords(interval.right, coord));
        } else {
            sprite_args.push(Utils.equalIntegerCoords(interval.left, coord)
                ? Utils.subtractCoords(interval.right, coord)
                : Utils.subtractCoords(interval.left, coord)
            );
        }
        const sprite = type === AnyaNodeType.Cone ? this.#canvas_nodes.addCone(...sprite_args) : this.#canvas_nodes.addFlat(...sprite_args);
        const node = new Algs.AnyaNode(coord, g, h, sprite, null, type, interval, is_blocked);
        return node;
    }

    #pruneIntermediate(successors, parent) {
        let prev = null;
        while (successors.length === 1 && successors[0].is_expansion) {
            this.#changeParent(successors[0], parent);
            this.#closeStep();
            this.#newMnrStep();
            this.#updateNode(parent, successors[0]);
            if (this.#goalReached(successors[0], parent)) {
                return [[], true];
            }
            prev = successors;
            successors = this.#generateSuccessors(successors[0]);
        }
        // successors = prev || successors;
        successors = successors.length === 0 && prev ? prev : successors;
        return [successors, false];
    }

    run() {
        this.#path = [];

        // Create an initial step
        this.#newMjrStep();

        // Set up start node

        const NULL_PQSPRITE = null;
        let xpd_node = this.#createSpriteAndNode(this.coord_start,
            new Algs.AnyaInterval(this.coord_start, this.coord_start, AnyaIntervalType.Closed),
            0, this.#euclFromGoal(this.coord_start),
            AnyaNodeType.Start, AnyaNodeStatus.Queued);
        this.#changeGandF(xpd_node, 0);
        xpd_node.parent = null;
        this.#queueNode(xpd_node);

        this.#closeStep();

        // prev_nb_node for visualization purposes
        let prev_nb_node = null;
        let count = 0;
        while (this.#openListFilled()) {
            if (count++ > 1000) break;

            this.#newMjrStep();
            this.#visualizeNeighbors(prev_nb_node, null);
            prev_nb_node = null;
            if (!xpd_node.is_expansion) this.#visualizeClosed(xpd_node);

            xpd_node.is_expansion = false;

            xpd_node = this.#pollNode();
            this.#visualizeExpanded(xpd_node);

            if (this.#goalReached(xpd_node))
                // will close current step if goal reached
                break;

            let successors = this.#generateSuccessors(xpd_node);
            let reached = false;

            [successors, reached] = this.#pruneIntermediate(successors, xpd_node);
            if (reached) break;

            this.#closeStep();

            // bcos the open_list requeues nodes, there is no need to check if node is visited.
            for (const nb_node of successors) {
                this.#newMnrStep();

                if (nb_node.is_expansion) {
                    this.#updateNode(xpd_node, nb_node);
                    this.#queueNode(xpd_node);
                    this.#closeStep();
                    continue;
                }

                // get neighbor node first for visualization purposes.
                this.#visualizeNeighbors(prev_nb_node, nb_node);
                prev_nb_node = nb_node;

                const new_nb_g = nb_node.g;
                const curr_g = this.#min_g.get(this.serialize(nb_node.coord));
                if (Utils.approxGt(new_nb_g, curr_g)) {
                    this.#nbNodeExpensive(new_nb_g, nb_node, xpd_node);
                } else {
                    this.#nbNodeCheaper(new_nb_g, nb_node, xpd_node);
                }

                this.#closeStep();
            }

        }

        // Required to remove cyclic references for garbage collection
        this.#open_list.clear();

        if (this.#path.length === 0)
            console.log("no path!");

        this.#nodeCount = 0;
    }

    get #nextId() {
        return this.#nodeCount++;
    }

    #changeGandF(node, new_g) {
        node.changeGandF(new_g, this.params.g_weight, this.params.h_weight);
        this.#min_g.set(this.serialize(node.coord), new_g);
        this.#step.registerWithData(node.sprite, AnyaAction.GCost, node.g);
        this.#step.registerWithData(node.sprite, AnyaAction.FCost, node.f);
        this.#lens_g.updateBounds(node.g);
        this.#lens_f.updateBounds(node.f);
    }

    #changeParent(node, new_parent_node) {
        // this.#visualizeParent(node, node.parent, new_parent_node);
        node.parent = new_parent_node;
    }

    #queueNode(node) {
        if (this.#open_list.requeue(node) === true) {
            // requeued
        } else {
            // newly queued
            this.#visualizeOpened(node);
        }
    }

    #openListFilled() {
        const is_filled = this.#open_list.filled();
        return is_filled;
    }

    #pollNode() {
        const xpd_node = this.#open_list.pop();
        return xpd_node;
    }

    #goalReached(xpd_node, parent = null) {
        const isWithin = (coord, interval) => coord[1] == interval.left[1] && coord[0] >= interval.left[0] && coord[0] <= interval.right[0];
        if (Utils.equalIntegerCoords(xpd_node.coord, this.coord_goal) || isWithin(this.coord_goal, xpd_node.interval)) {
            console.log(`goal reached at ${xpd_node.toString()}`);
            this.#closeStep();

            if (parent) {
                this.#newMnrStep();
                this.#updateNode(parent, xpd_node);
                xpd_node = parent;
                this.#closeStep();
            }

            this.#newMnrStep();

            this.#path = [this.coord_goal];
            while (1) {
                if (this.#path[this.#path.length - 1] === xpd_node.coord) {
                    xpd_node = xpd_node.parent; // reuse xpd_node
                    continue;
                }
                this.#visualizeFoundPathSegment(xpd_node, this.#path[this.#path.length - 1]);
                this.#path.push(xpd_node.coord);

                if (Utils.equalIntegerCoords(xpd_node.coord, this.coord_start)) {
                    this.#step.changeRank(this.num_ranks - 1);
                    this.#closeStep();
                    break;
                }

                this.#closeStep();
                this.#newMnrStep();
            }
            console.log("path", this.#path);
        }
        return this.#path.length > 0; // else
    }


    /**
     * Getting to neighbor node from expanded node does not improve the g-cost at the neighbor node.
     * @param {number} new_nb_g
     * @param {Algs.AnyaNode} nb_node
     * @param {Algs.AnyaNode} xpd_node
     */
    #nbNodeExpensive(new_nb_g, nb_node, xpd_node) { }

    /**
     * Getting to neighbor node from expanded node improves the g-cost at the neighbor node.
     * @param {number} new_nb_g 
     * @param {Algs.AnyaNode} nb_node 
     * @param {Algs.AnyaNode} xpd_node 
     */
    #nbNodeCheaper(new_nb_g, nb_node, xpd_node) {
        this.#changeGandF(nb_node, new_nb_g);
        this.#changeParent(nb_node, xpd_node);
        this.#queueNode(nb_node);
    }

    #updateNode(node, nb_node) {
        if (node.type == AnyaNodeType.Cone) {
            node.updateInterval(nb_node.interval);
            this.#step.registerWithData(node.sprite, AnyaAction.Interval0, node.left_ray);
            this.#step.registerWithData(node.sprite, AnyaAction.Interval1, node.right_ray);
        } else {
            console.assert(node.type === AnyaNodeType.Flat, `unexpected node type: ${node.type}`);
            node.updateLeft([Math.min(node.interval.left[0], nb_node.interval.left[0]), node.interval.left[1]]);
            node.updateRight([Math.max(node.interval.right[0], nb_node.interval.right[0]), node.interval.right[1]]);
            this.#step.registerWithData(node.sprite, AnyaAction.Interval1, node.left_ray);
            this.#step.registerWithData(node.sprite, AnyaAction.Interval1, node.right_ray);

            // if (node.interval.right[0] == nb_node.interval.left[0]) {
            //     node.updateRight(nb_node.interval.right);
            //     this.#step.registerWithData(node.sprite, AnyaAction.Interval1, node.right_ray);
            // } else {
            //     console.assert(node.interval.left[0] == nb_node.interval.right[0], `unexpected interval update: ${node.toString()} -> ${nb_node.toString()}`);
            //     node.updateLeft(nb_node.interval.left);
            //     this.#step.registerWithData(node.sprite, AnyaAction.Interval1, node.left_ray);
            // }
        }
        this.#step.registerWithData(node.sprite, AnyaAction.Status, AnyaNodeStatus.Queued);
        node.is_expansion = nb_node.is_expansion;
        node.is_blocked = nb_node.is_blocked;
    }


    // ============== Steps and Visualization methods=======================
    #newMjrStep() {
        this.#step = new UI.Step(1);
    }
    #newMnrStep() {
        this.#step = new UI.Step(0);
    }

    #visualizeExpanded(node) {
        // this.#step.registerWithData(node.sprite, SpriteActionNode.Class, SpriteActionClass.Red);
        this.#step.registerWithData(node.sprite, AnyaAction.Status, AnyaNodeStatus.Expanding);

        // const id = this.serialize(node.coord);
        // const sprite = this.#canvas_arrows.sprite(id);
        // if (sprite) {
        //     this.#step.registerWithData(sprite,
        //         SpriteActionArrow.Class,
        //         SpriteActionClass.Blue);
        // }
    }

    #visualizeOpened(node) {
        // this.#step.registerWithData(node.sprite, SpriteActionNode.Class, SpriteActionClass.Orange);
        this.#step.registerWithData(node.sprite, AnyaAction.Status, AnyaNodeStatus.Queued);
    }

    #visualizeClosed(node) {
        // this.#step.registerWithData(node.sprite, SpriteActionNode.Class, SpriteActionClass.Blue);
        this.#step.registerWithData(node.sprite, AnyaAction.Status, AnyaNodeStatus.Visited);
    }

    #addArrow(id, from, to) {
        return this.#canvas_arrows.add(
            id,
            from,
            Utils.subtractCoords(to, from),
            false,
            SpriteActionClass.Red,
            0);
    }

    #visualizeParent(node, old_parent, new_parent) {
        const id = this.serialize(node.coord);
        if (old_parent === null) {
            // create new arrow
            const sprite = this.#addArrow(id, node, new_parent);
            this.#step.registerWithData(sprite, SpriteActionArrow.Display, true);
        } else {
            // reroute current arrow
            const sprite = this.#canvas_arrows.sprite(id);
            this.#step.registerWithData(
                sprite,
                SpriteActionArrow.Size,
                Utils.subtractCoords(new_parent.coord, node.coord)
            );
        }
    }

    #visualizeNeighbors(prev_nb_node, new_nb_node) {

        if (new_nb_node !== null) // && new_nb_node.type !== AnyaNodeType.Cone)
            this.#step.registerWithData(new_nb_node.sprite, AnyaAction.Display, true);
        // this.#step.registerWithData(
        //     new_nb_node.sprite, SpriteActionNode.Outline,
        //     SpriteActionOutline.Red);

        // if (prev_nb_node !== null)
        //     this.#step.registerWithData(
        //         prev_nb_node.sprite, SpriteActionNode.Outline,
        //         SpriteActionOutline.None);
    }

    #visualizeFoundPathSegment(node, child_coord) {
        const sprite = this.#addArrow(this.#nextId, child_coord, node.coord);
        this.#step.registerWithData(sprite,
            SpriteActionArrow.Display,
            true);
        // this.#step.registerWithData(
        //     node.sprite, AnyaAction.Status,
        //     AnyaNodeStatus.Path);
    }

    #closeStep() {
        ui.player.register(this.#step);
        this.#step = null;
    }
};
