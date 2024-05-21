"use strict";

UI.Ruler = class {
    dom;
    #is_vertical;

    constructor(dom, is_vertical) {
        this.#is_vertical = is_vertical;
        this.dom = dom;
        Object.freeze(this.dom);
    }

    resize(length) {
        this.dom.replaceChildren(); 

        const class_name = this.#is_vertical ? "vrule" : "hrule";

        for (let i = 0; i < length; ++i) {
            const dom_rule = document.createElement("div");
            dom_rule.className = class_name;
            dom_rule.appendChild(document.createTextNode(i));
            this.dom.appendChild(dom_rule);
        }
    }
}

ui.ruler_bottom = new UI.Ruler(
    document.querySelector(".body>.graph>.ruler-bottom"),
    false);

ui.ruler_top = new UI.Ruler(
    document.querySelector(".body>.graph>.ruler-top"),
    false);

ui.ruler_left = new UI.Ruler(
    document.querySelector(".body>.graph>.ruler-left"),
    true);

ui.ruler_right = new UI.Ruler(
    document.querySelector(".body>.graph>.ruler-right"),
    true);