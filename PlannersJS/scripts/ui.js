"use strict";

/** globals affected by user input. */
const ui_states = {
    /** True if the dialog is currently being shown, false if the dialog is hidden. @type{boolean} */
    dialog: false,
    /** True for drawing mode, false for running mode. @type {boolean} */
    draw_mode: true,
    /** Current draw cost. @type{number} */
    draw_cost: 10,
    /** Costs smaller than or equal to this value is colored black @type {number} */
    visual_min_cost: 0,
    /** Costs larger than or equal to this value is colored black @type {number} */
    visual_max_cost: 10,
    /** Cost increment for the tool_cost @type {number} */
    draw_step: 1,
    /** @type {[number, number]} */
    goal: [2.5, 17.5],
    /** @type {[number, number]} */
    start: [27.5, 2.5],
    /** Number of cells. To get number of vertices, add one to x and y. @type {[number, number]} */
    size: [30, 20],
    /** @type {number} */
    rank: 0,
    /** @type {number} */
    changing_start: false,
    changing_goal: false,
    changing_draw_cost: false,
    changing_rank: false,
    changing_lens: false,
    /** @type {UI.AbstractAlg} */
    alg: null,
};
Object.seal(ui_states);

/** globals not affected by user input, but can be adjusted by the developers. */
const ui_params = {
    /** @type {[number, number]} */
    cell_size: undefined,
    /** @type {number} */
    tooltip_tail: undefined,
    /** @type {number} */
    cursor_dia: undefined,
    /** @type {number} */
    cell_border_radius: undefined,
    /** @type {number} */
    cell_border_width: undefined,
    /** @type {number} */
    cell_size_vis: undefined,
    /** @type {number} */
    arrow_width: undefined,
    /** @type {number} */
    arrow_cap: undefined,
    /** @type {number} */
    sprite_cell_scale: undefined,
    /** @type {number} */
    sprite_vertex_scale: undefined,
    /** @type {number} */
    sprite_link_knob: undefined,
    /** @type {number} */
    sprite_link_anchor_radius: undefined,
    /** @type {number} */
    sprite_link_root_radius: undefined,
    /** @type {number} */
    sprite_link_arrow_length: undefined,
    /** @type {number} */
    sprite_link_arrow_width: undefined,
    /** @type {number} */
    sprite_link_arrow_position: undefined,
    /** @type {number} */
    sprite_link_stroke_width: undefined,
    /** @type {number} */
    sprite_sec_src_radius: undefined,
    /** @type {number} */
    sprite_sec_ray_arrow_length: undefined,
    /** @type {number} */
    sprite_sec_ray_arrow_width: undefined,
    /** @type {number} */
    sprite_sec_ray_radius: undefined,
    /** @type {number} */
    sprite_sec_radius: undefined,
    /** @type {number} */
    sprite_sec_ray_width: undefined,
    /** @type {number} */
    sprite_sec_ext_width: undefined,
    /** @type {number} */
    sprite_prog_src_radius: undefined,
    /** @type {number} */
    sprite_prog_tgt_radius: undefined,
    /** @type {number} */
    sprite_prog_arrow_length: undefined,
    /** @type {number} */
    sprite_prog_arrow_width: undefined,
    /** @type {number} */
    sprite_prog_stroke_width: undefined,
    /** @type {number} */
    sprite_trace_stroke_width: undefined,
    /** @type {number} */
    play_interval: 20,
    /** @type {number} */
    thresh: 1e-8,

    init() {
        const getCssVar = function (css_var) {
            return getComputedStyle(document.body).getPropertyValue(css_var);
        };

        this.cell_size = parseFloat(getCssVar("--cell-size"));
        this.tooltip_tail = parseFloat(getCssVar("--tooltip-tail"));
        this.cursor_dia = parseFloat(getCssVar("--cursor-dia"));
        this.cell_border_radius = parseFloat(getCssVar("--cell-border-radius"));
        this.cell_border_width = parseFloat(getCssVar("--cell-border-width"));
        this.cell_size_vis = parseFloat(getCssVar("--cell-border-width"));
        this.arrow_width = parseFloat(getCssVar("--arrow-width"));
        this.arrow_cap = parseFloat(getCssVar("--arrow-cap"));
        this.sprite_cell_scale = parseFloat(getCssVar("--sprite-cell-scale"));
        this.sprite_vertex_scale = parseFloat(getCssVar("--sprite-vertex-scale"));

        this.sprite_link_knob = parseFloat(getCssVar("--sprite-link-knob"));
        this.sprite_link_anchor_radius = parseFloat(getCssVar("--sprite-link-anchor-radius"));
        this.sprite_link_root_radius = parseFloat(getCssVar("--sprite-link-root-radius"));
        this.sprite_link_arrow_length = parseFloat(getCssVar("--sprite-link-arrow-length"));
        this.sprite_link_arrow_width = parseFloat(getCssVar("--sprite-link-arrow-width"));
        this.sprite_link_arrow_position = parseFloat(getCssVar("--sprite-link-arrow-position"));
        this.sprite_link_stroke_width = parseFloat(getCssVar("--sprite-link-stroke-width"));

        this.sprite_sec_src_radius = parseFloat(getCssVar("--sprite-sec-src-radius"));
        this.sprite_sec_ray_arrow_length = parseFloat(getCssVar("--sprite-sec-ray-arrow-length"));
        this.sprite_sec_ray_arrow_width = parseFloat(getCssVar("--sprite-sec-ray-arrow-width"));
        this.sprite_sec_ray_radius = parseFloat(getCssVar("--sprite-sec-ray-radius"));
        this.sprite_sec_radius = parseFloat(getCssVar("--sprite-sec-radius"));
        this.sprite_sec_ray_width = parseFloat(getCssVar("--sprite-sec-ray-width"));
        this.sprite_sec_ext_width = parseFloat(getCssVar("--sprite-sec-ext-width"));

        this.sprite_prog_src_radius = parseFloat(getCssVar("--sprite-prog-src-radius"));
        this.sprite_prog_tgt_radius = parseFloat(getCssVar("--sprite-prog-tgt-radius"));
        this.sprite_prog_arrow_length = parseFloat(getCssVar("--sprite-prog-arrow-length"));
        this.sprite_prog_arrow_width = parseFloat(getCssVar("--sprite-prog-arrow-width"));
        this.sprite_prog_stroke_width = parseFloat(getCssVar("--sprite-prog-stroke-width"));

        this.sprite_trace_stroke_width = parseFloat(getCssVar("--sprite-trace-stroke-width"));
    }
};
Object.seal(ui_params);

