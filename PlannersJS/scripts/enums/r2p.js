"use strict";

/**
 * @readonly
 * @enum {number}
 */
const R2PActionLink = {
    /** True to Display, false to style display to "none". {boolean} */
    Display: 0,
    /** z-index. Integer {number}. */
    ZIndex: 1,
    /** L = -1, R = 1, {-1 | 1 | R2PSide} */
    Side: 2,
    /** Src = -1, Tgt = 1, {-1 | 1 | R2PTreeDir} */
    Tdir: 3,
    /** Src point. Grid coordinates {[number, number]} */
    SrcCoord: 4,
    /** An integer determining the amount of deviation from the straight line for the drawn curve, with 0 being straight, and higher numbers being more deviated. {number} */
    Knob: 5,
    /** Tgt point. Grid coordinates {[number, number]} */
    TgtCoord: 6,
    /** {number} */
    Id: 7,
    /** {R2PLinkStatus} */
    Status: 8,
    /** Node type at anchor. {R2PLinkType} */
    Type: 9,
    /** Cost at link anchor from tree root {number} */
    Cost: 10,
    /** Left Ray [dx, dy, from_origin]. dx and dy determines the shape of the ray. 
     * If from_origin is true, the ray points from the src point. 
     * If from_origin is false, the ray points to the src point. 
     * {[number, number, boolean]} */
    LeftRay: 11,
    /** Left Ray [dx, dy, from_origin]. dx and dy determines the shape of the ray. 
     * If from_origin is true, the ray points from the src point. 
     * If from_origin is false, the ray points to the src point. 
     * {[number, number, boolean]} */
    RightRay: 12,
    /** {[number, number]} */
    ProgRay: 13,
    /** {[id, add]} if add is true, point to src link sprite id. If add is false, remove src link sprite id.  {[number, boolean]} */
    AddSrcId: 14,
    /** {[id, add]} if add is true, point to tgt link sprite id. If add is false, remove src link sprite id.  {[number, boolean]} */
    AddTgtId: 15,
    length: 16,
}
Object.freeze(R2PActionLink);

/**
 * @readonly
 * @enum {number}
 */
const R2PLinkStatus = {
    None: 0,
    Expanding: 1,
    Waiting: 2,
    Pruning: 3,
    Placing: 4,
    Queued: 5,
    Path: 6,
    length: 7,
    /**
     * @param {R2PLinkType | any} type 
     * @returns {string}
     */
    toString(type) {
        if (type === this.None)
            return "None";
        else if (type === this.Expanding)
            return "Expanding";
        else if (type === this.Waiting)
            return "Waiting";
        else if (type === this.Pruning)
            return "Pruning";
        else if (type === this.Placing)
            return "Placing";
        else if (type === this.Queued)
            return "Queued";
        else if (type === this.Path)
            return "Path!";
        else
            return "";
    }
};
Object.freeze(R2PLinkStatus);

/**
 * @readonly
 * @enum {number}
 */
const R2PLinkType = {
    Vu: 0,
    Eu: 1,
    Vy: 2,
    Ey: 3,
    Tm: 4,
    Un: 5,
    Oc: 6,
    length: 7,
    /** 
     * @param {R2PLinkType | any} type 
     * @returns {string}
     * */
    toString(type) {
        if (type === R2PLinkType.Vu)
            return "Vu";
        else if (type === R2PLinkType.Eu)
            return "Eu";
        else if (type === R2PLinkType.Vy)
            return "Vy";
        else if (type === R2PLinkType.Ey)
            return "Ey";
        else if (type === R2PLinkType.Tm)
            return "Tm";
        else if (type === R2PLinkType.Un)
            return "Un";
        else if (type === R2PLinkType.Oc)
            return "Oc";
        else
            return "??";
    },
};
Object.freeze(R2PLinkType);

/**
 * @readonly
 * @enum {number}
 */
const R2PActionSector = {
    /** True to Display, false to style display to "none". {boolean} */
    Display: 0,
    /** z-index. Integer {number}. */
    ZIndex: 1,
    /** Src point. Grid coordinates {[number, number]} */
    SrcCoord: 2,
    /** Left Ray [dx, dy, from_origin]. dx and dy determines the shape of the ray. 
     * If from_origin is true, the ray points from the src point. 
     * If from_origin is false, the ray points to the src point. 
     * {Algs.R2PRay} */
    LeftRay: 3,
    /** Left Ray [dx, dy, from_origin]. dx and dy determines the shape of the ray. 
     * If from_origin is true, the ray points from the src point. 
     * If from_origin is false, the ray points to the src point. 
     * {Algs.R2PRay} */
    RightRay: 4,
    /** {R2PSectorClass} */
    Class: 5,
    length: 6,
}
Object.freeze(R2PActionSector);

/**
 * @readonly
 * @enum {number}
 */
const R2PSectorClass = {
    Active: 0,
    Inactive: 1,
    length: 2,
};
Object.freeze(R2PSectorClass);

/**
 * @readonly
 * @enum {number}
 */
const R2PActionProg = {
    /** True to Display, false to style display to "none". {boolean} */
    Display: 0,
    /** z-index. Integer {number}. */
    ZIndex: 1,
    /** The coordinate where the progression ray originates. {[number, number]} */
    SrcCoord: 2,
    /** The difference vector. {[number, number]} */
    Diff: 3,
    length: 4,
};
Object.freeze(R2PActionProg);

/**
 * @readonly
 * @enum {number}
 */
const R2PActionTrace = {
    /** True to Display, false to style display to "none". {boolean} */
    Display: 0,
    /** z-index. Integer {number}. */
    ZIndex: 1,
    /** {[number, number]} Adds a coordinate reflecting the current position of the trace */
    Add: 2,
    /** {undefined} clears the stack.  */
    Clear: 3,
    /** {R2PTraceClass} Adds a coordinate reflecting the current position of the trace */
    Class: 4,
    length: 5,
};
Object.freeze(R2PActionTrace);

/**
 * @readonly
 * @enum {number}
 */
const R2PTraceClass = {
    Inactive: 0,
    Waiting: 1,
    Active: 2,
    length: 3,
};
Object.freeze(R2PTraceClass);


/**
 * @readonly
 * @enum {number}
 */
const R2PSide = {
    L: -1,
    R: 1,
    length: 2,
    /** @param {R2PSide} side */
    toString(side) {
        if (side === R2PSide.L)
            return "L";
        else if (side === R2PSide.R)
            return "R";
        else
            return "?";
    },
};
Object.freeze(R2PSide);

/**
 * @readonly
 * @enum {number}
 */
const R2PTreeDir = {
    Src: -1,
    Tgt: 1,
    length: 2,
    /** @param {R2PTreeDir} tdir */
    toString(tdir) {
        if (tdir === R2PTreeDir.Src)
            return "S";
        else if (tdir === R2PTreeDir.Tgt)
            return "T";
        else
            return "?";
    },
};
Object.freeze(R2PTreeDir);


/** @enum{number}
 * @readonly
 */
const R2PListDir = {
    Front: 0,
    Back: 1,
    Auto: 2,
    length: 3,
};
Object.freeze(R2PListDir);

/** 
 * @enum{number}
 * @readonly
 */
const R2PQueueType = {
    Cast: 0,
    Trace: 1,
    length: 2,
    /** @param {R2PQueueType} type */
    toString(type) {
        if (type === R2PQueueType.Cast)
            return "Cast";
        else if (type === R2PQueueType.Trace)
            return "Trace";
        else
            return "?????";
    }
};
Object.freeze(R2PQueueType);