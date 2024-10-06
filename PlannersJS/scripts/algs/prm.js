"use strict";

Algs.PRMCanvasCell = class extends UI.AbstractCanvasCell {
  constructor() {
    super(0, PRMAction.length);
  }

  add(g, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(PRMAction.G, g);
    sprite.register(PRMAction.Status, status);
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
    const status = sprite.value(PRMAction.Status);
    let status_str;
    if (status === PRMNodeStatus.Queued) status_str = "Queued";
    else if (status === PRMNodeStatus.Expanding) status_str = "Expanding";
    else if (status === PRMNodeStatus.Visited) status_str = "Visited";
    else if (status === PRMNodeStatus.Undiscovered) status_str = "Undiscovered";
    else if (status === PRMNodeStatus.Path) status_str = "Path!";
    const g = sprite.value(PRMAction.G).toFixed(3);
    const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nG = ${g}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.PRMCanvasVertex = class extends UI.AbstractCanvasVertex {
  /** @type {UI.Tooltip} */
  constructor() {
    super(0, PRMAction.length);
  }

  add(g, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(PRMAction.G, g);
    sprite.register(PRMAction.Status, status);
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
    const status = sprite.value(PRMAction.Status);
    let status_str;
    if (status === PRMNodeStatus.Queued) status_str = "Queued";
    else if (status === PRMNodeStatus.Expanding) status_str = "Expanding";
    else if (status === PRMNodeStatus.Visited) status_str = "Visited";
    else if (status === PRMNodeStatus.Undiscovered) status_str = "Undiscovered";
    else if (status === PRMNodeStatus.Path) status_str = "Path!";
    const g = sprite.value(PRMAction.G).toFixed(3);
    const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nG = ${g}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.PRMNode = class extends Algs.AbstractPriorityQueueNode {
  get g() {
    return this.costs[0];
  }

  set g(new_g) {
    return (this.costs[0] = new_g);
  }

  constructor(coord, g, sprite, pq_sprite) {
    super(coord, 1, sprite, pq_sprite);
    this.g = g;
  }

  changeG(new_g) {
    this.g = new_g;
  }
};

Algs.PRM = class extends Algs.AbstractGridAlg {
  /** @type {Algs.AbstractPriorityQueue} */
  #open_list;
  /** @type {Map<Algs.PRMNode} */
  #nodes;
  /** @returns {UI.AbstractCanvasArrow} */
  get #canvas_arrows() {
    return this.canvas(2);
  }
  /** @returns {UI.AbstractCanvasLine} */
  get #canvas_lines() {
    return this.canvas(0);
  }
  /** @returns {Algs.PRMCanvasVertex} */
  get #canvas_nodes() {
    return this.canvas(1);
  }

  /** @returns {UI.AbstractLens} */
  get #lens_g() {
    return this.lens(1);
  }
  /** @type{UI.Step} */
  #step; // current step
  /** @type{Array<[number, number]>} */
  #path;
  #rayTracer;
  alg_params;

  constructor (alg_params) {
    super(["1: Smallest", "2: Every Expansion"], 1, alg_params);
    this.#rayTracer = new RayTracerGeneral();
    this.graphNodes = [];
    this.alg_params = alg_params;
    // Set up canvases
    let size;
    const canvases = Array(2);

    canvases[1] = new Algs.PRMCanvasVertex();
    size = Utils.addCoords(ui_states.size, [1, 1]);

    this.#addLine = this.#addLineVertex;
    canvases[0] = new UI.AbstractCanvasLine(1, 0); // put edge above the nodes
    this.#addArrow = this.#addArrowVertex;
    canvases[2] = new UI.AbstractCanvasArrow(1, 0); // put arrows above the nodes
    super.setCanvases(canvases);

    // Set up lenses
    const lenses = [
      new UI.LensNone(this.#canvas_nodes, "None", "None"),
      new UI.LensRainbow(this.#canvas_nodes, PRMAction.G, "G-cost", "$G"),
    ];
    super.setLenses(lenses, 0);

    // Set up Openlist
    let cost_indices = [0]; // g-cost
    // RECHECK FIFO
    let is_fifo = alg_params.time_ordering === AlgTimeOrdering.FIFO;
    this.#open_list = new Algs.AbstractPriorityQueue(
      is_fifo,
      ui_params.thresh,
      ...cost_indices
    );
  }
  /**
   * Checks if a line of sight exists between two coordinates
   * @param {[number, number]} from_coord
   * @param {[number, number]} to_coord
   * @returns true if there is a LOS between from_coord and to_coord, false otherwise.
   */
  LOSChecker(from_coord, to_coord) {
    //check if 2 float coords are equal
    if (
      Math.abs(from_coord[0] - to_coord[0]) < 0.0001 &&
      Math.abs(from_coord[1] - to_coord[1]) < 0.0001
    ) {
      from_coord = [Math.round(from_coord[0]), Math.round(from_coord[1])];
      return !(ui.cells.at(from_coord).cost > this.params.lethal);
    }
    const tracer = new RayTracerGeneral();
    const lethal_cost = this.alg_params.lethal;
    const isOccupied = (cell_coord) => {
      const cell = ui.cells.at(cell_coord);
      return cell === null || cell.cost >= lethal_cost;
    };
    let output = !tracer.run(from_coord, to_coord, false, isOccupied);
    return output;
  }

  getRandomPoints(sampleSize, rand) {
    function isCoordEqual(a, b) {
      return a.every((x, i) => x === b[i]);
    }
    nextCoord: for (let i = 0; i < sampleSize; ++i) {
      var randomCoord_XY = [
        rand() * (ui_states.size[0] - 0.5),
        rand() * (ui_states.size[1] - 0.5),
      ]; //need seed

      // if current is obstacle
      if (this.LOSChecker(randomCoord_XY, randomCoord_XY) == false) {
        continue nextCoord;
      }

      let foundIndex = this.graphNodes.findIndex((graphNode) =>
        isCoordEqual(graphNode.value_XY, randomCoord_XY)
      );
      if (foundIndex != -1) continue nextCoord; //dont add random coord that is already added into list of random coord

      this.#newMjrStep();
      let sprite = this.#drawVertex(randomCoord_XY);
      this.graphNodes.push(
        new Algs.GraphNode(null, randomCoord_XY, [], Number.MAX_VALUE, sprite)
      );
    }
  }

  connectRandomPoints(startIndex, endIndex) {
  
    for (let i = startIndex; i < endIndex; ++i) {
      let currentCoord = [...this.graphNodes[i].value_XY];
      var distancesBetweenACoordAndAllOthers = []; // index corresponds to index of graphNodes,
      let otherRandomCoords = Utils.deep_copy_matrix(
        Utils.nodes_to_array(this.graphNodes, "value_XY")
      ); // randomCoord passed by reference here

      for (let j = 0; j < otherRandomCoords.length; ++j) {
        if (i == j) continue;
        distancesBetweenACoordAndAllOthers.push([
          Math.hypot(
            currentCoord[0] - otherRandomCoords[j][0],
            currentCoord[1] - otherRandomCoords[j][1]
          ),
          j,
        ]);
      }
      distancesBetweenACoordAndAllOthers.sort((a, b) => {
        return a[0] - b[0]; // sort by distance ascending
      });

      let indexOfSelectedOtherRandomCoords;

      if (
        this.alg_params.neighbor_selection_method ==
        AlgNeighborSelectionMethod.KNN
      ) {
        // checks LOS between the the top X closes neighbors
        indexOfSelectedOtherRandomCoords = distancesBetweenACoordAndAllOthers
          .slice(0, this.alg_params.neighbor_selection_method_knn_number)
          .map((p) => p[1]);
      } else if (
        this.alg_params.neighbor_selection_method ==
        AlgNeighborSelectionMethod.Radius
      ) {
        indexOfSelectedOtherRandomCoords = distancesBetweenACoordAndAllOthers
          .filter(
            (p) =>
              p[0] < this.alg_params.neighbor_selection_method_radius_number
          )
          .map((p) => p[1]);
      }

      let cnt = 0;
      coordLoop: for (
        let j = 0;
        j < indexOfSelectedOtherRandomCoords.length;
        ++j
      ) {
        let jdx = indexOfSelectedOtherRandomCoords[j];
        if (i == jdx) continue;

        var LOS = this.LOSChecker(currentCoord, otherRandomCoords[jdx]);
        if (LOS) {
          //if there is lOS then add neighbors(out of 5) to neighbors of node
          ++cnt;
          // every time we add an edge, it is bidirectional, so checking of one neighbor is sufficient
          if (!this.graphNodes[i].neighbors.includes(jdx)) {
            this.graphNodes[i].neighbors.push(jdx);
            this.graphNodes[jdx].neighbors.push(i);
            this.#newMjrStep();
            this.#drawLine(
              this.graphNodes[i].value_XY,
              this.graphNodes[jdx].value_XY
            );

            this.#closeStep();
          }
        }
        if (cnt >= this.alg_params.neighbor_selection_method_knn_number)
          break coordLoop;
      }
    }
  }

  
  /**
   * Builds a graph of nodes with edges between them using PRM
   * @params {void}
   * @returns {void}
   */
  generateNewMap() {
  
    var seed = Utils.cyrb128(String(this.alg_params.seed));
    this.rand = Utils.mulberry32(seed[0]);

    this.getRandomPoints(this.alg_params.sample_size, this.rand);
    this.connectRandomPoints(0, this.graphNodes.length);




    
  }

  AppendtoMap(){
    this.getRandomPoints(1, this.rand);
     this.connectRandomPoints(this.graphNodes.length-1, this.graphNodes.length);
  }


  /**
   * connects graph generated in generateNewMap to start or goal and allows changes to start and goal after graph is generated
   * @params {string} isStartOrGoal - "start" or "goal"
   * @params {[number, number]} coord_XY - start or goal coord
   * @returns {number} index of start or goal node in graphNodes
   */
  addStartGoalNode(isStartOrGoal = "start", coord_XY = [4, 4]) {
    if (!this.LOSChecker(coord_XY, coord_XY))
      return alert(`start/Goal is on an obstacle`);
    if (isStartOrGoal == "start" && this.prevStartCoord) {
      prevCoord = this.prevStartCoord;
      prevCoordConnectedto = this.prevCoordStartConnectedTo;
    } else if (isStartOrGoal == "goal" && this.prevGoalCoord) {
      prevCoord = this.prevGoalCoord;
      prevCoordConnectedto = this.prevCoordGoalConnectedTo;
    } else {
      var prevCoord;
    }

    if (prevCoord) {
      //   myUI.edgeCanvas.eraseLine(prevCoord, prevCoordConnectedto);
      //   myUI.nodeCanvas.eraseCircle(prevCoord);
    }

    if (isStartOrGoal == "start" && this.prevStartCoord) {
      this.prevStartCoord = coord_XY;
    } else if (isStartOrGoal == "goal" && this.prevGoalCoord) {
      this.prevGoalCoord = coord_XY;
    }

    var distancesBetweenACoordAndAllOthers = []; // index corresponds to index of graphNodes,
    let startEndCoordNodeIndex = 0;
    for (let i = 0; i < this.graphNodes.length; ++i) {
      if (
        coord_XY[0] == this.graphNodes[i].value_XY[0] &&
        coord_XY[1] == this.graphNodes[i].value_XY[1]
      )
        startEndCoordNodeIndex = i;
      distancesBetweenACoordAndAllOthers.push([
        Math.hypot(
          coord_XY[0] - this.graphNodes[i].value_XY[0],
          coord_XY[1] - this.graphNodes[i].value_XY[1]
        ),
        i,
      ]);
    }

    distancesBetweenACoordAndAllOthers.sort((a, b) => {
      return a[0] - b[0]; // sort by first index/sort by distances shortest at start
    });

    let indexOfSelectedRandomCoords = distancesBetweenACoordAndAllOthers.map(
      (p) => p[1]
    );

    var selectedVertexIndex;
    let cnt = 0;
    coordLoop: for (let j = 0; j < indexOfSelectedRandomCoords.length; ++j) {
      let jdx = indexOfSelectedRandomCoords[j];
      if (startEndCoordNodeIndex == jdx) continue;

      //choosee first vertex that passes LOS to connect to start
      var LOS = this.LOSChecker(coord_XY, this.graphNodes[jdx].value_XY);
      if (LOS) {
        //if there is lOS then add neighbors(out of 5) to neighbors of node
        ++cnt;
        selectedVertexIndex = jdx;
      }
      if (cnt >= 1) break coordLoop; // hardcoded to take the closest node not least cost
    }
    const selected_XY = this.graphNodes[selectedVertexIndex].value_XY;
    var selectedIndexForStartEndVertex = this.graphNodes.length; // determined before push to array below

    this.#newMjrStep();
    let sprite = this.#drawVertex(coord_XY);
    this.#closeStep();
    this.graphNodes.push(
      new Algs.GraphNode(null, coord_XY, new Array(), Number.MAX_VALUE, sprite)
    );

    // this._create_action({ command: STATIC.DrawEdge, dest: this.dests.networkGraph, nodeCoord: coord_XY, endCoord: selected_XY });
    // this._create_action({ command: STATIC.DrawVertex, dest: this.dests.networkGraph, nodeCoord: coord_XY });

    if (
      !this.graphNodes[selectedVertexIndex].neighbors.includes(
        selectedIndexForStartEndVertex
      )
    )
      this.graphNodes[selectedVertexIndex].neighbors.push(
        selectedIndexForStartEndVertex
      );
    if (
      !this.graphNodes[selectedIndexForStartEndVertex].neighbors.includes(
        selectedVertexIndex
      )
    )
      this.graphNodes[selectedIndexForStartEndVertex].neighbors.push(
        selectedVertexIndex
      );

    //code below allows start/end to change without redrawing map but in unimplemented
    if (isStartOrGoal == "start" && this.prevStartCoord) {
      this.prevStartCoordConnectedto = selected_XY;
    } else if (isStartOrGoal == "goal" && this.prevGoalCoord) {
      this.prevGoalCoordConnectedto = selected_XY;
    }

    return selectedIndexForStartEndVertex;
  }
  findPathAStar() {
    this.addStartGoalNode("goal", this.coord_goal);
    let indexOfStartNode = this.addStartGoalNode("start", this.coord_start);
    
    this.#path = [];
    // Create an initial step
    this.#newMjrStep();

    let xpd_node_index_in_Graph_Nodes = indexOfStartNode;
    let xpd_node = this.graphNodes[indexOfStartNode];
    xpd_node.g = 0;
    xpd_node.parent = null;
    this.#queueNode(xpd_node);

    this.#closeStep();
    // prev_nb_node for visualization purposes
    let prev_nb_node = null;
    let node_index = indexOfStartNode;
    while (this.#openListFilled()) {
      // takes in indexes of nodes in graphNodes
      // if (this.#open_list.length >1000) break;
      this.#newMjrStep();
      this.#visualizeNeighbors(prev_nb_node, null);
      prev_nb_node = null;
      this.#visualizeClosed(xpd_node);

      xpd_node = this.#pollNode();
      //find index of node in graphNodes
      xpd_node_index_in_Graph_Nodes = this.graphNodes.findIndex((graphNode) =>
        Utils.equalFloatCoords(graphNode.value_XY, xpd_node.value_XY)
      );

      this.#visualizeExpanded(xpd_node);

      if (this.#goalReached(xpd_node))
        // will close current step if goal reached
        break;

      this.#closeStep();
      // bcos the open_list requeues nodes, there is no need to check if node is visited.
      for (const nbi of this.graphNodes[xpd_node_index_in_Graph_Nodes]
        .neighbors) {
        this.#newMnrStep();
        let nb = this.graphNodes[nbi];

        this.#visualizeNeighbors(prev_nb_node, nb);
        prev_nb_node = nb;

        // check g cost if node is accessible
        const new_nb_g =
          xpd_node.g + Utils.euclideanDistance(xpd_node.coord, nb.coord);

        if (new_nb_g < nb.g) {
          nb.g = new_nb_g;
          nb.parent = xpd_node;
          this.#queueNode(nb);
        } else {
        }

        if (Utils.approxGe(new_nb_g, nb.g))
          this.#nbNodeExpensive(new_nb_g, nb, xpd_node);
        else this.#nbNodeCheaper(new_nb_g, nb, xpd_node);

        this.#closeStep();
      }
    }

    // Required to remove cyclic references for garbage collection
    this.#open_list.clear();



  }
  run() {
    this.generateNewMap();
   

    this.findPathAStar();




    if (
      this.#path.length === 0 &&
      this.alg_params.grow_tree_till_path_found ==
        AlgGrowTreeTillPathFound.Enable
    ) {

      while (this.#path.length === 0) {
        this.AppendtoMap();
        this.findPathAStar();
      }
    }
      else if (this.#path.length === 0) {

     
        console.log("no path!");
      }
    
  }

  getNode(node) {
    let coord = node.value_XY;
    const id = this.serialize(coord);
    const sprite = this.#canvas_nodes.add(
      Infinity,
      PRMNodeStatus.Undiscovered,
      id,
      coord,
      true,
      SpriteActionClass.Transparent,
      0,
      SpriteActionOutline.None
    );
    sprite.vis(); // sprites are not visualized at the first step.
    return new Algs.PRMNode(coord, Infinity, sprite); //;
  }
  #changeG(node, new_g) {
    // node.changeG(new_g);
    node.g = new_g;
    this.#step.registerWithData(node.sprite, PRMAction.G, node.g);
    this.#lens_g.updateBounds(node.g);
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
    if (Utils.equalFloatCoords(xpd_node.coord, this.coord_goal)) {
      this.#closeStep();
      this.#newMnrStep();

      this.#path = [];
      let prevCoord = xpd_node.coord;
      while (1) {
        this.#path.push(xpd_node.coord);
        this.#visualizeFoundPathSegment(xpd_node);
        this.#drawLinePath(prevCoord, xpd_node.coord);
        if (Utils.equalFloatCoords(xpd_node.coord, this.coord_start)) {
          this.#step.changeRank(this.num_ranks - 1);
          this.#closeStep();
          break;
        }
        this.#closeStep();
        this.#newMnrStep();
        prevCoord = xpd_node.coord;
        xpd_node = xpd_node.parent; // reuse xpd_node
      }
    }
    return this.#path.length > 0; // else
  }

  /**
   *
   * @param {Algs.PRMNode} xpd_node
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
   * @param {Algs.PRMNode} nb_node
   * @param {Algs.PRMNode} xpd_node
   */
  #nbNodeExpensive(new_nb_g, nb_node, xpd_node) {}

  /**
   * Getting to neighbor node from expanded node improves the g-cost at the neighbor node.
   * @param {number} new_nb_g
   * @param {Algs.PRMNode} nb_node
   * @param {Algs.PRMNode} xpd_node
   */
  #nbNodeCheaper(new_nb_g, nb_node, xpd_node) {
    this.#changeG(nb_node, new_nb_g);
    this.#changeParent(nb_node, xpd_node);
    this.#queueNode(nb_node);
  }

  // ============== Steps and Visualization methods=======================
  #newMjrStep() {
    if (this.#step) this.#closeStep();
    this.#step = new UI.Step(1);
  }
  #newMnrStep() {
    if (this.#step) this.#closeStep(); // and at the end of run
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
      PRMAction.Status,
      PRMNodeStatus.Expanding
    );

    const id = this.serialize(node.value_XY);
    const sprite = this.#canvas_arrows.sprite(id);
    if (sprite) {
      this.#step.registerWithData(
        sprite,
        SpriteActionArrow.Class,
        SpriteActionClass.Blue
      );
    }
  }
  // -------- Vertex ---------
  #drawVertex(coord) {
    const id = this.serialize(coord);
    const sprite = this.#canvas_nodes.add(
      Infinity,
      PRMNodeStatus.Undiscovered,
      id,
      coord,
      false,
      SpriteActionClass.Gray,
      0,
      SpriteActionOutline.None
    );
    this.#step.registerWithData(sprite, SpriteActionArrow.Display, true);

    // this.#step.registerWithData(node.sprite, PRMAction.Status, PRMNodeStatus.Queued);
    return sprite;
  }

  #visualizeOpened(node) {
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Orange
    );
    this.#step.registerWithData(
      node.sprite,
      PRMAction.Status,
      PRMNodeStatus.Queued
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
      PRMAction.Status,
      PRMNodeStatus.Visited
    );
  }
  // -------- Line ---------

  #addLine;
  #addLineVertex(id, node, new_parent) {
    return this.#canvas_lines.add(
      id,
      node.coord,
      Utils.subtractCoords(new_parent.coord, node.coord),
      false,
      SpriteActionClass.Blue,
      0
    );
  }

  #drawLine(node_coord, new_parent_coord) {
    const id = null;
    // const id = node_coord[0].toString() + node_coord[1].toString() + new_parent_coord[0].toString() + new_parent_coord[1].toString();
    // create new edge
    const sprite = this.#canvas_lines.add(
      id,
      node_coord,
      Utils.subtractCoords(new_parent_coord, node_coord),
      false,
      SpriteActionClass.Gray,
      0
    );
    this.#step.registerWithData(sprite, SpriteActionArrow.Display, true);
  }

  #drawLinePath(node_coord, new_parent_coord) {
    const id = null;
    // const id = node_coord[0].toString() + node_coord[1].toString() + new_parent_coord[0].toString() + new_parent_coord[1].toString();
    // create new edge
    const sprite = this.#canvas_lines.add(
      id,
      node_coord,
      Utils.subtractCoords(new_parent_coord, node_coord),
      false,
      SpriteActionClass.Red,
      0
    );
    this.#step.registerWithData(sprite, SpriteActionArrow.Display, true);
  }
  // -------- Arrows ---------

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
      SpriteActionClass.Gray,
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

    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Red
    );
    this.#step.registerWithData(
      node.sprite,
      PRMAction.Status,
      PRMNodeStatus.Path
    );
  }

  #closeStep() {
    ui.player.register(this.#step);
    this.#step = null;
  }
};
