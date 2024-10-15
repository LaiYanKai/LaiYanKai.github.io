"use strict";

ui.form_alg_algorithm = new UI.FormElementSelect(
  "Algorithm",
  "form_alg_algorithm",
  "Choose an algorithm. Every algorithm has a different set of parameters.",
  [
    ["Depth First Search (DFS)", AlgAlgorithm.DFS],
    ["Breadth First Search (BFS/FloodFill)", AlgAlgorithm.BFS],
    ["Greedy Best First Search (GBFS)", AlgAlgorithm.GBFS, AlgAlgorithm.GBFS],
    ["Dijkstra", AlgAlgorithm.Dijkstra],
    ["A*", AlgAlgorithm.AStar, AlgAlgorithm.Astar],
    ["Theta*", AlgAlgorithm.ThetaStar, AlgAlgorithm.ThetaStar],
    ["Anya", AlgAlgorithm.Anya, AlgAlgorithm.Anya],
    ["RRT", AlgAlgorithm.RRT],
    ["PRM", AlgAlgorithm.PRM],
    ["R2+", AlgAlgorithm.R2P, AlgAlgorithm.R2P],
  ],
  AlgAlgorithm.AStar
);

ui.form_alg_preset = new UI.FormElementSelect(
  "Preset",
  "form_alg_preset",
  "Choose a preset. Each algorithm has a different set of presets that changes the values of the parameters below.",
  [["Default", 0]],
  0
);

ui.form_alg_graphing = new UI.FormHeading("Graphing");

ui.form_alg_node_type = new UI.FormElementSelect(
  "Node Type",
  "form_alg_node_type",
  "Determines if the search expands grid cells or grid vertices.",
  [
    ["Cell", AlgNodeType.Cell],
    ["Vertex", AlgNodeType.Vertex],
  ],
  AlgNodeType.Cell
);

ui.form_alg_node_connectivity = new UI.FormElementSelect(
  "Node Connectivity",
  "form_alg_node_connectivity",
  "The maximum number of neighboring nodes a node can be connected to. If <b>4-connected</b>, adjacent nodes that lie in the cardinal (horizontal and vertical, or N, W, S, E) directions can be reached by the current node. If <b>8-connected</b>, adjacent nodes in the diagonal (NW, SW, SE, NE) directions and cardinal directions can be reached.",
  [
    ["4-connected", AlgNodeConnectivity.FourConnected],
    ["8-connected", AlgNodeConnectivity.EightConnected],
  ],
  AlgNodeConnectivity.EightConnected
);

ui.form_alg_first_neighbor = new UI.FormElementSelect(
  "First Neighbor",
  "form_alg_first_neighbor",
  "The first neighboring node to evaluate when a node is being expanded. The options points in the directions of the compass, with north (N) pointing in the direction of the positive <i>y</i> axis, and east pointing in the direction of the positive <i>x</i> axis. For example, if <b>W</b> is chosen, the neighbor node in the negative <i>x</i> direction is evaluated first.",
  [
    ["N", DirIndex.N],
    ["NW", DirIndex.NW],
    ["W", DirIndex.W],
    ["SW", DirIndex.SW],
    ["S", DirIndex.S],
    ["SE", DirIndex.SE],
    ["E", DirIndex.E],
    ["NE", DirIndex.NE],
  ],
  DirIndex.N
);

ui.form_alg_next_neighbor = new UI.FormElementSelect(
  "Next Neighbor",
  "form_alg_next_neighbor",
  "The next neighboring node to evaluate after a neighboring node is evaluated.",
  [
    ["Anti-clockwise", AlgNextNeighbor.AntiClockwise],
    ["Clockwise", AlgNextNeighbor.Clockwise],
  ],
  AlgNextNeighbor.AntiClockwise
);

ui.form_alg_open_list = new UI.FormHeading("Open List");

ui.form_alg_fh = new UI.FormElementSelect(
  "Sort by <i>F</i> or <i>F</i>&<i>H</i>",
  "form_alg_fh",
  "The costs used to sort nodes in the open-list. Select <b>F only</b> to sort only by the <i>f</i>-cost. Select <b>F then H</b> to sort by the <i>f</i>-cost, and subsequently by the <i>h</i>-cost if nodes have the same <i>f</i>-costs.",
  [
    ["F only", AlgFH.FOnly],
    ["F then H", AlgFH.FThenH],
  ],
  AlgFH.FOnly
);

ui.form_alg_time_ordering = new UI.FormElementSelect(
  "Time Ordering",
  "form_alg_time_ordering",
  "Determines how nodes are sorted in the open-list if there are ties in their costs. Select <b>FIFO</b> to prioritize earlier nodes, or <b>LIFO</b> to prioritize more recent nodes. A prioritized node will be polled from the open-list earlier.",
  [
    ["FIFO", AlgTimeOrdering.FIFO],
    ["LIFO", AlgTimeOrdering.LIFO],
  ],
  AlgTimeOrdering.FIFO
);

ui.form_alg_cost_calculation = new UI.FormHeading("Cost Calculation");

