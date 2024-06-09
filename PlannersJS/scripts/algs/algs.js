"use strict";
Algs.AbstractNode = class {
    coord;
    /** Algorithm specific costs */
    costs;
    /** Parent node */
    parent;
    sprite;

    constructor(coord, num_costs, sprite) {
        this.coord = coord;
        this.parent = null;
        this.costs = Array(num_costs).fill(Infinity);
        this.sprite = sprite;

        Object.freeze(this.id);
        Object.freeze(this.coord);
        Object.freeze(this.sprite);
        Object.seal(this.costs);
    }
};

Algs.AbstractPriorityQueueNode = class extends Algs.AbstractNode {
    pq_sprite;
    pq_next;
    pq_prev;
    queued;

    constructor(coord, num_costs, sprite, pq_sprite) {
        super(coord, num_costs, sprite)
        this.pq_sprite = pq_sprite;
        this.pq_next = null;
        this.pq_prev = null;
        this.queued = false;
        Object.freeze(this.pq_sprite);
    }
}


Algs.AbstractQueueNode = class extends Algs.AbstractNode {
    queued;

    constructor(coord, num_costs, sprite) {
        super(coord, num_costs, sprite)
        this.queued = false;
    }
};
Algs.AbstractStackNode = class extends Algs.AbstractNode {
    queued;

    constructor(coord, num_costs, sprite) {
        super(coord, num_costs, sprite)
        this.queued = false;
    }
};


