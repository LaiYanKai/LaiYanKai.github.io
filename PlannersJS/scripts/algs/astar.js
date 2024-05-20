"use strict";
Algs.AStarCanvasCell = class extends UI.AbstractCanvasCell {
    constructor() {
        super(AStarAction.length);
    }

    add(f, g, h, status, ...abstract_canvas_cell_args) {
        const sprite = super.add(...abstract_canvas_cell_args);
        sprite.register(AStarAction.F, f);
        sprite.register(AStarAction.G, g);
        sprite.register(AStarAction.H, h);
        sprite.register(AStarAction.Status, status);
        sprite.dom_svg.addEventListener(
            "mousemove", this.#setTip.bind(this, sprite), false);
        sprite.dom_svg.addEventListener(
            "mouseout", ui.tooltip.hide.bind(ui.tooltip), false);
        return sprite;
    }

    #setTip(sprite, e) {
        const pos = Utils.subtractCoord(
            sprite.value(SpriteAction.Position), [0.5, 0.5]);
        const status = sprite.value(AStarAction.Status);
        let status_str;
        if (status === AStarNodeStatus.Queued)
            status_str = "Queued";
        else if (status === AStarNodeStatus.Expanding)
            status_str = "Expanding";
        else if (status === AStarNodeStatus.Visited)
            status_str = "Visited";
        else if (status === AStarNodeStatus.Undiscovered)
            status_str = "Undiscovered";
        else if (status === AStarNodeStatus.Path)
            status_str = "Path!";
        const f = sprite.value(AStarAction.F).toFixed(3);
        const g = sprite.value(AStarAction.G).toFixed(3);
        const h = sprite.value(AStarAction.H).toFixed(3);
        const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nF = ${f}\nG = ${g}\nH = ${h}\n`;
        ui.tooltip.setTip(
            TooltipPosition.Right,
            message,
            sprite.dom_svg,
        );
    }
};

Algs.AStarCanvasVertex = class extends UI.AbstractCanvasVertex {
    /** @type {UI.Tooltip} */
    constructor() {
        super(AStarAction.length);
    }

    add(f, g, h, status, ...abstract_canvas_cell_args) {
        const sprite = super.add(...abstract_canvas_cell_args);
        sprite.register(AStarAction.F, f);
        sprite.register(AStarAction.G, g);
        sprite.register(AStarAction.H, h);
        sprite.register(AStarAction.Status, status);
        sprite.dom_svg.addEventListener(
            "mousemove", this.#setTip.bind(this, sprite), false);
        sprite.dom_svg.addEventListener(
            "mouseout", ui.tooltip.hide.bind(ui.tooltip), false);
        return sprite;
    }

    #setTip(sprite, e) {
        const pos = sprite.value(SpriteAction.Position);
        const status = sprite.value(AStarAction.Status);
        let status_str;
        if (status === AStarNodeStatus.Queued)
            status_str = "Queued";
        else if (status === AStarNodeStatus.Expanding)
            status_str = "Expanding";
        else if (status === AStarNodeStatus.Visited)
            status_str = "Visited";
        else if (status === AStarNodeStatus.Undiscovered)
            status_str = "Undiscovered";
        else if (status === AStarNodeStatus.Path)
            status_str = "Path!";
        const f = sprite.value(AStarAction.F).toFixed(3);
        const g = sprite.value(AStarAction.G).toFixed(3);
        const h = sprite.value(AStarAction.H).toFixed(3);
        const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nF = ${f}\nG = ${g}\nH = ${h}\n`;
        ui.tooltip.setTip(
            TooltipPosition.Right,
            message,
            sprite.dom_svg,
        );
    }
}


Algs.AStarNode = class extends Algs.AbstractPriorityQueueNode {

    get f() { return this.costs[0]; }
    get g() { return this.costs[1]; }
    get h() { return this.costs[2]; }

    set f(new_f) { return this.costs[0] = new_f; }
    set g(new_g) { return this.costs[1] = new_g; }
    set h(new_h) { return this.costs[2] = new_h; }

    constructor(coord, g, h, sprite, pq_sprite) {
        super(coord, 3, sprite, pq_sprite);
        this.g = g;
        this.h = h;
        this.f = g + h;
    }

    changeGandF(new_g, g_weight, h_weight) {
        this.g = new_g;
        this.f = this.g * g_weight + this.h * h_weight;
    }
}
Object.seal(Algs.AstarNode);