ui.form_alg_distance_metric = new UI.FormElementSelect(
  "Distance Metric",
  "form_alg_distance_metric",
  "The metric used to evaluate the distance between nodes.",
  [
    ["Chebyshev", Metric.Chebyshev],
    ["Manhattan", Metric.Manhattan],
    ["Octile", Metric.Octile],
    ["Euclidean", Metric.Euclidean],
  ],
  Metric.Octile,
  Metric
);

ui.form_alg_g_nb = new UI.FormElementSelect(
  "Neighbor <i>G</i>-cost",
  "form_alg_g_nb",
  "Determines how the <i>g</i>-cost between an expanded node and a neighboring node is calculated. For <i>Cell</i> node types, select <b>Neighbor</b> or <b>Expanded</b> to use the cost of the cell where the respective neighboring or expanded node lies on. For <i>Cell</i> and <i>Vertex</i> node types, select <b>Average</b> to use the average cost of the one or two cell(s) between both nodes, or <b>Max</b> or <b>Min</b> to use the larger or smaller cost respectively.",
  [
    ["Average", AlgGNb.Average],
    ["Expanded", AlgGNb.Expanded],
    ["Neighbor", AlgGNb.Neighbor],
    ["Min", AlgGNb.Min],
    ["Max", AlgGNb.Max],
  ],
  AlgGNb.Average
);

ui.form_alg_g_weight = new UI.FormElementNumber(
  "G weight",
  "form_alg_g_weight",
  "Determines the weight <i>a</i> of the <i>g</i>-cost when calculating the <i>f</i>-cost, where <i>f</i> = <i>a</i>&middot;<i>g</i> + <i>b</i>&middot;<i>h</i>. If <i>a</i> is close to zero, the algorithm behaves like GBFS.",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);

ui.form_alg_h_weight = new UI.FormElementNumber(
  "H weight",
  "form_alg_h_weight",
  "Determines the weight <i>b</i> of the <i>h</i>-cost when calculating the <i>f</i>-cost, where <i>f</i> = <i>a</i>&middot;<i>g</i> + <i>b</i>&middot;<i>h</i>. If <i>b</i> is close to zero, the algorithm behaves like Dijkstra.",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);

ui.form_alg_seed = new UI.FormElementNumber(
  "Seed",
  "form_alg_seed",
  "Determines the seed for the random number generator.",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);
ui.form_alg_goal_radius = new UI.FormElementNumber(
  "Goal radius",
  "alg_goal_radius",
  "Determines the goal radius at which the tree/network connects to the goal to find a path.",
  5,
  -Infinity,
  Infinity,
  0.1,
  false
);

ui.form_alg_distance_from_coord = new UI.FormElementNumber(
  "Distance Away From Another Vertex",
  "form_alg_distance_from_coord",
  "Determines distance next vertex is chosen away from closest vertex in RRT tree.",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);
ui.form_alg_sample_size = new UI.FormElementNumber(
  "Sample size",
  "form_alg_sample_size",
  "Determines the number of vertices in the graph",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);


ui.form_alg_grow_tree_till_path_found = new UI.FormElementSelect(
  "Grow Tree Till Path Found ",
  "form_alg_grow_tree_till_path_found ",
  "Determines the tree should stop at sample size or till path is found.",
  [
    ["Enable", AlgGrowTreeTillPathFound.Enable],
    ["Disable", AlgGrowTreeTillPathFound.Disable],
  ],
  AlgGrowTreeTillPathFound.Disable
);


ui.form_alg_neighbor_selection_method = new UI.FormElementSelect(
  "Neighbor Selection Method",
  "form_alg_neighbor_selection_method",
  "Determines how neighbors are selected. Select <b>KNN</b> to select the <i>k</i> nearest neighbors, or <b>Neighbors within radius of vertex</b> to select neighbors within a radius around a vertex.",
  [
    ["KNN", AlgNeighborSelectionMethod.KNN],
    ["Neighbors within radius of vertex", AlgNeighborSelectionMethod.Radius],
  ],
  AlgNeighborSelectionMethod.KNN
);

ui.form_alg_nearby_nodes_selection_method = new UI.FormElementSelect(
  "Nearby Nodes Selection Method",
  "form_alg_nearby_nodes_selection_method",
  "Determines how nearby nodes are selected for the rewiring stage in RRT*. Select <b>Nearest nodes</b> to select the <i>k</i> nearest Nodes, or <b>Nodes within radius of vertex</b> to select nodes within a radius around a vertex.",
  [
    ["Nearest nodes", AlgNearbyNodesSelectionMethod.Nearest],
    ["Nodes within radius of vertex", AlgNearbyNodesSelectionMethod.Radius],
  ],
  AlgNearbyNodesSelectionMethod.Nearest
);
ui.form_alg_neighbor_selection_method_knn_number = new UI.FormElementNumber(
  "Number Of Neighbors",
  "form_alg_neighbor_selection_method_knn_number",
  "Determines the number of neighbors for KNN ",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);
