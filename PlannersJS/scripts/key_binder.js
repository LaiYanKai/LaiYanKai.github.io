"use strict";

UI.KeyBinder = class {
    constructor() {
        if (ui.key_binder)
            throw new Error(`ui.key_binder has already been initialized.`);
        ui.key_binder = this;

        document.addEventListener("keydown", this.#binder.bind(this));
        Object.freeze(this);
    }

    #binder(e) {
        if (e.repeat)
            return;

        if (ui_states.dialog === true) {
            if (e.key === "Escape")
                ui.cancelDialog();
            else if (e.key === "Enter" && e.ctrlKey)
                ui.okDialog();
        }
        else if (ui_states.dialog === false && e.altKey) {
            if (e.key === "1")
                ui.showDialog(ui.form_alg);
            else if (ui_states.draw_mode === true) {
                if (e.key === "2")
                    ui.tool_new_map.click();
                else if (e.key === "3")
                    ui.tool_load_map.click();
                else if (e.key === "4")
                    ui.tool_save_map.click();
                else if (e.key === "5")
                    ui.tool_draw_cost.focus();
                else if (e.key === "6")
                    ui.tool_start_x.focus();
                else if (e.key === "7")
                    ui.tool_start_y.focus();
                else if (e.key === "8")
                    ui.tool_goal_x.focus();
                else if (e.key === "9")
                    ui.tool_goal_y.focus();
            }
            else if (ui_states.draw_mode === false) {
                if (e.key === "2")
                    ui.drawMode();
                else if (e.key === "3")
                    ui.tool_play_reverse.click();
                else if (e.key === "4")
                    ui.tool_step.focus();
                else if (e.key === "5")
                    ui.tool_rank.focus();
                else if (e.key === "6")
                    ui.tool_play_forward.click();
            }
        }
    }
};
Object.seal(UI.KeyBinder);