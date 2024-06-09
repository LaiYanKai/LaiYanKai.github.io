"use strict";

ui.form_new_map_template = new UI.FormElementSelect(
    "Template", "form_new_map_template",
    "Pick a template.",
    [
        ["Maze00", NewMapTemplate.Maze00],
        ["Maze01", NewMapTemplate.Maze01],
        ["Maze02", NewMapTemplate.Maze02],
    ], NewMapTemplate.Maze01
);

ui.form_new_map_source = new UI.FormElementSelect(
    "Source", "form_new_map_source",
    "Choose whether to build the new map from scratch or from a template.",
    [
        ["Manual", NewMapSource.Manual],
        ["Template", NewMapSource.Template]
    ], NewMapSource.Manual
);

ui.form_new_map_size_x = new UI.FormElementNumber(
    "Length in <i>x</i>", "form_new_map_size_x",
    "The number of cells along the <i>x</i>-axis. Keep the value small to avoid lag.",
    ui_states.size[0], 1, Infinity, 1, true
);

ui.form_new_map_size_y = new UI.FormElementNumber(
    "Length in <i>y</i>", "form_new_map_size_y",
    "The number of cells along the <i>y</i>-axis. Keep the value small to avoid lag.",
    ui_states.size[1], 1, Infinity, 1, true
);

ui.form_new_map_keep = new UI.FormElementSelect(
    "Keep/Discard Costs", "form_new_map_keep",
    "Keep the costs on the current map for the new map, or replace them with the new value below.",
    [
        ["Keep", NewMapKeep.Keep],
        ["Replace", NewMapKeep.Replace]
    ], NewMapKeep.Keep
);

ui.form_new_map_new_cost = new UI.FormElementNumber(
    "New Cost", "form_new_map_new_cost",
    "This cost is assigned to any new cells created for the new map. If the costs from the current map are discarded, this cost will be assigned to all cells.",
    1, 0, Infinity, 1, false
);

ui.form_new_map_visual_min_cost = new UI.FormElementNumber(
    "Min. Vis. Cost", "form_new_map_visual_min_cost",
    "The smallest cost to visualize. Cells with costs that are smaller or equal to this value will be colored white.",
    ui_states.visual_min_cost, 0, Infinity, 1, false
);
ui.form_new_map_visual_max_cost = new UI.FormElementNumber(
    "Max. Vis. Cost", "form_new_map_visual_max_cost",
    "The largest cost to visualize. Cells with costs that are larger or equal to this value will be colored black.",
    ui_states.visual_max_cost, 0, Infinity, 1, false
);