ui.form_alg_neighbor_selection_method_radius_number = new UI.FormElementNumber(
  "Radius",
  "form_alg_neighbor_selection_method_radius_number",
  "Determines the radius around a vertex of which encompassed vertices are considered nearby nodes ",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);
ui.form_alg_nearby_nodes_selection_method_nearest_number = new UI.FormElementNumber(
  "Number Of Nearby Nodes",
  "form_alg_nearby_nodes_selection_method_nearest_number",
  "Determines the number of nearest nearby nodes selected for rewiring ",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);
ui.form_alg_nearby_nodes_selection_method_radius_number = new UI.FormElementNumber(
  "Radius",
  "form_alg_nearby_nodes_selection_method_radius_number",
  "Determines the radius around a vertex of which encompassed vertices are nearby nodes selected for rewiring ",
  1,
  -Infinity,
  Infinity,
  0.1,
  false
);

ui.form_alg_rewiring = new UI.FormElementSelect(
  "Rewiring",
  "form_alg_rewiring",
  "enabling rewiring after sampled vertices are added to the tree converts RRT to RRT* and this is the main difference between them.",
  [
    ["Enable", AlgRewiringOfTree.Enable],
    ["Disable", AlgRewiringOfTree.Disable],
  ],
  AlgRewiringOfTree.Enable
);

ui.form_alg_costmap = new UI.FormHeading("Costmap");

ui.form_alg_costmap_type = new UI.FormElementSelect(
  "Costmap Type",
  "form_alg_costmap_type",
  "Select <b>Multi-cost</b> to use the costs drawn on the cells. Select <b>Multi-cost with Lethal</b> to use the drawn costs with lethal costs, where drawn costs that are greater than or equal to the lethal cost are not accessible by the path planner. Select <b>Binary-cost</b> to emulate a binary occupancy grid, where drawn costs that are below the lethal cost are treated as 1, and cells with costs exceeding the lethal cost are inaccessible.",
  [
    ["Multi-cost", AlgCostmapType.MultiCost],
    ["Multi-cost with Lethal", AlgCostmapType.MultiCostWithLethal],
    ["Binary-cost", AlgCostmapType.Binary],
  ],
  AlgCostmapType.MultiCost
);

ui.form_alg_lethal = new UI.FormElementNumber(
  "Lethal Cost",
  "form_alg_lethal",
  "Cells that have costs greater than or equal to the lethal cost are treated as out-of-bounds, and cannot be accessed by the path planner.",
  5,
  0,
  Infinity,
  1,
  false
);

ui.form_alg_checkerboard = new UI.FormElementSelect(
  "Checkerboard Cells",
  "form_alg_checkerboard",
  "Determines if the planner is allowed to pass through the zero-width corner at the center of a checkerboard. A checkerboard is a 2x2 square window of adjacent cells, where a pair of diagonally opposite cells is accessible, and the other pair is inaccessible.",
  [
    ["Allow", AlgCheckerboard.Allow],
    ["Blocked", AlgCheckerboard.Blocked],
  ],
  AlgCheckerboard.Allow
);

