"use strict";

Algs.RRTCanvasCell = class extends UI.AbstractCanvasCell {
  constructor () {
    super(0, RRTAction.length);
  }

  add(g, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(RRTAction.G, g);
    sprite.register(RRTAction.Status, status);
    // sprite.register(SpriteActionNode.Display, false);
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
    const status = sprite.value(RRTAction.Status);
    let status_str;
    if (status === RRTNodeStatus.Queued) status_str = "Queued";
    else if (status === RRTNodeStatus.Expanding) status_str = "Expanding";
    else if (status === RRTNodeStatus.Visited) status_str = "Visited";
    else if (status === RRTNodeStatus.Undiscovered) status_str = "Undiscovered";
    else if (status === RRTNodeStatus.Path) status_str = "Path!";
    const g = sprite.value(RRTAction.G).toFixed(3);
    const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nG = ${g}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.RRTCanvasVertex = class extends UI.AbstractCanvasVertex {
  /** @type {UI.Tooltip} */
  constructor () {
    super(0, RRTAction.length);
  }

  add(g, status, ...abstract_canvas_cell_args) {
    const sprite = super.add(...abstract_canvas_cell_args);
    sprite.register(RRTAction.G, g);
    sprite.register(RRTAction.Status, status);
    // sprite.register(SpriteActionNode.Display, false);
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
    const status = sprite.value(RRTAction.Status);
    let status_str;
    if (status === RRTNodeStatus.Queued) status_str = "Queued";
    else if (status === RRTNodeStatus.Expanding) status_str = "Expanding";
    else if (status === RRTNodeStatus.Visited) status_str = "Visited";
    else if (status === RRTNodeStatus.Undiscovered) status_str = "Undiscovered";
    else if (status === RRTNodeStatus.Path) status_str = "Path!";
    const g = sprite.value(RRTAction.G).toFixed(3);
    const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\nG = ${g}\n`;
    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.RRTNode = class extends Algs.AbstractPriorityQueueNode {
  get g() {
    return this.costs[0];
  }

  set g(new_g) {
    return (this.costs[0] = new_g);
  }

  constructor (coord, g, sprite, pq_sprite) {
    super(coord, 1, sprite, pq_sprite);
    this.g = g;
  }

  changeG(new_g) {
    this.g = new_g;
  }
};

Algs.RRT = class extends Algs.AbstractGridAlg {
  /** @type {Algs.AbstractPriorityQueue} */
  #open_list;
  /** @type {Map<Algs.RRTNode} */
  #nodes;
  /** @returns {Algs.RRTCanvasNodes} */
  get #canvas_circles() {
    return this.canvas(0);
  }
  /** @returns {UI.AbstractCanvasArrow} */
  get #canvas_arrows() {
    return this.canvas(3);
  }
  /** @returns {UI.AbstractCanvasLine} */
  get #canvas_lines() {
    return this.canvas(1);
  }
  /** @returns {Algs.RRTCanvasVertex} */
  get #canvas_nodes() {
    return this.canvas(2);
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

    canvases[2] = new Algs.RRTCanvasVertex();
    size = Utils.addCoords(ui_states.size, [1, 1]);

    this.#addLine = this.#addLineVertex;
    canvases[1] = new UI.AbstractCanvasLine(1, 0); // put edge above the nodes
    this.#addArrow = this.#addArrowVertex;
    canvases[3] = new UI.AbstractCanvasArrow(1, 0); // put arrows above the nodes
    canvases[0] = new Algs.RRTCanvasNodes(0);
    super.setCanvases(canvases);

    // Set up lenses
    const lenses = [
      new UI.LensNone(this.#canvas_nodes, "None", "None"),
      new UI.LensRainbow(this.#canvas_nodes, RRTAction.G, "G-cost", "$G"),
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
  /**
   * returns the index of the nearest node (euclidean distance) in the tree to a random coordinate
   * @param {*} graphNodes
   * @param {*} randomCoord_XY
   * @returns
   */
  getNearestNodeIndexInTreeToRandomCoord(graphNodes, randomCoord_XY) {
    var indexOfClosestCoordInTreeToRandomCoord = 0;
    var k = indexOfClosestCoordInTreeToRandomCoord;
    var distanceOfClosestCoordInTreeToRandomCoord = Utils.euclideanDistance(
      graphNodes[k].value_XY,
      randomCoord_XY
    );

    for (let x = 1; x < graphNodes.length; ++x) {
      var distanceOfPotentialClosestCoordInTreeToRandomCoord =
        Utils.euclideanDistance(graphNodes[x].value_XY, randomCoord_XY);
      if (
        distanceOfClosestCoordInTreeToRandomCoord >
        distanceOfPotentialClosestCoordInTreeToRandomCoord
      ) {
        k = x;
        var distanceOfClosestCoordInTreeToRandomCoord = Utils.euclideanDistance(
          graphNodes[k].value_XY,
          randomCoord_XY
        );
      }
    }
    return k;
  }
  /**
   * returns the neighbors of a given coordinate in the graph by either Nearest or Radius
   * @param {*} graphNodes
   * @param {[number,number]} nextCoordToAdd_XY
   * @param {"string"} nearbyNodesSelectionMethod
   * @param {number} connectionDistance
   * @param {number} numberOfTopClosestNeighbors
   * @returns
   */
  getNodesNearby(
    graphNodes,
    nextCoordToAdd_XY,
    nearbyNodesSelectionMethod,
    connectionDistance,
    numberOfTopClosestNeighbors
  ) {

    var distancesBetweenACoordAndAllOthers = [];
    for (let i = 0; i < graphNodes.length; ++i) {
      distancesBetweenACoordAndAllOthers.push([
        Utils.euclideanDistance(graphNodes[i].value_XY, nextCoordToAdd_XY),
        i,
      ]);
    }
    distancesBetweenACoordAndAllOthers.sort((a, b) => {
      return a[0] - b[0]; // sort by distance
    });

    var indexOfSelectedOtherRandomCoords;

    if (nearbyNodesSelectionMethod == AlgNearbyNodesSelectionMethod.Nearest) {
      // checks LOS between the the top X closes Neighbors
      indexOfSelectedOtherRandomCoords = distancesBetweenACoordAndAllOthers
        .slice(0, numberOfTopClosestNeighbors)
        .map((p) => p[1]);
    } else if (nearbyNodesSelectionMethod == AlgNearbyNodesSelectionMethod.Radius) {
      indexOfSelectedOtherRandomCoords = distancesBetweenACoordAndAllOthers
        .filter((p) => p[0] < connectionDistance)
        .map((p) => p[1]);
    }
    return indexOfSelectedOtherRandomCoords;
  }
  /**
   * returns the index of the parent node with the lowest cost
   * @param {*} nodesNearby_Index
   * @param {[number,number]} nextCoordToAdd_XY
   * @param {number} nearestNode_Index
   * @param {*} graphNodes
   */

  determineParentWithLowestCost(
    nodesNearby_Index,
    nextCoordToAdd_XY,
    nearestNode_Index,
    graphNodes
  ) {
    // parent maybe further than nearest node but with lower cost
    var selectedParent_index = nearestNode_Index;
    for (let i = 0; i < nodesNearby_Index.length; ++i) {
      if (
        graphNodes[nodesNearby_Index[i]].g +
        Utils.euclideanDistance(
          graphNodes[nodesNearby_Index[i]].value_XY,
          nextCoordToAdd_XY
        ) <
        graphNodes[selectedParent_index].g +
        Utils.euclideanDistance(
          graphNodes[selectedParent_index].value_XY,
          nextCoordToAdd_XY
        ) &&
        this.LOSChecker(
          graphNodes[nodesNearby_Index[i]].value_XY,
          nextCoordToAdd_XY
        )
      ) {
        selectedParent_index = nodesNearby_Index[i];
      }
    }
    return selectedParent_index;
  }

  /**
   * Builds a graph of nodes with edges between them using PRM
   * @params {void}
   * @returns {void}
   */
  generateNewMap() {
    this.prevGoalCoord = [];
    this.prevGoalCoordConnectedto = [];
    var seed = Utils.cyrb128(this.alg_params.seed);
    this.rand = Utils.mulberry32(seed[0]);
    this.choosenCoordsNodes = [];
    var edgeAccumalator = [];
    this.choosenCoordsNodes.push(
      new Algs.GraphNode(null, this.coord_start, [], 0)
    );
    this.goalIndex = -1;

    this.#newMjrStep();
    this.#drawVertex(this.coord_start);
    this.#newMjrStep();
    this.#drawCircleDotted(
      this.coord_goal,
      this.alg_params.goal_radius
    );
    this.#closeStep();
    // myUI.nodeCanvas.drawCircle(start);

    // this._create_action({ command: STATIC.DrawEdge, dest: this.dests.intermediaryMapExpansion, nodeCoord: [2,2], endCoord: [8,8] });
    // this._create_action({ command: STATIC.CreateStaticRow, dest: this.dests.ITStatistics, id: "NumberOfNodes", value: "Number Of Nodes" });
    // this._create_action({ command: STATIC.CreateStaticRow, dest: this.dests.ITStatistics, id: "PathDistance", value: "Path Distance" });
    // this._create_action({ command: STATIC.EditStaticRow, dest: this.dests.ITStatistics, id: "NumberOfNodes", value: "0" });
    // this._create_action({ command: STATIC.EditStaticRow, dest: this.dests.ITStatistics, id: "PathDistance", value: "∞" });

    // this.createStaticRow(this.dests.ITStatistics, "NumberOfNodes", "Number Of Nodes");
    // this.createStaticRow(this.dests.ITStatistics, "PathDistance", "Path Distance");
    // this.editStaticRow(this.dests.ITStatistics, "NumberOfNodes", "0");
    // this.editStaticRow(this.dests.ITStatistics, "PathDistance", "∞");
    // this._create_action({ command: STATIC.DrawVertex, dest: this.dests.networkGraph, nodeCoord: start });
    // this._create_action({ command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 1 });
    // this._save_step(true);

    for (let i = 0; i < this.alg_params.sample_size; ++i) {
      var randomCoord_XY = [
        this.rand() * ui_states.size[0],
        this.rand() * ui_states.size[1],
      ]; //need seed
      this.#newMjrStep();
      const tempSpriteDotted = this.#drawVertexDotted(randomCoord_XY);

      this.#closeStep();
      let tempRadius;
      let tempNeighbours = [];

      // this._create_action({command: STATIC.HighlightPseudoCodeRowSec, dest: this.dests.pseudocode, pseudoCodeRow: 2});
      // this._create_action({ command: STATIC.DrawVertex, dest: this.dests.intermediaryMapExpansion, nodeCoord: randomCoord_XY, colorIndex: 1});
      // this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 3});
      // this._save_step(false);

      var nearestNode_Index = this.getNearestNodeIndexInTreeToRandomCoord(
        this.choosenCoordsNodes,
        randomCoord_XY
      );
      this.#newMjrStep();
      let node1 = this.choosenCoordsNodes[nearestNode_Index].value_XY;
      let node2 = randomCoord_XY;
      const tempSprite = this.#drawDottedLine(node1, node2);
      this.#closeStep();

      // this._create_action({ command: STATIC.DrawSingleVertex, dest: this.dests.expanded, nodeCoord: this.choosenCoordsNodes[nearestNode_Index].value_XY});
      // this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 4});
      // this._create_action({ command: STATIC.DrawEdge, dest: this.dests.intermediaryMapExpansion, nodeCoord: this.choosenCoordsNodes[nearestNode_Index].value_XY, endCoord: randomCoord_XY });
      // this._save_step(false);

      var nextCoordToAdd_XY = Utils.getCoordinatesofPointsXAwayFromSource(
        this.choosenCoordsNodes[nearestNode_Index].value_XY,
        randomCoord_XY,
        this.alg_params.distance_from_coord
      );
      this.#newMjrStep();
      const tempSprite2 = this.#drawVertex(nextCoordToAdd_XY);
      this.#closeStep();
      // this._create_action({ command: STATIC.DrawVertex, dest: this.dests.intermediaryMapExpansion, nodeCoord: nextCoordToAdd_XY });
      // this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 5});
      // this._save_step(false)
      if (
        this.LOSChecker(
          this.choosenCoordsNodes[nearestNode_Index].value_XY,
          nextCoordToAdd_XY
        )
      ) {
        // checks if new randomm coord is on a non-obstacle coord and if path from parent to node has LOS
        var nodesNearby_Index = this.getNodesNearby(
          this.choosenCoordsNodes,
          nextCoordToAdd_XY,
          this.alg_params.nearby_nodes_selection_method,

          this.alg_params.nearby_nodes_selection_method_radius_number,
          this.alg_params.nearby_nodes_selection_method_nearest_number
        );
        this.#newMjrStep();
        nodesNearby_Index.forEach((element) => {
          tempNeighbours.push(
            this.#drawVertexNeighbor(this.choosenCoordsNodes[element].value_XY)
          );
        });
        this.#closeStep();
        if (
          this.alg_params.nearby_nodes_selection_method ==
          AlgNearbyNodesSelectionMethod.Radius
        ) {
          this.#newMjrStep();
          tempRadius = this.#drawCircleDotted(
            nextCoordToAdd_XY,
            this.alg_params.nearby_nodes_selection_method_radius_number
          );
          this.#closeStep();
        }
        //   this._create_action({ command: STATIC.DrawVertex, dest: this.dests.networkGraph, nodeCoord: nextCoordToAdd_XY });
        //   this.incrementStaticRow(this.dests.ITStatistics, "NumberOfNodes");
        //   this._create_action({command: STATIC.DrawVertex, dest: this.dests.intermediaryMapExpansion, nodeCoord: nextCoordToAdd_XY,anyVal: this.alg_params.Neighbor_selection_method_radius_number.toString()});
        //   this._create_action({command: STATIC.HighlightPseudoCodeRowSec, dest: this.dests.pseudocode, pseudoCodeRow: 6});
        //   this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 7});
        //   this._save_step(false);

        var selectedParent_Index = this.determineParentWithLowestCost(
          nodesNearby_Index,
          nextCoordToAdd_XY,
          nearestNode_Index,
          this.choosenCoordsNodes
        );

        this.#newMjrStep();
        let node1 = this.choosenCoordsNodes[selectedParent_Index].value_XY;
        let node2 = nextCoordToAdd_XY;
        const sprite = this.#drawLine(node1, node2);
        this.#closeStep();

        // myUI.edgeCanvas.drawLine(this.choosenCoordsNodes[selectedParent_Index].value_XY, nextCoordToAdd_XY);
        //   this._create_action({command: STATIC.DrawSingleVertex, dest: this.dests.expanded, nodeCoord: this.choosenCoordsNodes[selectedParent_Index].value_XY, colour:"pink"});
        //   this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 8});
        //   this._save_step(false);
        //   this._create_action({ command: STATIC.DrawEdge, dest: this.dests.networkGraph, nodeCoord: this.choosenCoordsNodes[selectedParent_Index].value_XY, endCoord: nextCoordToAdd_XY });
        //   this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 9});
        //   this._save_step(false);
        this.insertNodeToTree(selectedParent_Index, nextCoordToAdd_XY, [
          selectedParent_Index,
        ]);

        if (this.alg_params.rewiring == AlgRewiringOfTree.Enable) {
          console.log("rewiring")
          this.rewireTree(
            this.choosenCoordsNodes.length - 1,
            nodesNearby_Index
          );
        }

        //   this._create_action({ command: STATIC.UnhighlightAllPseudoCodeRowSec, dest: this.dests.pseudocode });
        //   this._create_action({command: STATIC.HighlightPseudoCodeRowSec, dest: this.dests.pseudocode, pseudoCodeRow: 2});
        //   this._create_action({ command: STATIC.EraseAllVertex, dest: this.dests.neighbors });
        //   this._create_action({ command: STATIC.EraseAllVertex, dest: this.dests.intermediaryMapExpansion });
        //   this._create_action({command: STATIC.EraseAllEdge, dest: this.dests.intermediaryMapExpansion});
        //   this._save_step(true);

        //g cost calculated within in insertNodeToTree()
        //deleting all the intermediary vertices
        this.#newMjrStep();
        this.#eraseLine(tempSprite);
        this.#eraseVertex(tempSpriteDotted);
        if (tempRadius != undefined) {
          this.#deleteCircleDotted(tempRadius);
        }
        tempNeighbours.forEach((element) => {
          this.#eraseVertex(element);
        });
        this.#closeStep();
      } else {
        //   this._create_action({ command: STATIC.EraseAllVertex, dest: this.dests.neighbors });
        //   this._create_action({ command: STATIC.EraseAllVertex, dest: this.dests.intermediaryMapExpansion });
        //   this._create_action({command: STATIC.EraseAllEdge, dest: this.dests.intermediaryMapExpansion});
        //   this._save_step(true);
        this.#newMjrStep();
        this.#eraseLine(tempSprite);
        this.#eraseVertexDotted(tempSpriteDotted);
        this.#eraseVertex(tempSprite2);
      }


      // after adding last node of sample size
      if (i == this.alg_params.sample_size - 1 && this.alg_params.grow_tree_till_path_found == AlgGrowTreeTillPathFound.Enable) {
        this.goalIndex = this.addGoalNode(this.coord_goal);
        if (this.goalIndex == -1) {
          // sample size reached but cannot find this.goalIndex, incrementing sample size
          i--; // to keep the loop running
        }
      }
    }

    this.goalIndex = this.addGoalNode(this.coord_goal);

    if (this.goalIndex == -1) {
      console.log("Goal is not reachable");
      if (this.alg_params.grow_tree_till_path_found == AlgGrowTreeTillPathFound.Enable) {
      }
      // alert("Goal is not reachable");
      return;
    }
    // trace path
    let currentIndex = this.goalIndex;
    this.#newMjrStep();
    while (currentIndex != 0) {
      console.log("popy")
      let currentCoord = this.choosenCoordsNodes[currentIndex].value_XY;
      let parentCoord =
        this.choosenCoordsNodes[this.choosenCoordsNodes[currentIndex].parent]
          .value_XY;
      currentIndex = this.choosenCoordsNodes[currentIndex].parent;
      this.#drawLinePath(currentCoord, parentCoord);
      this.#drawVertexPath(currentCoord);
    }
    this.#closeStep();

    // this._create_action({ command: STATIC.UnhighlightAllPseudoCodeRowSec, dest: this.dests.pseudocode });
    // this._create_action({ command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 9 });

    // this._save_step(true);
  }

  //   growMapByNodes(numberOfNodes=1) {
  //     //this.alg_params.sample_size+=numberOfNodes

  //     //var testrandom = [[10,3],[4,20],[15,2]]

  //     for (let i = 0; i < numberOfNodes; ++i) {
  //         var randomCoord_XY = [this.rand()*ui_states.size[0], this.rand()*ui_states.size[1]]; //recycles seed used in generate map
  //        // var randomCoord_XY = testrandom[i];

  //         // -------------FROM generateNewMap-------------
  //         // this._create_action({command: STATIC.HighlightPseudoCodeRowSec, dest: this.dests.pseudocode, pseudoCodeRow: 2});
  //         // this._create_action({ command: STATIC.DrawVertex, dest: this.dests.intermediaryMapExpansion, nodeCoord: randomCoord_XY, colorIndex: 1});
  //         // this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 3});
  //         // this._save_step(false);
  //         // -------------UNTIL HERE-------------

  //         var nearestNode_Index = this.getNearestNodeIndexInTreeToRandomCoord(this.choosenCoordsNodes, randomCoord_XY)

  //         // -------------FROM generateNewMap-------------
  //         // this._create_action({ command: STATIC.DrawSingleVertex, dest: this.dests.expanded, nodeCoord: this.choosenCoordsNodes[nearestNode_Index].value_XY});
  //         // this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 4});
  //         // this._create_action({ command: STATIC.DrawEdge, dest: this.dests.intermediaryMapExpansion, nodeCoord: this.choosenCoordsNodes[nearestNode_Index].value_XY, endCoord: randomCoord_XY });
  //         // this._save_step(false);
  //         // -------------UNTIL HERE-------------

  //         var nextCoordToAdd_XY = Utils.getCoordinatesofPointsXAwayFromSource(this.choosenCoordsNodes[nearestNode_Index].value_XY,randomCoord_XY,this.alg_params.form_alg_distance_from_coord);

  //         // -------------FROM generateNewMap-------------
  //         // this._create_action({ command: STATIC.DrawVertex, dest: this.dests.intermediaryMapExpansion, nodeCoord: nextCoordToAdd_XY });
  //         // this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 5});
  //         // this._save_step(false)
  //         // -------------UNTIL HERE-------------

  //         if (this.LOSChecker(this.choosenCoordsNodes[nearestNode_Index].value_XY, nextCoordToAdd_XY)){ // checks if new randomm coord is on a non-obstacle coord and if path from parent to node has LOS

  //         //   if (document.getElementById("randomCoordLine")){ myUI.edgeCanvas.EraseSvgById("randomCoordLine") }
  //         //    if( document.getElementById("randomCoord") ){myUI. nodeCanvas.EraseSvgById("randomCoord")}

  //           // -------------OMITTED IN FAVOUR OF generateNewMap methods-------------
  //           // myUI.edgeCanvas.drawLine(this.choosenCoordsNodes[nearestNode_Index].value_XY, nextCoordToAdd_XY);
  //           // myUI.nodeCanvas.drawCircle(nextCoordToAdd_XY);
  //           // //if(this.choosenCoordsNodes.length == 1) myUI.edgeCanvas.drawLine(start,nextCoordToAdd_XY);;
  //           // myUI.edgeCanvas.drawLine(nextCoordToAdd_XY,randomCoord_XY,this.dests.networkGraph,"randomCoordLine",true);
  //           // myUI.nodeCanvas.drawCircle(randomCoord_XY,this.dests.networkGraph,"randomCoord","purple");
  //           // -------------UNTIL HERE-------------

  //           var nodesNearby_Index = this.getNodesNearby(this.choosenCoordsNodes, nextCoordToAdd_XY,this.alg_params.Neighbor_selection_method,this.alg_params.Neighbor_selection_method_radius_number);

  //           // -------------FROM generateNewMap-------------
  //         //   nodesNearby_Index.forEach(element => {
  //         //     this._create_action({ command: STATIC.DrawVertex, dest: this.dests.neighbors, nodeCoord: this.choosenCoordsNodes[element].value_XY });
  //         //   });
  //         //   this._create_action({ command: STATIC.DrawVertex, dest: this.dests.networkGraph, nodeCoord: nextCoordToAdd_XY });
  //         //   this._create_action({ command: STATIC.EditStaticRow, dest: this.dests.ITStatistics, id: "NumberOfNodes",value:"++"});
  //         //   this.incrementStaticRow(this.dests.ITStatistics, "NumberOfNodes");
  //         //   this._create_action({command: STATIC.DrawVertex, dest: this.dests.intermediaryMapExpansion, nodeCoord: nextCoordToAdd_XY,anyVal: this.alg_params.Neighbor_selection_method_radius_number.toString()});
  //         //   this._create_action({command: STATIC.HighlightPseudoCodeRowSec, dest: this.dests.pseudocode, pseudoCodeRow: 6});
  //         //   this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 7});
  //         //   this._save_step(false);
  //           // -------------UNTIL HERE-------------

  //           var selectedParent_Index = this.determineParentWithLowestCost(nodesNearby_Index,nextCoordToAdd_XY,nearestNode_Index,this.choosenCoordsNodes);
  //           //myUI.edgeCanvas.drawLine(this.choosenCoordsNodes[selectedParent_Index].value_XY,nextCoordToAdd_XY);

  //           // -------------FROM generateNewMap-------------
  //         //   this._create_action({command: STATIC.DrawSingleVertex, dest: this.dests.expanded, nodeCoord: this.choosenCoordsNodes[selectedParent_Index].value_XY, colour:"pink"});
  //         //   this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 8});
  //         //   this._save_step(false);
  //         //   this._create_action({ command: STATIC.DrawEdge, dest: this.dests.networkGraph, nodeCoord: this.choosenCoordsNodes[selectedParent_Index].value_XY, endCoord: nextCoordToAdd_XY });
  //         //   this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 9});
  //         //   this._save_step(false);
  //         //   this.insertNodeToTree(selectedParent_Index, nextCoordToAdd_XY, [selectedParent_Index], randomCoord_XY, [nextCoordToAdd_XY, randomCoord_XY]);
  //         //   this.rewireTree(this.choosenCoordsNodes.length - 1, nodesNearby_Index)

  //         //   this._create_action({ command: STATIC.UnhighlightAllPseudoCodeRowSec, dest: this.dests.pseudocode });
  //         //   this._create_action({command: STATIC.HighlightPseudoCodeRowSec, dest: this.dests.pseudocode, pseudoCodeRow: 2});
  //           // -------------UNTIL HERE-------------

  //           // -------------OMITTED IN FAVOUR OF generateNewMap methods-------------
  //           // this.insertNodeToTree(selectedParent_Index,nextCoordToAdd_XY,[selectedParent_Index],randomCoord_XY,[nextCoordToAdd_XY,randomCoord_XY]);
  //           // this.rewireTree(this.choosenCoordsNodes.length-1, nodesNearby_Index)
  //           // -------------UNTIL HERE-------------

  //           //parent, value_XY,Neighbors, additionalCoord, additionalEdge, g_cost) parent left as null here as it is not used in search()
  //           //g cost calculated within in insertNodeToTree()
  //         }
  //         else{
  //           console.log("Didn't add node!");
  //         }
  //           // -------------FROM generateNewMap-------------
  //         // this._create_action({ command: STATIC.EraseAllVertex, dest: this.dests.neighbors });
  //         // this._create_action({ command: STATIC.EraseAllVertex, dest: this.dests.intermediaryMapExpansion });
  //         // this._create_action({command: STATIC.EraseAllEdge, dest: this.dests.intermediaryMapExpansion});
  //         // this._save_step(true);
  //           // -------------UNTIL HERE-------------
  //     }

  //     this.addGoalNode(this.coord_goal, false);

  //     // this._create_action({ command: STATIC.UnhighlightAllPseudoCodeRowSec, dest: this.dests.pseudocode });
  //     // this._create_action({ command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 9 });

  //     // this._save_step(true);
  //     // this._save_step(true);

  //     // myUI.updateStepControls();
  //   }

  insertNodeToTree(parent_Index, current_XY, neighbors_IndexArray) {
    if (
      this.LOSChecker(
        this.choosenCoordsNodes[parent_Index].value_XY,
        current_XY
      )
    ) {
      var g_cost =
        this.choosenCoordsNodes[parent_Index].g +
        Utils.euclideanDistance(
          current_XY,
          this.choosenCoordsNodes[parent_Index].value_XY
        );
      //add neighbors for parents

      this.choosenCoordsNodes[parent_Index].neighbors.push(
        this.choosenCoordsNodes.length
      );
      this.choosenCoordsNodes.push(
        new Algs.GraphNode(
          parent_Index,
          current_XY,
          neighbors_IndexArray,
          g_cost
        )
      );
    }
  }

  /**
   * Rewires neighboring nodes within radius of current node to current node as parent if it results in a lower g cost
   * @param {*} currentNode_index
   * @param {*} nodesNearby_Index
   */
  rewireTree(currentNode_index, nodesNearby_Index) {
    for (let i = 0; i < nodesNearby_Index.length; ++i) {
      var nodeNearby_index = nodesNearby_Index[i];


      if (nodeNearby_index == this.choosenCoordsNodes[currentNode_index].parent)
        continue;
      var newConnection_g_cost =
        Utils.euclideanDistance(
          this.choosenCoordsNodes[currentNode_index].value_XY,
          this.choosenCoordsNodes[nodeNearby_index].value_XY
        ) + this.choosenCoordsNodes[currentNode_index].g;

      var LOS = this.LOSChecker(
        this.choosenCoordsNodes[currentNode_index].value_XY,
        this.choosenCoordsNodes[nodeNearby_index].value_XY
      );
      if (this.choosenCoordsNodes[nodeNearby_index].g > newConnection_g_cost) {

      }
      if (
        this.choosenCoordsNodes[nodeNearby_index].g > newConnection_g_cost &&
        LOS
      ) {
        // yes rewire
        this.choosenCoordsNodes[nodeNearby_index].neighbors.push(
          currentNode_index
        ); // forms edge between nearby node and current
        this.choosenCoordsNodes[currentNode_index].neighbors.push(
          nodeNearby_index
        );
        //before rewiring
        for (
          let j = 0;
          j < this.choosenCoordsNodes[nodeNearby_index].neighbors.length;
          ++j
        ) {
          // remove edge between nearby node and parent of nearby node
          if (
            this.choosenCoordsNodes[nodeNearby_index].neighbors[j] ==
            this.choosenCoordsNodes[nodeNearby_index].parent
          ) {
            var formerParentOfNearbyNode_index =
              this.choosenCoordsNodes[nodeNearby_index].neighbors[j];
            this.choosenCoordsNodes[nodeNearby_index].neighbors.splice(j, 1); // removes parent as a neighbor
            continue;
          }
        }
        this.choosenCoordsNodes[nodeNearby_index].parent = currentNode_index;
        //after rewiring
        for (
          let j = 0;
          j <
          this.choosenCoordsNodes[formerParentOfNearbyNode_index].neighbors
            .length;
          ++j
        ) {
          if (
            this.choosenCoordsNodes[formerParentOfNearbyNode_index].neighbors[
            j
            ] == nodeNearby_index
          ) {
            this.choosenCoordsNodes[
              formerParentOfNearbyNode_index
            ].neighbors.splice(j, 1); // removes nearby node as a neighbor of (nearby node parent)
          }
        }

        this.#newMjrStep();
        // console.log(this.choosenCoordsNodes[formerParentOfNearbyNode_index].value_XY, this.choosenCoordsNodes[nodeNearby_index].value_XY, this.choosenCoordsNodes[currentNode_index].value_XY,
        //   this.choosenCoordsNodes[nodeNearby_index].value_XY)
        // console.log(formerParentOfNearbyNode_index, nodeNearby_index, currentNode_index, nodeNearby_index)
        this.#moveLineByCoord(
          this.choosenCoordsNodes[formerParentOfNearbyNode_index].value_XY,
          this.choosenCoordsNodes[nodeNearby_index].value_XY,
          this.choosenCoordsNodes[currentNode_index].value_XY,
          this.choosenCoordsNodes[nodeNearby_index].value_XY
        );
        // let x = []
        // this.choosenCoordsNodes.forEach((element) => {x.push(element.coord)})
        // console.log(x[41],x[31]);
        console.log(this.#canvas_nodes)
        this.#deleteLineByCoord(this.choosenCoordsNodes[formerParentOfNearbyNode_index].value_XY, this.choosenCoordsNodes[nodeNearby_index].value_XY);
        this.#drawLineOrange(this.choosenCoordsNodes[currentNode_index].value_XY,
          this.choosenCoordsNodes[nodeNearby_index].value_XY)
        this.#closeStep();

        
        //   this._create_action({command: STATIC.EraseEdge, dest: this.dests.networkGraph, nodeCoord: this.choosenCoordsNodes[formerParentOfNearbyNode_index].value_XY, endCoord: this.choosenCoordsNodes[nodeNearby_index].value_XY });
        //   this._create_action({command: STATIC.DrawEdge, dest: this.dests.networkGraph, nodeCoord: this.choosenCoordsNodes[currentNode_index].value_XY, endCoord: this.choosenCoordsNodes[nodeNearby_index].value_XY, colorIndex:1});
        //   this._create_action({command: STATIC.HighlightPseudoCodeRowPri, dest: this.dests.pseudocode, pseudoCodeRow: 10});
        //   this._save_step(true);
        // myUI.edgeCanvas.eraseLine(this.choosenCoordsNodes[formerParentOfNearbyNode_index].value_XY, this.choosenCoordsNodes[nodeNearby_index].value_XY, this.dests.networkGraph);
        //myUI.edgeCanvas.drawLine(this.choosenCoordsNodes[currentNode_index].value_XY,this.choosenCoordsNodes[nodeNearby_index].value_XY);
      }
    }
  }
  /**
   * connects graph generated in generateNewMap to start or goal and allows changes to start and goal after graph is generated
   * @params {string} isStartOrGoal - "start" or "goal"
   * @params {[number, number]} coord_XY - start or goal coord
   * @returns {number} index of start or goal node in graphNodes
   */

  addGoalNode(coord_XY = [4, 1], addToExports = true) {
    if (this.LOSChecker(coord_XY, coord_XY) == false) {
      // alert(`Goal is on an obstacle`);
      return -1;

    }

    if (this.prevGoalCoordConnectedto.length == 2) {
      //  myUI.edgeCanvas.eraseLine(this.prevGoalCoordConnectedto,this.prevGoalCoord);
    }

    this.#newMjrStep();
    this.#drawVertex(coord_XY);
    this.#closeStep();
    var nodesNearby_Index = this.getNodesNearby(
      this.choosenCoordsNodes,
      coord_XY,
      AlgNearbyNodesSelectionMethod.Radius, //hard coded to radius
      this.alg_params.goal_radius,
      0 //redundent for radius as nodes nearby is by radius
    );
    if (nodesNearby_Index == false) {
      console.log("No nearby nodes to connect to.");
      // alert("No nearby nodes to connect to.");
      // this._create_action({ command: STATIC.EditStaticRow, dest: this.dests.ITStatistics, id: "PathDistance",value:"∞"});
      //   this.editStaticRow(this.dests.ITStatistics, "PathDistance", "∞");
      return -1;
    }
    let selectedVertex = this.getNeighborIndexThatResultsInShortestPath(
      coord_XY,
      nodesNearby_Index
    )
    if (selectedVertex.index == -1) {
      console.log("No nearby nodes to connect to.");
      //case wherethere is nearby nodes but no nodes within radius of goal 
      return -1;
    }
    var selectedVertexIndex = selectedVertex.index;
    var selectedVertexCost = selectedVertex.cost;
    // this._create_action({ command: STATIC.EditStaticRow, dest: this.dests.ITStatistics, id: "NumberOfNodes", value: "++" });
    // this._create_action({ command: STATIC.EditStaticRow, dest: this.dests.ITStatistics, id: "PathDistance",value:selectedVertexCost.toPrecision(5)});
    // this.incrementStaticRow(this.dests.ITStatistics, "NumberOfNodes");
    // this.editStaticRow(this.dests.ITStatistics, "PathDistance", selectedVertexCost.toPrecision(5));

    const selected_XY = this.choosenCoordsNodes[selectedVertexIndex].value_XY;
    var selectedIndexForStartEndVertex = this.choosenCoordsNodes.length; // determined before push to array below

    this.choosenCoordsNodes.push(
      new Algs.GraphNode(null, coord_XY, new Array())
    );
    // this._create_action({ command: STATIC.DrawEdge, dest: this.dests.networkGraph, nodeCoord: coord_XY, endCoord: selected_XY });
    //myUI.edgeCanvas.drawLine(coord_XY,selected_XY);
    this.#newMjrStep();
    this.#drawLine(coord_XY, selected_XY);
    this.#closeStep();

    if (
      !this.choosenCoordsNodes[selectedVertexIndex].neighbors.includes(
        selectedIndexForStartEndVertex
      )
    )
      this.choosenCoordsNodes[selectedVertexIndex].neighbors.push(
        selectedIndexForStartEndVertex
      );
    if (
      !this.choosenCoordsNodes[
        selectedIndexForStartEndVertex
      ].neighbors.includes(selectedVertexIndex)
    )
      this.choosenCoordsNodes[selectedIndexForStartEndVertex].neighbors.push(
        selectedVertexIndex
      );

    this.choosenCoordsNodes[selectedIndexForStartEndVertex].parent =
      selectedVertexIndex;
    return selectedIndexForStartEndVertex;
  }

  getNeighborIndexThatResultsInShortestPath(coord_XY, nodesNearby_Index) {
    // rewires neighboring nodes within radius of current node to current node as parent if it results in a lower g cost

    var lowestConnection_g_cost = Infinity;
    var lowestConnection_g_cost_index = -1; // change this such that sample size increases till there is a connection
    for (let i = 0; i < nodesNearby_Index.length; ++i) {
      var nodeNearby_index = nodesNearby_Index[i];
      var newConnection_g_cost =
        Utils.euclideanDistance(
          coord_XY,
          this.choosenCoordsNodes[nodeNearby_index].value_XY
        ) + this.choosenCoordsNodes[nodeNearby_index].g;
      var LOS = this.LOSChecker(
        coord_XY,
        this.choosenCoordsNodes[nodeNearby_index].value_XY
      );
      if (lowestConnection_g_cost > newConnection_g_cost && LOS) {
        // yes connect to
        lowestConnection_g_cost = newConnection_g_cost;
        lowestConnection_g_cost_index = nodeNearby_index;
      }
    }
    // if (lowestConnection_g_cost_index == -1)
    //   alert("nodes within radius of goal are not viable connections");

    return {
      index: lowestConnection_g_cost_index,
      cost: lowestConnection_g_cost,
    };
  }
  run() {


    this.generateNewMap();
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
    this.#step.registerWithData(sprite, SpriteActionNode.Display, true);
    return sprite;
  }
  #drawVertexPath(coord) {
    const id = this.serialize(coord);
    const sprite = this.#canvas_nodes.add(
      Infinity,
      PRMNodeStatus.Undiscovered,
      id,
      coord,
      false,
      SpriteActionClass.Red,
      0,
      SpriteActionOutline.None
    );
    this.#step.registerWithData(sprite, SpriteActionNode.Display, true);
  
    return sprite;
  }
  #drawVertexNeighbor(coord) {
    const id = this.serialize(coord);
    const sprite = this.#canvas_nodes.add(
      Infinity,
      PRMNodeStatus.Undiscovered,
      id,
      coord,
      false,
      SpriteActionClass.Blue,
      0,
      SpriteActionOutline.None
    );
    this.#step.registerWithData(sprite, SpriteActionNode.Display, true);
  
    return sprite;
  }
  #drawVertexDotted(coord) {
    const id = null;
    const sprite = this.#canvas_nodes.add(
      Infinity,
      PRMNodeStatus.Undiscovered,
      id,
      coord,
      false,
      SpriteActionClass.Transparent,
      0,
      SpriteActionOutline.Red
    );
    this.#step.registerWithData(sprite, SpriteActionNode.Display, true);
   
    return sprite;
  }
  #eraseVertex(sprite) {
    this.#step.registerWithData(sprite, SpriteActionNode.Display, false);
  }
  #eraseVertexByCoord(coord) {
    this.#step.registerWithData(sprite, SpriteActionNode.Display, false);
  }
  #eraseVertexDotted(sprite) {
    this.#step.registerWithData(sprite, SpriteActionNode.Display, false);
  }
  // -------- Line ---------

  #addLine;
  #addLineVertex(id, node_coord, new_parent_coord) {
    return this.#canvas_lines.add(
      id,
      node_coord,
      Utils.subtractCoords(new_parent_coord, node_coord),
      false,
      SpriteActionClass.Gray,
      0
    );
  }

  #drawLine(node_coord, new_parent_coord) {
    if (node_coord[0] > new_parent_coord[0]) {
      // to ensure id always starts with coord with smaller x
      let temp = node_coord;
      node_coord = new_parent_coord;
      new_parent_coord = temp;
    }
    const id = ui.serializeVertexEdge(node_coord, new_parent_coord);
    // create new edge
    const sprite = this.#addLine(id, node_coord, new_parent_coord);
    this.#step.registerWithData(sprite, SpriteActionLine.Display, true);
  }
  #drawLinePath(node_coord, new_parent_coord) {
    const id = null;
    // create new edge
    const sprite = this.#canvas_lines.add(
      id,
      node_coord,
      Utils.subtractCoords(new_parent_coord, node_coord),
      false,
      SpriteActionClass.Red,
      0
    );
    this.#step.registerWithData(sprite, SpriteActionLine.Display, true);
  }
  #drawLineOrange(node_coord, new_parent_coord) {
    if (node_coord[0] > new_parent_coord[0]) {
      // to ensure id always starts with coord with smaller x
      let temp = node_coord;
      node_coord = new_parent_coord;
      new_parent_coord = temp;
    }

    const id = ui.serializeVertexEdge(node_coord, new_parent_coord);
    // create new edge
    const sprite = this.#canvas_lines.add(
      id,
      node_coord,
      Utils.subtractCoords(new_parent_coord, node_coord),
      false,
      SpriteActionClass.Orange,
      0
    );
    this.#step.registerWithData(sprite, SpriteActionLine.Display, true);
  }
  #deleteLineByCoord(coord1, coord2) {
    if (coord1[0] > coord2[0]) {
      // to ensure id always starts with coord with smaller x
      let temp = coord1;
      coord1 = coord2;
      coord2 = temp;
    }

    const id = ui.serializeVertexEdge(coord1, coord2);
    console.log("id",id);
    let sprite = this.#canvas_lines.sprite(id);
    this.#step.registerWithData(sprite, SpriteActionLine.Display, false);
  }
  #moveLineByCoord(coord1, coord2, coord3, coord4) {
    if (coord1[0] > coord2[0]) {
      // to ensure id always starts with coord with smaller x
      let temp = coord1;
      coord1 = coord2;
      coord2 = temp;
    }
    const id = ui.serializeVertexEdge(coord1, coord2);

    let sprite = this.#canvas_lines.sprite(id);
    this.#step.registerWithData(sprite, SpriteActionLine.Position, coord3);
    this.#step.registerWithData(
      sprite,
      SpriteActionLine.Size,
      Utils.subtractCoords(coord4, coord3)
    );
    this.#step.registerWithData(
      sprite,
      SpriteActionLine.Class,
      SpriteActionClass.Orange
    );
    sprite.id = ui.serializeVertexEdge(coord3, coord4);
  }

  #eraseLine(sprite) {
    this.#step.registerWithData(sprite, SpriteActionLine.Display, false);
  }

  #visualizeOpened(node) {
    this.#step.registerWithData(
      node.sprite,
      SpriteActionNode.Class,
      SpriteActionClass.Orange
    );
    this.#step.registerWithData(
      node.sprite,
      RRTAction.Status,
      RRTNodeStatus.Queued
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
      RRTAction.Status,
      RRTNodeStatus.Visited
    );
  }

  //  #addLine
  #addDottedLineVertex(id, node_coord, new_parent_coord) {
    return this.#canvas_lines.add(
      id,
      node_coord,
      Utils.subtractCoords(new_parent_coord, node_coord),
      false,
      SpriteActionClass.Gray,
      0,
      SpriteActionOutline.Dotted
    );
  }

  #drawDottedLine(node_coord, new_parent_coord) {
    const id = ui.serializeVertexEdge(node_coord, new_parent_coord);

    // create new edge
    const sprite = this.#addDottedLineVertex(id, node_coord, new_parent_coord);
    this.#step.registerWithData(sprite, SpriteActionLine.Display, true);
    return sprite;
  }
  // -------- Circl ---------

  #addCircle;
  #drawCircleDotted(coord, radius) {
    const id = `${coord[0]},${coord[1]}`;

    const sprite_r = new Algs.RRTSpriteCircle(id);
    this.#canvas_circles.dom.appendChild(sprite_r.dom);
    sprite_r.register(RRTActionCircle.Display, false);
    sprite_r.register(RRTActionCircle.ZIndex, 0);
    sprite_r.register(RRTActionCircle.Position, coord);
    sprite_r.register(RRTActionCircle.Radius, radius);
    this.#step.registerWithData(sprite_r, RRTActionCircle.Display, true);
    this.#step.registerWithData(sprite_r, RRTActionCircle.Position, coord);
    this.#step.registerWithData(sprite_r, RRTActionCircle.Radius, radius);
    sprite_r.vis();
    return sprite_r;
  }
  #deleteCircleDotted(sprite) {
    this.#step.registerWithData(sprite, RRTActionCircle.Display, false);
  }

  #deleteCircleDottedByCoord(coord) {
    const id = `${coord[0]},${coord[1]}`;

    let sprite = this.#canvas_circles.sprite(id);
    this.#step.registerWithData(sprite, SpriteActionLine.Display, false);
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

  #closeStep() {
    ui.player.register(this.#step);
    this.#step = null;
  }
};