UI.FormNewMap = class extends UI.AbstractForm {
    constructor() {
        super(
            "Adjust or Create Map",
            "Resize or recolor the current map, or create a new map from scratch or a template.");

        if (ui.form_new_map)
            throw new Error(`ui.form_new_map has already been initialized`);
        ui.form_new_map = this;

        super.add(ui.form_new_map_source);
        super.add(ui.form_new_map_template);
        super.add(ui.form_new_map_size_x);
        super.add(ui.form_new_map_size_y);
        super.add(ui.form_new_map_keep);
        super.add(ui.form_new_map_new_cost);
        super.add(ui.form_new_map_visual_min_cost);
        super.add(ui.form_new_map_visual_max_cost);

        this.dom_ok.addEventListener("click", this.ok.bind(this), false);
        this.dom_cancel.addEventListener("click", this.cancel.bind(this), false);

        ui.form_new_map_source.dom_input.addEventListener(
            "change", this._change_source.bind(this), false);

        this._change_source();

        Object.freeze(this);
    }

    _change_source() {
        const source = ui.form_new_map_source.value;
        if (source === NewMapSource.Manual) {
            ui.form_new_map_template.hide();
            ui.form_new_map_size_x.show();
            ui.form_new_map_size_y.show();
            ui.form_new_map_keep.show();
            ui.form_new_map_new_cost.show();
            ui.form_new_map_visual_min_cost.show();
            ui.form_new_map_visual_max_cost.show();
        }
        else if (source === NewMapSource.Template) {
            ui.form_new_map_template.show();
            ui.form_new_map_size_x.hide();
            ui.form_new_map_size_y.hide();
            ui.form_new_map_keep.hide();
            ui.form_new_map_new_cost.hide();
            ui.form_new_map_visual_min_cost.hide();
            ui.form_new_map_visual_max_cost.hide();
        }
        else {
            throw new Error(`New map source option "${source}" is unknown`);
        }
    }

    ok() {
        ui.hideDialog();

        const source = ui.form_new_map_source.value;
        if (source == NewMapSource.Manual) {
            // parse new states;
            const new_size = [
                ui.form_new_map_size_x.value,
                ui.form_new_map_size_y.value];
            const new_states = {
                visual_min_cost: ui.form_new_map_visual_min_cost.value,
                visual_max_cost: ui.form_new_map_visual_max_cost.value,
            };

            // cells
            const new_cost = ui.form_new_map_new_cost.value;
            const new_costs = Utils.createArray2d(new_size, new_cost);
            const keep_costs = ui.form_new_map_keep.value === NewMapKeep.Keep;

            // call ui new map
            ui.makeMap(new_states, new_costs, keep_costs);
        }
        else if (source == NewMapSource.Template) {
            let json;
            const value = ui.form_new_map_template.value;
            if (value === NewMapTemplate.Maze00)
                json = { "costs": [[10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 10, 10, 10, 10, 1, 1, 1], [10, 1, 1, 10, 10, 10, 10, 10, 1, 1, 10, 1, 1, 10, 1, 1, 1, 1, 1, 1], [10, 1, 1, 10, 1, 1, 1, 10, 1, 1, 10, 1, 1, 10, 1, 1, 10, 1, 10, 10], [10, 1, 1, 10, 1, 10, 1, 10, 1, 1, 10, 1, 1, 10, 1, 1, 10, 1, 10, 1], [10, 1, 1, 10, 1, 10, 1, 10, 1, 1, 10, 1, 1, 10, 10, 10, 10, 1, 10, 1], [10, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 1, 10, 1, 10, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1], [10, 1, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 10, 1], [1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 10, 1], [1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 10, 1], [1, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 10, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 10, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 10, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1], [1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], "states": { "dialog": false, "draw_mode": true, "draw_cost": 10, "visual_min_cost": 0, "visual_max_cost": 10, "draw_step": 1, "goal": [5, 15], "start": [25, 5], "size": [30, 20], "rank": 0, "changing_start": false, "changing_goal": false, "changing_draw_cost": false, "changing_rank": false, "changing_lens": false, "alg": null } }
            else if (value === NewMapTemplate.Maze01)
                json = { "costs": [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], "states": { "dialog": false, "draw_mode": true, "draw_cost": 1, "visual_min_cost": 0, "visual_max_cost": 10, "draw_step": 1, "goal": [39.06666666666667, 16.066666666666666], "start": [1.9666666666666666, 2.033333333333335], "size": [50, 25], "rank": 0, "changing_start": false, "changing_goal": false, "changing_draw_cost": false, "changing_rank": false, "changing_lens": false, "alg": null } };
            else if (value === NewMapTemplate.Maze02)
                json = { "costs": [[1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 10, 1, 1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1], [1, 1, 1, 10, 1, 1, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 10, 1, 10, 10, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1], [10, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 10, 1, 10, 1, 1, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 1, 1, 10, 1, 10, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 1, 1, 10, 1, 10, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 1, 1, 10, 1, 10, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 10, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 10, 10, 1, 1, 1, 10, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 1, 10, 10, 10, 10, 10, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 10, 10, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 10, 1, 10, 1, 1, 1], [1, 10, 1, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 10, 10, 1, 1, 10, 1, 1, 1], [1, 10, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 10, 10, 1, 1, 1], [1, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1], [1, 1, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 10, 10, 10, 10, 10, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1, 1], [1, 10, 1, 1, 1, 10, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 1], [10, 1, 1, 1, 1, 10, 1, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 1, 1, 1, 10, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 1, 1, 1, 1, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 10, 1, 1, 1, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 10], [10, 1, 10, 1, 1, 1, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 10], [10, 1, 10, 1, 1, 1, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 10, 1, 1, 1, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 10, 1, 1, 1, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1], [10, 1, 10, 10, 10, 10, 10, 1, 1, 10, 1, 1, 1, 1, 1, 10, 10, 10, 10, 1, 1, 1, 10, 10, 1], [10, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 10, 10, 1, 10, 10, 10, 10, 10, 1, 1], [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 10, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 10, 10, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 10, 1, 1], [1, 1, 10, 10, 10, 10, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1], [1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 1, 1, 10, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]], "states": { "dialog": false, "draw_mode": true, "draw_cost": 10, "visual_min_cost": 0, "visual_max_cost": 10, "draw_step": 1, "goal": [33.9, 21.133333333333333], "start": [1.9666666666666666, 2.033333333333335], "size": [50, 25], "rank": 0, "changing_start": false, "changing_goal": false, "changing_draw_cost": false, "changing_rank": false, "changing_lens": false, "alg": null } };
            else
                throw new RangeError(`Unknown template "${value}" `);

            ui.makeMap(json.states, json.costs, false);
        }
        else {
            throw new Error(`New map source option "${source}" is unknown`);
        }
    }

    cancel() { ui.hideDialog(); }
}