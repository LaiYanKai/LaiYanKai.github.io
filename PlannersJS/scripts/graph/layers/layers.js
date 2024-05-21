"use strict";

UI.Layers = class {
    dom;

    constructor() {
        if (ui.layers)
            throw new Error("ui.layers has already been initialized");
        ui.layers = this;

        this.dom = document.querySelector(".body>.graph>.layers");
        
        new UI.Grid();
        new UI.Cursors();
        new UI.Cells();
        
        Object.freeze(this);
    }

    loadCanvases(canvases) {
        for (const canvas of canvases)
            this.dom.appendChild(canvas.dom);
    }

    unloadCanvases(canvases) {
        for (const canvas of canvases)
            this.dom.removeChild(canvas.dom);
    }
};

UI.Grid = class {
    dom;
    #dom_svg;

    constructor() {
        if (ui.grid)
            throw new Error(`ui.grid has already been initialized`);
        ui.grid = this;

        this.dom = document.querySelector(".body>.graph>.layers>.grid");
        this.#dom_svg = Utils.createSVGElement("svg");
        this.dom.appendChild(this.#dom_svg);
        
        Object.freeze(this);
    }

    /** @params {[number, number]} number of cells (ui_states.size) */
    resize(size, cell_width) {
        if (!Utils.isFiniteNonNegativeIntegerCoord(size))
            throw new Error(`"size" should be number of cells`);

        this.#dom_svg.replaceChildren();

        const last_x = size[0] * cell_width;
        const last_y = size[1] * cell_width;

        this.#dom_svg.setAttribute("viewBox", `0 0 ${last_x} ${last_y}`);

        for (let x = 1; x < size[0]; ++x) {
            const pos_x = x * cell_width;
            const dom_path = Utils.createSVGElement("path");
            dom_path.setAttribute("d", `M ${pos_x},0 V ${last_y}`);
            this.#dom_svg.appendChild(dom_path);
        }
        for (let y = 1; y < size[1]; ++y) {
            const pos_y = y * cell_width;
            const dom_path = Utils.createSVGElement("path");
            dom_path.setAttribute("d", `M 0,${pos_y} H ${last_x}`);
            this.#dom_svg.appendChild(dom_path);
        }
    }
}