"use strict";

ui.form_alg_algorithm = new UI.FormElementSelect(
    "Algorithm", "form_alg_algorithm",
    "Choose an algorithm. Every algorithm has a different set of parameters.",
    [
        ["Depth First Search (DFS)", AlgAlgorithm.DFS],
        ["Breadth First Search (BFS/FloodFill)", AlgAlgorithm.BFS],
        ["Greedy Best First Search (GBFS)", AlgAlgorithm.GBFS, AlgAlgorithm.GBFS],
        ["Dijkstra", AlgAlgorithm.Dijkstra],
        ["A*", AlgAlgorithm.AStar, AlgAlgorithm.Astar],
        ["Theta*", AlgAlgorithm.ThetaStar, AlgAlgorithm.ThetaStar],
        ["Anya", AlgAlgorithm.Anya, AlgAlgorithm.Anya],
        ["RRT*", AlgAlgorithm.RRTStar, AlgAlgorithm.RRTStar],
        ["PRM*", AlgAlgorithm.PRMStar, AlgAlgorithm.PRMStar],
    ], AlgAlgorithm.AStar);

ui.form_alg_preset = new UI.FormElementSelect(
    "Preset", "form_alg_preset",
    "Choose a preset. Each algorithm has a different set of presets that changes the values of the parameters below.",
    [
        ["Default", 0],
    ], 0);

ui.form_alg_graphing = new UI.FormHeading("Graphing");

ui.form_alg_node_type = new UI.FormElementSelect(
    "Node Type", "form_alg_node_type",
    "Determines if the search expands grid cells or grid vertices.",
    [
        ["Cell", AlgNodeType.Cell],
        ["Vertex", AlgNodeType.Vertex],
    ], AlgNodeType.Cell);

ui.form_alg_node_connectivity = new UI.FormElementSelect(
    "Node Connectivity", "form_alg_node_connectivity",
    "The maximum number of neighboring nodes a node can be connected to. If <b>4-connected</b>, adjacent nodes that lie in the cardinal (horizontal and vertical, or N, W, S, E) directions can be reached by the current node. If <b>8-connected</b>, adjacent nodes in the diagonal (NW, SW, SE, NE) directions and cardinal directions can be reached.",
    [
        ["4-connected", AlgNodeConnectivity.FourConnected],
        ["8-connected", AlgNodeConnectivity.EightConnected],
    ], AlgNodeConnectivity.EightConnected);

ui.form_alg_first_neighbor = new UI.FormElementSelect(
    "First Neighbor", "form_alg_first_neighbor",
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
    ], DirIndex.N);

ui.form_alg_next_neighbor = new UI.FormElementSelect(
    "Next Neighbor", "form_alg_next_neighbor",
    "The next neighboring node to evaluate after a neighboring node is evaluated.",
    [
        ["Anti-clockwise", AlgNextNeighbor.AntiClockwise],
        ["Clockwise", AlgNextNeighbor.Clockwise],
    ], AlgNextNeighbor.AntiClockwise);

ui.form_alg_open_list = new UI.FormHeading("Open List");

ui.form_alg_fh = new UI.FormElementSelect(
    "Sort by <i>F</i> or <i>F</i>&<i>H</i>", "form_alg_fh",
    "The costs used to sort nodes in the open-list. Select <b>F only</b> to sort only by the <i>f</i>-cost. Select <b>F then H</b> to sort by the <i>f</i>-cost, and subsequently by the <i>h</i>-cost if nodes have the same <i>f</i>-costs.",
    [
        ["F only", AlgFH.FOnly],
        ["F then H", AlgFH.FThenH],
    ], AlgFH.FOnly);

ui.form_alg_time_ordering = new UI.FormElementSelect(
    "Time Ordering", "form_alg_time_ordering",
    "Determines how nodes are sorted in the open-list if there are ties in their costs. Select <b>FIFO</b> to prioritize earlier nodes, or <b>LIFO</b> to prioritize more recent nodes. A prioritized node will be polled from the open-list earlier.",
    [
        ["FIFO", AlgTimeOrdering.FIFO],
        ["LIFO", AlgTimeOrdering.LIFO],
    ], AlgTimeOrdering.FIFO);

ui.form_alg_cost_calculation = new UI.FormHeading("Cost Calculation");

ui.form_alg_distance_metric = new UI.FormElementSelect(
    "Distance Metric", "form_alg_distance_metric",
    "The metric used to evaluate the distance between nodes.",
    [
        ["Chebyshev", Metric.Chebyshev],
        ["Manhattan", Metric.Manhattan],
        ["Octile", Metric.Octile],
        ["Euclidean", Metric.Euclidean],
    ], Metric.Octile, Metric);

