"use strict";

UI.Graph = class {
    constructor(){
        this.dom = document.querySelector(".body>.graph");
        if (ui.graph)
            throw new Error("ui.graph has already been initialized");
        ui.graph = this;

        new UI.Layers();
        Object.freeze(this);
    }
};
Object.seal(UI.Graph);