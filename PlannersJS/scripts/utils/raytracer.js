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
        this.#sgn = [NaN, NaN];
        this.#plen_travelled = Infinity;
        this.#front_sgns = [];
        this.#state = RayTracerState.XY;
    }

    /**
     * @param {[number, number]} from_coord 
     * @param {[number, number]} to_coord 
     */
    init(from_coord, to_coord) {
        for (let d = 0; d < 2; ++d) {
            this.#dif[d] = to_coord[d] - from_coord[d];

            if (this.#dif[d] - this.#thres > 0) {  // this.#dif[d] is positive.
                this.#sgn[d] = 1;
                this.#root[d] = Math.floor(from_coord[d]);
                this.#cache[d] = this.#sgn[d] - from_coord[d];
                this.#next_plen[d] = (this.#root[d] + this.#cache[d]) / this.#dif[d];
            }
            else if (this.#dif[d] + this.#thres < 0) { // this.#dif[d] is negative
                this.#sgn[d] = -1;
                this.#root[d] = Math.ceil(from_coord[d]);
                this.#cache[d] = this.#sgn[d] - from_coord[d];
                this.#next_plen[d] = (this.#root[d] + this.#cache[d]) / this.#dif[d];
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
        this.#plen_travelled = 0;
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
        if (Utils.approxEq(err, 0) && front_sgn[d] === 0)
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
     * Brings the raytracer to the next root vertex
     * Make sure to call it in the following order:
     * @example 
     * this.init(from_coord, to_coord);
     * while (1) {
     *     for (const front_sgn of this.getFrontSgn()) {
     *         const front_cell_coord = Utils.adjCellFromVertex(this.getRoot(), sgn);
     *         const cell_cost = ui.cells.at(front_cell_coord); // if at least one of the cell_cost is free, then no collision, just break.
     *     }
     *     if (this.getState() === RayTracerState.XY) { // only if u need to check checkerboard.
     *         for (const ch_sgn_pair of this.getCheckerboardSgnPairs()) {
     *             const cell_coord1 = Utils.adjCellFromVertex(this.getRoot(), sgn_pair[0]);
     *             const cell_cost1 = ui.cells.at(cell_coord1);
     *             const cell_coord2 = Utils.adjCellFromVertex(this.getRoot(), sgn_pair[1]);
     *             const cell_cost2 = ui.cells.at(cell_coord2);
     *             // blocked iff both are occupied.
     *         }
     *     }
     *     if (this.hasReached())
     *         break;
     *     this.update();
     * }
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
     * <caption>See this.update() for more example code</caption>
     * for (const sgn of this.getFrontSgn()) {
     *     const front_cell_coord = Utils.adjCellFromVertex(this.getRoot(), sgn);
     * }
     * @yields {[number, number]} 
    */
    *getFrontSgn() {
        for (const sgn of this.#front_sgns)
            yield sgn.slice();
    }


    /**
     * Yields a pair of sign directions from the root vertex, which indicates the pair of diagonally opposite cells to check for checkerboard corners.
     * Let sgn_pair be the yielded pair of sign directions.
     * @example 
     * <caption>See this.update() for more example code</caption>
     * for (const sgn_pair of this.getCheckerboardSgnPairs()) {
     *     const cell_coord1 = Utils.adjCellFromVertex(this.getRoot(), sgn_pair[0]);
     *     const cell_coord2 = Utils.adjCellFromVertex(this.getRoot(), sgn_pair[1]);
     * }
     * @yields {[[number, number], [number, number]]}
     */
    *getCheckerboardSgnPairs() {
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