/** Classes for Algs */
const Algs = {};

/** Classes for ui */
const UI = {};

const ui = {
    /** @type {UI.Cells} */
    cells: undefined,
    /** @type {UI.Grid} */
    grid: undefined,
    /** @type {UI.Cursor} */
    cursor_start: undefined,
    /** @type {UI.Cursor} */
    cursor_goal: undefined,
    /** @type {UI.Cursors} */
    cursors: undefined,
    /** @type {UI.Layers} */
    layers: undefined,
    /** @type {UI.Ruler} */
    ruler_top: undefined,
    /** @type {UI.Ruler} */
    ruler_bottom: undefined,
    /** @type {UI.Ruler} */
    ruler_left: undefined,
    /** @type {UI.Ruler} */
    ruler_right: undefined,
    /** @type {UI.Graph} */
    graph: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_new_map: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_load_map: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_save_map: undefined,
    /** @type {UI.AbstractToolNumber} */
    tool_draw_cost: undefined,
    /** @type {UI.AbstractToolNumber} */
    tool_start_x: undefined,
    /** @type {UI.AbstractToolNumber} */
    tool_start_y: undefined,
    /** @type {UI.AbstractToolNumber} */
    tool_goal_x: undefined,
    /** @type {UI.AbstractToolNumber} */
    tool_goal_y: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_alg: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_play_reverse: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_step_reverse: undefined,
    /** @type {UI.AbstractToolNumber} */
    tool_step: undefined,
    /** @type {UI.AbstractToolSelect} */
    tool_rank: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_step_forward: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_play_forward: undefined,
    /** @type {UI.AbstractToolButton} */
    tool_exit: undefined,
    /** @type {UI.Toolbar} */
    toolbar: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_algorithm: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_preset: undefined,
    /** @type {UI.FormHeading} */
    form_alg_graphing: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_node_type: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_node_connectivity: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_first_neighbor: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_next_neighbor: undefined,
    /** @type {UI.FormHeading} */
    form_alg_open_list: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_fh: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_time_ordering: undefined,
    /** @type {UI.FormHeading} */
    form_alg_cost_calculation: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_distance_metric: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_g_nb: undefined,
    /** @type {UI.FormElementNumber} */
    form_alg_g_weight: undefined,
    /** @type {UI.FormElementNumber} */
    form_alg_h_weight: undefined,
    /** @type {UI.FormHeading} */
    form_alg_costmap: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_costmap_type: undefined,
    /** @type {UI.FormElementNumber} */
    form_alg_lethal: undefined,
    /** @type {UI.FormElementSelect} */
    form_alg_checkerboard: undefined,
    /** @type {UI.FormAlg} */
    form_alg: undefined,
    /** @type {UI.FormElementSelect} */
    form_new_map_source: undefined,
    /** @type {UI.FormElementSelect} */
    form_new_map_template: undefined,
    /** @type {UI.FormElementNumber} */
    form_new_map_size_x: undefined,
    /** @type {UI.FormElementNumber} */
    form_new_map_size_y: undefined,
    /** @type {UI.FormElementSelect} */
    form_new_map_keep: undefined,
    /** @type {UI.FormElementNumber} */
    form_new_map_cost: undefined,
    /** @type {UI.FormElementNumber} */
    form_new_map_visual_min_cost: undefined,
    /** @type {UI.FormElementNumber} */
    form_new_map_visual_max_cost: undefined,
    /** @type {UI.FormNewMap} */
    form_new_map: undefined,
    /** @type {UI.Dialog} */
    dialog: undefined,
    /** @type {UI.Overlay} */
    overlay: undefined,
    /** @type {UI.Tooltip} */
    tooltip: undefined,
    /** @type {UI.Player} */
    player: undefined,
    /** @type {UI.KeyBinder} */
    key_binder: undefined,

    init() {
        ui_params.init();

        new UI.Overlay();
        new UI.Dialog();
        new UI.Graph();
        new UI.KeyBinder();
        new UI.Tooltip();
        new UI.Toolbar();
        new UI.Player();

        this.drawMode();
        this.makeMap(ui_states,
            Utils.createArray2d(ui_states.size, 1),
            false);

        this.test();

        delete this.init;
        Object.freeze(this);
    },

    test() {
        let canvas = document.querySelector("div.sprites");

        ui.newMap();
        ui.form_new_map_source.selectValue(NewMapSource.Template);
        ui.form_new_map._change_source();
        ui.form_new_map_template.selectValue(NewMapTemplate.Maze01);
        ui.dialog.ok();

        ui.showDialog(ui.form_alg);
        ui.form_alg_algorithm.selectValue(AlgAlgorithm.R2P);
        ui.form_alg._change_algorithm();
        ui.dialog.cancel();
    },

    /**
     * Shows the dialog box with the form attached.
     * @param {AbstractForm} form the form to show
     */
    showDialog(form) {
        this.toolbar.disable();
        this.overlay.show();
        this.dialog.show(form);
        ui_states.dialog = true;
    },

    /**
     * Hides the dialog box.
     */
    hideDialog() {
        this.toolbar.enable();
        this.overlay.hide();
        this.dialog.hide();
        ui_states.dialog = false;
    },

    okDialog() { this.dialog.ok(); },
    cancelDialog() { this.dialog.cancel(); },

    drawMode() {
        this.pause();
        this._unloadAlg();
        this.toolbar.drawMode();
        this.cursors.addEvents();
        this.hideDialog();
        this.tooltip.hide();
        ui_states.draw_mode = true;
    },

    newMap() {
        if (ui_states.draw_mode !== true)
            throw new Error(`newMap called while not in draw mode`);
        ui.tool_new_map.click();
    },

    loadMap() {
        if (ui_states.draw_mode !== true)
            throw new Error(`loadMap called while not in draw mode`);
        ui.tool_load_map.click();
    },

    saveMap() {
        if (ui_states.draw_mode !== true)
            throw new Error(`saveMap called while not in draw mode`);
        this.toolbar.disable();

        const dom_anchor = document.createElement('a');
        document.body.appendChild(dom_anchor);
        dom_anchor.setAttribute("download", `map.json`);
        dom_anchor.style.display = "none";

        const json = {
            costs: this.cells.costs(),
            states: ui_states,
        };

        const anchor_data = "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(json));
        dom_anchor.setAttribute("href", anchor_data);
        dom_anchor.click();

        document.body.removeChild(dom_anchor);
        this.toolbar.enable();
    },

    /** Modifies the UI to create a new map. 
     * @param {ui_states | *} new_states The new states. Property names must match the "ui_states" class. The "size" property in "new_states" is ignored. Any other property in "new_states" will be used to update the "State" class.
     * @param {number[][]} new_costs Square matrix of costs. The size is inferred from the top array and the first array in the former.
     * @param {boolean} keep_costs If true, costs in the current map will overwrite the costs in "new_costs" if there are overlapping cells between them.
     */
    makeMap(new_states, new_costs, keep_costs) {
        this.toolbar.disable();

        // write to states
        for (const [key, value] of Object.entries(new_states)) {
            if (ui_states[key] === undefined)
                throw new Error(`ui_states does not have the requested property "${key}"`);
            ui_states[key] = value;
        }

        // get size
        if (!new_costs.length || !new_costs[0].length)
            throw new Error("new_costs is not a valid array of arrays (2d array)");
        ui_states.size = [new_costs.length, new_costs[0].length];
        const new_start = Utils.isCoord(new_states.start) ? new_states.start : ui_states.start;
        const new_goal = Utils.isCoord(new_states.goal) ? new_states.goal : ui_states.goal;

        // form_new_map sizes and vis
        ui.form_new_map_size_x.change(ui_states.size[0]);
        ui.form_new_map_size_y.change(ui_states.size[1]);
        ui.form_new_map_visual_min_cost.change(new_states.visual_min_cost);
        ui.form_new_map_visual_max_cost.change(new_states.visual_max_cost);

        // start cursors and tools    
        this.tool_start_x.changeParams(new_start[0], 0, ui_states.size[0], 0.5, false);
        this.tool_start_y.changeParams(new_start[1], 0, ui_states.size[1], 0.5, false);
        ui_states.start = [this.tool_start_x.value, this.tool_start_y.value];
        this.cursor_start.moveToVertex(ui_states.start);

        // goal cursors and tools    
        this.tool_goal_x.changeParams(new_goal[0], 0, ui_states.size[0], 0.5, false);
        this.tool_goal_y.changeParams(new_goal[1], 0, ui_states.size[1], 0.5, false);
        ui_states.goal = [this.tool_goal_x.value, this.tool_goal_y.value];
        this.cursor_goal.moveToVertex(ui_states.goal);

        // draw cost and step
        this.tool_draw_cost.changeParams(ui_states.draw_cost, 0, Infinity, ui_states.draw_step, false);

        // adjust cells. Colors depend on ui_states.visual_{min,max}_cost
        this.cells.resize(new_costs, keep_costs);

        this.grid.resize(ui_states.size, ui_params.cell_size);

        // rulers
        this.ruler_top.resize(ui_states.size[0]);
        this.ruler_bottom.resize(ui_states.size[0]);
        this.ruler_left.resize(ui_states.size[1]);
        this.ruler_right.resize(ui_states.size[1]);

        this.toolbar.enable();
    },

    changeDrawCost(cost) {
        if (ui_states.changing_draw_cost)
            return;
        ui_states.changing_draw_cost = true;

        if (!Utils.isNonNegative(cost))
            throw new RangeError(`"cost" must be >= 0, got "${cost}"`);
        this.tool_draw_cost.change(cost);
        ui_states.draw_cost = this.tool_draw_cost.value;

        ui_states.changing_draw_cost = false;
    },

    /** Moves the start cursor, changes the start tools, and modifies ui_state.start. 
     * If out of map, the start coordinate will be clamped into the map.  
     * Leave a coordinate as NaN if it is not to be changed
    */
    changeStart(start) {
        if (ui_states.changing_start)
            return;
        ui_states.changing_start = true;

        if (!Number.isNaN(start[0])) {
            this.tool_start_x.change(start[0]);
            ui_states.start[0] = this.tool_start_x.value;
        }
        if (!Number.isNaN(start[1])) {
            this.tool_start_y.change(start[1]);
            ui_states.start[1] = this.tool_start_y.value;
        }
        this.cursor_start.moveToVertex(ui_states.start);

        ui_states.changing_start = false;
    },

    /** Moves the goal cursor, changes the goal tools, and modifies ui_state.goal.
     * If out of map, the goal coordinate will be clamped into the map.  
     * Leave a coordinate as NaN if it is not to be changed
    */
    changeGoal(goal) {
        if (ui_states.changing_goal)
            return;
        ui_states.changing_goal = true;

        if (!Number.isNaN(goal[0])) {
            this.tool_goal_x.change(goal[0]);
            ui_states.goal[0] = this.tool_goal_x.value;
        }
        if (!Number.isNaN(goal[1])) {
            this.tool_goal_y.change(goal[1]);
            ui_states.goal[1] = this.tool_goal_y.value;
        }
        this.cursor_goal.moveToVertex(ui_states.goal);

        ui_states.changing_goal = false;
    },


    /**
     * 
     * @param {Algs.Parameters} alg_params 
     * @returns 
     */
    runMode(alg_params) {
        this.pause();
        this._unloadAlg();
        this.toolbar.runMode();
        this.cursors.removeEvents();
        this.hideDialog();
        this.tooltip.hide();

        ui_states.draw_mode = false;

        // load algorithm
        if (alg_params.algorithm === AlgAlgorithm.AStar) {
            ui_states.alg = new Algs.AStar(alg_params);
        }
        else if (alg_params.algorithm === AlgAlgorithm.Dijkstra) {
            ui_states.alg = new Algs.Dijkstra(alg_params);
        }
        else if (alg_params.algorithm === AlgAlgorithm.BFS) {
            ui_states.alg = new Algs.BFS(alg_params);
        }
        else if (alg_params.algorithm === AlgAlgorithm.DFS) {
            ui_states.alg = new Algs.DFS(alg_params);
        }
        else if (alg_params.algorithm === AlgAlgorithm.R2P) {
            ui_states.alg = new Algs.R2P(alg_params);
        }

        else {
            window.alert("Algorithm is not implemented.")
            this.drawMode();
            return;
        }

        this.player.load(ui_states.alg.num_ranks);
        this.layers.loadCanvases([...ui_states.alg.canvases()]);

        // find path and build sprites and steps.
        ui_states.alg.run(ui_states.start.slice(), ui_states.goal.slice());

        // Build lens options
        let lens_options = [];
        let i = -1; // start from zero
        for (const lens of ui_states.alg.lenses())
            lens_options.push([lens.option_text, ++i]);
        this.tool_lens.replaceOptions(
            lens_options,
            ui_states.alg.default_lens_idx
        );

        // Build rank options
        let rank_options = [];
        i = 0; // start from one
        for (const rank_name of ui_states.alg.rank_names)
            rank_options.push([rank_name, ++i]);
        this.tool_rank.replaceOptions(
            rank_options,
            ui_states.alg.default_rank + 1);
        this.changeRank(ui_states.alg.default_rank); // requires player to load alg.

        this.changeLens(ui_states.alg.default_lens_idx);

        this.gotoStep(0);

        this.playForward();

    },

    _unloadAlg() {
        if (ui_states.alg === null) {
            // do nothing
        } else if (ui_states.alg !== null) {
            this.player.unload();
            this.layers.unloadCanvases([...ui_states.alg.canvases()]);
            ui_states.alg = null;
        } else if (ui_states.alg instanceof Algs.AbstractAlg === false)
            throw new TypeError(`ui_states.alg is invalid.`);
    },

    gotoStep(step_idx) {
        if (ui_states.draw_mode === false) {
            this.player.gotoStep(ui_states.rank, step_idx);
            this.tool_step.change(step_idx + 1);
        }
    },

    /**
     * 
     * @param {number} lens_idx 
     */
    changeLens(lens_idx) {
        if (ui_states.draw_mode === false) {
            if (ui_states.changing_lens === true)
                return;
            ui_states.changing_lens = true;

            if (!Utils.isFiniteNonNegativeInteger(lens_idx) || lens_idx > ui_states.alg.num_lenses)
                throw new Error(`lens_idx is not in range.`);

            const lens = ui_states.alg.lens(lens_idx);

            this.tool_lens.selectValue(lens_idx);
            this.tool_lens.text = lens.option_label;

            lens.lensCanvas();
            this.player.setLens(lens);

            ui_states.changing_lens = false;
        }
    },

    /** 
     * @param {number} rank
     */
    changeRank(rank) {
        if (ui_states.draw_mode === false) {
            if (ui_states.changing_rank === true)
                return;
            ui_states.changing_rank = true;

            if (!Utils.isFiniteNonNegativeInteger(rank))
                throw new Error(`rank "${rank}" must be a finite non-negative integer`);
            // const step_type_text = String.fromCharCode(rank + 'A'.charCodeAt(0));

            if (rank >= ui_states.alg.num_ranks)
                throw new Error(`rank "${rank}" is larger than number of ranks (${ui_states.alg.numRanks}).`)

            ui_states.rank = rank;
            const step_idx = this.player.stepIdx(rank);

            this.tool_rank.selectValue(rank + 1);
            this.tool_rank.text = rank + 1;
            this.tool_step.changeParams(
                step_idx + 1, 1, this.player.numSteps(rank), 1, true);
            this.tool_step.label = `Go to step (Alt+5). There are ${this.player.numSteps(rank)} rank-${rank + 1} steps`

            ui_states.changing_rank = false;
        }
    },

    toggleForward() {
        if (this.tool_play_forward.value)
            this.pause();
        else
            this.playForward();
    },

    toggleReverse() {
        if (this.tool_play_reverse.value)
            this.pause();
        else
            this.playReverse();
    },

    _toolStepChanger(value) {
        if (!ui.tool_step.isFocused()) {
            ui.tool_step.change(value + 1);
        }
    },

    skipForward() {
        if (ui_states.draw_mode === false) {
            this.player.gotoStep(0, this.player.numSteps(0) - 1);
            const step_idx = this.player.stepIdx(ui_states.rank); // error will be thrown above if rank or step_idx  are invalid.
            this._toolStepChanger(step_idx);
        }
    },

    stepForward() {
        if (ui_states.draw_mode === false) {
            this.player.stepForward(this._toolStepChanger)
        }
    },

    playForward() {
        if (ui_states.draw_mode === false) {
            this.tool_play_reverse.label = "Click to rewind (Alt+3). Double-click to go to start (Alt+Comma)";
            this.tool_play_reverse.release();
            if (this.tool_play_reverse.isHovered())
                this.tool_play_reverse.setTip();

            this.tool_play_forward.label = "Click to pause (Alt+9). Double-click to go to end (Alt+Period)";
            this.tool_play_forward.press();
            if (this.tool_play_forward.isHovered())
                this.tool_play_forward.setTip();

            this.player.playForward(this._toolStepChanger);
        }
    },

    stepReverse() {
        if (ui_states.draw_mode === false) {
            this.player.stepReverse(this._toolStepChanger)
        }
    },

    playReverse() {
        if (ui_states.draw_mode === false) {
            this.tool_play_reverse.label = "Click to pause (Alt+3). Double-click to go to start (Alt+Comma)";
            this.tool_play_reverse.press();
            if (this.tool_play_reverse.isHovered())
                this.tool_play_reverse.setTip();

            this.tool_play_forward.label = "Click to play (Alt+9). Double-click to go to end (Alt+Period)";
            this.tool_play_forward.release();
            if (this.tool_play_forward.isHovered())
                this.tool_play_forward.setTip();

            this.player.playReverse(this._toolStepChanger);
        }
    },

    skipReverse() {
        if (ui_states.draw_mode === false) {
            this.player.gotoStep(0, 0);
            const step_idx = this.player.stepIdx(ui_states.rank); // error will be thrown above if rank or step_idx  are invalid.
            this._toolStepChanger(step_idx);
        }
    },

    pause() {
        if (ui_states.draw_mode === false) {
            this.tool_play_reverse.label = "Click to rewind (Alt+3). Double-click to go to start (Alt+Comma)";
            this.tool_play_reverse.release();
            if (this.tool_play_reverse.isHovered())
                this.tool_play_reverse.setTip();
            this.tool_play_forward.label = "Click to play (Alt+9). Double-click to go to end (Alt+Period)";
            this.tool_play_forward.release();
            if (this.tool_play_forward.isHovered())
                this.tool_play_forward.setTip();
            this.player.pause();
        }
    },


    /** 
     * Converts pixel coordiantes values from the top left corner of the layers DOM object to *grid* coordinates. 
     * @param {[number, number]} px_coord An array of two numbers describing the pixel values from the top left corner of the layers DOM object.
     * @returns {[number, number]} An array of two numbers describing the *grid* coordinates.
    */
    pxToGrid(px_coord) {
        return [px_coord[0] / ui_params.cell_size, ui_states.size[1] - px_coord[1] / ui_params.cell_size];
    },

    /** 
     * Converts *grid* coordinates to pixel coordinates from the top left corner of the layers DOM object. 
     * @param {[number, number]} grid_coord An array of two numbers describing the *grid* coordinates.
     * @returns {[number, number]} An array of two numbers describing the pixel values from the top left corner of the layers DOM object.
     * */
    gridToPx(grid_coord) {
        return [grid_coord[0] * ui_params.cell_size, (ui_states.size[1] - grid_coord[1]) * ui_params.cell_size];
    },

    /** 
     * Converts a vector in the grid to the corresponding pixel vector
     * @param {[number, number]} vector An array of two numbers describing the vector in the grid.
     * @returns {[number, number]} An array of two numbers describing the pixel values from the top left corner of the layers DOM object.
     * */
    gridToPxVector(vector) {
        return [vector[0] * ui_params.cell_size, - vector[1] * ui_params.cell_size];
    },

    /** 
     * Tests if a pair of *cell* coordinates are in map. Checks against ui_states.size.
     * @param {number, number} cell_coord An array of two non-negative integers describing the *cell* coordinates to test. 
     * @returns {boolean} Returns true if the pair of *cell* coordinates are in the map, false otherwise 
     */
    inMapCell(cell_coord) {
        return cell_coord[0] >= 0 && cell_coord[0] < ui_states.size[0] && cell_coord[1] >= 0 && cell_coord[1] < ui_states.size[1];
    },

    /** 
     * Tests if a pair of *grid / vertex* coordinates are in map. Checks against ui_states.size.
     * @param {number, number} vertex_coord An array of two non-negative integers describing the *grid* coordinates to test. 
     * @returns {boolean} Returns true if the pair of *grid* coordinates are in the map, false otherwise 
     */
    inMapVertex(vertex_coord) {
        return vertex_coord[0] >= 0 && vertex_coord[0] <= ui_states.size[0] && vertex_coord[1] >= 0 && vertex_coord[1] <= ui_states.size[1];
    },

    /**
     * Serializes a cell coordinate by converting it to a number based on ui_states.size.
     * @param {[number, number]} cell_coord An array containing two non-negative integers describing the *cell* coordinate
     * @returns {[number]} a serialized integer representing the coordinate.
     */
    serializeCell(cell_coord) {
        return cell_coord[0] * ui_states.size[1] + cell_coord[1];
    },

    serializeVertex(vertex_coord) {
        return vertex_coord[0] * (ui_states.size[1] + 1) + vertex_coord[1];
    },
};