"use strict";

UI.Overlay = class {
    dom;

    constructor() {
        if (ui.overlay)
            throw new Error(`ui.overlay has already been initialized`);
        ui.overlay = this;
        
        this.dom = document.querySelector(".overlay");
        Object.freeze(this);
    }

    show() { this.dom.style.removeProperty("display"); }

    hide() { this.dom.style.display = "none"; }
}