UI.FormAlg = class extends UI.AbstractForm {
  /** Array of elements except headers @type {string[]} */
  _element_names;

  constructor () {
    super("Run a Path Planner", "Run and visualize a path planner.");

    if (ui.form_alg) throw new Error(`ui.form_alg already defined`);
    ui.form_alg = this;

    super.add(ui.form_alg_algorithm);
    super.add(ui.form_alg_preset);

    super.addHeading(ui.form_alg_graphing);
    super.add(ui.form_alg_node_type);
    super.add(ui.form_alg_node_connectivity);
    super.add(ui.form_alg_first_neighbor);
    super.add(ui.form_alg_next_neighbor);
    super.add(ui.form_alg_seed);
    super.add(ui.form_alg_goal_radius);
    super.add(ui.form_alg_distance_from_coord);
    super.add(ui.form_alg_sample_size);
    super.add(ui.form_alg_neighbor_selection_method);
    super.add(ui.form_alg_neighbor_selection_method_knn_number);
    super.add(ui.form_alg_neighbor_selection_method_radius_number);
    super.add(ui.form_alg_nearby_nodes_selection_method);
    super.add(ui.form_alg_nearby_nodes_selection_method_nearest_number);
    super.add(ui.form_alg_nearby_nodes_selection_method_radius_number);
    super.add(ui.form_alg_rewiring);
    super.add(ui.form_alg_grow_tree_till_path_found);

    super.addHeading(ui.form_alg_open_list);
    super.add(ui.form_alg_fh);
    super.add(ui.form_alg_time_ordering);

    super.addHeading(ui.form_alg_cost_calculation);
    super.add(ui.form_alg_distance_metric);
    super.add(ui.form_alg_g_nb);
    super.add(ui.form_alg_g_weight);
    super.add(ui.form_alg_h_weight);

    super.addHeading(ui.form_alg_costmap);
    super.add(ui.form_alg_costmap_type);
    super.add(ui.form_alg_lethal);
    super.add(ui.form_alg_checkerboard);

    this.dom_ok.addEventListener("click", this.ok.bind(this), false);
    this.dom_cancel.addEventListener("click", this.cancel.bind(this), false);

    this._element_names = [
      "algorithm",
      "preset",
      "node_type",
      "node_connectivity",
      "first_neighbor",
      "next_neighbor",
      "seed",
      "goal_radius",
      "distance_from_coord",
      "sample_size",
      "neighbor_selection_method",
      "rewiring",
      "grow_tree_till_path_found",
      "neighbor_selection_method_knn_number",
      "neighbor_selection_method_radius_number",
      "nearby_nodes_selection_method",
      "nearby_nodes_selection_method_nearest_number",
      "nearby_nodes_selection_method_radius_number",
      "fh",
      "time_ordering",
      "distance_metric",
      "g_nb",
      "g_weight",
      "h_weight",
      "costmap_type",
      "lethal",
      "checkerboard",
    ];

    Object.freeze(this);

    this._change_algorithm(); // required to show / hide elements in the correct order, and assign events
  }

  ok() {
    ui.hideDialog();
    let params = new Algs.Parameters();

    for (const name of ui.form_alg._element_names)
      if (name !== "preset") params[name] = ui[`form_alg_${name}`].value;
    params.validate();

    ui.runMode(params);
  }
  cancel() {
    ui.hideDialog();
  }

  _change_algorithm() {
    const alg = ui.form_alg_algorithm.value;

    const hideElements = function (...names) {
      for (const name of names) ui[`form_alg_${name}`].hide(); // hide() additionally disables the element
    };

    const showElements = function (...names) {
      for (const name of names) ui[`form_alg_${name}`].show(); // show() additionally enables the element
    };

    let default_preset;
    let new_presets = [];

    if (alg === AlgAlgorithm.DFS) {
      new_presets = [
        ["Default (Cell)", AlgPresetDFS.Cell],
        ["Default (Vertex)", AlgPresetDFS.Vertex],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetDFS.Cell;
      hideElements(
        "fh",
        "time_ordering",
        "distance_metric",
        "g_nb",
        "g_weight",
        "h_weight",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      hideElements("open_list", "cost_calculation");
      showElements(
        "node_type",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("graphing", "costmap");
    } else if (alg === AlgAlgorithm.BFS) {
      new_presets = [
        ["Default (Cell)", AlgPresetBFS.Cell],
        ["Default (Vertex)", AlgPresetBFS.Vertex],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetBFS.Cell;
      hideElements(
        "fh",
        "time_ordering",
        "distance_metric",
        "g_nb",
        "g_weight",
        "h_weight",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      hideElements("open_list", "cost_calculation");
      showElements(
        "node_type",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("graphing", "costmap");
    } else if (alg === AlgAlgorithm.GBFS) {
      new_presets = [
        ["Default (Cell)", AlgPresetGBFS.Cell],
        ["Default (Vertex)", AlgPresetGBFS.Vertex],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetGBFS.Cell;
      hideElements(
        "fh",
        "time_ordering",
        "g_nb",
        "g_weight",
        "h_weight",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      hideElements("open_list");
      showElements(
        "node_type",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "distance_metric",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("cost_calculation", "graphing", "costmap");
    } else if (alg === AlgAlgorithm.Dijkstra) {
      new_presets = [
        ["Default (Cell)", AlgPresetDijkstra.Cell],
        ["Default (Vertex)", AlgPresetDijkstra.Vertex],
        ["EE3305", AlgPresetDijkstra.EE3305],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetDijkstra.Cell;
      hideElements(
        "fh",
        "g_weight",
        "h_weight",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      hideElements("open_list");
      showElements(
        "node_type",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "time_ordering",
        "distance_metric",
        "g_nb",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("cost_calculation", "graphing", "costmap");
    } else if (alg === AlgAlgorithm.AStar) {
      new_presets = [
        ["Default (Cell)", AlgPresetAStar.Cell],
        ["Default (Vertex)", AlgPresetAStar.Vertex],
        ["EE3305", AlgPresetAStar.EE3305],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetAStar.Cell;
      hideElements(
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      showElements(
        "node_type",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "fh",
        "time_ordering",
        "distance_metric",
        "g_nb",
        "g_weight",
        "h_weight",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("open_list", "cost_calculation", "graphing", "costmap");
    } else if (alg === AlgAlgorithm.ThetaStar) {
      new_presets = [
        ["Default (Cell)", AlgPresetThetaStar.Cell],
        ["Default (Vertex)", AlgPresetThetaStar.Vertex],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetThetaStar.Cell;
      hideElements(
        "g_nb",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      showElements(
        "node_type",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "fh",
        "time_ordering",
        "distance_metric",
        "g_weight",
        "h_weight",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("open_list", "cost_calculation", "graphing", "costmap");
    } else if (alg === AlgAlgorithm.Anya) {
      new_presets = [
        // ["Default (Cell)", AlgPresetAnya.Cell],
        ["Default (Vertex)", AlgPresetAnya.Vertex],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetAnya.Vertex;
      hideElements(
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "g_nb",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      showElements(
        "node_type",
        "fh",
        "time_ordering",
        "distance_metric",
        "g_weight",
        "h_weight",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("open_list", "cost_calculation", "graphing", "costmap");
    } else if (alg === AlgAlgorithm.RRT) {
      new_presets = [
        ["RRT", AlgPresetRRT.Default],
        ["RRT*", AlgPresetRRT.Star],
        ["RRT (grow until path)", AlgPresetRRT.DefaultGrowUntilPath],
        ["RRT* (grow until path)", AlgPresetRRT.StarGrowUntilPath],


        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetRRT.StarGrowUntilPath;
      hideElements("fh", "g_weight", "h_weight");
      hideElements(
        "open_list",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
      );
      showElements(
        "time_ordering",
        "node_type",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",

        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "distance_metric",
        "g_nb",
        "costmap_type",
        "lethal",
        "checkerboard",
        "grow_tree_till_path_found"
      );
      showElements("cost_calculation", "graphing", "costmap");
      // console.log(a)
    } else if (alg === AlgAlgorithm.PRM) {
      new_presets = [
        ["PRM", AlgPresetPRM.Default],
        ["PRM*", AlgPresetPRM.Star],
        ["PRM (grow until path)", AlgPresetPRM.DefaultGrowUntilPath],
        ["PRM* (grow until path)", AlgPresetPRM.StarGrowUntilPath],

        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetPRM.StarGrowUntilPath;
      hideElements("fh", "g_weight", "h_weight");
      hideElements(
        "open_list",
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "rewiring",
        "goal_radius",
        "distance_from_coord",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",

      );
      showElements(
        "time_ordering",
        "node_type",
        "seed",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",

        "distance_metric",
        "g_nb",
        "costmap_type",
        "lethal",
        "checkerboard",
        "grow_tree_till_path_found"
      );
      showElements("cost_calculation", "graphing", "costmap");
    } // remove some params here
    else if (alg === AlgAlgorithm.R2P) {
      new_presets = [
        ["Default", AlgPresetR2P.Default],
        ["Custom", AlgPresetCustom],
      ];
      default_preset = AlgPresetR2P.Default;
      hideElements(
        "node_connectivity",
        "first_neighbor",
        "next_neighbor",
        "g_nb",
        "seed",
        "goal_radius",
        "distance_from_coord",
        "sample_size",
        "neighbor_selection_method",
        "neighbor_selection_method_knn_number",
        "neighbor_selection_method_radius_number",
        "nearby_nodes_selection_method",
        "nearby_nodes_selection_method_nearest_number",
        "nearby_nodes_selection_method_radius_number",
        "rewiring",
        "grow_tree_till_path_found"
      );
      showElements(
        "node_type",
        "fh",
        "time_ordering",
        "distance_metric",
        "g_weight",
        "h_weight",
        "costmap_type",
        "lethal",
        "checkerboard"
      );
      showElements("open_list", "cost_calculation", "graphing", "costmap");
    } else {
      throw new Error(`Unknown algorithm "${alg}"`);
    }

    // Replace the options for the preset
    ui.form_alg_preset.replaceOptions(new_presets, default_preset);

    ui.form_alg._change_preset();

  }

  _change_preset() {
    const _this = ui.form_alg;

    // remove element events to prevent propagation.
    for (const name of _this._element_names)
      ui[`form_alg_${name}`].dom_input.removeEventListener(
        "change",
        ui.form_alg[`_change_${name}`]
      );

    const preset = ui.form_alg_preset.value;
    const alg = ui.form_alg_algorithm.value;

    if (alg === AlgAlgorithm.DFS) {
      if (preset === AlgPresetDFS.Cell) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
      } else if (preset === AlgPresetDFS.Vertex) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
      } else if (preset === AlgPresetCustom) {
        _this._change_node_type();
        _this._change_node_connectivity();
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }

      // set binary
      ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
      ui.form_alg_costmap_type.disable();
      _this._change_costmap_type();
    } else if (alg === AlgAlgorithm.BFS) {
      if (preset === AlgPresetBFS.Cell) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
      } else if (preset === AlgPresetBFS.Vertex) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
      } else if (preset === AlgPresetCustom) {
        _this._change_node_type();
        _this._change_node_connectivity();
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }

      // set binary
      ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
      ui.form_alg_costmap_type.disable();
      _this._change_costmap_type();
    } else if (alg === AlgAlgorithm.GBFS) {
      if (preset === AlgPresetGBFS.Cell) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_distance_metric.selectValue(Metric.Octile);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
        ui.form_alg_costmap_type.disable();
        _this._change_costmap_type();
      } else if (preset === AlgPresetGBFS.Vertex) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_distance_metric.selectValue(Metric.Octile);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
        ui.form_alg_costmap_type.disable();
        _this._change_costmap_type();
      } else if (preset === AlgPresetCustom) {
        _this._change_node_type();
        _this._change_node_connectivity();
        _this._change_costmap_type();
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }
    } else if (alg === AlgAlgorithm.Dijkstra) {
      if (preset === AlgPresetDijkstra.Cell) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Octile);
        ui.form_alg_g_nb.selectValue(AlgGNb.Average);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
        _this._change_costmap_type();
      } else if (preset === AlgPresetDijkstra.Vertex) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Octile);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
        _this._change_costmap_type();
      } else if (preset === AlgPresetDijkstra.EE3305) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Euclidean);
        ui.form_alg_g_nb.selectValue(AlgGNb.Neighbor);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
        _this._change_costmap_type();
      } else if (preset === AlgPresetCustom) {
        _this._change_node_type();
        _this._change_node_connectivity();
        _this._change_costmap_type();
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }
    } else if (alg === AlgAlgorithm.AStar) {
      if (preset === AlgPresetAStar.Cell) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_fh.selectValue(AlgFH.FOnly);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Octile);
        ui.form_alg_g_weight.change(1);
        ui.form_alg_h_weight.change(1);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
        _this._change_costmap_type();
        ui.form_alg_g_nb.selectValue(AlgGNb.Average);
      } else if (preset === AlgPresetAStar.Vertex) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_fh.selectValue(AlgFH.FOnly);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Octile);
        ui.form_alg_g_weight.change(1);
        ui.form_alg_h_weight.change(1);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
        _this._change_costmap_type();
      } else if (preset === AlgPresetAStar.EE3305) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_fh.selectValue(AlgFH.FOnly);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Euclidean);
        ui.form_alg_g_weight.change(1);
        ui.form_alg_h_weight.change(1);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
        _this._change_costmap_type();
        ui.form_alg_g_nb.selectValue(AlgGNb.Neighbor);
      } else if (preset === AlgPresetCustom) {
        _this._change_node_type();
        _this._change_node_connectivity();
        _this._change_costmap_type();
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }
    } else if (alg === AlgAlgorithm.ThetaStar) {
      if (preset === AlgPresetThetaStar.Cell) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_fh.selectValue(AlgFH.FOnly);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Euclidean);
        ui.form_alg_g_weight.change(1);
        ui.form_alg_h_weight.change(1);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
        _this._change_costmap_type();
      } else if (preset === AlgPresetThetaStar.Vertex) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
        _this._change_node_type();
        ui.form_alg_node_connectivity.selectValue(
          AlgNodeConnectivity.EightConnected
        );
        _this._change_node_connectivity();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_fh.selectValue(AlgFH.FOnly);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(Metric.Euclidean);
        ui.form_alg_g_weight.change(1);
        ui.form_alg_h_weight.change(1);
        ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
        _this._change_costmap_type();
      } else if (preset === AlgPresetCustom) {
        _this._change_node_type();
        _this._change_node_connectivity();
        _this._change_costmap_type();
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }
    } else if (alg === AlgAlgorithm.Anya) {
      // if (preset === AlgPresetAnya.Cell) {
      //   ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
      //   _this._change_node_type();
      //   ui.form_alg_first_neighbor.selectValue(DirIndex.N);
      //   ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
      //   ui.form_alg_fh.selectValue(AlgFH.FOnly);
      //   ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
      //   ui.form_alg_distance_metric.selectValue(Metric.Euclidean);
      //   ui.form_alg_g_weight.change(1);
      //   ui.form_alg_h_weight.change(1);
      // } else
      if (preset === AlgPresetAnya.Vertex) {
        ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
        _this._change_node_type();
        ui.form_alg_node_type.disable();
        ui.form_alg_first_neighbor.selectValue(DirIndex.N);
        ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
        ui.form_alg_fh.selectValue(AlgFH.FOnly);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_distance_metric.selectValue(AlgTimeOrdering.Euclidean);
        ui.form_alg_g_weight.change(1);
        ui.form_alg_h_weight.change(1);
        ui.form_alg_checkerboard.selectValue(AlgCheckerboard.Blocked);
      } else if (preset === AlgPresetCustom) {
        _this._change_node_type();
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }

      // set binary
      ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
      ui.form_alg_costmap_type.disable();
      _this._change_costmap_type();

    } else if (alg === AlgAlgorithm.RRT) {

      ui.form_alg_sample_size.change(100);
      ui.form_alg_nearby_nodes_selection_method.selectValue(
        AlgNearbyNodesSelectionMethod.Nearest
      );
      ui.form_alg_nearby_nodes_selection_method_nearest_number.change(5);
      ui.form_alg_distance_from_coord.change(2);


      if (preset === AlgPresetRRT.Default) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Disable
        );



        ui.form_alg_sample_size.change(100);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Nearest
        );
        ui.form_alg_nearby_nodes_selection_method_nearest_number.change(5);
        ui.form_alg_distance_from_coord.change(2);

        ui.form_alg_seed.change(1);
        ui.form_alg_goal_radius.change(3);
        ui.form_alg_distance_from_coord.change(2);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Radius
        );


        ui.form_alg_nearby_nodes_selection_method_radius_number.change(5);
        ui.form_alg_rewiring.selectValue(AlgRewiringOfTree.Disable);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      }
      else if (preset === AlgPresetRRT.Star) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Disable
        );


        ui.form_alg_sample_size.change(100);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Nearest
        );
        ui.form_alg_nearby_nodes_selection_method_nearest_number.change(5);
        ui.form_alg_distance_from_coord.change(2);


        ui.form_alg_seed.change(1);
        ui.form_alg_goal_radius.change(3);
        ui.form_alg_distance_from_coord.change(2);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Radius
        );
        ui.form_alg_nearby_nodes_selection_method_radius_number.change(5);
        ui.form_alg_rewiring.selectValue(AlgRewiringOfTree.Enable);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      }
      else if (preset === AlgPresetRRT.DefaultGrowUntilPath) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Enable
        );

        ui.form_alg_sample_size.change(100);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Nearest
        );
        ui.form_alg_nearby_nodes_selection_method_nearest_number.change(5);
        ui.form_alg_distance_from_coord.change(2);


        ui.form_alg_seed.change(1);
        ui.form_alg_goal_radius.change(3);
        ui.form_alg_distance_from_coord.change(2);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Radius
        );
        ui.form_alg_nearby_nodes_selection_method_radius_number.change(5);
        ui.form_alg_rewiring.selectValue(AlgRewiringOfTree.Disable);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      }
      else if (preset === AlgPresetRRT.StarGrowUntilPath) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Enable
        );

        ui.form_alg_sample_size.change(100);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Nearest
        );
        ui.form_alg_nearby_nodes_selection_method_nearest_number.change(5);
        ui.form_alg_distance_from_coord.change(2);


        ui.form_alg_seed.change(1);
        ui.form_alg_goal_radius.change(3);
        ui.form_alg_distance_from_coord.change(2);
        ui.form_alg_nearby_nodes_selection_method.selectValue(
          AlgNearbyNodesSelectionMethod.Radius
        );
        ui.form_alg_nearby_nodes_selection_method_radius_number.change(5);
        ui.form_alg_rewiring.selectValue(AlgRewiringOfTree.Enable);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      }
      else if (preset === AlgPresetCustom) {
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }

      ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
      ui.form_alg_time_ordering.disable();
      // set node type
      ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
      ui.form_alg_node_type.disable();

      // set binary
      ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
      ui.form_alg_costmap_type.disable();
      _this._change_costmap_type();

      // set distance metric
      ui.form_alg_distance_metric.selectValue(AlgTimeOrdering.Euclidean);
      ui.form_alg_distance_metric.disable();

      // set checkerboard
      ui.form_alg_checkerboard.selectValue(AlgCheckerboard.Allow);
      ui.form_alg_checkerboard.disable();
    } else if (alg === AlgAlgorithm.PRM) {

      if (preset === AlgPresetPRM.Default) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Disable
        );

        ui.form_alg_sample_size.change(100);


        ui.form_alg_seed.change(1);
        ui.form_alg_neighbor_selection_method.selectValue(
          AlgNeighborSelectionMethod.Radius
        );
        ui.form_alg_neighbor_selection_method_knn_number.change(5);
        ui.form_alg_neighbor_selection_method_radius_number.change(2);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      } else if (preset === AlgPresetPRM.Star) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Disable
        );

        ui.form_alg_sample_size.change(100);


        ui.form_alg_seed.change(1);
        ui.form_alg_neighbor_selection_method.selectValue(
          AlgNeighborSelectionMethod.KNN
        );
        ui.form_alg_neighbor_selection_method_knn_number.change(5);
        ui.form_alg_neighbor_selection_method_radius_number.change(2);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      } else if (preset === AlgPresetPRM.DefaultGrowUntilPath) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Enable
        );

        ui.form_alg_sample_size.change(100);


        ui.form_alg_seed.change(1);
        ui.form_alg_neighbor_selection_method.selectValue(
          AlgNeighborSelectionMethod.Radius
        );
        ui.form_alg_neighbor_selection_method_knn_number.change(5);
        ui.form_alg_neighbor_selection_method_radius_number.change(2);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      }
      else if (preset === AlgPresetPRM.StarGrowUntilPath) {
        ui.form_alg_grow_tree_till_path_found.selectValue(
          AlgGrowTreeTillPathFound.Enable
        );

        ui.form_alg_sample_size.change(100);

        ui.form_alg_seed.change(1);
        ui.form_alg_neighbor_selection_method.selectValue(
          AlgNeighborSelectionMethod.KNN
        );
        ui.form_alg_neighbor_selection_method_knn_number.change(5);
        ui.form_alg_neighbor_selection_method_radius_number.change(2);
        ui.form_alg_g_nb.selectValue(AlgGNb.Min);
      }
      else if (preset === AlgPresetCustom) {
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }
      ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
      ui.form_alg_time_ordering.disable();
      // set node type
      ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
      ui.form_alg_node_type.disable();

      // set binary
      ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
      ui.form_alg_costmap_type.disable();
      _this._change_costmap_type();

      // set distance metric
      ui.form_alg_distance_metric.selectValue(AlgTimeOrdering.Euclidean);
      ui.form_alg_distance_metric.disable();

      // set checkerboard
      ui.form_alg_checkerboard.selectValue(AlgCheckerboard.Allow);
      ui.form_alg_checkerboard.disable();
    } else if (alg === AlgAlgorithm.R2P) {
      if (preset === AlgPresetR2P.Default) {
        ui.form_alg_fh.selectValue(AlgFH.FOnly);
        ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
        ui.form_alg_g_weight.change(1);
        ui.form_alg_h_weight.change(1);
      } else if (preset === AlgPresetCustom) {
      } else {
        throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
      }

      ui.form_alg_fh.disable();
      ui.form_alg_time_ordering.disable();
      ui.form_alg_g_weight.disable();
      ui.form_alg_h_weight.disable();

      // set node type
      ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
      ui.form_alg_node_type.disable();

      // set binary
      ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
      ui.form_alg_costmap_type.disable();
      _this._change_costmap_type();

      // set distance metric
      ui.form_alg_distance_metric.selectValue(AlgTimeOrdering.Euclidean);
      ui.form_alg_distance_metric.disable();

      // set checkerboard
      ui.form_alg_checkerboard.selectValue(AlgCheckerboard.Allow);
      ui.form_alg_checkerboard.disable();
    } else {
      throw new Error(`Unknown algorithm "${alg}"`);
    }

    // add back element events .
    for (const name of _this._element_names)
      ui[`form_alg_${name}`].dom_input.addEventListener(
        "change",
        ui.form_alg[`_change_${name}`]
      );
  }

  _setCustomPreset(e) {
    if (e) {
      // modified from event listener
      e.stopPropagation();
      ui.form_alg_preset.selectValue(AlgPresetCustom);
    }
    // if e is undefined, it is called by another _change function.
  }

  _change_node_type(e) {
    ui.form_alg._setCustomPreset(e);

    const alg = ui.form_alg_algorithm.value;
    if (alg === AlgAlgorithm.DFS || alg === AlgAlgorithm.BFS) return; // is binary cost

    const ele_node = ui.form_alg_node_type;
    let new_options;
    if (ele_node.value === AlgNodeType.Cell) {
      new_options = [
        ["Average", AlgGNb.Average],
        ["Expanded", AlgGNb.Expanded],
        ["Neighbor", AlgGNb.Neighbor],
        ["Min", AlgGNb.Min],
        ["Max", AlgGNb.Max],
      ];
    } else if (ele_node.value == AlgNodeType.Vertex) {
      new_options = [
        ["Average", AlgGNb.Average],
        ["Min", AlgGNb.Min],
        ["Max", AlgGNb.Max],
      ];
    } else {
      throw new Error(`No such option ${ele_node.value}`);
    }

    const ele_g_nb = ui.form_alg_g_nb;
    ele_g_nb.replaceOptions(new_options, AlgGNb.Average);
    ele_g_nb.selectValue(AlgGNb.Average);
  }

  _change_node_connectivity(e) {
    ui.form_alg._setCustomPreset(e);

    const ele_firstnb = ui.form_alg_first_neighbor;
    const ele_connect = ui.form_alg_node_connectivity;

    let new_options, default_option;
    if (ele_connect.value === AlgNodeConnectivity.EightConnected) {
      new_options = [
        ["N", DirIndex.N],
        ["NW", DirIndex.NW],
        ["W", DirIndex.W],
        ["SW", DirIndex.SW],
        ["S", DirIndex.S],
        ["SE", DirIndex.SE],
        ["E", DirIndex.E],
        ["NE", DirIndex.NE],
      ];
      default_option = ele_firstnb.value;
    } else if (ele_connect.value === AlgNodeConnectivity.FourConnected) {
      new_options = [
        ["N", DirIndex.N],
        ["W", DirIndex.W],
        ["S", DirIndex.S],
        ["E", DirIndex.E],
      ];
      default_option = Utils.isCardinal(ele_firstnb.value)
        ? ele_firstnb.value
        : DirIndex.N;
    } else throw new Error(`Invalid option ${ele_connect.value}`);

    ele_firstnb.replaceOptions(new_options, default_option);
  }

  _change_first_neighbor(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_next_neighbor(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_fh(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_time_ordering(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_distance_metric(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_g_nb(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_g_weight(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_h_weight(e) {
    ui.form_alg._setCustomPreset(e);
  }

  _change_costmap_type(e) {
    ui.form_alg._setCustomPreset(e);

    const costmap_type = ui.form_alg_costmap_type.value;
    if (costmap_type === AlgCostmapType.MultiCost) {
      ui.form_alg_lethal.hide();
      ui.form_alg_checkerboard.hide();
      ui.form_alg_g_nb.show();
    } else if (costmap_type === AlgCostmapType.MultiCostWithLethal) {
      ui.form_alg_lethal.show();
      ui.form_alg_checkerboard.show();
      ui.form_alg_g_nb.show();
    } else if (costmap_type === AlgCostmapType.Binary) {
      ui.form_alg_lethal.show();
      ui.form_alg_checkerboard.show();
      ui.form_alg_g_nb.hide();
    } else throw new Error(`Unknown option: ${costmap_type}`);
  }

  _change_lethal(e) {
    ui.form_alg._setCustomPreset(e);
  }
  _change_checkerboard(e) {
    ui.form_alg._setCustomPreset(e);
  }
};
