"use strict";

/**
 * @readonly
 * @enum {number}
 */
const AnyaAction = {
    /** True to Display, false to style display to "none". {boolean} */
    Display: 0,
    /** z-index. Integer {number}. */
    ZIndex: 1,
    /** {AnyaNodeStatus} */
    Status: 2,
    /** Node type at anchor. {AnyaNodeType} */
    Type: 3,
    /** FCost {number} */
    FCost: 4,
    /** GCost {number} */
    GCost: 5,
    /** HCost {number} */
    HCost: 6,
    /** {[number, number]} */
    Root: 7,
    /** {[number, number]} The directional vector of the first (any) interval coordinate for cone nodes. Not used by flat nodes.*/
    Interval0: 8,
    /** {[number, number]} The directional vector of the second (any) interval coordinate for cone nodes, or the interval coordinate for flat nodes that does not correspond to the root.*/
    Interval1: 9,
    /** {[number, number]} */
    length: 10,
}
Object.freeze(AnyaAction);

/**
 * @readonly
 * @enum {number}
 */
const AnyaNodeStatus = {
    Queued: 0,
    Expanding: 1,
    Visited: 2,
    Path: 3,
    length: 4,
    /**
     * @param {AnyaNodeStatus} status 
     */
    toString: function(status) {
        if (status === this.Queued)
            return "Queued";
        else if (status === this.Expanding)
            return "Expanding";
        else if (status === this.Visited)
            return "Visited";
        else if (status === this.Path)
            return "Path";
        else 
            return "???";
    }
};
Object.freeze(AnyaNodeStatus);

/**
 * @readonly
 * @enum {number}
 */
const AnyaNodeType = {
    Flat: 0,
    Cone: 1,
    Start: 2,
    length: 3,
    /**
     * @param {AnyaNodeType} type 
     */
    toString: function(type) {
        if (type === this.Flat)
            return "Flat";
        else if (type === this.Cone)
            return "Cone";
        else if (type === this.Start)
            return "Start";
        return "???";
    }
}
Object.freeze(AnyaNodeType);

/**
 * @readonly
 * @enum {number}
 */
const AnyaIntervalType = {
    OpenLeft: 0,
    OpenRight: 1,
    Closed: 2,
    length: 3,
    /**
     * @param {AnyaIntervalType} type 
     */
    toString: function(type) {
        if (type === this.OpenLeft)
            return "OpenLeft";
        else if (type === this.OpenRight)
            return "OpenLeft";
        else if (type === this.Closed)
            return "Closed";
        return "???";
    }
}
