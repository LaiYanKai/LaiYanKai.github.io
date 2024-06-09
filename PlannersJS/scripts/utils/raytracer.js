"use strict";

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
    #next_len = Array(2); // always positive
    #grad = Array(2); // always positive
    #root = Array(2);
    #sgn = Array(2);
    #len_travelled = 0; // always positive

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
                this.#next_len[d] = this.#grad[d];
            }
            else if (this.#dif[d] + RayTracer.#THRES < 0) { // this.#dif[d] is negative
                this.#sgn[d] = -1;
                this.#root[d] = Math.ceil(from[d]);
                this.#grad[d] = this.#sgn[d] / this.#dif[d];
                this.#next_len[d] = this.#grad[d];
            }
            else { // this.#dif[d] is close to zero.
                this.#root[d] = Math.floor(from[d]);
                this.#sgn[d] = 0;
                this.#grad[d] = Infinity; // avoid NaN
                this.#dif[d] = 0;
                this.#next_len[d] = Infinity;
            }
        }

        this.#len_travelled = 0;
        this.#state = RayTracerState.XY;
    }

    #getNext(d) {
        this.#root[d] += this.#sgn[d];
        this.#next_len[d] += this.#grad[d];
    }

    /**
     * Brings the raytracer to the next root vertex
     * Use adjCellFromVertex to get cell corresponding to vertex.
     */
    update() {
        if (this.#next_len[1] - this.#next_len[0] > RayTracer.#THRES) {
            this.#len_travelled = this.#next_len[0];
            this.#state = this.#sgn[1] === 0 ? RayTracerState.XY : RayTracerState.X;

            this.#getNext(0); // x crossed a grid line before y crossed a grid line 
        }
        else if (this.#next_len[0] - this.#next_len[1] > RayTracer.#THRES) {
            this.#len_travelled = this.#next_len[1];
            this.#state = this.#sgn[0] === 0 ? RayTracerState.XY : RayTracerState.Y;

            this.#getNext(1); // y crossed a grid line before x crossed a grid line
        }
        else { // x and y crossed grid line at same location
            this.#len_travelled = this.#next_len[0];
            this.#state = RayTracerState.XY;

            this.#getNext(0);
            this.#getNext(1);
        }
    }

    /** Returns the sign direction (array) */
    getSgn() { return this.#sgn; }

    /** Returns the root vertex (array) */
    getRoot() { return this.#root; }

    /** @returns {[number, number]} */
    getDiff() {return this.#dif; }

    /** @returns {RayTracerState} */
    getState() { return this.#state; }

    /** Returns the length travelled (number). 
     * Distance between "from" and "to" is normalised to one */
    getLenTravelled() { return this.#len_travelled; }

    /** Checks if reached */
    hasReached() { return this.#len_travelled > RayTracer.#REACHED_THRES; }

};
