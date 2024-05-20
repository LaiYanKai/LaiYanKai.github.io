"use strict"

const Utils = {
    isEnum: function (value, enum_class) {
        return value === null
            || (Number.isInteger(value)
                && value >= -1
                && value < enum_class.length);
    },

    isNonNegative: function (value) {
        return typeof value === "number" && value >= 0;
    },

    isNonNegativeInteger: function (value) {
        return this.isNonNegative(value) && Number.isInteger(value);
    },

    isFiniteNonNegative: function (value) {
        return this.isNonNegative(value) && Number.isFinite(value);
    },

    isFiniteNonNegativeInteger: function (value) {
        return this.isFiniteNonNegative(value) && Number.isFinite(value);
    },

    /**
     * Returns true if *coord* is a pair of coordinates (an array of two numbers).
     * @param {*} coord 
     * @returns true if *coord* is a pair of coordinates, false otherwise.
     */
    isCoord: function (coord) {
        return Array.isArray(coord) && coord.length === 2 &&
            typeof coord[0] === "number" && typeof coord[1] === "number";
    },

    /**
     * Returns true if *coord* is a pair of non-negative coordinates (an array of two non-negative numbers).
     * @param {*} coord 
     * @returns true if *coord* is a pair of coordinates, false otherwise.
     */
    isFiniteNonNegativeCoord: function (coord) {
        return this.isCoord(coord) && this.isFiniteNonNegative(coord[0]) && this.isFiniteNonNegative(coord[1]);
    },

    /** 
     * Returns ture if *coord* is a pair of integer coordinates (an array of two integers).
     * @param {*} coord
     * @returns true if *coord* is a pair of integer coordinates, false otherwise.
     */
    isFiniteNonNegativeIntegerCoord: function (coord) {
        return this.isCoord(coord) && this.isFiniteNonNegativeInteger(coord[0]) && this.isFiniteNonNegativeInteger(coord[1]);
    },


    /** 
     * Clamps a value to the range between min and max inclusive.
     * @param {number} value The value to clamp.
     * @param {number} min The minimum value.
     * @param {number} max The maximum value.
     * @returns {number} The clamped value. */
    clamp: function (value, min, max) {
        if (value < min)
            return min;
        else if (value > max)
            return max;
        else
            return value;
    },

    approxGt: function (value1, value2) { return value1 > value2 + ui_params.thresh; },
    approxGe: function (value1, value2) { return value1 > value2 - ui_params.thresh; },

    /** 
     * Returns the *cell* coordinate in the directional vector of a *vertex* coordinate. 
     * @param {[number, number]} vertex_coord An array of two integers describing the *grid* coordinates of the vertex.
     * @param {[number, number]} sgn An array of two real numbers  describing the direction of the adjacent cell.
     * @returns {[number, number]} An array of two integers describing the *cell* coordinates of the adjacent cell. 
    */
    adjCellFromVertex: function (vertex_coord, sgn) {
        let cell_coord = [vertex_coord[0], vertex_coord[1]];
        if (sgn[0] < 0)
            --cell_coord[0];
        if (sgn[1] < 0)
            --cell_coord[1];
        return cell_coord;
    },


    /** 
     * Creates a 2D array filled with a value.
     * @param {[number, number]} size an array of two non-negative numbers describing the size of the new array.
     * @param {*} value the new value to fill the array with. Must be an immutable object.
     * @returns {[][]} a 2D array emulating a matrix.
     */
    createArray2d: function (size, value) {
        const arr = Array(size[0]);
        for (let x = 0; x < size[0]; ++x)
            arr[x] = Array(size[1]).fill(value);
        return arr;
    },

    /** 
     * Flattens a 2D array (matrix) into an array. Wraps the array flat() function.
     * @param {[][]} array2d the 2d array to flatten.
     * @returns {[]} the flattened array.
    */
    array2dToArray: function (array2d) { return array2d.flat(); },

    /** 
     * Unflattens an array into a 2D array emulating a square matrix. 
     * @param {[]} array The array to unflatten.
     * @param {[number, number]} size An array of two positive integers that describes the size of the emulated square matrix. The product of the two integers must match the length of the input *array*.
     * @throws if *array* length is not the same as the product of the integers in *size*.
     * @returns {[][]} The 2D array emulating a square matrix.
     */
    arrayToArray2d: function (array, size) {
        if (array.length != size[0] * size[1])
            throw new Error(`array length (${array.length}) not equals to total size (${size[0]} * ${size[1]})`);

        const arr = Array(size[0]);
        let k = 0;
        for (let x = 0; x < size[0]; ++x) {
            const column = Array(size[1]);
            for (let y = 0; y < size[1]; ++y)
                column[y] = array[k++];
            arr[x] = column;
        }
        return arr;
    },

    /** 
     * Wrapper to create an SVG element.
     * @param type the svg tag name to create.
     */
    createSVGElement: function (type) { return document.createElementNS("http://www.w3.org/2000/svg", type); },


    /**
     * Adds two coordinates
     * @param {[number, number]} coord1
     * @param {[number, number]} coord2
     * @returns {[number, number]} sum of coordinates.
     */
    addCoord: function (coord1, coord2) {
        return [
            coord1[0] + coord2[0],
            coord1[1] + coord2[1]
        ];
    },

    /**
     * Returns coord1 - coord2.
     * @param {[number, number]} coord1 
     * @param {[number, number]} coord2 
     */
    subtractCoord: function (coord1, coord2) {
        return [
            coord1[0] - coord2[0],
            coord1[1] - coord2[1]
        ];
    },

    dotCoords: function (coord1, coord2) {
        return coord1[0] * coord2[0] + coord1[1] * coord2[1];
    },


    detCoords: function (coord1, coord2) {
        return coord1[0] * coord2[1] - coord1[1] * coord2[0];
    },

    equalIntegerCoords: function (coord1, coord2) {
        return coord1[0] === coord2[0] && coord1[1] === coord2[1];
    },

    /** 
     * Converts a 2D directional vector into the corresponding directional index.
     * @param {[number, number]} dir an array of two numbers describing the directional vector. The vector cannot be zero. 
     * @param {number} thresh if the absolute of a value in *dir* is smaller than *thresh*, the value will be evaluated as zero.
     * @throws an error if *dir* is [0, 0].
     * @returns {number} directional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
     */
    dirToDirIndex (dir, thresh = 0) {
        if (dir[0] > thresh) {
            if (dir[1] > thresh)
                return DirIndex.NE; // [1, 1]
            else if (dir[1] < thresh)
                return DirIndex.SE; // [1,-1] 
            else
                return DirIndex.E; // [1, 0]
        }
        else if (dir[0] < thresh) {
            if (dir[1] > thresh)
                return DirIndex.NW; // [-1, 1]
            else if (dir[1] < thresh)
                return DirIndex.SW; // [-1,-1]
            else
                return DirIndex.W; // [-1, 0]
        }
        else {
            if (dir[1] > thresh)
                return DirIndex.N; // [0, 1]
            else if (dir[1] < thresh)
                return DirIndex.S; // [0,-1]
            else
                throw new Error(`Invalid directional vector [0, 0].`);
        }
    },


    /** 
     * Converts a directional index into the corresponding 2D sign directional vector.
     * @param {number} didx directional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
     * @throws if *didx* is not a directional index.
     * @returns {[number, number]} a sign directional vector, where N is [0, 1], NE is [-1, 1] etc.
     */
    dirIndexToDir (didx) {
        if (didx === DirIndex.N)
            return [0, 1];
        else if (didx === DirIndex.NW)
            return [-1, 1];
        else if (didx === DirIndex.W)
            return [-1, 0];
        else if (didx === DirIndex.SW)
            return [-1, -1];
        else if (didx === DirIndex.S)
            return [0, -1];
        else if (didx === DirIndex.SE)
            return [1, -1];
        else if (didx === DirIndex.E)
            return [1, 0];
        else if (didx === DirIndex.NE)
            return [1, 1];
        else
            throw new Error(`Invalid didx=${didx}`);
    },

    /**
     * Wraps a directional index to 0 and 7 inclusive. 
     * @param {number} didx an integer to convert to a directional index.
     * @returns {number} A direcional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
     */
    wrapDirIndex (didx) {
        return ((didx % DirIndex.length) + DirIndex.length) % DirIndex.length;
    },

    /** 
     * Adds two directional indices (didx1 + didx2) and returns the directional index representing the sum.
     * @param {number} didx1 directional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
     * @param {number} didx2 directional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
     * @returns {number} A directional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
    */
    addDirIndex: function (didx1, didx2) {
        return this.wrapDirIndex(didx1 + didx2);
    },

    isCardinal: function (didx) {
        return didx % 2 === 0;
    },

    dirIndexRange: function* (from_didx = DirIndex.N, increment = 1) {
        for (let d = 0; d < DirIndex.length; d += increment)
            yield this.addDirIndex(from_didx, d);
    },

    euclidean: function (diff_coord) {
        return Math.sqrt(diff_coord[0] * diff_coord[0] + diff_coord[1] * diff_coord[1]);
    },
    octile: function (diff_coord) {
        const ax = Math.abs(diff_coord[0]);
        const ay = Math.abs(diff_coord[1]);
        let as, al;
        if (ax <= ay) {
            as = ax;
            al = ay;
        }
        else {
            as = ay;
            al = ax;
        }
        return as * Math.SQRT2 + al - as;
    },
    manhattan: function (diff_coord) {
        const ax = Math.abs(diff_coord[0]);
        const ay = Math.abs(diff_coord[1]);
        return ax + ay;
    },
    chebyshev: function (diff_coord) {
        const ax = Math.abs(diff_coord[0]);
        const ay = Math.abs(diff_coord[1]);
        return ax > ay ? ax : ay;
    },
};
Object.freeze(Utils);
