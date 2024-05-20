"use strict";

UI.Toolbar = class {
    dom;
    #draw_tools;
    #run_tools;
    #global_tools;

    constructor() {
        if (ui.toolbar)
            throw new Error("ui.toolbar has already been initialized");
        ui.toolbar = this;

        this.dom = document.querySelector(".toolbar");

        this.#global_tools = [
            ui.tool_alg
        ];

        this.#draw_tools = [
            ui.tool_new_map,
            ui.tool_load_map,
            ui.tool_save_map,
            ui.tool_draw_cost,
            ui.tool_start_x,
            ui.tool_start_y,
            ui.tool_goal_x,
            ui.tool_goal_y,
        ];

        this.#run_tools = [
            ui.tool_exit,
            ui.tool_play_reverse,
            ui.tool_step,
            ui.tool_rank,
            ui.tool_play_forward,
        ];

        const tools = [
            ...this.#global_tools,
            ...this.#draw_tools,
            ...this.#run_tools
        ];

        for (const tool of tools) {
            if (!tool || !tool.dom)
                throw new Error(`tool not initialized. tool=${tool}`);
            this.dom.appendChild(tool.dom);
        }

        // Attach events
        ui.tool_alg.dom.addEventListener(
            "click", ui.toolbar._click_alg);
        ui.tool_new_map.dom.addEventListener(
            "click", ui.toolbar._click_new_map);
        ui.tool_load_map.dom_input.addEventListener(
            "change", ui.toolbar._change_load_map);
        ui.tool_save_map.dom.addEventListener(
            "click", ui.toolbar._click_save_map);
        ui.tool_draw_cost.dom_input.addEventListener(
            "change", ui.toolbar._change_draw_cost);
        ui.tool_start_x.dom_input.addEventListener(
            "change", ui.toolbar._change_start_x);
        ui.tool_start_y.dom_input.addEventListener(
            "change", ui.toolbar._change_start_y);
        ui.tool_goal_x.dom_input.addEventListener(
            "change", ui.toolbar._change_goal_x);
        ui.tool_goal_y.dom_input.addEventListener(
            "change", ui.toolbar._change_goal_y);
        ui.tool_exit.dom.addEventListener(
            "click", ui.toolbar._click_exit);
        ui.tool_play_reverse.dom.addEventListener(
            "click", ui.toolbar._click_play_reverse);
        ui.tool_step.dom_input.addEventListener(
            "change", ui.toolbar._change_step);
        ui.tool_rank.dom_input.addEventListener(
            "change", ui.toolbar._change_rank);
        ui.tool_play_forward.dom.addEventListener(
            "click", ui.toolbar._click_play_forward);


        this.drawMode();

        Object.freeze(this);
    }

    enable() {
        for (const tool of this.#global_tools)
            tool.enable();
        for (const tool of this.#draw_tools)
            tool.enable();
        for (const tool of this.#run_tools)
            tool.enable();
    }

    disable() {
        for (const tool of this.#global_tools)
            tool.disable();
        for (const tool of this.#draw_tools)
            tool.disable();
        for (const tool of this.#run_tools)
            tool.disable();
    }

    drawMode() {
        for (const tool of this.#run_tools)
            tool.hide(); // also disables
        for (const tool of this.#draw_tools)
            tool.show(); // also enables
    }

    runMode() {
        for (const tool of this.#draw_tools)
            tool.hide(); // also disables
        for (const tool of this.#run_tools)
            tool.show(); // also enables
    }


    _click_alg(e) {
        e.stopPropagation();
        ui.showDialog(ui.form_alg);
    }

    _click_new_map(e) {
        e.stopPropagation();
        ui.showDialog(ui.form_new_map);
    }

    _change_load_map(e) {
        e.stopPropagation();

        const file = ui.tool_load_map.dom_input.files[0];
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            const json = JSON.parse(reader.result);
            ui.makeMap(json.states, json.costs, false);
        }, true);

        reader.readAsText(file);

        ui.tool_load_map.dom_input.value = null; // required to activate onchange if the same map is loaded
    }

    _click_save_map(e) {
        e.stopPropagation();
        ui.saveMap();
    }

    _change_draw_cost(e) {
        e.stopPropagation();
        ui.changeDrawCost(ui.tool_draw_cost.raw_value);
    }

    _change_start_x(e) {
        e.stopPropagation();
        ui.changeStart([
            ui.tool_start_x.raw_value,
            ui_states.start[1]]);
    }

    _change_start_y(e) {
        e.stopPropagation();
        ui.changeStart([
            ui_states.start[0],
            ui.tool_start_y.raw_value]);
    }

    _change_goal_x(e) {
        e.stopPropagation();
        ui.changeGoal([
            ui.tool_goal_x.raw_value,
            ui_states.goal[1]]);
    }

    _change_goal_y(e) {
        e.stopPropagation();
        ui.changeGoal([
            ui_states.goal[0],
            ui.tool_goal_y.raw_value]);
    }

    _click_exit(e) {
        e.stopPropagation();
        ui.drawMode();
    }

    _click_play_reverse(e) {
        e.stopPropagation();
        ui.toggleReverse();
    }

    _change_step(e) {
        e.stopPropagation();
        ui.gotoStep(ui.tool_step.raw_value - 1);
    }

    _change_rank(e) {
        e.stopPropagation();
        ui.changeRank(ui.tool_rank.value - 1);
    }

    _click_play_forward(e) {
        e.stopPropagation();
        ui.toggleForward();
    }
};