Algs.AStar = class extends Algs.AbstractGridAlg {
    #open_list;
    #nodes;
    get #canvas_arrows() { return this.canvases[0]; }
    get #canvas_nodes() { return this.canvases[1]; }
    #step; // current step
    #path;

    constructor(alg_params) {
        super(["0: Smallest", "1: Every Expansion"], 1, alg_params);

        // Set up canvases
        let size;
        const canvases = Array(2);
        canvases[0] = new UI.AbstractCanvasArrow(0); // put arrows below the nodes
        if (alg_params.node_type === AlgNodeType.Cell) {
            canvases[1] = new Algs.AStarCanvasCell();
            this.#addArrow = this.#addArrowCell;
            size = ui_states.size;
        }
        else if (alg_params.node_type === AlgNodeType.Vertex) {
            canvases[1] = new Algs.AStarCanvasVertex();
            this.#addArrow = this.#addArrowVertex;
            size = Utils.addCoord(ui_states.size, [1, 1]);
        }
        super.setCanvases(canvases);

        // Check h_weight and g_weight
        if (typeof this.params.h_weight !== "number")
            throw new TypeError("h_weight must be a number!");
        if (typeof this.params.g_weight !== "number")
            throw new TypeError("g_weight must be a number!");

        // Set up lenses


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


        // Set up Nodes and Sprites
        this.#nodes = new Map();
        for (let x = 0; x < size[0]; ++x) {
            for (let y = 0; y < size[1]; ++y) {
                const coord = [x, y];
                const id = this.serialize(coord);
                const h = this.metric(Utils.subtractCoord(this.coord_goal, coord));
                const sprite = this.#canvas_nodes.add(
                    Infinity, Infinity, h, AStarNodeStatus.Undiscovered,
                    id, coord,
                    true,
                    SpriteActionClass.Transparent,
                    0,
                    SpriteActionOutline.None);
                sprite.vis(); // sprites are not visualized at the first step.
                const node = new Algs.AStarNode(coord, Infinity, h, sprite, null);
                this.#nodes.set(id, node);
            }
        }

    }

    run() {
        this.#path = [];

        // Create an initial step
        this.#newMjrStep();

        // Set up start node
        let xpd_node = this.#nodes.get(this.serialize(this.coord_start));
        this.#changeGandF(xpd_node, 0);
        xpd_node.parent = null;
        this.#queueNode(xpd_node);

        this.#closeStep();

        // prev_nb_node for visualization purposes
        let prev_nb_node = null;
        while (this.#openListFilled()) {
            this.#newMjrStep();
            this.#visualizeNeighbors(prev_nb_node, null);
            prev_nb_node = null;
            this.#visualizeClosed(xpd_node);

            xpd_node = this.#pollNode();
            this.#visualizeExpanded(xpd_node);

            if (this.#goalReached(xpd_node))  // will close current step if goal reached
                break;

            this.#closeStep();

            // bcos the open_list requeues nodes, there is no need to check if node is visited.
            for (const nb of this.getNb(xpd_node)) {
                this.#newMnrStep();

                // get neighbor node first for visualization purposes.
                let nb_coord, nb_id, nb_node = null; // null if out of map.
                if (nb.in_map === true) {
                    nb_coord = Utils.addCoord(xpd_node.coord, nb.dir);
                    nb_id = this.serialize(nb_coord);
                    nb_node = this.#nodes.get(nb_id);
                }

                this.#visualizeNeighbors(prev_nb_node, nb_node);
                prev_nb_node = nb_node;

                // continue if node is inaccessible.
                if (this.#nbNodeAccessible(nb) === true) {

                    // check g cost if node is accessible
                    const new_nb_g = xpd_node.g + nb.node_rel_g;
                    if (Utils.approxGe(new_nb_g, nb_node.g))
                        this.#nbNodeExpensive(new_nb_g, nb_node, xpd_node);
                    else
                        this.#nbNodeCheaper(new_nb_g, nb_node, xpd_node);
                }

                this.#closeStep();
            }
        }

        // Required to remove cyclic references for garbage collection
        this.#open_list.clear();

        if (this.#path.length === 0)
            console.log("no path!");

    }

    #changeGandF(node, new_g) {
        node.changeGandF(new_g, this.params.g_weight, this.params.h_weight);
        this.#step.registerWithData(node.sprite, AStarAction.G, node.g);
        this.#step.registerWithData(node.sprite, AStarAction.F, node.f);
    }

    #changeParent(node, new_parent_node) {
        this.#visualizeParent(node, node.parent, new_parent_node);
        node.parent = new_parent_node;
    }

    #queueNode(node) {
        if (this.#open_list.requeue(node) === true) {    // requeued

        }
        else {   // newly queued
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

    #goalReached(xpd_node) {
        if (Utils.equalIntegerCoords(xpd_node.coord, this.coord_goal)) {
            this.#closeStep();
            this.#newMnrStep();

            this.#path = [];
            while (1) {
                this.#path.push(xpd_node.coord);
                this.#visualizeFoundPathSegment(xpd_node);
                if (Utils.equalIntegerCoords(xpd_node.coord, this.coord_start)) {
                    this.#step.changeRank(this.num_ranks - 1);
                    this.#closeStep();
                    break;
                }
                this.#closeStep();
                this.#newMnrStep();
                xpd_node = xpd_node.parent; // reuse xpd_node
            }
            console.log("path", this.#path);
        }
        return this.#path.length > 0; // else
    }

    /**
     * 
     * @param {Algs.AStarNode} xpd_node 
     * @param {Algs.GridAlgNeighbor} nb 
     */
    #nbNodeAccessible(nb) {
        if (nb.node_access === true) {
            return true;
        }
        else {
            if (nb.node_chblocked === true) {   // true only if checkerboard is allowed

            }
            else if (nb.in_map === false) {

            }
            return false;
        }
    }

    /**
     * Getting to neighbor node from expanded node does not improve the g-cost at the neighbor node.
     * @param {number} new_nb_g 
     * @param {Algs.AStarNode} nb_node 
     * @param {Algs.AStarNode} xpd_node 
     */
    #nbNodeExpensive(new_nb_g, nb_node, xpd_node) {
    }

    /**
     * Getting to neighbor node from expanded node improves the g-cost at the neighbor node.
     * @param {number} new_nb_g 
     * @param {Algs.AStarNode} nb_node 
     * @param {Algs.AStarNode} xpd_node 
     */
    #nbNodeCheaper(new_nb_g, nb_node, xpd_node) {
        this.#changeGandF(nb_node, new_nb_g);
        this.#changeParent(nb_node, xpd_node);
        this.#queueNode(nb_node);
    }

    // ============== Steps and Visualization methods=======================
    #newMjrStep() {
        this.#step = new UI.Step(1);
    }
    #newMnrStep() {
        this.#step = new UI.Step(0);
    }

    #visualizeExpanded(node) {
        this.#step.registerWithData(node.sprite, SpriteAction.Class, SpriteActionClass.Red);
        this.#step.registerWithData(node.sprite, AStarAction.Status, AStarNodeStatus.Expanding);
    }

    #visualizeOpened(node) {
        this.#step.registerWithData(node.sprite, SpriteAction.Class, SpriteActionClass.Orange);
        this.#step.registerWithData(node.sprite, AStarAction.Status, AStarNodeStatus.Queued);
    }

    #visualizeClosed(node) {
        this.#step.registerWithData(node.sprite, SpriteAction.Class, SpriteActionClass.Blue);
        this.#step.registerWithData(node.sprite, AStarAction.Status, AStarNodeStatus.Visited);
    }

    #addArrow;
    #addArrowCell(id, node, new_parent) {
        return this.#canvas_arrows.add(
            id,
            Utils.addCoord(node.coord, [0.5, 0.5]),
            Utils.subtractCoord(new_parent.coord, node.coord),
            false,
            SpriteActionClass.Blue,
            0);
    }
    #addArrowVertex(id, node, new_parent) {
        return this.#canvas_arrows.add(
            id,
            node.coord,
            Utils.subtractCoord(new_parent.coord, node.coord),
            false,
            SpriteActionClass.Blue,
            0);
    }

    #visualizeParent(node, old_parent, new_parent) {
        const id = this.serialize(node.coord);
        if (old_parent === null) {  // create new arrow
            const sprite = this.#addArrow(id, node, new_parent);
            this.#step.registerWithData(sprite,
                SpriteAction.Display,
                true);
            this.#step.registerWithData(sprite,
                SpriteAction.Class,
                SpriteActionClass.Blue);
        }
        else {   // reroute current arrow
            const sprite = this.#canvas_arrows.sprite(id);
            this.#step.registerWithData(
                sprite, SpriteAction.Size,
                Utils.subtractCoord(new_parent.coord, node.coord));
        }
    }

    #visualizeNeighbors(prev_nb_node, new_nb_node) {
        if (new_nb_node !== null)
            this.#step.registerWithData(
                new_nb_node.sprite, SpriteAction.Outline,
                SpriteActionOutline.Red);

        if (prev_nb_node !== null)
            this.#step.registerWithData(
                prev_nb_node.sprite, SpriteAction.Outline,
                SpriteActionOutline.None);
    }

    #visualizeFoundPathSegment(node) {

        const id = this.serialize(node.coord);
        const arrow_sprite = this.#canvas_arrows.sprite(id);
        if (arrow_sprite)
            this.#step.registerWithData(
                arrow_sprite, SpriteAction.Class,
                SpriteActionClass.Red);
        this.#step.registerWithData(
            node.sprite, SpriteAction.Class,
            SpriteActionClass.Red);
        this.#step.registerWithData(
            node.sprite, AStarAction.Status,
            AStarNodeStatus.Path);

        // this.#step.registerWithData(sprite, SpriteAction.ZIndex, 1);
    }

    #closeStep() {
        ui.player.register(this.#step);
        this.#step = null;
    }
};
Object.seal(Algs.AStar);