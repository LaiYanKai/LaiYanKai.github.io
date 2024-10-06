"use strict";

/** Interfaces with the map */
Algs.R2PMapper = class {
  #raytracer;
  #lethal;

  constructor(lethal) {
    this.#raytracer = new RayTracer();
    if (!Utils.isNonNegative(lethal))
      throw new Error(`lethal must be a non-negative finite number`);
    this.#lethal = lethal;
  }

  /**
   * Returns null if out of map, true if in map and accessible, false if in map and not accessible
   * @returns{ null | true | false } */
  cellAccess(cell_coord) {
    const cell = ui.cells.at(cell_coord);
    if (cell === null) return null;
    else return cell.cost < this.#lethal;
  }

  /**
   * If cast reaches to_coord from from_coord, the function returns null.
   * If cast collides, an array of two corners is returned.
   * If a corner is at the map boundary, its didx property will be 0.
   * @param {[number, number]} from_coord
   * @param {[number, number]} to_coord
   * @returns {null | [Algs.R2PPose, Algs.R2PPose, [number, number]]} returns null if reached, or if collided, an array of two poses.
   */
  cast(from_coord, to_coord) {
    // const diff = Utils.subtractCoords(to_coord, from_coord);
    this.#raytracer.init(from_coord, to_coord);

    while (1) {
      let result = this.#castCollided(from_coord);
      if (result) {
        let [left_pose, right_pose, col_coord] = result;
        left_pose = this.trace(R2PSide.L, left_pose.coord, left_pose.didx);
        right_pose = this.trace(R2PSide.R, right_pose.coord, right_pose.didx);
        return [left_pose, right_pose, col_coord];
      }

      this.#raytracer.update();

      if (this.#raytracer.hasReached()) return null;
    }
  }

  /**
   * If collided, returns the poses of the first left and right corners from collision, and the collision point.
   * Note that the collision point is not used by R2+, but by the visualization.
   * @param {[number, number]} from_coord for calculating the exact collision point for visualization.
   * @returns {null | [Algs.R2PPose, Algs.R2PPose, [number, number]]}
   */
  #castCollided(from_coord) {
    const root = this.#raytracer.getRoot();
    const sgn = this.#raytracer.getSgn();
    const raytracer_state = this.#raytracer.getState();
    const inner = sgn[0] * sgn[1]; // always constant from begin. of raytracer

    // ======================= Crossed Vertical Line ================
    if (raytracer_state === RayTracerState.X) {
      const cell_coord = Utils.adjCellFromVertex(root, sgn);
      const cell_access = this.cellAccess(cell_coord);

      if (cell_access === false) {
        const root_adj = [root[0], root[1] + sgn[1]];
        let left_pose = new Algs.R2PPose(R2PSide.L);
        let right_pose = new Algs.R2PPose(R2PSide.R);

        if (sgn[0] > 0) {
          left_pose.didx = DirIndex.N;
          right_pose.didx = DirIndex.S;
        } else if (sgn[0] < 0) {
          left_pose.didx = DirIndex.S;
          right_pose.didx = DirIndex.N;
        } else throw new Error(`sgn[0] cannot be zero`);
        if (inner > 0) {
          left_pose.coord = root_adj;
          right_pose.coord = root;
        } else if (inner < 0) {
          left_pose.coord = root;
          right_pose.coord = root_adj;
        } // has zero component, can never happen
        else throw new Error(`sgn cannot have zero component`);

        // calculate collision
        const dif = this.#raytracer.getDiff();
        const col_coord = [
          root[0],
          from_coord[1] + (dif[1] * (root[0] - from_coord[0])) / dif[0],
        ];
        return [left_pose, right_pose, col_coord];
      } else if (cell_access === true) {
        return null;
      } else {
        throw new Error(
          `out of map can never happen in cast collisions in R2+`
        );
      }
    }
    // ======================= Crossed Horizontal Line ================
    else if (raytracer_state === RayTracerState.Y) {
      const cell_coord = Utils.adjCellFromVertex(root, sgn);
      const cell_access = this.cellAccess(cell_coord);

      if (cell_access === false) {
        const root_adj = [root[0] + sgn[0], root[1]];
        let left_pose = new Algs.R2PPose(R2PSide.L);
        let right_pose = new Algs.R2PPose(R2PSide.R);

        if (sgn[1] > 0) {
          left_pose.didx = DirIndex.W;
          right_pose.didx = DirIndex.E;
        } else if (sgn[1] < 0) {
          left_pose.didx = DirIndex.E;
          right_pose.didx = DirIndex.W;
        } else throw new Error(`sgn[1] cannot be zero`);
        if (inner > 0) {
          left_pose.coord = root;
          right_pose.coord = root_adj;
        } else if (inner < 0) {
          left_pose.coord = root_adj;
          right_pose.coord = root;
        } // has zero component, can never happen
        else throw new Error(`sgn cannot have zero component`);

        // calculate collision
        const dif = this.#raytracer.getDiff();
        const col_coord = [
          from_coord[0] + (dif[0] * (root[1] - from_coord[1])) / dif[1],
          root[1],
        ];
        return [left_pose, right_pose, col_coord];
      } else if (cell_access === true) {
        return null;
      } else {
        throw new Error(
          `out of map can never happen in cast collisions in R2+`
        );
      }
    }
    // ======================= Crossed Vertex ================
    else if (raytracer_state === RayTracerState.XY) {
      const didx = Utils.dirToDirIndex(sgn); // always constant from begin. of raytracer

      // ----------------- Cardinal direction -----------------
      if (inner === 0) {
        // cardinal direction;
        const fl_didx = Utils.addDirIndex(didx, 1); // front left, always constant from beginning of raytracer
        const fr_didx = Utils.addDirIndex(didx, -1); // front right, always constant from beginning of raytracer
        const fl_cell_coord = Utils.adjCellFromVertex(
          root,
          Utils.dirIndexToDir(fl_didx)
        );
        const fr_cell_coord = Utils.adjCellFromVertex(
          root,
          Utils.dirIndexToDir(fr_didx)
        );
        const fl_cell_access = this.cellAccess(fl_cell_coord);
        const fr_cell_access = this.cellAccess(fr_cell_coord);
        if (fl_cell_access === true || fr_cell_access === true) {
          // can move forward
          return null; // nothing
        } else {
          // front blocked (fl_cell_access != true (false or null) && etc.)
          const left_pose = new Algs.R2PPose(
            R2PSide.L,
            Utils.addDirIndex(didx, 2),
            root
          );
          const right_pose = new Algs.R2PPose(
            R2PSide.R,
            Utils.addDirIndex(didx, -2),
            root
          );
          return [left_pose, right_pose, root];
        }
      }
      // ----------------- Diagonal direction -----------------
      else {
        const cell_coord = Utils.adjCellFromVertex(root, sgn);
        const cell_access = this.cellAccess(cell_coord);

        if (cell_access === false) {
          // collided diagonally at a vertex
          let left_didx = Utils.addDirIndex(didx, 2);
          let right_didx = Utils.addDirIndex(didx, -2);
          const left_cell_coord = Utils.adjCellFromVertex(
            root,
            Utils.dirIndexToDir(left_didx)
          );
          const right_cell_coord = Utils.adjCellFromVertex(
            root,
            Utils.dirIndexToDir(right_didx)
          );
          const left_cell_access = this.cellAccess(left_cell_coord);
          const right_cell_access = this.cellAccess(right_cell_coord);
          // null (out of map) treated as true (accessible)
          if (left_cell_access === false && right_cell_access !== false) {
            // hit straight wall
            left_didx = Utils.addDirIndex(didx, 3);
            right_didx = Utils.addDirIndex(didx, -1);
          } else if (
            left_cell_access !== false &&
            right_cell_access === false
          ) {
            // hit straight wall
            left_didx = Utils.addDirIndex(didx, 1);
            right_didx = Utils.addDirIndex(didx, -3);
          } else {
            // hit convex or non convex corner
            const det = Utils.detCoords(this.#raytracer.getDiff(), sgn);
            // diff is always integer coord in r2p.
            if (det > 0) {
              // diff lies to right of sgn(diff)
              left_didx = Utils.addDirIndex(didx, 1);
              right_didx = Utils.addDirIndex(didx, -3);
            } else if (det < 0) {
              left_didx = Utils.addDirIndex(didx, 3);
              right_didx = Utils.addDirIndex(didx, -1);
            } else {
              // det === 0
              if (left_cell_access === false) {
                // non convex
                left_didx = Utils.addDirIndex(didx, 3);
                right_didx = Utils.addDirIndex(didx, -3);
              } else {
                // convex
                left_didx = Utils.addDirIndex(didx, 1);
                right_didx = Utils.addDirIndex(didx, -1);
              }
            }
          }
          const left_pose = new Algs.R2PPose(R2PSide.L, left_didx, root);
          const right_pose = new Algs.R2PPose(R2PSide.R, right_didx, root);
          return [left_pose, right_pose, root];
        } else if (cell_access === true) {
          return null;
        } else {
          throw new Error(
            `out of map can never happen in cast collisions in R2+`
          );
        }
      }
    }
  }

  /**
   * Projects from from_coord in direction diff.
   * Always collides in a rectangular map for R2+.
   * Returns [left_corner, right_corner] from collision.
   * A corner will have didx = 0 if at the map boundary.
   * Returns the collision coordinates if collided.
   * @param {[number, number]} from_coord origin of projection
   * @param {[number, number]} diff direction of projection
   * @returns {null | [Algs.R2PPose, Algs.R2PPose, [number, number]]}  Note it is theoretically impossible to return null in R2+ for rectangular maps.
   */
  project(from_coord, diff) {
    let to_coord = from_coord.slice();
    while (1) {
      to_coord = Utils.addCoords(to_coord, diff);
      if (!ui.inMapVertex(to_coord)) break; // shift the destination to outside the map
    }
    return this.cast(from_coord, to_coord); // should not be null (out of map) in r2p and convex map boundary (rectangular map).
  }

  /**
   * Traces to the next corner and returns it.
   * If trace reaches the map boundary, returns a "corner" positioned at the boundary, that has didx = 0;
   * Parameters are not validated.
   * @param {R2PSide} side side of the trace. The obstacle is on the right side of a left-sided trace, vice versa.
   * @param {[coord, coord]} from_coord the coordinate to trace from. Must be at a vertex.
   * @param {DirIndex} didx must be cardinal.
   * @returns {R2PPose} Corner where the trace reached. The didx property will be 0 if at map boundary.
   */
  trace(side, from_coord, didx) {
    const wall_didx = Utils.addDirIndex(didx, side);
    const free_didx = Utils.addDirIndex(didx, -side);
    const wall_sgn = Utils.dirIndexToDir(wall_didx);
    const free_sgn = Utils.dirIndexToDir(free_didx);
    let wall_cell_access, free_cell_access;
    let wall_cell_coord, free_cell_coord;
    let coord = from_coord.slice();
    const sgn = Utils.dirIndexToDir(didx);
    while (1) {
      wall_cell_coord = Utils.adjCellFromVertex(coord, wall_sgn);
      wall_cell_access = this.cellAccess(wall_cell_coord);
      if (wall_cell_access === null) {
        // out of map
        return new Algs.R2PPose(side, 0, coord, false);
      } else if (wall_cell_access === true) {
        // convex cell
        const crn_didx = Utils.addDirIndex(didx, 3 * side);
        return new Algs.R2PPose(side, crn_didx, coord, true);
      } else {
        // has wall
        free_cell_coord = Utils.adjCellFromVertex(coord, free_sgn);
        free_cell_access = this.cellAccess(free_cell_coord);
        if (free_cell_access === false)
          return new Algs.R2PPose(side, wall_didx, coord, false);
        // free_cell_access cannot be null.
        // continue if free_cell_access is false.
      }
      coord[0] += sgn[0];
      coord[1] += sgn[1];
    }
  }
};
