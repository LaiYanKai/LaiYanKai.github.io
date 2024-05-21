"use strict";
UI.AbstractTool = class {
    dom
    dom_input;
    dom_label;

    get label() { return this.dom_label.textContent; }
    set label(new_label) { this.dom_label.textContent = new_label; }

    constructor(type, id, label) {
        if (type === "select") {
            this.dom_input = document.createElement("select");
        }
        else if (type === "number" || type === "file" || type === "button") {
            this.dom_input = document.createElement("input");
            this.dom_input.setAttribute("type", type);
        }
        else
            throw new Error(`Invalid type "${type}"`);

        this.dom = document.createElement("div");
        this.dom.appendChild(this.dom_input);
        this.dom_input.id = id;

        this.dom_label = document.createElement("label");
        this.dom.prepend(this.dom_label);
        this.dom_label.setAttribute("for", id);
        this.label = label;

        this.dom.addEventListener("mousemove", this.setTip.bind(this), true);
        this.dom.addEventListener("mouseout", this.#hideTip, true);
        this.enable();
    }

    show() {
        this.dom.style.removeProperty("display");
        this.enable();
    }

    hide() {
        this.dom.style.display = "none";
        this.disable();
    }

    enable() { this.dom_input.disabled = false; }
    disable() { this.dom_input.disabled = true; }

    setTip(show_tip = true) {
        ui.tooltip.setTip(TooltipPosition.Right, this.dom_label.textContent, this.dom);
        if (show_tip)
            ui.tooltip.show();
    }

    #hideTip() { ui.tooltip.hide(); }

    focus() { this.dom_input.focus(); }
    click() { this.dom.click(); }
    dblclick() { this.dom.dispatchEvent(new MouseEvent('dblclick')); }

    isHovered() { return this.dom.matches(":hover"); }
    isFocused() { return document.activeElement === this.dom_input; }
};

UI.AbstractToolFile = class extends UI.AbstractTool {
    constructor(id, label, accept) {
        super("file", id, label);

        if (accept)
            this.dom_input.setAttribute("accept", accept);
    }
};

UI.AbstractToolButton = class extends UI.AbstractTool {
    #value;

    get value() { return this.#value; }

    constructor(value, id, label) {
        super("button", id, label);

        this.#value = value;
        if (value)
            this.press();
        else
            this.release();
    }

    press() {
        this.#value = true;
        this.dom_input.value = this.#value;
    }

    release() {
        this.#value = false;
        this.dom_input.value = this.#value;
    }
};

UI.AbstractToolSelect = class extends UI.AbstractTool {
    dom_text
    dom_title;

    get text() { return this.dom_text.textContent; }
    set text(new_text) { this.dom_text.textContent = new_text; }
    get title() { return this.dom_title.textContent; }
    set title(new_title) { this.dom_title.textContent = new_title; }
    get value() { return parseInt(this.dom_input.value); }

    /** 
     * @param options [[text, value], [text, value], ...] */
    constructor(id, label, title, text, options, default_value) {
        super("select", id, label);

        this.dom_title = document.createElement("div");
        this.dom.insertBefore(this.dom_title, this.dom.lastChild);
        this.dom_title.className = "title";
        this.title = title;

        this.dom_text = document.createElement("div");
        this.dom.insertBefore(this.dom_text, this.dom.lastChild);
        this.dom_text.className = "text";
        this.text = text;


        this.replaceOptions(options, default_value)
    }

    /**
     * 
     * @param {number} value 
     */
    selectValue(value) {
        const options = this.dom_input.options;
        let index = 0;
        for (const option of options) {
            if (parseInt(option.value) === value)
                break;
            ++index;
        }

        if (index === options.length)
            throw new Error(`Option "${value}" not found!`);

        this.dom_input.selectedIndex = index;
    }

    /**
     * 
     * @param {[string, number][]} new_options 
     * @param {number} value 
     */
    replaceOptions(new_options, value) {
        this.dom_input.replaceChildren();
        for (const [option_text, option_value] of new_options) {
            const dom_option = document.createElement("option");
            dom_option.text = option_text;
            dom_option.value = option_value;
            this.dom_input.appendChild(dom_option);
        }
        this.selectValue(value);
    }

}

UI.AbstractToolNumber = class extends UI.AbstractTool {
    dom_title
    #value;
    #min;
    #max;
    #is_integer;

    get raw_value() { return parseFloat(this.dom_input.value); }
    get value() { return this.#value; }
    get min() { return this.#min; }
    get max() { return this.#max; }
    get title() { return this.dom_title.textContent; }
    set title(new_title) { this.dom_title.textContent = new_title; }

    constructor(value, id, label, title, min, max, step, is_integer) {
        super("number", id, label);
        this.dom_title = document.createElement("div");
        this.dom.prepend(this.dom_title);
        this.dom_title.className = "title";
        this.title = title;

        this.#value = Utils.clamp(value, min, max);
        this.changeParams(value, min, max, step, is_integer);
    }

    change(value) {
        value = parseFloat(value);
        if (isNaN(value))
            value = this.#value;

        if (this.#is_integer && !Number.isInteger(value))
            value = Math.round(value);

        if (value < this.#min)
            value = this.#min;
        else if (value > this.#max)
            value = this.#max;

        this.#value = value;
        this.dom_input.value = value;
    }

    changeParams(value, min, max, step, is_integer) {
        if (typeof is_integer !== 'boolean')
            throw new Error(`is_integer=${is_integer} is not a boolean`);

        if (typeof min !== 'number' || isNaN(min))
            throw new Error(`min=${min} is not a number`);

        if (typeof max !== 'number' || isNaN(max))
            throw new Error(`min=${max} is not a number`);

        if (min > max)
            throw new Error(`New min=${min} is larger than new max=${max}`);


        if (is_integer) {
            if (Number.isFinite(min) && !Number.isInteger(min))
                throw new Error(`is_integer=true, and min=${min} is not an integer`);
            if (Number.isFinite(max) && !Number.isInteger(max))
                throw new Error(`is_integer=true, and max=${max} is not an integer`);
            if (!Number.isInteger(step))
                throw new Error(`is_integer=true, and step=${step} is not an integer`);
        }

        this.#min = min;
        this.#max = max;
        this.#is_integer = is_integer;

        this.dom_input.min = min;
        this.dom_input.max = max;
        this.dom_input.step = step;

        this.change(value);
    }

};

ui.tool_alg = new UI.AbstractToolButton(
    false, "tool_alg", "Select and run a path planner (Alt+1)");

ui.tool_new_map = new UI.AbstractToolButton(
    false, "tool_new_map",
    "Adjust the current map or create a new map (Alt+2)");

ui.tool_load_map = new UI.AbstractToolFile(
    "tool_load_map", "Load a map (Alt+3)", ".json");

ui.tool_save_map = new UI.AbstractToolButton(
    false, "tool_save_map",
    "Save and download the current map (Alt+4)");

ui.tool_draw_cost = new UI.AbstractToolNumber(
    ui_states.draw_cost, "tool_draw_cost", "Cost to draw cells (Alt+5)",
    "Cost", 0, Infinity, ui_states.draw_step, false);

ui.tool_start_x = new UI.AbstractToolNumber(
    ui_states.start[0], "tool_start_x", "Start point's x-coordinate (Alt+6)",
    "Start X", 0, ui_states.size[0], 0.5, false);

ui.tool_start_y = new UI.AbstractToolNumber(
    ui_states.start[1], "tool_start_y", "Start point's y-coordinate (Alt+7)",
    "Start Y", 0, ui_states.size[1], 0.5, false);

ui.tool_goal_x = new UI.AbstractToolNumber(
    ui_states.goal[0], "tool_goal_x", "Goal point's x-coordinate (Alt+8)",
    "Goal X", 0, ui_states.size[0], 0.5, false);

ui.tool_goal_y = new UI.AbstractToolNumber(
    ui_states.goal[1], "tool_goal_y", "Goal point's y-coordinate (Alt+9)",
    "Goal Y", 0, ui_states.size[1], 0.5, false);

ui.tool_exit = new UI.AbstractToolButton(
    false, "tool_exit", "Go back to drawing mode (Alt+2)");

ui.tool_lens = new UI.AbstractToolSelect(
    "tool_lens", 
    "Select lenses (Alt+3)",
    "Lens", "",
    [
        ["default", 0],
    ], 0
);

ui.tool_play_reverse = new UI.AbstractToolButton(
    false, "tool_play_reverse", "(Alt+4)");

ui.tool_step_reverse = new UI.AbstractToolButton(
    false, "tool_step_reverse", "Move one step back (Alt+5)");

ui.tool_step = new UI.AbstractToolNumber(
    1, "tool_step", "(Alt+6)", "Step", 1, Infinity, 1, true);

ui.tool_rank = new UI.AbstractToolSelect(
    "tool_rank",
    "Change step size (Alt+7), which affects how fast the visualization is played.",
    "Size", "",
    [
        ["default", 0],
    ], 0
);

ui.tool_step_forward = new UI.AbstractToolButton(
    false, "tool_step_forward", "Move one step forward (Alt+8)");

ui.tool_play_forward = new UI.AbstractToolButton(
    false, "tool_play_forward", "(Alt+9)");