ui.form_alg_g_nb = new UI.FormElementSelect(
    "Neighbor <i>G</i>-cost", "form_alg_g_nb",
    "Determines how the <i>g</i>-cost between an expanded node and a neighboring node is calculated. For <i>Cell</i> node types, select <b>Neighbor</b> or <b>Expanded</b> to use the cost of the cell where the respective neighboring or expanded node lies on. For <i>Cell</i> and <i>Vertex</i> node types, select <b>Average</b> to use the average cost of the one or two cell(s) between both nodes, or <b>Max</b> or <b>Min</b> to use the larger or smaller cost respectively.",
    [
        ["Average", AlgGNb.Average],
        ["Expanded", AlgGNb.Expanded],
        ["Neighbor", AlgGNb.Neighbor],
        ["Min", AlgGNb.Min],
        ["Max", AlgGNb.Max],
    ], AlgGNb.Average);

ui.form_alg_g_weight = new UI.FormElementNumber(
    "G weight", "form_alg_g_weight",
    'Determines the weight <i>a</i> of the <i>g</i>-cost when calculating the <i>f</i>-cost, where <i>f</i> = <i>a</i>&middot;<i>g</i> + <i>b</i>&middot;<i>h</i>. If <i>a</i> is close to zero, the algorithm behaves like GBFS.',
    1, -Infinity, Infinity, 0.1, false);


ui.form_alg_h_weight = new UI.FormElementNumber(
    "H weight", "form_alg_h_weight",
    'Determines the weight <i>b</i> of the <i>h</i>-cost when calculating the <i>f</i>-cost, where <i>f</i> = <i>a</i>&middot;<i>g</i> + <i>b</i>&middot;<i>h</i>. If <i>b</i> is close to zero, the algorithm behaves like Dijkstra.',
    1, -Infinity, Infinity, 0.1, false);

ui.form_alg_costmap = new UI.FormHeading("Costmap");

ui.form_alg_costmap_type = new UI.FormElementSelect(
    "Costmap Type", "form_alg_costmap_type",
    "Select <b>Multi-cost</b> to use the costs drawn on the cells. Select <b>Multi-cost with Lethal</b> to use the drawn costs with lethal costs, where drawn costs that are greater than or equal to the lethal cost are not accessible by the path planner. Select <b>Binary-cost</b> to emulate a binary occupancy grid, where drawn costs that are below the lethal cost are treated as 1, and cells with costs exceeding the lethal cost are inaccessible.",
    [
        ["Multi-cost", AlgCostmapType.MultiCost],
        ["Multi-cost with Lethal", AlgCostmapType.MultiCostWithLethal],
        ["Binary-cost", AlgCostmapType.Binary],
    ], AlgCostmapType.MultiCost);

ui.form_alg_lethal = new UI.FormElementNumber(
    "Lethal Cost", "form_alg_lethal",
    "Cells that have costs greater than or equal to the lethal cost are treated as out-of-bounds, and cannot be accessed by the path planner.",
    5, 0, Infinity, 1, false);

ui.form_alg_checkerboard = new UI.FormElementSelect(
    "Checkerboard Cells", "form_alg_checkerboard",
    "Determines if the planner is allowed to pass through the zero-width corner at the center of a checkerboard. A checkerboard is a 2x2 square window of adjacent cells, where a pair of diagonally opposite cells is accessible, and the other pair is inaccessible.",
    [
        ["Allow", AlgCheckerboard.Allow],
        ["Blocked", AlgCheckerboard.Blocked],
    ], AlgCheckerboard.Allow);