Algs.AbstractAlg = class {
    params;
    #canvases;
    #lenses;
    default_lens_idx;
    rank_names;
    num_ranks;
    default_rank;
    #cells;

    get num_canvases() { this.#canvases.length; }
    get num_lenses() { this.#lenses.length; }

    /**  Constructs an abstract path planner.
     * @param {Algs.Params} params key, value pair of parameters.
     * */
    constructor(rank_names, default_rank, params) {
        this.#setRanks(rank_names, default_rank);
        this.#setParams(params);
    }

    /**
     * @yields {UI.AbstractCanvas}
     */
    *canvases() {
        for (const canvas of this.#canvases)
            yield canvas;
    }

    /** @returns {UI.AbstractCanvas} */
    canvas(idx) { return this.#canvases[idx]; }

    /**
     * @yields {UI.AbstractLens}
     */
    *lenses() {
        for (const lens of this.#lenses)
            yield lens;
    }

    /** @returns {UI.AbstractLens} */
    lens(idx) { return this.#lenses[idx]; }

    /** Returns the cost at the *cell* coordinate.
     * @param {[number, number]} cell_coord A pair of non-negative integers describing the *cell* coordinates.
     * @returns {number} the cost of the cell at the *cell* coordinate, or NaN if the cell does not exist.
    */
    cost(cell_coord) {
        const cell = ui.cells.at(cell_coord);
        if (!cell)
            return NaN;
        else
            return cell.cost;
    }

    setCanvases(canvases) {
        if (Array.isArray(canvases) === false)
            throw new TypeError(`"canvases" must be an array of UI.AbstractCanvas`)
        for (const canvas of canvases)
            if (!(canvas instanceof UI.AbstractCanvas))
                throw new Error(`"canvas" is not UI.AbstractCanvas!`);
        this.#canvases = canvases;
        Object.freeze(this.#canvases);
    }

    /**
     * 
     * @param {Array<UI.AbstractLens>} lenses Array of lenses
     * @param {number} default_lens_idx The default lens is given by lenses[default_lens_idx].
     */
    setLenses(lenses, default_lens_idx) {
        if (Array.isArray(lenses) === false)
            throw new TypeError(`"lenses" must be an array of UI.AbstractLens`)
        if (!Utils.isFiniteNonNegativeInteger(default_lens_idx) || default_lens_idx > lenses.length)
            throw new RangeError(`"default_lens_idx" must be >= 0 and shorter than the length of "lenses"`);
        let num_lens_none = 0;
        for (const lens of lenses) {
            if (lens instanceof UI.AbstractLens === false)
                throw new TypeError(`"lenses" must be an array of UI.AbstractLens`)
            if (lens instanceof UI.LensNone)
                ++num_lens_none;
        }
        if (num_lens_none !== 1) {
            throw new Error(`There must be exactly one UI.LensNone in lenses`);
        }

        this.#lenses = lenses;
        this.default_lens_idx = default_lens_idx;
        Object.freeze(this.#lenses);
        Object.freeze(this.default_lens_idx);
    }

    // used only once
    #setParams(params) {
        if (!(params instanceof Algs.Parameters))
            throw new TypeError(`params is not an Algs.Parameters type`);
        this.params = params;
        Object.freeze(this.params);
    }

    #setRanks(rank_names, default_rank) {
        if (!Array.isArray(rank_names))
            throw new TypeError(`"rank_names" has to be an array of strings`);
        if (!Utils.isFiniteNonNegativeInteger(default_rank) || default_rank >= rank_names.length)
            throw new RangeError(`"default_rank" must be between 0 and 1 minus the length of "rank_names" inclusive.`)
        for (const rank_name of rank_names)
            if (typeof rank_name !== "string")
                throw new TypeError(`option_text has to be a string`);

        this.rank_names = rank_names;
        this.default_rank = default_rank;
        this.num_ranks = this.rank_names.length;

        Object.freeze(this.rank_names);
        Object.freeze(this.default_rank);
        Object.freeze(this.num_ranks);
    }
};

Algs.GridAlgNeighbor = class {

    /** Directional index of adjacent node/cell. Readonly. */
    didx;
    /** Sign directional vector of  adjacent node/cell. Readonly. */
    dir;
    /** true if adjacent node/cell is in cardinal direction, false if diagonal. Readonly. */
    is_cardinal;
    /** The metric distance to the *adjacent* node/cell. Readonly. */
    metric_length;
    /** The sign direction of an adjacent cell, if the nodes are vertices. Readonly. */
    adj_cell_dir;
    /** true if the adjacent node/cell is in map, false otherwise. */
    in_map;
    /** true if the cell cost exceeds the lethal cost */
    cell_lethal;
    /** true if the adjacent diagonal node is diagonally (checkerboard) blocked, false otherwise. */
    node_chblocked;
    /** true if cell is accessible, false otherwise */
    cell_access;
    /** true if node is accessible, false otherwise */
    node_access;
    /** Cost of the adjacent cell. Will be NaN if out of map. */
    cell_cost;
    /** G cost to get to the adjacent node. Will be NaN if inaccessible (out of map/blocked).  */
    node_rel_g;

    constructor(didx, metric_function) {
        this.didx = didx;
        this.dir = Utils.dirIndexToDir(didx);
        this.is_cardinal = Utils.isCardinal(didx);
        this.metric_length = metric_function == null ?1:metric_function(this.dir);
        this.adj_cell_dir = Utils.adjCellFromVertex([0, 0], this.dir);
        this.in_map = null;
        this.cell_lethal = null;
        this.node_chblocked = null;
        this.cell_access = null;
        this.node_access = null;
        this.cell_cost = NaN;
        this.node_rel_g = NaN;

        Object.freeze(this.didx);
        Object.freeze(this.dir);
        Object.freeze(this.is_cardinal);
        Object.freeze(this.metric_length);
        Object.freeze(this.adj_cell_dir);
    }
};

Algs.AbstractGridAlg = class extends Algs.AbstractAlg {
    #dind_order;
    #neighbors;
    #lethal;
    metric;
    #checkerboard
    serialize;
    coord_start;
    coord_goal;
    inMap;

    constructor(rank_names, default_rank, params) {
        super(rank_names, default_rank, params);

        // Initialize Serializer
        if (this.params.node_type === AlgNodeType.Cell)
            this.serialize = ui.serializeCell;
        else if (this.params.node_type === AlgNodeType.Vertex)
            this.serialize = ui.serializeVertex;
        Object.freeze(this.serialize);

        // Initalize InMap
        if (this.params.node_type === AlgNodeType.Cell)
            this.inMap = ui.inMapCell;
        else if (this.params.node_type === AlgNodeType.Vertex)
            this.inMap = ui.inMapVertex;
        Object.freeze(this.inMap);

        // set Start and Goal
        this.#setStart(ui_states.start);
        this.#setGoal(ui_states.goal);

        // Initialize #checkerboard
        if (this.params.checkerboard === AlgCheckerboard.Allow)
            this.#checkerboard = false;
        else if (this.params.checkerboard === AlgCheckerboard.Blocked)
            this.#checkerboard = true;
        else if (this.params.checkerboard === null)
            this.#checkerboard = null;

        // Initialize metric
        if (this.params.distance_metric === Metric.Chebyshev)
            this.metric = Utils.chebyshev;
        else if (this.params.distance_metric === Metric.Euclidean)
            this.metric = Utils.euclidean;
        else if (this.params.distance_metric === Metric.Manhattan)
            this.metric = Utils.manhattan;
        else if (this.params.distance_metric === Metric.Octile)
            this.metric = Utils.octile;
        else if (this.params.distance_metric === null)
            this.metric = null;

        // Initialize this.#dind_order
        this.#dind_order = [];
        if (this.params.node_connectivity === AlgNodeConnectivity.EightConnected)
            this.#dind_order = [...Utils.dirIndexRange(this.params.first_neighbor, 1)];
        else if (this.params.node_connectivity === AlgNodeConnectivity.FourConnected)
            this.#dind_order = [...Utils.dirIndexRange(this.params.first_neighbor, 2)];
        // else if (this.params.node_connectivity === null)
        //     this.#dind_order = [];

        // Initialise neighbors (LUT)
        this.#neighbors = Array(DirIndex.length);
        for (const didx of Utils.dirIndexRange())
            this.#neighbors[didx] = new Algs.GridAlgNeighbor(didx, this.metric);

        // Initialize #gNb
        if (this.params.g_nb === AlgGNb.Average)
            this.#gNb = this.#gAverage.bind(this);
        else if (this.params.g_nb === AlgGNb.Expanded)
            this.#gNb = this.#gExpanded.bind(this);
        else if (this.params.g_nb === AlgGNb.Neighbor)
            this.#gNb = this.#gNeighbor.bind(this);
        else if (this.params.g_nb === AlgGNb.Min)
            this.#gNb = this.#gMin.bind(this);
        else if (this.params.g_nb === AlgGNb.Max)
            this.#gNb = this.#gMax.bind(this);
        else if (this.params.g_nb === null)
            this.#gNb = this.#gUnity.bind(this);

        const has_lethal = this.params.costmap_type === AlgCostmapType.Binary ||
            this.params.costmap_type === AlgCostmapType.MultiCostWithLethal;
        // assign #nbCellInfo
        if (has_lethal) {
            this.#lethal = params.lethal;
            this.#nbCellInfo = this.#nbCellInfoL.bind(this);
        } else
            this.#nbCellInfo = this.#nbCellInfoN.bind(this);
        if (this.params.node_type === AlgNodeType.Cell)
            this.#nbCellInfos = this.#nbCellInfosC.bind(this);
        else if (this.params.node_type === AlgNodeType.Vertex)
            this.#nbCellInfos = this.#nbCellInfosV.bind(this);

        // assign #nbNodeInfos
        if (this.params.node_type === AlgNodeType.Cell) {
            this.#nbNodeInfoC = has_lethal ? this.#nbNodeInfoCL.bind(this) : this.#nbNodeInfoCN.bind(this);
            this.#nbNodeInfos = this.#nbNodeInfosC.bind(this);
        }
        else if (this.params.node_type === AlgNodeType.Vertex) {
            this.#nbNodeInfoV = has_lethal ? this.#nbNodeInfoVL.bind(this) : this.#nbNodeInfoVN.bind(this);
            this.#nbNodeInfos = this.#nbNodeInfosV.bind(this);
        }
    };

    /** Used only once */
    #setStart(coord_start) {
        if (this.params.node_type === AlgNodeType.Cell)
            coord_start = [Math.floor(coord_start[0]), Math.floor(coord_start[1])];
        else if (this.params.node_type === AlgNodeType.Vertex)
            coord_start = [Math.round(coord_start[0]), Math.round(coord_start[1])];
        else throw new RangeError(`params.node_type is not "Cell" or "Vertex"`);
        if (!this.inMap(coord_start))
            throw new RangeError(`coord_start is not in the map. coord_start="${coord_start}"`);
        this.coord_start = coord_start;
        Object.freeze(this.coord_start);
    }

    /** Used only once */
    #setGoal(coord_goal) {
        if (this.params.node_type === AlgNodeType.Cell)
            coord_goal = [Math.floor(coord_goal[0]), Math.floor(coord_goal[1])];
        else if (this.params.node_type === AlgNodeType.Vertex)
            coord_goal = [Math.round(coord_goal[0]), Math.round(coord_goal[1])];
        else throw new RangeError(`params.node_type is not "Cell" or "Vertex"`);
        if (!this.inMap(coord_goal))
            throw new RangeError(`coord_goal is not in the map. coord_goal="${coord_goal}"`);
        this.coord_goal = coord_goal;
        Object.freeze(this.coord_goal);
    }

    #FLAndFRNeighbors(neighbor) {
        const didx_aw = Utils.addDirIndex(neighbor.didx, 1);
        const didx_cw = Utils.addDirIndex(neighbor.didx, -1);
        return [this.#neighbors[didx_aw], this.#neighbors[didx_cw]];
    }
    #BLAndBRNeighbors(neighbor) {
        const didx_aw = Utils.addDirIndex(neighbor.didx, 3);
        const didx_cw = Utils.addDirIndex(neighbor.didx, -3);
        return [this.#neighbors[didx_aw], this.#neighbors[didx_cw]];
    }
    #LAndRNeighbors(neighbor) {
        const didx_aw = Utils.addDirIndex(neighbor.didx, 2);
        const didx_cw = Utils.addDirIndex(neighbor.didx, -2);
        return [this.#neighbors[didx_aw], this.#neighbors[didx_cw]];
    }

    /** The method of calculating cost for neighboring cells. Requires further processing. */
    #gNb;

    #gAverage(cost1, cost2, metric_length) {
        return (cost1 + cost2) * metric_length / 2;
    }

    #gExpanded(expanded_cell_cost, _unused1, metric_length) {
        return expanded_cell_cost * metric_length;
    }

    #gNeighbor(_unused1, nb_cell_cost, metric_length) {
        return nb_cell_cost * metric_length;
    }

    #gMin(cost1, cost2, metric_length) {
        return (cost1 < cost2 ? cost1 : cost2) * metric_length;
    }

    #gMax(cost1, cost2, metric_length) {
        return (cost1 > cost2 ? cost1 : cost2) * metric_length;
    }

    #gUnity(_unused1, _unused2, metric_length) {
        return metric_length;
    }

    #nbCellInfo;

    #nbCellInfoL(neighbor_cell_coord, neighbor) {
        neighbor.cell_cost = super.cost(neighbor_cell_coord);
        if (neighbor.in_map === true) {
            neighbor.cell_lethal = neighbor.cell_cost >= this.#lethal;
        }
        neighbor.cell_access = neighbor.in_map && !neighbor.cell_lethal;
    }

    #nbCellInfoN(neighbor_cell_coord, neighbor) {
        neighbor.cell_cost = super.cost(neighbor_cell_coord);
        neighbor.cell_access = neighbor.in_map;
    }

    /** Finds the status of neighboring cells, and checks if the adjacent cell/node is out of map */
    #nbCellInfos;

    #nbCellInfosC(exp_node) {
        for (const neighbor of this.#neighbors) {
            const neighbor_cell_coord = Utils.addCoords(exp_node.coord, neighbor.dir);
            neighbor.in_map = this.inMap(neighbor_cell_coord);
            this.#nbCellInfo(neighbor_cell_coord, neighbor);
        }
    }

    #nbCellInfosV(exp_node) {
        for (const neighbor of this.#neighbors) {
            const neighbor_vertex_coord = Utils.addCoords(exp_node.coord, neighbor.dir);
            neighbor.in_map = this.inMap(neighbor_vertex_coord);
            if (!neighbor.is_cardinal) {
                const neighbor_cell_coord = Utils.addCoords(exp_node.coord, neighbor.adj_cell_dir);
                this.#nbCellInfo(neighbor_cell_coord, neighbor);
            }
        }
    }

    /** Evaluates the accessibility of adjacent nodes. 
     * If accessible, the corresponding neighbor.node_access is true, and the cost to get to the adjacent node from the expanded node is evaluated in neighbor.node_rel_g. 
     * If inaccessible, the corresponding neighbor.node_access is false, and the neighbor.node_rel_g is NaN.*/
    #nbNodeInfos;

    #nbNodeInfosC(exp_node) {
        // if 4-connected / 8-connected, there will be four / eight indices respectively in this.#dind_order.
        for (const didx of this.#dind_order) {
            const neighbor = this.#neighbors[didx];
            this.#nbNodeInfoC(neighbor, exp_node);
        }
    }

    #nbNodeInfoC;

    #nbNodeInfoCL(neighbor, exp_node) {
        // neighbor node is not accessible if cell is not accessible.
        neighbor.node_chblocked = null;
        neighbor.node_access = null;
        neighbor.node_rel_g = NaN;

        if (neighbor.cell_access === false) {
            neighbor.node_access = false;
            neighbor.node_rel_g = NaN;
            return;
        }

        // check if node is checkerboard blocked.
        if (this.#checkerboard === true) {
            if (neighbor.is_cardinal === false) {
                const [nb_fl, nb_fr] = this.#FLAndFRNeighbors(neighbor);
                neighbor.node_chblocked = nb_fl.cell_access === false && nb_fr.cell_access === false;
            }
            else
                neighbor.node_chblocked = false;
            // get node accessibility.
            neighbor.node_access = !neighbor.node_chblocked;
        }
        else {
            neighbor.node_access = true;
        }

        // calculate cost if node is accessible.
        if (neighbor.node_access === true)
            neighbor.node_rel_g = this.#gNb(
                super.cost(exp_node.coord),
                neighbor.cell_cost,
                neighbor.metric_length);
        else
            neighbor.node_rel_g = NaN;
    }

    #nbNodeInfoCN(neighbor, exp_node) {
        neighbor.node_access = neighbor.cell_access;
        // calculate cost if node is accessible.
        if (neighbor.node_access === true)
            neighbor.node_rel_g = this.#gNb(
                super.cost(exp_node.coord),
                neighbor.cell_cost,
                neighbor.metric_length);
        else
            neighbor.node_rel_g = NaN;
    }


    #nbNodeInfosV(exp_node) {
        // if 4-connected / 8-connected, there will be four / eight indices respectively in this.#dind_order.
        for (const didx of this.#dind_order) {
            const neighbor = this.#neighbors[didx];
            this.#nbNodeInfoV(neighbor, exp_node);
        }
    }

    #nbNodeInfoV;

    #nbNodeInfoVN(neighbor, exp_node) {
        if (neighbor.in_map === true) {
            neighbor.node_access = true;

            let cost1, cost2;
            if (neighbor.is_cardinal) {
                const [nb_fl, nb_fr] = this.#FLAndFRNeighbors(neighbor); // at least one adj cell is in map for this nb node to be in map.
                cost1 = nb_fl.in_map ? nb_fl.cell_cost : nb_fr.cell_cost;
                cost2 = nb_fr.in_map ? nb_fr.cell_cost : nb_fl.cell_cost;
            }
            else {
                cost1 = neighbor.cell_cost;
                cost2 = cost1;
            }
            neighbor.node_rel_g = this.#gNb(cost1, cost2, neighbor.metric_length);
        }
        else // neighbor not in map
        {
            neighbor.node_access = false;
            neighbor.node_rel_g = NaN;
        }
    }

    #nbNodeInfoVL(neighbor, exp_node) {
        neighbor.node_chblocked = null;
        neighbor.node_access = null;
        neighbor.node_rel_g = NaN;

        if (neighbor.in_map === true) {
            let cost1, cost2;

            if (neighbor.is_cardinal) {
                const [nb_fl, nb_fr] = this.#FLAndFRNeighbors(neighbor); // at least one adj cell is in map for this nb node to be in map.
                neighbor.node_access = nb_fl.cell_access || nb_fr.cell_access;

                if (neighbor.node_access === true) {   // front is not blocked

                    if (this.#checkerboard === true) { // check checkerboard

                        if (exp_node.parent === null) { // start node, allow checkerboard access.
                            neighbor.node_chblocked = false;
                        }
                        else { // check for checkerboard acceess
                            const parent_dir = Utils.subtractCoords(exp_node.parent.coord, exp_node.coord);

                            const [nb_bl, nb_br] = this.#BLAndBRNeighbors(neighbor);

                            neighbor.node_chblocked = (!nb_fl.cell_access && !nb_br.cell_access && Utils.dotCoords(parent_dir, nb_fr.dir) < 0)
                                || (!nb_bl.cell_access && !nb_fr.cell_access && Utils.dotCoords(parent_dir, nb_fl.dir) < 0);

                            neighbor.node_access = !neighbor.node_chblocked;
                            if (!neighbor.node_access) { // if no checkerboard access, no need to calculate cost
                                return;
                            }
                        }
                    } // if checkerboard

                    // calculate g cost for accessible checkerboard corners, or if not blocked
                    cost1 = nb_fl.in_map ? nb_fl.cell_cost : nb_fr.cell_cost;
                    cost2 = nb_fr.in_map ? nb_fr.cell_cost : nb_fl.cell_cost;
                }
                else // node is blocked by cells.
                    return;
            }
            else { // not cardinal
                neighbor.node_access = neighbor.cell_access;

                if (neighbor.node_access === true) { // front is not blocked

                    if (this.#checkerboard === true) { // check for checkerboard

                        if (exp_node.parent === null) { // start node has no parent, allow checkerboard access
                            neighbor.node_chblocked = false;
                        }
                        else { // not a start node, check for checkerboard access
                            const parent_dir = Utils.subtractCoords(exp_node.parent.coord, exp_node.coord);
                            const [nb_l, nb_r] = this.#LAndRNeighbors(neighbor);
                            neighbor.node_chblocked = (!nb_l.cell_access && !nb_r.cell_access && Utils.dotCoords(parent_dir, neighbor.dir) < 0);

                            neighbor.node_access = !neighbor.node_chblocked;
                            if (!neighbor.node_access) {
                                return;  // blocked
                            }
                        }
                    }

                    cost1 = neighbor.cell_cost;
                    cost2 = cost1;
                }
                else // node is blocked by cells.
                    return;
            }
            neighbor.node_rel_g = this.#gNb(cost1, cost2, neighbor.metric_length);
        }
        else { // neighbor not in map
            neighbor.node_access = false;
        }

    };

    /** 
     * A generator that returns adjacent nodes of the expanded node by considering the algorithm's parameters.
     * Before returning, the accessibility of the adjacent nodes are evaluated and the cost to get to the adjacent nodes from the expanded node are calculated.
     * @param {Algs.AbstractNode} exp_node The expanded node.
     * @returns {Algs.GridAlgNeighbor} the adjacent nodes in the order specified by the parameters.*/
    getNb = function* (exp_node) {
        this.#nbCellInfos(exp_node);
        this.#nbNodeInfos(exp_node);
        for (const didx of this.#dind_order)
            yield this.#neighbors[didx];
    };
};