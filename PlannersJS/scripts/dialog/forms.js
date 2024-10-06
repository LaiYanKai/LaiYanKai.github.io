"use strict";

UI.AbstractForm = class {
    dom;
    #dom_title;
    #dom_description;
    #dom_elements;
    dom_ok;
    dom_cancel;

    /**
     * Adds an element to the form.
     * @param {UI.AbstractFormElement | *} element Derived from the UI.AbstractFormElement class.
     */
    add(element) {
        this.#dom_elements.appendChild(element.dom_parameter);
        this.#dom_elements.appendChild(element.dom_label);
    }

    /**
     * Adds a sub heading between form elements.
     * @param {UI.AbstractFormElement | *} element 
     */
    addHeading(element) {
        this.#dom_elements.appendChild(element.dom);
    }

    constructor (title, description) {
        this.dom = document.createElement("div");
        this.dom.className = "form";

        const dom_cap = document.createElement("div");
        this.dom.appendChild(dom_cap);
        dom_cap.className = "caption";

        this.#dom_title = document.createElement("div");
        dom_cap.appendChild(this.#dom_title);
        this.#dom_title.className = "title";
        this.#dom_title.innerHTML = title;

        this.#dom_description = document.createElement("div");
        dom_cap.appendChild(this.#dom_description);
        this.#dom_description.className = "description";
        this.#dom_description.innerHTML = description;

        this.#dom_elements = document.createElement("div");
        this.dom.appendChild(this.#dom_elements);
        this.#dom_elements.className = "elements";

        const dom_actions = document.createElement("div");
        this.dom.appendChild(dom_actions);
        dom_actions.className = "actions";

        this.dom_ok = document.createElement("input");
        dom_actions.appendChild(this.dom_ok);
        this.dom_ok.type = "button";
        this.dom_ok.value = "Accept (Ctrl+Enter)";
        this.dom_ok.className = "accept";

        this.dom_cancel = document.createElement("input");
        dom_actions.appendChild(this.dom_cancel);
        this.dom_cancel.type = "button";
        this.dom_cancel.value = "Cancel (Esc)";
        this.dom_cancel.className = "cancel";

        for (const entry of Object.entries(this))
            Object.freeze(entry);
    }

    show() { this.dom.style.removeProperty("display"); }

    hide() { this.dom.style.display = "none"; }

    //override ok(), and assign callbacks.
    //override cancel(), and assign callbacks.
}

UI.FormHeading = class {
    dom;

    constructor (heading) {
        this.dom = document.createElement("div");
        this.dom.className = "heading";
        const dom_span = document.createElement("span");
        this.dom.appendChild(dom_span);
        dom_span.innerHTML = heading;

        Object.freeze(this);
    }

    show() { this.dom.classList.remove("hide"); }

    hide() { this.dom.classList.add("hide"); }
}

UI.AbstractFormElement = class {
    dom_parameter;
    dom_label;
    dom_input;

    constructor (name, id, label, input_tag) {
        this.dom_parameter = document.createElement("div");
        this.dom_parameter.className = "parameter";

        const dom_name = document.createElement("span");
        this.dom_parameter.appendChild(dom_name);
        dom_name.className = "name";
        dom_name.innerHTML = name;

        this.dom_input = document.createElement(input_tag);
        this.dom_parameter.appendChild(this.dom_input);
        this.dom_input.id = id;

        this.dom_label = document.createElement("label");
        this.dom_label.htmlFor = id;

        const dom_label_span = document.createElement("span");
        this.dom_label.appendChild(dom_label_span);
        dom_label_span.innerHTML = label;

        Object.freeze(this);
    }

    show() {
        this.dom_parameter.classList.remove("hide");
        this.dom_label.classList.remove("hide");
        this.enable();
    }

    hide() {
        this.dom_parameter.classList.add("hide");
        this.dom_label.classList.add("hide");
        this.disable();
    }

    enable() { this.dom_input.disabled = false; }

    disable() { this.dom_input.disabled = true; }
}

UI.FormElementSelect = class extends UI.AbstractFormElement {
    #is_null;

    /** 
     * @returns {null | number} Returns the string corresponding to the selected option's value. 
     * Returns null if setNull() was previously called. 
    */
    get value() {
        return this.#is_null ?
            null :
            parseInt(this.dom_input.value);
    }

    /** 
     * @param {string} name The name of the element to show on the form.
     * @param {string} id The element id.
     * @param {string} label The description of the element.
     * @param {[string, number][]} options An array of string-number pairs. 
     * Each string in the array represents the text of the option in the drop down menu. The option value is given by the number.
     * @param {number} default_value The option whose value equals to this value will be selected.
     */
    constructor (name, id, label, options, default_value) {
        super(name, id, label, "select");
        this.replaceOptions(options, default_value);
    }

    show() {
        this.#is_null = false;
        super.show();
    }

    hide() {
        this.#is_null = true;
        super.hide();
    }

    /**
     * Selects the option associated with the value.
     * @param {number} value 
     */
    selectValue(value) {
        let idx = -1;
        for (const option of this.dom_input.options) {
            console.log("option.value", option.value);
            ++idx;
            if (parseInt(option.value) === value)
                break;
        }
        if (idx >= this.dom_input.options.length)
            throw new Error(`Invalid value "${value}" selected.`);
        this.dom_input.selectedIndex = idx;
        console.log("this.dom_input.selectedIndex", this.dom_input.selectedIndex);
        console.log("this.value", this.value);
    }

    /**
     * Replaces the options available. 
     * * @param {[string, number][]} options An array of string-number pairs. 
     * Each string in the array represents the text of the option in the drop down menu. The option value is given by the number.
     * @param {number} default_value The option whose value equals to this value will be selected.
     */
    replaceOptions(new_options, default_value) {
        this.dom_input.replaceChildren();
        for (const [option_text, option_value] of new_options) {
            const dom_option = document.createElement("option");
            dom_option.text = option_text;
            dom_option.value = option_value;
            this.dom_input.appendChild(dom_option);
        }
        this.selectValue(default_value);
    }
}

UI.FormElementNumber = class extends UI.AbstractFormElement {
    #is_null;
    #value;
    #min;
    #max;
    #is_integer; // only allow values that can be obtained by min, max, and step.

    get value() { return this.#is_null ? NaN : this.#value; }
    get raw_value() { return parseFloat(this.dom_input.value); }

    constructor (name, id, label, value, min, max, step,
        is_integer, attach_changer = true) {
        super(name, id, label, "input");
        this.dom_input.type = "number";

        this.changeParams(value, min, max, step, is_integer);

        if (attach_changer === true)
            this.dom_input.addEventListener(
                "change", this.changeFromInput.bind(this), false);
    }

    show() {
        this.#is_null = false;
        super.show();
    }

    hide() {
        this.#is_null = true;
        super.hide();
    }

    changeFromInput(e) { this.change(this.raw_value); }

    /** Change parameters. No validations are done, and min, max, step values are undefined. */
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

    change(value) {

        value = parseFloat(value);
        if (isNaN(value))
            value = this.#value;

        if (this.#is_integer && !Number.isInteger(value))
            value = Math.round(value);

        if (value < this.#min)
            value = this.#min;
        if (value > this.#max)
            value = this.#max;

        this.#value = value;
        this.dom_input.value = value;
    }
}