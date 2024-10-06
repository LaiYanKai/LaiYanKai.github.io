"use strict";

/**
 * @enum {number}
 * @readonly
 */
const RayTracerState = {
    X: 0, // moved in X dim (crossed vertical line)
    Y: 1, // moved in Y dim (crossed horizontal line)
    XY: 2, // moved in X & Y dim (crossed vertex)
};
Object.freeze(RayTracerState);

const RayTracer = class {
    static #THRES = 1e-8;
    static #REACHED_THRES = 1 - this.#THRES;

    #dif = Array(2);
    #next_plen = Array(2); // always positive
    #grad = Array(2); // always positive
    #root = Array(2);
    #sgn = Array(2);
    #plen_travelled = 0; // always positive
    #length = 0;

    // Extra implementations
    #state = RayTracerState.XY;

    constructor() { }

    /** Initializes the raytracer at "from"
     * @param from array
     * @param to array
     */
    init(from, to) {
        for (let d = 0; d < 2; ++d) {
            this.#dif[d] = to[d] - from[d];

            if (this.#dif[d] - RayTracer.#THRES > 0) {  // this.#dif[d] is positive.
                this.#sgn[d] = 1;
                this.#root[d] = Math.floor(from[d]);
                this.#grad[d] = this.#sgn[d] / this.#dif[d];
                this.#next_plen[d] = this.#grad[d];
            }
            else if (this.#dif[d] + RayTracer.#THRES < 0) { // this.#dif[d] is negative
                this.#sgn[d] = -1;
                this.#root[d] = Math.ceil(from[d]);
                this.#grad[d] = this.#sgn[d] / this.#dif[d];
                this.#next_plen[d] = this.#grad[d];
            }
            else { // this.#dif[d] is close to zero.
                this.#root[d] = Math.floor(from[d]);
                this.#sgn[d] = 0;
                this.#grad[d] = Infinity; // avoid NaN
                this.#dif[d] = 0;
                this.#next_plen[d] = Infinity;
            }
        }

        this.#plen_travelled = 0;
        this.#length = Utils.euclidean(this.#dif);
        this.#state = RayTracerState.XY;
    }

    #getNext(d) {
        this.#root[d] += this.#sgn[d];
        this.#next_plen[d] += this.#grad[d];
    }

    /**
     * Brings the raytracer to the next root vertex
     * Use adjCellFromVertex to get cell corresponding to vertex.
     */
    update() {
        if (this.#next_plen[1] - this.#next_plen[0] > RayTracer.#THRES) {
            this.#plen_travelled = this.#next_plen[0];
            this.#state = this.#sgn[1] === 0 ? RayTracerState.XY : RayTracerState.X;

            this.#getNext(0); // x crossed a grid line before y crossed a grid line 
        }
        else if (this.#next_plen[0] - this.#next_plen[1] > RayTracer.#THRES) {
            this.#plen_travelled = this.#next_plen[1];
            this.#state = this.#sgn[0] === 0 ? RayTracerState.XY : RayTracerState.Y;

            this.#getNext(1); // y crossed a grid line before x crossed a grid line
        }
        else { // x and y crossed grid line at same location
            this.#plen_travelled = this.#next_plen[0];
            this.#state = RayTracerState.XY;

            this.#getNext(0);
            this.#getNext(1);
        }
    }

    /** Returns the sign direction (array) */
    getSgn() { return this.#sgn.slice(); }

    /** Returns the root vertex (array) */
    getRoot() { return this.#root.slice(); }

    /** @returns {[number, number]} */
    getDiff() { return this.#dif.slice(); }

    /** @returns {RayTracerState} */
    getState() { return this.#state; }

    /** Returns the length travelled */
    getLenTravelled() { return this.#plen_travelled * this.#length; }

    /** Checks if reached */
    hasReached() { return this.#plen_travelled > RayTracer.#REACHED_THRES; }

};

const RayTracerGeneral = class {

    // constants
    /** @type {number} */
    #thres;
    /** @type {number} */
    #reached_thres;
    /** @type {boolean} */
    #checkerboard;

    /** @type {[number, number]} */
    #dif;
    /** @type {[number, number]} */
    #next_plen; // always positive
    /** @type {[number, number]} */
    #cache;
    /** @type {[number, number]} */
    #root;
    /** @type {[number, number]} */
    #sgn;
    /** @type {number} */
    #plen_travelled; // always positive
    /** @type{[number, number][]} */
    #front_sgns;
    /** @type{[[number, number], [number, number]][]} */
    #checkerboard_sgns;
    /** @type {number} */
    #length
    /** @type {RayTracerState} */
    #state;

    /**
     * 
     * @param {boolean} checkerboard 
     * @param {number} thres 
     */
    constructor(checkerboard = false, thres = ui_params.thresh) {
        this.#checkerboard = checkerboard;
        this.#thres = thres;
        this.#reached_thres = 1 - this.#thres;

        this.#dif = [NaN, NaN];
        this.#next_plen = [NaN, NaN];
        this.#cache = [NaN, NaN];
        this.#root = [NaN, NaN];
        this.#sgn = [NaN, NaN];
        this.#plen_travelled = Infinity;
        this.#front_sgns = [];
        this.#checkerboard_sgns = [];
        this.#length = NaN;
        this.#state = RayTracerState.XY;
        this.#root = [NaN, NaN];
    }

    /**
     * @param {[number, number]} from_coord 
     * @param {[number, number]} to_coord 
     */
    init(from_coord, to_coord) {
        this.#plen_travelled = Infinity;

        for (let d = 0; d < 2; ++d) {
            this.#dif[d] = to_coord[d] - from_coord[d];

            if (this.#dif[d] - this.#thres > 0) {  // this.#dif[d] is positive.
                this.#sgn[d] = 1;
                this.#root[d] = Math.floor(from_coord[d]);
                this.#cache[d] = this.#sgn[d] - from_coord[d];
                this.#next_plen[d] = (this.#root[d] + this.#cache[d]) / this.#dif[d];
                this.#plen_travelled = 0;
            }
            else if (this.#dif[d] + this.#thres < 0) { // this.#dif[d] is negative
                this.#sgn[d] = -1;
                this.#root[d] = Math.ceil(from_coord[d]);
                this.#cache[d] = this.#sgn[d] - from_coord[d];
                this.#next_plen[d] = (this.#root[d] + this.#cache[d]) / this.#dif[d];
                this.#plen_travelled = 0;
            }
            else { // this.#dif[d] is close to zero.
                this.#root[d] = Math.floor(from_coord[d]);
                this.#sgn[d] = 0;
                this.#cache[d] = Infinity; // avoid NaN
                this.#dif[d] = 0; // round to zero.
                this.#next_plen[d] = Infinity;
            }
        }

        this.#length = Utils.euclidean(this.#dif);
        this.#state = RayTracerState.XY;

        const err = Utils.subtractCoords(from_coord, this.#root);
        this.#front_sgns = [];
        this.#getFront(0, this.#sgn, err, this.#front_sgns);

        if (this.#checkerboard)
            this.#getCheckerboard(this.#front_sgns, this.#sgn, this.#checkerboard_sgns);
        else
            this.#checkerboard_sgns = [];
    }

    /**
     * 
     * @param {number} d 
     * @param {[number, number]} front_sgn 
     * @param {[number, number]} err 
     * @param {[number, number][]} all_front_sgns 
     */
    #getFront(d, front_sgn, err, all_front_sgns) {
        if (d >= 2) {
            all_front_sgns.push(front_sgn);
            return;
        }
        let I;
        if (Utils.approxEq(err[d], 0) && front_sgn[d] === 0)
            I = [-1, 1];
        else
            I = [front_sgn[d]];
        for (const i of I) {
            const f_new = front_sgn.slice();
            f_new[d] = i;
            this.#getFront(d + 1, f_new, err, all_front_sgns);
        }
    }

    /**
     * 
     * @param {[number, number][]} all_front_sgns 
     * @param {[number, number]} sgn 
     * @param {[[number, number],[number, number]][]} checkerboard_sgns 
     */
    #getCheckerboard(all_front_sgns, sgn, checkerboard_sgns) {
        if (all_front_sgns.length > 1) {
            checkerboard_sgns = [
                [[-1, 1], [1, -1]],
                [[1, 1], [-1, -1]],
            ];
        }
        else {
            checkerboard_sgns = [
                [-sgn[0], sgn[1]], [sgn[0], -sgn[1]]
            ];
        }
    }

    #getNext(d) {
        this.#root[d] += this.#sgn[d];
        this.#next_plen[d] = (this.#root[d] + this.#cache[d]) / this.#dif[d];
    }


    /**
     * Returns true if the cell at _cell_coord_ is occupied, false otherwise
     * @name RayTracerComparator
     * @function 
     * @param {[number, number]} cell_coord the cell coordinate to test
     * @returns {boolean} true if occupied, false if free.
     */

    /**
     * Returns _true_ if the line drawn from _from_coord_ to _to_coord_ collides with an obstacle, _false_ if the line can be drawn unobstructed.
     * @param {[number, number]} from_coord the coordinate to test line-of-sight from.
     * @param {[number, number]} to_coord the coordinate to reach.
     * @param {boolean} checkerboard Set to true if checkerboard corners have to be checked
     * @param {RayTracerComparator} is_occupied Function that takes in one input (cell_coord), and outputs true if the cell at cell_coord is occupied, false otherwise.
     * @returns {boolean} True if collision has occurred, false if reached.
     * @example
     * const raytracer = new RayTracerGeneral();
     * const from_coord = ui_states.start;
     * const to_coord = ui_states.goal;
     * const checkerboard = false;
     * const isOccupied = cell_coord => {
     *     const cell = ui.cells.at(cell_coord);
     *     return cell === null || cell.cost >= params.lethal;
     * };
     * const collided = raytracer.run(from_coord, to_coord, checkerboard, isOccupied);
     */
    run(from_coord, to_coord, checkerboard, isOccupied) {
        this.init(from_coord, to_coord)
        while (!this.hasReached()) {

            // Check front
            let front_blocked = true;
            for (const front_sgn of this.getFrontSgn()) {
                const front_cell_coord = Utils.adjCellFromVertex(this.getRoot(), front_sgn);
                // const cell_cost = ui.cells.at(front_cell_coord); // if at least one of the cell_cost is free, then no collision, just break.
                if (!isOccupied(front_cell_coord)) {
                    front_blocked = false;
                    break;
                }
            }
            if (front_blocked)
                return true;

            // Check checkerboard
            if (checkerboard && this.getState() === RayTracerState.XY) { // only if u need to check checkerboard.
                for (const ch_sgn_pair of this.getCheckerboardSgnPairs()) {
                    const cell_coord1 = Utils.adjCellFromVertex(this.getRoot(), ch_sgn_pair[0]);
                    // const cell_cost1 = ui.cells.at(cell_coord1);
                    const cell_coord2 = Utils.adjCellFromVertex(this.getRoot(), ch_sgn_pair[1]);
                    // const cell_cost2 = ui.cells.at(cell_coord2);
                    if (isOccupied(cell_coord1) && is_occupied(cell_coord2))
                        return true; // blocked by checkerboard.
                }
            }

            // update root vertex
            this.update();
        }
        return false;
    }


    /**
     * Brings the raytracer to the next root vertex
     * @example 
     * <caption>See this.run() for more example code</caption>
     */
    update() {
        if (this.#next_plen[1] - this.#next_plen[0] > this.#thres) {
            this.#plen_travelled = this.#next_plen[0];
            this.#state = this.#sgn[1] === 0 ? RayTracerState.XY : RayTracerState.X;

            this.#getNext(0); // x crossed a grid line before y crossed a grid line 
        }
        else if (this.#next_plen[0] - this.#next_plen[1] > this.#thres) {
            this.#plen_travelled = this.#next_plen[1];
            this.#state = this.#sgn[0] === 0 ? RayTracerState.XY : RayTracerState.Y;

            this.#getNext(1); // y crossed a grid line before x crossed a grid line
        }
        else { // x and y crossed grid line at same location
            this.#plen_travelled = this.#next_plen[0];
            this.#state = RayTracerState.XY;

            this.#getNext(0);
            this.#getNext(1);
        }
    }


    /** 
     * Yields the sign direction of the front cell(s) from the root vertex.
     * @example 
     * <caption>See this.run() for more example code</caption>
     * @yields {[number, number]} 
    */
    * getFrontSgn() {
        for (const sgn of this.#front_sgns)
            yield sgn.slice();
    }


    /**
     * Yields a pair of sign directions from the root vertex, which indicates the pair of diagonally opposite cells to check for checkerboard corners.
     * Let sgn_pair be the yielded pair of sign directions.
     * @example 
     * <caption>See this.run() for more example code</caption>
     * @yields {[[number, number], [number, number]]}
     */
    * getCheckerboardSgnPairs() {
        for (const sgn_pair of this.#checkerboard_sgns) {
            const sliced_sgn_pair = [sgn_pair[0].slice(), sgn_pair[1].slice()];
            yield sliced_sgn_pair;
        }
    }

    /** 
     * Returns the root vertex coordinate. 
     * @returns {[number, number]}
     * @readonly 
     */
    getRoot() { return this.#root.slice(); }


    /**
     * Returns difference between _to_coord_ and _from_coord_.
     * @returns [number, number]
     * @readonly
     */
    getDiff() { return this.#dif.slice(); }

    /**
     * Indicates which part of the grid the ray has intersected.
     * RayTracerState.X indicates that an X=c line has been intersected.
     * RayTracerState.Y indicates that a Y=d line has been intersected.
     * RayTracerState.XY indicates that an X=c line and a Y=d line have been intersected at the same time (i.e. pass through a grid vertex).
     * c and d refers to whole numbers.
     * @returns {RayTracerState}
     */
    getState() { return this.#state; }

    /** 
     * Returns the Euclidean length travelled from _from_coord_ 
     * @returns {[number, number]}
     */
    getLenTravelled() { return this.#plen_travelled * this.#length; }

    /** 
     * Returns true if the ray has reached the destination.
     * See this.update() for example code.
     * @returns {boolean}
     */
    hasReached() { return this.#plen_travelled > this.#reached_thres; }


};

const HorizontalTracer = class {
    /**
     * @description A specific implementation of RayTracerGeneral 
     * that only traces horizontal lines with Integer Y-coordinates.
     */

    /**
     * Returns _true_ if the line drawn from _from_coord_ to _to_coord_ collides with an obstacle, _false_ if the line can be drawn unobstructed.
     * @param {[number, number]} from_coord the coordinate to test line-of-sight from.
     * @param {boolean} is_right _true_ if the direction is +x, _false_ if the direction is -x.
     * @param {boolean} checkerboard Set to true if checkerboard corners have to be checked
     * @param {RayTracerComparator} is_occupied Function that takes in one input (cell_coord), and outputs true if the cell at cell_coord is occupied, false otherwise.
     * @returns {[number, number]} the final coordinate of collision
     * @example
     * const from_coord = ui_states.start;
     * const is_right = true;
     * const checkerboard = false;
     * const isOccupied = cell_coord => {
     *     const cell = ui.cells.at(cell_coord);
     *     return cell === null || cell.cost >= params.lethal;
     * };
     * const collided = HorizontalTracer.run(from_coord, is_right, checkerboard, isOccupied);
     */
    static run(from_coord, is_right, checkerboard, isOccupied) {
        if (from_coord[1] >= ui_states.size[1]) {
            console.warn("HorizontalTracer: from_coord is at the top boundary.\nRunning LowerHorizontalTracer instead.");
            return LowerHorizontalTracer.run(from_coord, is_right, isOccupied);
        } else if (from_coord[1] <= 0) {
            console.warn("HorizontalTracer: from_coord is at the bottom boundary.\nRunning UpperHorizontalTracer instead.");
            return UpperHorizontalTracer.run(from_coord, is_right, isOccupied);
        }
        from_coord = is_right
            ? [Math.floor(from_coord[0]), from_coord[1]]
            : [Math.ceil(from_coord[0]), from_coord[1]];
        let check1 = is_right
            ? Utils.topRightCellFromVertex(from_coord)
            : Utils.topLeftCellFromVertex(from_coord);
        let check2 = is_right
            ? Utils.bottomRightCellFromVertex(from_coord)
            : Utils.bottomLeftCellFromVertex(from_coord);
        const d = is_right ? [1, 0] : [-1, 0];
        let last_check1 = check1.slice();
        let last_check2 = check2.slice();
        const fixOffset = is_right ? p => p : p => Utils.addCoords(p, [1, 0]); 
        while (check1[0] >= 0 && check1[0] < ui_states.size[0]) {
            if (isOccupied(check1) && isOccupied(check2))
                return fixOffset(check1);
            
            if (checkerboard) {
                if (isOccupied(check1) && isOccupied(last_check2))
                    return fixOffset(check1);
                if (isOccupied(check2) && isOccupied(last_check1))
                    return fixOffset(check1);
            }
            last_check1 = check1;
            last_check2 = check2;
            check1 = Utils.addCoords(check1, d);
            check2 = Utils.addCoords(check2, d);
        }
        return fixOffset(check1);
    }

    static runRight(from_coord, checkerboard, isOccupied) {
        return this.run(from_coord, true, checkerboard, isOccupied);
    }

    static runLeft(from_coord, checkerboard, isOccupied) {
        return this.run(from_coord, false, checkerboard, isOccupied);
    }
}

const UpperHorizontalTracer = class {
    /**
     * @description Raytracer that only checks for collisions with the cell above it.
     * Only traces horizontal lines with Integer Y-coordinates.
     */

    /**
     * Returns the final coordinate of collision, or the map boundary if no collision occurs.
     * @param {[number, number]} from_coord the coordinate to test line-of-sight from.
     * @param {boolean} is_right _true_ if the direction is +x, _false_ if the direction is -x.
     * @param {RayTracerComparator} isOccupied Function that takes in one input (cell_coord), and outputs true if the cell at cell_coord is occupied, false otherwise.
     * @param {boolean} inverse Set to true if the raytracer should check for free cells instead of occupied cells.
     * @returns {[number, number]} the final coordinate of collision
     * @example
     * const from_coord = ui_states.start;
     * const is_right = true;
     * const isOccupied = cell_coord => {
     *    const cell = ui.cells.at(cell_coord);
     *    return cell === null || cell.cost >= params.lethal;
     * };
     * const collided = LowerHorizontalTracer.run(from_coord, is_right, isOccupied);
     */
    static run(from_coord, is_right, isOccupied, inverse = false) {
        if (from_coord[1] >= ui_states.size[1]) {
            console.warn(`UpperHorizontalTracer: from_coord "${from_coord}"is at the top boundary.`);
            return from_coord;
        }
        from_coord = is_right
            ? [Math.floor(from_coord[0]), from_coord[1]]
            : [Math.ceil(from_coord[0]), from_coord[1]];
        const d = is_right ? [1, 0] : [-1, 0];
        let check = is_right
            ? Utils.topRightCellFromVertex(from_coord)
            : Utils.topLeftCellFromVertex(from_coord);
        const isFree = inverse ? c => isOccupied(c) : c => !isOccupied(c);
        const fixOffset = is_right ? p => p : p => Utils.addCoords(p, [1, 0]); 

        while (check[0] >= 0 && check[0] < ui_states.size[0] && isFree(check)) {
            check = Utils.addCoords(check, d);
        }
        return fixOffset(check);
    }

    static runRight(from_coord, isOccupied, inverse = false) {
        // console.log(`running UpperHorizontalTracer.runRight(${from_coord}, isOccupied, ${inverse})`);
        return this.run(from_coord, true, isOccupied, inverse);
    }

    static runLeft(from_coord, isOccupied, inverse = false) {
        // console.log(`running UpperHorizontalTracer.runLeft(${from_coord}, isOccupied, ${inverse})`);
        return this.run(from_coord, false, isOccupied, inverse);
    }
}

const LowerHorizontalTracer = class {
    /**
     * @description Raytracer that only checks for collisions with the cell below it.
     * Only traces horizontal lines with Integer Y-coordinates.
     */

    /**
     * Returns the final coordinate of collision, or the map boundary if no collision occurs.
     * @param {[number, number]} from_coord the coordinate to test line-of-sight from.
     * @param {boolean} is_right _true_ if the direction is +x, _false_ if the direction is -x.
     * @param {RayTracerComparator} isOccupied Function that takes in one input (cell_coord), and outputs true if the cell at cell_coord is occupied, false otherwise.
     * @param {boolean} inverse Set to true if the raytracer should check for free cells instead of occupied cells.
     * @returns {[number, number]} the final coordinate of collision
     * @example
     * const from_coord = ui_states.start;
     * const is_right = true;
     * const isOccupied = cell_coord => {
     *   const cell = ui.cells.at(cell_coord);
     *   return cell === null || cell.cost >= params.lethal;
     * };
     * const collided = LowerHorizontalTracer.run(from_coord, is_right, isOccupied);
     * 
     */
    static run(from_coord, is_right, isOccupied, inverse = false) {
        if (from_coord[1] <= 0) {
            console.warn(`LowerHorizontalTracer: from_coord "${from_coord}" is at the bottom boundary.`);
            return from_coord;
        }
        const start = Utils.addCoords(from_coord, [0, -1]);
        const res = UpperHorizontalTracer.run(start, is_right, isOccupied, inverse);
        return Utils.addCoords(res, [0, 1]);
    }

    static runRight(from_coord, isOccupied, inverse = false) {
        // console.log(`running LowerHorizontalTracer.runRight(${from_coord}, isOccupied, ${inverse})`);
        return this.run(from_coord, true, isOccupied, inverse);
    }

    static runLeft(from_coord, isOccupied, inverse = false) {
        // console.log(`running LowerHorizontalTracer.runLeft(${from_coord}, isOccupied, ${inverse})`);
        return this.run(from_coord, false, isOccupied, inverse);
    }
}

const HorizontalCornerTracer = class {
    /**
     * @description Raytracer that only checks for collisions with
     * the first corner it encounters past the starting
     * that only works with Integer X and Y-coordinates.
     * 
     * Corner definition: a point p with only one cell occupied around it
     * 
     * Direcitonal Corner definition: a point p is a corner for a ray direction d
     * iff exactly one cell before p is occupied and zero cells after p are occupied.
     */

    /**
     * Returns the final coordinate of collision, or the map boundary if no collision occurs.
     * @param {[number, number]} from_coord the coordinate to test line-of-sight from.
     * @param {boolean} is_right the coordinate to reach.
     * @param {RayTracerComparator} isOccupied Function that takes in one input (cell_coord), and outputs true if the cell at cell_coord is occupied, false otherwise.
     * @param {boolean} top_only Set to true if only corners in the top row should be checked
     * @param {boolean} bottom_only Set to true if only corners in the bottom row should be checked
     * @param {boolean} inverse Set to true if the raytracer should check for free cells instead of occupied cells.
     * @returns {[number, number]} the final coordinate of collision
     * @example
     * const from_coord = ui_states.start;
     * const is_right = true;
     * const isOccupied = cell_coord => {
     *    const cell = ui.cells.at(cell_coord);
     *   return cell === null || cell.cost >= params.lethal;
     * };
     * const top_only = false;
     * const bottom_only = false;
     * const inverse = false;   
     * const collided = HorizontalCornerTracer.run(from_coord, is_right, isOccupied, top_only, bottom_only, inverse);
     */
    static run(from_coord, is_right, isOccupied, top_only = false, bottom_only = false, inverse = false, no_direction = false) {
        if (from_coord[1] <= 0) {
            console.warn("HorizontalCornerTracer: from_coord is at the bottom boundary.");
            return UpperHorizontalTracer.run(from_coord, is_right, isOccupied, inverse);
        } else if (from_coord[1] >= ui_states.size[1]) {
            console.warn("HorizontalCornerTracer: from_coord is at the top boundary.");
            return LowerHorizontalTracer.run(from_coord, is_right, isOccupied, inverse);
        }
        const d = is_right ? [1, 0] : [-1, 0];
        from_coord = is_right
            ? [Math.floor(from_coord[0]), from_coord[1]]
            : [Math.ceil(from_coord[0]), from_coord[1]];
        let check = is_right
            ? Utils.topRightCellFromVertex(from_coord)
            : Utils.topLeftCellFromVertex(from_coord);
        const isNotFree = inverse ? c => !isOccupied(c) : c => isOccupied(c);

        const makeCount = top_only ? (top, bottom) => top && bottom ? 2 : top && !bottom ? 1 : 0
            : bottom_only ? (top, bottom) => top && bottom ? 2 : !top && bottom ? 1 : 0
            : (top, bottom) => top + bottom;
        const fixOffset = is_right ? p => p : p => Utils.addCoords(p, [1, 0]); 

        const sum = arr => arr.reduce((a, b) => a + b, 0);
        const isWall = counter => sum(counter[1]) == 2
            || (counter[0][0] && counter[1][1])
            || (counter[0][1] && counter[1][0]);

        const counter = [];

        const prev = Utils.topLeftCellFromVertex(check);
        const prev_bottom = Utils.bottomRightCellFromVertex(prev);
        counter.push([isNotFree(prev), isNotFree(prev_bottom)]);

        const bottom = Utils.bottomRightCellFromVertex(check);
        counter.push([isNotFree(check), isNotFree(bottom)]);
        // does not check for checkerboard on the first cell
        if (sum(counter[1]) == 2) return fixOffset(check);

        counter.shift();
        
        check = Utils.addCoords(check, d);
        
        while (check[0] >= 0 && check[0] < ui_states.size[0]) {
            const bottom = Utils.bottomRightCellFromVertex(check);
            // break if there is a wall
            counter.push([isNotFree(check), isNotFree(bottom)]);
            if (isWall(counter)) break;
            // break if the corner is found
            if (sum(counter[0]) == 1 && sum(counter[1]) == 0) {
                break;
            }
            if (no_direction && sum(counter[0]) == 0 && sum(counter[1]) == 1) {
                break;
            }
            counter.shift();
            check = Utils.addCoords(check, d);
        }
        return fixOffset(check);
    }

    static runRight(from_coord, isOccupied, top_only = false, bottom_only = false, inverse = false, no_direction = false) {
        return this.run(from_coord, true, isOccupied, top_only, bottom_only, inverse, no_direction);
    }

    static runLeft(from_coord, isOccupied, top_only = false, bottom_only = false, inverse = false, no_direction = false) {
        return this.run(from_coord, false, isOccupied, top_only, bottom_only, inverse, no_direction);
    }


}