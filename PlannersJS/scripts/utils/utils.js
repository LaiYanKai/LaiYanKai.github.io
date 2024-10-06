"use strict"

const Utils = {
  isEnum: function (value, enum_class) {
    return (
      value === null ||
      (Number.isInteger(value) && value >= -1 && value < enum_class.length)
    );
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
    return (
      Array.isArray(coord) &&
      coord.length === 2 &&
      typeof coord[0] === "number" &&
      typeof coord[1] === "number"
    );
  },

  /**
   * Returns true if *coord* is a pair of non-negative coordinates (an array of two non-negative numbers).
   * @param {*} coord
   * @returns true if *coord* is a pair of coordinates, false otherwise.
   */
  isFiniteNonNegativeCoord: function (coord) {
    return (
      this.isCoord(coord) &&
      this.isFiniteNonNegative(coord[0]) &&
      this.isFiniteNonNegative(coord[1])
    );
  },

  /**
   * Returns ture if *coord* is a pair of integer coordinates (an array of two integers).
   * @param {*} coord
   * @returns true if *coord* is a pair of integer coordinates, false otherwise.
   */
  isFiniteNonNegativeIntegerCoord: function (coord) {
    return (
      this.isCoord(coord) &&
      this.isFiniteNonNegativeInteger(coord[0]) &&
      this.isFiniteNonNegativeInteger(coord[1])
    );
  },

  /**
   * Clamps a value to the range between min and max inclusive.
   * @param {number} value The value to clamp.
   * @param {number} min The minimum value.
   * @param {number} max The maximum value.
   * @returns {number} The clamped value. */
  clamp: function (value, min, max) {
    if (value < min) return min;
    else if (value > max) return max;
    else return value;
  },

  approxGt: function (value1, value2) {
    return value1 > value2 + ui_params.thresh;
  },
  approxGe: function (value1, value2) {
    return value1 > value2 - ui_params.thresh;
  },
  approxEq: function (value1, value2) {
    return Math.abs(value2 - value1) <= ui_params.thresh;
  },

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
     * Returns the *cell* coordinate top right of a *vertex* coordinate. 
     * @param {[number, number]} vertex_coord An array of two integers describing the *grid* coordinates of the vertex.
     * @returns {[number, number]} An array of two integers describing the *cell* coordinates of the top right cell. 
     */
    topRightCellFromVertex: function (vertex_coord) {
        return Utils.adjCellFromVertex(vertex_coord, [0, 0]);
    },

    /**
     * Returns the *cell* coordinate top left of a *vertex* coordinate.
     * @param {[number, number]} vertex_coord An array of two integers describing the *grid* coordinates of the vertex.
     * @returns {[number, number]} An array of two integers describing the *cell* coordinates of the top left cell.
     */
    topLeftCellFromVertex: function (vertex_coord) {
        return Utils.adjCellFromVertex(vertex_coord, [-1, 0]);
    },

    /**
     * Returns the *cell* coordinate bottom right of a *vertex* coordinate.
     * @param {[number, number]} vertex_coord An array of two integers describing the *grid* coordinates of the vertex.
     * @returns {[number, number]} An array of two integers describing the *cell* coordinates of the bottom right cell.
     */
    bottomRightCellFromVertex: function (vertex_coord) {
        return Utils.adjCellFromVertex(vertex_coord, [0, -1]);
    },

    /**
     * Returns the *cell* coordinate bottom left of a *vertex* coordinate.
     * @param {[number, number]} vertex_coord An array of two integers describing the *grid* coordinates of the vertex.
     * @returns {[number, number]} An array of two integers describing the *cell* coordinates of the bottom left cell.
     */
    bottomLeftCellFromVertex: function (vertex_coord) {
        return Utils.adjCellFromVertex(vertex_coord, [-1, -1]);
    },

  /**
   * Creates a 2D array filled with a value.
   * @param {[number, number]} size an array of two non-negative numbers describing the size of the new array.
   * @param {*} value the new value to fill the array with. Must be an immutable object.
   * @returns {[][]} a 2D array emulating a matrix.
   */
  createArray2d: function (size, value) {
    const arr = Array(size[0]);
    for (let x = 0; x < size[0]; ++x) arr[x] = Array(size[1]).fill(value);
    return arr;
  },

  /**
   * Flattens a 2D array (matrix) into an array. Wraps the array flat() function.
   * @param {[][]} array2d the 2d array to flatten.
   * @returns {[]} the flattened array.
   */
  array2dToArray: function (array2d) {
    return array2d.flat();
  },

  /**
   * Unflattens an array into a 2D array emulating a square matrix.
   * @param {[]} array The array to unflatten.
   * @param {[number, number]} size An array of two positive integers that describes the size of the emulated square matrix. The product of the two integers must match the length of the input *array*.
   * @throws if *array* length is not the same as the product of the integers in *size*.
   * @returns {[][]} The 2D array emulating a square matrix.
   */
  arrayToArray2d: function (array, size) {
    if (array.length != size[0] * size[1])
      throw new Error(
        `array length (${array.length}) not equals to total size (${size[0]} * ${size[1]})`
      );

    const arr = Array(size[0]);
    let k = 0;
    for (let x = 0; x < size[0]; ++x) {
      const column = Array(size[1]);
      for (let y = 0; y < size[1]; ++y) column[y] = array[k++];
      arr[x] = column;
    }
    return arr;
  },

  /**
   * Wrapper to create an SVG element.
   * @param type the svg tag name to create.
   */
  createSVGElement: function (type) {
    return document.createElementNS("http://www.w3.org/2000/svg", type);
  },

  /**
   * Adds two coordinates
   * @param {[number, number]} coord1
   * @param {[number, number]} coord2
   * @returns {[number, number]} sum of coordinates.
   */
  addCoords: function (coord1, coord2) {
    return [coord1[0] + coord2[0], coord1[1] + coord2[1]];
  },

  /**
   * Returns coord1 - coord2.
   * @param {[number, number]} coord1
   * @param {[number, number]} coord2
   */
  subtractCoords: function (coord1, coord2) {
    return [coord1[0] - coord2[0], coord1[1] - coord2[1]];
  },

  dotCoords: function (coord1, coord2) {
    return coord1[0] * coord2[0] + coord1[1] * coord2[1];
  },

  multiplyCoord: function (coord1, scalar) {
    return [coord1[0] * scalar, coord1[1] * scalar];
  },

  divideCoord: function (coord1, scalar) {
    return [coord1[0] / scalar, coord1[1] / scalar];
  },

    unitCoord: function (coord1) {
        const mag = Math.hypot(coord1[0], coord1[1]);
        if (mag === 0) return [0, 0];
        return [coord1[0] / mag, coord1[1] / mag];
    },

  detCoords: function (coord1, coord2) {
    return coord1[0] * coord2[1] - coord1[1] * coord2[0];
  },

  equalIntegerCoords: function (coord1, coord2) {
    return coord1[0] === coord2[0] && coord1[1] === coord2[1];
  },
  equalFloatCoords: function (coord1, coord2) {
    return (
      Math.abs(coord1[0] - coord2[0]) <= ui_params.thresh &&
      Math.abs(coord1[1] - coord2[1]) <= ui_params.thresh
    );
  },

  /**
   * Converts a 2D directional vector into the corresponding directional index.
   * @param {[number, number]} dir an array of two numbers describing the directional vector. The vector cannot be zero.
   * @param {number} thresh if the absolute of a value in *dir* is smaller than *thresh*, the value will be evaluated as zero.
   * @throws an error if *dir* is [0, 0].
   * @returns {number} directional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
   */
  dirToDirIndex(dir, thresh = 0) {
    if (dir[0] > thresh) {
      if (dir[1] > thresh) return DirIndex.NE; // [1, 1]
      else if (dir[1] < thresh) return DirIndex.SE; // [1,-1]
      else return DirIndex.E; // [1, 0]
    } else if (dir[0] < thresh) {
      if (dir[1] > thresh) return DirIndex.NW; // [-1, 1]
      else if (dir[1] < thresh) return DirIndex.SW; // [-1,-1]
      else return DirIndex.W; // [-1, 0]
    } else {
      if (dir[1] > thresh) return DirIndex.N; // [0, 1]
      else if (dir[1] < thresh) return DirIndex.S; // [0,-1]
      else throw new Error(`Invalid directional vector [0, 0].`);
    }
  },

  /**
   * Converts a directional index into the corresponding 2D sign directional vector.
   * @param {number} didx directional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
   * @throws if *didx* is not a directional index.
   * @returns {[number, number]} a sign directional vector, where N is [0, 1], NE is [-1, 1] etc.
   */
  dirIndexToDir(didx) {
    if (didx === DirIndex.N) return [0, 1];
    else if (didx === DirIndex.NW) return [-1, 1];
    else if (didx === DirIndex.W) return [-1, 0];
    else if (didx === DirIndex.SW) return [-1, -1];
    else if (didx === DirIndex.S) return [0, -1];
    else if (didx === DirIndex.SE) return [1, -1];
    else if (didx === DirIndex.E) return [1, 0];
    else if (didx === DirIndex.NE) return [1, 1];
    else throw new Error(`Invalid didx=${didx}`);
  },

  /**
   * Wraps a directional index to 0 and 7 inclusive.
   * @param {number} didx an integer to convert to a directional index.
   * @returns {number} A direcional index, non-negative integer between 0 to 7 inclusive, where 0 is N, 1 is NE etc.
   */
  wrapDirIndex(didx) {
    return ((didx % DirIndex.length) + DirIndex.length) % DirIndex.length;
  },

  /** Returns the equivalent radians r in the range -pi <= r < pi. */
  wrapAngle(rad) {
    const PI2 = Math.PI * 2;
    rad += Math.PI;
    return (((rad % PI2) + PI2) % PI2) - Math.PI;
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
    return Math.hypot(diff_coord[0], diff_coord[1]);
  },

  octile: function (diff_coord) {
    const ax = Math.abs(diff_coord[0]);
    const ay = Math.abs(diff_coord[1]);
    let as, al;
    if (ax <= ay) {
      as = ax;
      al = ay;
    } else {
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

  /**
   * Returns the value of a cubic bezier curve
   * @param {number} t The parametric position, 0 <= t <= 1. 0 is at the start, 1 is at the end.
   * @param {number} p0 The starting coordinate
   * @param {number} p1 The position of the control knob for the starting coordinate.
   * @param {number} p2 The position of the control knob for the end coordinate.
   * @param {number} p3 The end coordinate.
   */
  cubicBezier(t, p0, p1, p2, p3) {
    return (
      (1 - t) ** 3 * p0 +
      3 * t * (1 - t) ** 2 * p1 +
      3 * (1 - t) * t ** 2 * p2 +
      t ** 3 * p3
    );
  },

  /**
   * Returns the gradient of a cubic bezier curve
   * @param {number} t The parametric position, 0 <= t <= 1. 0 is at the start, 1 is at the end.
   * @param {number} p0 The starting coordinate
   * @param {number} p1 The position of the control knob for the starting coordinate.
   * @param {number} p2 The position of the control knob for the end coordinate.
   * @param {number} p3 The end coordinate.
   */
  cubicBezierGrad(t, p0, p1, p2, p3) {
    return (
      3 * (1 - t) * (1 - t) * (p1 - p0) +
      6 * (1 - t) * t * (p2 - p1) +
      3 * t * t * (p3 - p2)
    );
  },

  quadraticBezier(t, p0, p1, p2) {
    return (1 - t) * (1 - t) * p0 + 2 * t * (1 - t) * p1 + t * t * p2;
  },

  quadraticBezierGrad(t, p0, p1, p2) {
    return 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1);
  },

  /**
   * Update the minimum and maximum coordinates *in place* based on the value of coord.
   * @param {[number, number]} min_bound The minimum coordinates.
   * @param {[number, number]} max_bound The maximum coordinates.
   * @param {[number, number]} coord The coordinates used to update the bounds.
   */
  updateBounds(min_bound, max_bound, coord) {
    this.updateMinBound(min_bound, coord);
    this.updateMaxBound(max_bound, coord);
  },

  /**
   * Update the minimum coordinates *in place* based on the value of coord.
   * @param {[number, number]} min_bound The minimum coordinates.
   * @param {[number, number]} coord The coordinates used to update the bounds.
   */
  updateMinBound(min_bound, coord) {
    if (coord[0] < min_bound[0]) min_bound[0] = coord[0];
    if (coord[1] < min_bound[1]) min_bound[1] = coord[1];
  },

  /**
   * Update the maximum coordinates *in place* based on the value of coord.
   * @param {[number, number]} max_bound The maximum coordinates.
   * @param {[number, number]} coord The coordinates used to update the bounds.
   */
  updateMaxBound(max_bound, coord) {
    if (coord[0] > max_bound[0]) max_bound[0] = coord[0];
    if (coord[1] > max_bound[1]) max_bound[1] = coord[1];
  },
  nodes_to_array(obj_array, property_in_obj) {
    var array = new Array(obj_array.length);
    //  only needs maximum val of 1024*1024 => 20 bits
    // default js uses 64 bits
    let max_val = 0;
    for (let i = 0; i < obj_array.length; ++i) {
      var res = obj_array[i][property_in_obj];
      if (property_in_obj == "self_XY") {
        res = res[0] * ui_states.size[0] + res[1]; // row-major form
        max_val = Math.max(max_val, res);
      }
      array[i] = res;
    }
    if (max_val == 0) return array;
    else if (max_val < 1 << 16) return new Uint16Array(array);
    else return new Uint32Array(array);
  },
  deep_copy_matrix(mat, flip_bit = false, compress = false) {
    let res = [];
    for (let i = 0; i < mat.length; ++i) {
      let row = new Array();
      let cur,
        cnt = 1,
        j = 0;
      while (j < mat[i].length) {
        if (compress) {
          if (cur == mat[i][j]) ++cnt;
          else {
            if (cur !== undefined) {
              if (cnt == 1) row.push(cur);
              else row.push(`${cnt}x`, cur);
            }
            cur = mat[i][j];
            cnt = 1;
          }
        } else row.push(flip_bit ? !mat[i][j] : mat[i][j]);
        ++j;
      }
      if (compress) {
        if (cnt == 1) row.push(cur);
        else row.push(`${cnt}x`, cur);
      }
      res.push(row);
    }
    return res;
  },
  /**
   * used to generate random numbers using seed for planners like RRT and PRM
   * @param {string} str
   * @returns hash
   */
  cyrb128(str) {
    let h1 = 1779033703,
      h2 = 3144134277,
      h3 = 1013904242,
      h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [
      (h1 ^ h2 ^ h3 ^ h4) >>> 0,
      (h2 ^ h1) >>> 0,
      (h3 ^ h1) >>> 0,
      (h4 ^ h1) >>> 0,
    ];
  },
  /**
   * used to generate random numbers using seed for planners like RRT and PRM
   * @param hash
   * @returns {number} 0-1
   */
  mulberry32(a) {
    return function () {
      var t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  euclideanDistance(c1, c2) {
    return Math.hypot(c1[0] - c2[0], c1[1] - c2[1]);
  },

  /**
   * used for RRT to get a point x units away from source    (source----x-----(point)--------------------- (randCoord)
   * @param {[number,number]} src
   * @param [number,number]} tgt
   * @param {number} x
   * @returns
   */
  getCoordinatesofPointsXAwayFromSource(src, tgt, x) {
    var distanceBetween2Points = Math.sqrt(
      Math.pow(src[0] - tgt[0], 2) + Math.pow(src[1] - tgt[1], 2)
    );
    if (distanceBetween2Points < x) {
      return tgt;
    } else {
      var ratioOfDistance = x / distanceBetween2Points;
      var differenceInXAndYCoordinateOfSourceAndTarget = [
        tgt[0] - src[0],
        tgt[1] - src[1],
      ];
      var coordinatesXAwayFromSource = [
        (1 - ratioOfDistance) * src[0] + ratioOfDistance * tgt[0],
        (1 - ratioOfDistance) * src[1] + ratioOfDistance * tgt[1],
      ];
      coordinatesXAwayFromSource = [
        coordinatesXAwayFromSource[0],
        coordinatesXAwayFromSource[1],
      ];

      return coordinatesXAwayFromSource;
    }
  },
};
Object.freeze(Utils);
