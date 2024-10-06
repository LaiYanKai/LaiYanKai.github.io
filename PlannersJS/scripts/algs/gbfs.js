"use strict";

Algs.GBFSCanvasCell = class extends UI.AbstractCanvasCell {
  constructor() {
    super(0, GBFSAction.length);
  }

  add(h, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(GBFSAction.H, h);
    sprite.register(GBFSAction.Status, status);
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
    const status = sprite.value(GBFSAction.Status);
    let status_str;
    if (status === GBFSNodeStatus.Queued) status_str = "Queued";
    else if (status === GBFSNodeStatus.Expanding) status_str = "Expanding";
    else if (status === GBFSNodeStatus.Visited) status_str = "Visited";
    else if (status === GBFSNodeStatus.Undiscovered)
      status_str = "Undiscovered";
    else if (status === GBFSNodeStatus.Path) status_str = "Path!";
    const h = sprite.value(GBFSAction.H).toFixed(3);
    const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nH = ${h}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.GBFSCanvasVertex = class extends UI.AbstractCanvasVertex {
  /** @type {UI.Tooltip} */
  constructor() {
    super(0, GBFSAction.length);
  }

  add(h, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(GBFSAction.H, h);
    sprite.register(GBFSAction.Status, status);
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
    const status = sprite.value(GBFSAction.Status);
    let status_str;
    if (status === GBFSNodeStatus.Queued) status_str = "Queued";
    else if (status === GBFSNodeStatus.Expanding) status_str = "Expanding";
    else if (status === GBFSNodeStatus.Visited) status_str = "Visited";
    else if (status === GBFSNodeStatus.Undiscovered)
      status_str = "Undiscovered";
    else if (status === GBFSNodeStatus.Path) status_str = "Path!";
    const h = sprite.value(GBFSAction.H).toFixed(3);
    const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nH = ${h}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.GBFSNode = class extends Algs.AbstractPriorityQueueNode {
  get h() {
    return this.costs[0];
  }

  set h(new_h) {
    return (this.costs[0] = new_h);
  }

  constructor(coord, h, sprite, pq_sprite) {
    super(coord, 1, sprite, pq_sprite);
    this.h = h;
  }
};

Algs.GBFS = class extends Algs.AbstractGridAlg {
  /** @type {Algs.AbstractPriorityQueue} */
  #open_list;
  /** @type {Map<Algs.GBFSNode} */
  #nodes;
  /** @returns {UI.AbstractCanvasArrow} */
  get #canvas_arrows() {
    return this.canvas(1);
  }
  /** @returns {Algs.GBFSCanvasCell | Algs.GBFSCanvasVertex} */
  get #canvas_nodes() {
    return this.canvas(0);
  }
  /** @returns {UI.AbstractLens} */
  get #lens_h() {
    return this.lens(1);
  }
  /** @type{UI.Step} */
  #step; // current step
  /** @type{Array<[number, number]>} */
  #path;

  constructor(alg_params) {
    super(["1: Smallest", "2: Every Expansion"], 1, alg_params);

    // Set up canvases
    let size;
    const canvases = Array(2);
    if (alg_params.node_type === AlgNodeType.Cell) {
      canvases[0] = new Algs.GBFSCanvasCell();
      this.#addArrow = this.#addArrowCell;
      size = ui_states.size;
    } else if (alg_params.node_type === AlgNodeType.Vertex) {
      canvases[0] = new Algs.GBFSCanvasVertex();
      this.#addArrow = this.#addArrowVertex;
      size = Utils.addCoords(ui_states.size, [1, 1]);
    }
    canvases[1] = new UI.AbstractCanvasArrow(1, 0); // put arrows above the nodes
    super.setCanvases(canvases);

    // Set up lenses
    const lenses = [
      new UI.LensNone(this.#canvas_nodes, "None", "None"),
      new UI.LensRainbow(this.#canvas_nodes, GBFSAction.H, "H-cost", "$H"),
    ];
    super.setLenses(lenses, 0);

    // Set up Openlist
    let cost_indices = [0];
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
          h,
          GBFSNodeStatus.Undiscovered,
          id,
          coord,
          true,
          SpriteActionClass.Transparent,
          0,
          SpriteActionOutline.None
        );
        this.#lens_h.updateBounds(h);
        sprite.vis(); // sprites are not visualized at the first step.
        const node = new Algs.GBFSNode(coord, h, sprite, null);
        this.#nodes.set(id, node);
      }
    }
  }

  run() {
    const START = 0;
    this.#path = [];

    // Create an initial step
    this.#newMjrStep();

    // Set up start node
    let xpd_node = this.#nodes.get(this.serialize(this.coord_start));
    xpd_node.parent = START;
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

      if (this.#goalReached(xpd_node)) {
        break;
      }

      this.#closeStep();

      for (const nb of this.getNb(xpd_node)) {
        this.#newMnrStep();

        let nb_coord,
          nb_id,
          nb_node = null;
        if (nb.in_map === true) {
          nb_coord = Utils.addCoords(xpd_node.coord, nb.dir);
          nb_id = this.serialize(nb_coord);
          nb_node = this.#nodes.get(nb_id);
        }

        this.#visualizeNeighbors(prev_nb_node, nb_node);
        prev_nb_node = nb_node;

        if (this.#nbNodeAccessible(nb) === true && nb_node.parent === null) {
          this.#nbNodeUnexplored(nb_node, xpd_node);
        }

        this.#closeStep();
      }
      console.log("path", this.#path);
    }

    // Required to remove cyclic references for garbage collection
    this.#open_list.clear();

    if (this.#path.length === 0) console.log("no path!");
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
        xpd_node = xpd_node.parent;
      }
    }
    return this.#path.length > 0;
  }

  /**
   *
   * @param {Algs.GBFSNode} xpd_node
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
   * Getting to neighbor node from expanded node improves the g-cost at the neighbor node.
   * @param {Algs.GBFSNode} nb_node
   * @param {Algs.GBFSNode} xpd_node
   */
  #nbNodeUnexplored(nb_node, xpd_node) {
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
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Red
    );
    this.#step.registerWithData(
      node.sprite,
      GBFSAction.Status,
      GBFSNodeStatus.Expanding
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
      GBFSAction.Status,
      GBFSNodeStatus.Queued
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
      GBFSAction.Status,
      GBFSNodeStatus.Visited
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
    if (arrow_sprite)
      this.#step.registerWithData(
        arrow_sprite,
        SpriteActionArrow.Class,
        SpriteActionClass.Red
      );
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Red
    );
    this.#step.registerWithData(
      node.sprite,
      GBFSAction.Status,
      GBFSNodeStatus.Path
    );
  }

  #closeStep() {
    ui.player.register(this.#step);
    this.#step = null;
  }
};
