"use strict";

Algs.ThetaStarCanvasCell = class extends UI.AbstractCanvasCell {
  constructor () {
    super(0, ThetaStarAction.length);
  }

  add(f, g, h, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(ThetaStarAction.F, f);
    sprite.register(ThetaStarAction.G, g);
    sprite.register(ThetaStarAction.H, h);
    sprite.register(ThetaStarAction.Status, status);
    sprite.dom.addEventListener(
      "mousemove",
      this.#setTip.bind(this, sprite),
      false
    );
    sprite.dom.addEventListener(
      "mouseout",
      ui.tooltip.hide.bind(ui.tooltip),
      false
    );
    return sprite;
  }

  #setTip(sprite, e) {
    const pos = Utils.subtractCoords(
      sprite.value(SpriteActionNode.Position),
      [0.5, 0.5]
    );
    const status = sprite.value(ThetaStarAction.Status);
    let status_str;
    if (status === ThetaStarNodeStatus.Queued) status_str = "Queued";
    else if (status === ThetaStarNodeStatus.Expanding) status_str = "Expanding";
    else if (status === ThetaStarNodeStatus.Visited) status_str = "Visited";
    else if (status === ThetaStarNodeStatus.Undiscovered)
      status_str = "Undiscovered";
    else if (status === ThetaStarNodeStatus.Path) status_str = "Path!";
    const f = sprite.value(ThetaStarAction.F).toFixed(3);
    const g = sprite.value(ThetaStarAction.G).toFixed(3);
    const h = sprite.value(ThetaStarAction.H).toFixed(3);
    const message = `(${pos[0]}, ${[
      pos[1],
    ]})\n${status_str}\nF = ${f}\nG = ${g}\nH = ${h}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.ThetaStarCanvasVertex = class extends UI.AbstractCanvasVertex {
  /** @type {UI.Tooltip} */
  constructor () {
    super(0, ThetaStarAction.length);
  }

  add(f, g, h, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(ThetaStarAction.F, f);
    sprite.register(ThetaStarAction.G, g);
    sprite.register(ThetaStarAction.H, h);
    sprite.register(ThetaStarAction.Status, status);
    sprite.dom.addEventListener(
      "mousemove",
      this.#setTip.bind(this, sprite),
      false
    );
    sprite.dom.addEventListener(
      "mouseout",
      ui.tooltip.hide.bind(ui.tooltip),
      false
    );
    return sprite;
  }

  #setTip(sprite, e) {
    const pos = sprite.value(SpriteActionNode.Position);
    const status = sprite.value(ThetaStarAction.Status);
    let status_str;
    if (status === ThetaStarNodeStatus.Queued) status_str = "Queued";
    else if (status === ThetaStarNodeStatus.Expanding) status_str = "Expanding";
    else if (status === ThetaStarNodeStatus.Visited) status_str = "Visited";
    else if (status === ThetaStarNodeStatus.Undiscovered)
      status_str = "Undiscovered";
    else if (status === ThetaStarNodeStatus.Path) status_str = "Path!";
    const f = sprite.value(ThetaStarAction.F).toFixed(3);
    const g = sprite.value(ThetaStarAction.G).toFixed(3);
    const h = sprite.value(ThetaStarAction.H).toFixed(3);
    const message = `(${pos[0]}, ${[
      pos[1],
    ]})\n${status_str}\nF = ${f}\nG = ${g}\nH = ${h}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.ThetaStarNode = class extends Algs.AbstractPriorityQueueNode {
  get f() {
    return this.costs[0];
  }
  get g() {
    return this.costs[1];
  }
  get h() {
    return this.costs[2];
  }

  set f(new_f) {
    return (this.costs[0] = new_f);
  }
  set g(new_g) {
    return (this.costs[1] = new_g);
  }
  set h(new_h) {
    return (this.costs[2] = new_h);
  }

  constructor (coord, g, h, sprite, pq_sprite) {
    super(coord, 3, sprite, pq_sprite);
    this.g = g;
    this.h = h;
    this.f = g + h;
  }

  changeGandF(new_g, g_weight, h_weight) {
    this.g = new_g;
    this.f = this.g * g_weight + this.h * h_weight;
  }
};

Algs.ThetaStar = class extends Algs.AbstractGridAlg {
  /** @type {Algs.AbstractPriorityQueue} */
  #open_list;
  /** @type {Map<Algs.ThetaStarNode} */
  #nodes;
  /** @returns {UI.AbstractCanvasArrow} */
  get #canvas_arrows() {
    return this.canvas(1);
  }
  /** @returns {Algs.ThetaStarCanvasCell | Algs.ThetaStarCanvasVertex} */
  get #canvas_nodes() {
    return this.canvas(0);
  }
  /** @returns {UI.AbstractLens} */
  get #lens_f() {
    return this.lens(1);
  }
  /** @returns {UI.AbstractLens} */
  get #lens_g() {
    return this.lens(2);
  }
  /** @returns {UI.AbstractLens} */
  get #lens_h() {
    return this.lens(3);
  }
  /** @type{UI.Step} */
  #step; // current step
  /** @type{Array<[number, number]>} */
  #path;

  constructor (alg_params) {
    super(["1: Smallest", "2: Every Expansion"], 1, alg_params);

    // Set up canvases
    let size;
    const canvases = Array(2);
    if (alg_params.node_type === AlgNodeType.Cell) {
      canvases[0] = new Algs.ThetaStarCanvasCell();
      this.#addArrow = this.#addArrowCell;
      size = ui_states.size;
    } else if (alg_params.node_type === AlgNodeType.Vertex) {
      canvases[0] = new Algs.ThetaStarCanvasVertex();
      this.#addArrow = this.#addArrowVertex;
      size = Utils.addCoords(ui_states.size, [1, 1]);
    }
    canvases[1] = new UI.AbstractCanvasArrow(1, 0); // put arrows above the nodes
    super.setCanvases(canvases);

    // Check h_weight and g_weight
    if (typeof this.params.h_weight !== "number")
      throw new TypeError("h_weight must be a number!");
    if (typeof this.params.g_weight !== "number")
      throw new TypeError("g_weight must be a number!");

    // Set up lenses
    const lenses = [
      new UI.LensNone(this.#canvas_nodes, "None", "None"),
      new UI.LensRainbow(this.#canvas_nodes, ThetaStarAction.F, "F-cost", "$F"),
      new UI.LensRainbow(this.#canvas_nodes, ThetaStarAction.G, "G-cost", "$G"),
      new UI.LensRainbow(this.#canvas_nodes, ThetaStarAction.H, "H-cost", "$H"),
    ];
    super.setLenses(lenses, 0);

    // Set up Openlist
    let cost_indices = [];
    if (alg_params.fh === AlgFH.FOnly) cost_indices = [0];
    else if (alg_params.fh === AlgFH.FThenH) cost_indices = [0, 2];
    let is_fifo = alg_params.time_ordering === AlgTimeOrdering.FIFO;
    this.#open_list = new Algs.AbstractPriorityQueue(
      is_fifo,
      ui_params.thresh,
      ...cost_indices
    );

    // Set up Nodes and Sprites
    this.#nodes = new Map();
    for (let x = 0; x < size[0]; ++x) {
      for (let y = 0; y < size[1]; ++y) {
        const coord = [x, y];
        const id = this.serialize(coord);
        const h = this.metric(Utils.subtractCoords(this.coord_goal, coord));
        const sprite = this.#canvas_nodes.add(
          Infinity,
          Infinity,
          h,
          ThetaStarNodeStatus.Undiscovered,
          id,
          coord,
          true,
          SpriteActionClass.Transparent,
          0,
          SpriteActionOutline.None
        );
        this.#lens_h.updateBounds(h);
        sprite.vis(); // sprites are not visualized at the first step.
        const node = new Algs.ThetaStarNode(coord, Infinity, h, sprite, null);
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

      if (this.#goalReached(xpd_node))
        // will close current step if goal reached
        break;

      this.#closeStep();

      // bcos the open_list requeues nodes, there is no need to check if node is visited.
      for (const nb of this.getNb(xpd_node)) {
        this.#newMnrStep();

        // get neighbor node first for visualization purposes.
        let nb_coord,
          nb_id,
          nb_node = null; // null if out of map.
        if (nb.in_map === true) {
          nb_coord = Utils.addCoords(xpd_node.coord, nb.dir);
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
          else this.#nbNodeCheaper(new_nb_g, nb_node, xpd_node);
        }

        this.#closeStep();
      }
    }

    // Required to remove cyclic references for garbage collection
    this.#open_list.clear();

    if (this.#path.length === 0) console.log("no path!");
  }

  #changeGandF(node, new_g) {
    node.changeGandF(new_g, this.params.g_weight, this.params.h_weight);
    this.#step.registerWithData(node.sprite, ThetaStarAction.G, node.g);
    this.#step.registerWithData(node.sprite, ThetaStarAction.F, node.f);
    this.#lens_g.updateBounds(node.g);
    this.#lens_f.updateBounds(node.f);
  }

  #changeParent(node, new_parent_node) {
    this.#visualizeParent(node, node.parent, new_parent_node);
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

  #goalReached(xpd_node) {
    if (Utils.equalIntegerCoords(xpd_node.coord, this.coord_goal)) {
      this.#closeStep();
      this.#newMnrStep();

      this.#path = [];
      let cnt = 0;
      while (1) {
        cnt++;
        if (cnt > 1000) {
          console.error("Infinite loop");
          break;
        }
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
   * @param {Algs.ThetaStarNode} xpd_node
   * @param {Algs.GridAlgNeighbor} nb
   */
  #nbNodeAccessible(nb) {
    if (nb.node_access === true) {
      return true;
    } else {
      if (nb.node_chblocked === true) {
        // true only if checkerboard is allowed
      } else if (nb.in_map === false) {
      }
      return false;
    }
  }

  /**
   * Getting to neighbor node from expanded node does not improve the g-cost at the neighbor node.
   * @param {number} new_nb_g
   * @param {Algs.ThetaStarNode} nb_node
   * @param {Algs.ThetaStarNode} xpd_node
   */
  #nbNodeExpensive(new_nb_g, nb_node, xpd_node) { }

  /**
   * Getting to neighbor node from expanded node improves the g-cost at the neighbor node.
   * @param {number} new_nb_g
   * @param {Algs.ThetaStarNode} nb_node
   * @param {Algs.ThetaStarNode} xpd_node
   */
  #nbNodeCheaper(new_nb_g, nb_node, xpd_node) {
    let nb_node_los = true;
    let g_cost = 0;
    let to = null;
    if (xpd_node.parent) {
      g_cost = xpd_node.parent.g;
      // check LOS between nb_node and xpd_node
      const tracer = new RayTracerGeneral();
      const from = this.tracify(nb_node.coord);
      const to = this.tracify(xpd_node.parent.coord);
      tracer.init(from, to);
      const lethal_cost = this.getLethal();
      let length_travelled = 0;
      nb_node_los = true;
      const isOccupied = (cell_coord) => {
        const cell = ui.cells.at(cell_coord);
        return cell === null || cell.cost >= lethal_cost;
      };
      const checkerboard = this.hasCheckerboard();
      while (!tracer.hasReached()) {
        // Check front
        let front_blocked = true;
        let min_rel_g = Math.Infinity;
        let chosen_cell_coord = null;
        for (const front_sgn of tracer.getFrontSgn()) {
          const front_cell_coord = Utils.adjCellFromVertex(
            tracer.getRoot(),
            front_sgn
          );
          const cell_cost = ui.cells.at(front_cell_coord); // if at least one of the cell_cost is free, then no collision, just break.
          if (!isOccupied(front_cell_coord)) {
            front_blocked = false;
            break;
          }

          if (cell_cost < min_rel_g) {
            min_rel_g = cell_cost;
            chosen_cell_coord = front_cell_coord;
          }
        }
        if (front_blocked) {
          nb_node_los = false;
          break;
        }

        // Check checkerboard
        if (checkerboard && tracer.getState() === RayTracerState.XY) {
          // only if u need to check checkerboard.
          for (const ch_sgn_pair of tracer.getCheckerboardSgnPairs()) {
            const cell_coord1 = Utils.adjCellFromVertex(
              tracer.getRoot(),
              ch_sgn_pair[0]
            );
            // const cell_cost1 = ui.cells.at(cell_coord1);
            const cell_coord2 = Utils.adjCellFromVertex(
              tracer.getRoot(),
              ch_sgn_pair[1]
            );
            // const cell_cost2 = ui.cells.at(cell_coord2);
            if (isOccupied(cell_coord1) && is_occupied(cell_coord2)) {
              front_blocked = true; // blocked by checkerboard.
              break;
            }
          }
        }

        if (front_blocked) {
          nb_node_los = false;
          break;
        }
        const cur_length = tracer.getLenTravelled();
        const diff = cur_length - length_travelled;
        if (this.isBinary()) min_rel_g = 1;

        g_cost += diff * min_rel_g;
        length_travelled = cur_length;

        // update root vertex
        tracer.update();
      }
    }

    if (xpd_node.parent && nb_node_los && Utils.approxGe(new_nb_g, g_cost)) {
      this.#changeGandF(nb_node, g_cost);
      this.#changeParent(nb_node, xpd_node.parent);
    } else {
      this.#changeGandF(nb_node, new_nb_g);
      this.#changeParent(nb_node, xpd_node);
    }
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
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Red
    );
    this.#step.registerWithData(
      node.sprite,
      ThetaStarAction.Status,
      ThetaStarNodeStatus.Expanding
    );

    const id = this.serialize(node.coord);
    const sprite = this.#canvas_arrows.sprite(id);
    if (sprite) {
      this.#step.registerWithData(
        sprite,
        SpriteActionArrow.Class,
        SpriteActionClass.Blue
      );
    }
  }

  #visualizeOpened(node) {
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Orange
    );
    this.#step.registerWithData(
      node.sprite,
      ThetaStarAction.Status,
      ThetaStarNodeStatus.Queued
    );
  }

  #visualizeClosed(node) {
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Blue
    );
    this.#step.registerWithData(
      node.sprite,
      ThetaStarAction.Status,
      ThetaStarNodeStatus.Visited
    );
  }

  #addArrow;
  #addArrowCell(id, node, new_parent) {
    return this.#canvas_arrows.add(
      id,
      Utils.addCoords(node.coord, [0.5, 0.5]),
      Utils.subtractCoords(new_parent.coord, node.coord),
      false,
      SpriteActionClass.Orange,
      0
    );
  }
  #addArrowVertex(id, node, new_parent) {
    return this.#canvas_arrows.add(
      id,
      node.coord,
      Utils.subtractCoords(new_parent.coord, node.coord),
      false,
      SpriteActionClass.Orange,
      0
    );
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
    if (new_nb_node !== null)
      this.#step.registerWithData(
        new_nb_node.sprite,
        SpriteActionNode.Outline,
        SpriteActionOutline.Red
      );

    if (prev_nb_node !== null)
      this.#step.registerWithData(
        prev_nb_node.sprite,
        SpriteActionNode.Outline,
        SpriteActionOutline.None
      );
  }

  #visualizeFoundPathSegment(node) {
    const id = this.serialize(node.coord);
    const arrow_sprite = this.#canvas_arrows.sprite(id);
    if (arrow_sprite) {
      this.#step.registerWithData(
        arrow_sprite,
        SpriteActionArrow.Class,
        SpriteActionClass.Red
      );
      this.#step.registerWithData(
        arrow_sprite,
        SpriteActionArrow.ZIndex,
        1
      )
    }
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Red
    );
    this.#step.registerWithData(
      node.sprite,
      ThetaStarAction.Status,
      ThetaStarNodeStatus.Path
    );
  }

  #closeStep() {
    ui.player.register(this.#step);
    this.#step = null;
  }
};