UI.FormAlg = class extends UI.AbstractForm {
    /** Array of elements except headers @type {string[]} */
    _element_names;

    constructor() {
        super(
            "Run a Path Planner",
            "Run and visualize a path planner.");

        if (ui.form_alg)
            throw new Error(`ui.form_alg already defined`);
        ui.form_alg = this;

        super.add(ui.form_alg_algorithm);
        super.add(ui.form_alg_preset);

        super.addHeading(ui.form_alg_graphing);
        super.add(ui.form_alg_node_type);
        super.add(ui.form_alg_node_connectivity);
        super.add(ui.form_alg_first_neighbor);
        super.add(ui.form_alg_next_neighbor);

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
            "algorithm", "preset", "node_type", "node_connectivity",
            "first_neighbor", "next_neighbor", "fh",
            "time_ordering", "distance_metric", "g_nb",
            "g_weight", "h_weight", "costmap_type",
            "lethal", "checkerboard"];

        Object.freeze(this);

        this._change_algorithm(); // required to show / hide elements in the correct order, and assign events
    }

    ok() {
        ui.hideDialog();
        let params = new Algs.Parameters();

        for (const name of ui.form_alg._element_names)
            if (name !== "preset")
                params[name] = ui[`form_alg_${name}`].value;
        params.validate();

        ui.runMode(params);
    }
    cancel() { ui.hideDialog(); }

    _change_algorithm() {
        const alg = ui.form_alg_algorithm.value;

        const hideElements = function (...names) {
            for (const name of names)
                ui[`form_alg_${name}`].hide(); // hide() additionally disables the element
        };

        const showElements = function (...names) {
            for (const name of names)
                ui[`form_alg_${name}`].show(); // show() additionally enables the element
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
            hideElements("fh", "time_ordering", "distance_metric", "g_nb", "g_weight", "h_weight");
            hideElements("open_list", "cost_calculation");
            showElements("node_type", "node_connectivity", "first_neighbor", "next_neighbor", "costmap_type", "lethal", "checkerboard");
            showElements("graphing", "costmap");
        }
        else if (alg === AlgAlgorithm.BFS) {
            new_presets = [
                ["Default (Cell)", AlgPresetBFS.Cell],
                ["Default (Vertex)", AlgPresetBFS.Vertex],
                ["Custom", AlgPresetCustom],
            ];
            default_preset = AlgPresetBFS.Cell;
            hideElements("fh", "time_ordering", "distance_metric", "g_nb", "g_weight", "h_weight");
            hideElements("open_list", "cost_calculation");
            showElements("node_type", "node_connectivity", "first_neighbor", "next_neighbor", "costmap_type", "lethal", "checkerboard");
            showElements("graphing", "costmap");
        }
        else if (alg === AlgAlgorithm.GBFS) {
            new_presets = [
                ["Default (Cell)", AlgPresetGBFS.Cell],
                ["Default (Vertex)", AlgPresetGBFS.Vertex],
                ["Custom", AlgPresetCustom],
            ];
            default_preset = AlgPresetGBFS.Cell;
            hideElements("fh", "time_ordering", "g_nb", "g_weight", "h_weight");
            hideElements("open_list");
            showElements("node_type", "node_connectivity", "first_neighbor", "next_neighbor", "distance_metric", "costmap_type", "lethal", "checkerboard");
            showElements("cost_calculation", "graphing", "costmap");
        }
        else if (alg === AlgAlgorithm.Dijkstra) {
            new_presets = [
                ["Default (Cell)", AlgPresetDijkstra.Cell],
                ["Default (Vertex)", AlgPresetDijkstra.Vertex],
                ["Custom", AlgPresetCustom],
            ];
            default_preset = AlgPresetDijkstra.Cell;
            hideElements("fh", "time_ordering", "g_weight", "h_weight");
            hideElements("open_list");
            showElements("node_type", "node_connectivity", "first_neighbor", "next_neighbor", "distance_metric", "g_nb", "costmap_type", "lethal", "checkerboard");
            showElements("cost_calculation", "graphing", "costmap");
        }
        else if (alg === AlgAlgorithm.AStar) {
            new_presets = [
                ["Default (Cell)", AlgPresetAStar.Cell],
                ["Default (Vertex)", AlgPresetAStar.Vertex],
                ["Custom", AlgPresetCustom],
            ];
            default_preset = AlgPresetAStar.Cell;
            showElements("node_type", "node_connectivity", "first_neighbor", "next_neighbor", "fh", "time_ordering", "distance_metric", "g_nb", "g_weight", "h_weight", "costmap_type", "lethal", "checkerboard");
            showElements("open_list", "cost_calculation", "graphing", "costmap");
        }
        else if (alg === AlgAlgorithm.ThetaStar) {
            new_presets = [
                ["Default (Cell)", AlgPresetThetaStar.Cell],
                ["Default (Vertex)", AlgPresetThetaStar.Vertex],
                ["Custom", AlgPresetCustom],
            ];
            default_preset = AlgPresetThetaStar.Cell;
            hideElements("g_nb");
            showElements("node_type", "node_connectivity", "first_neighbor", "next_neighbor", "fh", "time_ordering", "distance_metric", "g_weight", "h_weight", "costmap_type", "lethal", "checkerboard");
            showElements("open_list", "cost_calculation", "graphing", "costmap");
        }
        else if (alg === AlgAlgorithm.Anya) {
            new_presets = [
                ["Default (Cell)", AlgPresetAnya.Cell],
                ["Default (Vertex)", AlgPresetAnya.Vertex],
                ["Custom", AlgPresetCustom],
            ];
            default_preset = AlgPresetAnya.Cell;
            hideElements("node_connectivity", "first_neighbor", "next_neighbor", "g_nb");
            showElements("node_type", "fh", "time_ordering", "distance_metric", "g_weight", "h_weight", "costmap_type", "lethal", "checkerboard");
            showElements("open_list", "cost_calculation", "graphing", "costmap");
        }
        else if (alg === AlgAlgorithm.RRTStar) {
        }
        else if (alg === AlgAlgorithm.PRMStar) {
        }
        else {
            throw new Error(`Unknown algorithm "${alg}"`);
        }

        // Replace the options for the preset 
        ui.form_alg_preset.replaceOptions(
            new_presets, default_preset);

        ui.form_alg._change_preset();
    }

    _change_preset() {
        const _this = ui.form_alg;

        // remove element events to prevent propagation.
        for (const name of _this._element_names)
            ui[`form_alg_${name}`].dom_input.removeEventListener(
                "change", ui.form_alg[`_change_${name}`]);

        const preset = ui.form_alg_preset.value;
        const alg = ui.form_alg_algorithm.value;

        if (alg === AlgAlgorithm.DFS) {
            if (preset === AlgPresetDFS.Cell) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
                _this._change_node_connectivity();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
            } else if (preset === AlgPresetDFS.Vertex) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
                _this._change_node_connectivity();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
            }
            else if (preset === AlgPresetCustom) {
                _this._change_node_type();
                _this._change_node_connectivity();
            }
            else {
                throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
            }

            // set binary
            ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
            ui.form_alg_costmap_type.disable();
            _this._change_costmap_type();
        }
        else if (alg === AlgAlgorithm.BFS) {
            if (preset === AlgPresetBFS.Cell) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
                _this._change_node_connectivity();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
            } else if (preset === AlgPresetBFS.Vertex) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
                _this._change_node_connectivity();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
            }
            else if (preset === AlgPresetCustom) {
                _this._change_node_type();
                _this._change_node_connectivity();
            }
            else {
                throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
            }

            // set binary
            ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
            ui.form_alg_costmap_type.disable();
            _this._change_costmap_type();
        }
        else if (alg === AlgAlgorithm.GBFS) {
            if (preset === AlgPresetGBFS.Cell) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
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
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
                _this._change_node_connectivity();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
                ui.form_alg_distance_metric.selectValue(Metric.Octile);
                ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
                ui.form_alg_costmap_type.disable();
                _this._change_costmap_type();
            }
            else if (preset === AlgPresetCustom) {
                _this._change_node_type();
                _this._change_node_connectivity();
                _this._change_costmap_type();
            }
            else {
                throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
            }
        }
        else if (alg === AlgAlgorithm.Dijkstra) {
            if (preset === AlgPresetDijkstra.Cell) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
                _this._change_node_connectivity();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
                ui.form_alg_distance_metric.selectValue(Metric.Octile);
                ui.form_alg_g_nb.selectValue(AlgGNb.Average);
                ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
                _this._change_costmap_type();
            } else if (preset === AlgPresetDijkstra.Vertex) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
                _this._change_node_connectivity();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
                ui.form_alg_distance_metric.selectValue(Metric.Octile);
                ui.form_alg_g_nb.selectValue(AlgGNb.Average);
                ui.form_alg_costmap_type.selectValue(AlgCostmapType.MultiCost);
                _this._change_costmap_type();
            }
            else if (preset === AlgPresetCustom) {
                _this._change_node_type();
                _this._change_node_connectivity();
                _this._change_costmap_type();
            }
            else {
                throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
            }
        }
        else if (alg === AlgAlgorithm.AStar) {
            if (preset === AlgPresetAStar.Cell) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
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
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
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
            }
            else if (preset === AlgPresetCustom) {
                _this._change_node_type();
                _this._change_node_connectivity();
                _this._change_costmap_type();
            }
            else {
                throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
            }
        }
        else if (alg === AlgAlgorithm.ThetaStar) {
            if (preset === AlgPresetAStar.Cell) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
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
            } else if (preset === AlgPresetAStar.Vertex) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
                _this._change_node_type();
                ui.form_alg_node_connectivity.selectValue(AlgNodeConnectivity.EightConnected);
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
            }
            else if (preset === AlgPresetCustom) {
                _this._change_node_type();
                _this._change_node_connectivity();
                _this._change_costmap_type();
            }
            else {
                throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
            }

        }
        else if (alg === AlgAlgorithm.Anya) {
            if (preset === AlgPresetAnya.Cell) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Cell);
                _this._change_node_type();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
                ui.form_alg_fh.selectValue(AlgFH.FOnly);
                ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
                ui.form_alg_distance_metric.selectValue(Metric.Euclidean);
                ui.form_alg_g_weight.change(1);
                ui.form_alg_h_weight.change(1);
            } else if (preset === AlgPresetAnya.Vertex) {
                ui.form_alg_node_type.selectValue(AlgNodeType.Vertex);
                _this._change_node_type();
                ui.form_alg_first_neighbor.selectValue(DirIndex.N);
                ui.form_alg_next_neighbor.selectValue(AlgNextNeighbor.AntiClockwise);
                ui.form_alg_fh.selectValue(AlgFH.FOnly);
                ui.form_alg_time_ordering.selectValue(AlgTimeOrdering.FIFO);
                ui.form_alg_distance_metric.selectValue(AlgTimeOrdering.Euclidean);
                ui.form_alg_g_weight.change(1);
                ui.form_alg_h_weight.change(1);
            }
            else if (preset === AlgPresetCustom) {
                _this._change_node_type();
            }
            else {
                throw new Error(`Unknown preset "${preset}" for algorithm "${alg}"`);
            }

            // set binary
            ui.form_alg_costmap_type.selectValue(AlgCostmapType.Binary);
            ui.form_alg_costmap_type.disable();
            _this._change_costmap_type();
        }
        else if (alg === AlgAlgorithm.RRTStar) {

        }
        else if (alg === AlgAlgorithm.PRMStar) {

        }
        else {
            throw new Error(`Unknown algorithm "${alg}"`);
        }

        // add back element events .
        for (const name of _this._element_names)
            ui[`form_alg_${name}`].dom_input.addEventListener(
                "change", ui.form_alg[`_change_${name}`]);
    }

    _setCustomPreset(e) {
        if (e) {// modified from event listener
            e.stopPropagation();
            ui.form_alg_preset.selectValue(AlgPresetCustom);
        }
        // if e is undefined, it is called by another _change function.
    }

    _change_node_type(e) {
        ui.form_alg._setCustomPreset(e);

        const alg = ui.form_alg_algorithm.value;
        if (alg === AlgAlgorithm.DFS || alg === AlgAlgorithm.BFS)
            return; // is binary cost

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
        }
        else if (ele_node.value == AlgNodeType.Vertex) {
            new_options = [
                ["Average", AlgGNb.Average],
                ["Min", AlgGNb.Min],
                ["Max", AlgGNb.Max],
            ];
        }
        else {
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
        }
        else if (ele_connect.value === AlgNodeConnectivity.FourConnected) {
            new_options = [
                ["N", DirIndex.N],
                ["W", DirIndex.W],
                ["S", DirIndex.S],
                ["E", DirIndex.E],
            ];
            default_option = Utils.isCardinal(ele_firstnb.value) ?
                ele_firstnb.value : DirIndex.N;
        }
        else
            throw new Error(`Invalid option ${ele_connect.value}`);

        ele_firstnb.replaceOptions(new_options, default_option);
    }

    _change_first_neighbor(e) { ui.form_alg._setCustomPreset(e); }
    _change_next_neighbor(e) { ui.form_alg._setCustomPreset(e); }
    _change_fh(e) { ui.form_alg._setCustomPreset(e); }
    _change_time_ordering(e) { ui.form_alg._setCustomPreset(e); }
    _change_distance_metric(e) { ui.form_alg._setCustomPreset(e); }
    _change_g_nb(e) { ui.form_alg._setCustomPreset(e); }
    _change_g_weight(e) { ui.form_alg._setCustomPreset(e); }
    _change_h_weight(e) { ui.form_alg._setCustomPreset(e); }

    _change_costmap_type(e) {
        ui.form_alg._setCustomPreset(e);

        const costmap_type = ui.form_alg_costmap_type.value;
        if (costmap_type === AlgCostmapType.MultiCost) {
            ui.form_alg_lethal.hide();
            ui.form_alg_checkerboard.hide();
            ui.form_alg_g_nb.show();
        }
        else if (costmap_type === AlgCostmapType.MultiCostWithLethal) {
            ui.form_alg_lethal.show();
            ui.form_alg_checkerboard.show();
            ui.form_alg_g_nb.show();
        }
        else if (costmap_type === AlgCostmapType.Binary) {
            ui.form_alg_lethal.show();
            ui.form_alg_checkerboard.show();
            ui.form_alg_g_nb.hide();
        }
        else
            throw new Error(`Unknown option: ${costmap_type}`);

    }

    _change_lethal(e) { ui.form_alg._setCustomPreset(e); }
    _change_checkerboard(e) { ui.form_alg._setCustomPreset(e); }
};
Object.seal(UI.FormAlg);