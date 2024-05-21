"use strict";

UI.AbstractSprite = class {
    dom;
    canvas_id;
    #history;
    #current;
    #cls_base;

    // Use sparingly, and reuse sprites as much as possible.
    constructor(canvas_id, num_operations, sprite_cls, is_svg) {
        this.#history = Array(num_operations);
        for (let i = 0; i < num_operations; ++i)
            this.#history[i] = Array();
        this.#current = Array(num_operations).fill(-1);

        // construct
        if (is_svg)
            this.dom = Utils.createSVGElement("svg");
        else
            this.dom = document.createElement("div");
        this.#cls_base = sprite_cls;
        this.canvas_id = canvas_id;

        Object.freeze(this.dom);
        Object.freeze(this.canvas_id);
        Object.freeze(this.#cls_base);
    }

    /** Returns the current value of an operation. */
    value(action_id) {
        return this.#history[action_id][this.#current[action_id]];
    }

    /** Registers an operation into the history, 
     * and increments the counter associated with the operation. */
    register(action_id, new_data) {
        this.#current[action_id] = this.#history[action_id].length;
        this.#history[action_id].push(new_data);
    }

    /** Increments the counter to the next historical state of an operation, 
     * Does nothing if the counter is at the last operation. */
    redo(action_id) {
        if (this.#current[action_id] < this.#history[action_id].length - 1)
            ++this.#current[action_id];
    }

    /** Decrements the counter to the previous historical state of an operation.
     * Does nothing if the counter is at the current position.
    */
    undo(action_id) {
        if (this.#current[action_id] > 0)
            --this.#current[action_id];
    }

    /** Sets all operation counters to 0. */
    undoAll() {
        for (let o = 0; o < this.#current.length; ++o)
            this.#current[o] = 0;
    }

    /** Sets all operation counters to the end. */
    redoAll() {
        for (let o = 0; o < this.#current.length; ++o)
            this.#current[o] = this.#history[o].length - 1;
    }

    /** Returns true if displayed. Reuse this in derived classes */
    vis() {
        const display = this.value(SpriteAction.Display);
        if (display === false) {
            this.dom.style.display = "none";
            return false;
        }
        else {
            this.dom.style.removeProperty("display");
            this.dom.setAttribute("class", this.#cls_base);

            // z-index
            this.dom.style.zIndex = this.value(SpriteAction.ZIndex);
            return true;
        }
    }
}

UI.AbstractSpriteCell = class extends UI.AbstractSprite {
    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteAction.length + num_extra_actions, "cell", false);
    }

    /** 
     * Visualizes the sprite.
     *  */
    vis() {
        if (!super.vis())
            return; //not displayed

        // class
        this.dom.classList.add(this.value(SpriteAction.Class));

        // outline
        const outline = this.value(SpriteAction.Outline);
        if (outline !== SpriteActionOutline.None)
            this.dom.classList.add(outline);

        // position and size, in pixel units
        let pos = this.value(SpriteAction.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteAction.Size);
        size = [
            Math.abs(size[0] * ui_params.cell_size),
            Math.abs(size[1] * ui_params.cell_size)];

        // position
        pos[0] -= size[0] / 2;
        pos[1] -= size[1] / 2;
        this.dom.style.inset = `${pos[1]}px auto auto ${pos[0]}px`;

        //size 
        this.dom.style.width = `${size[0]}px`;
        this.dom.style.height = `${size[1]}px`;
    }
};


UI.AbstractSpriteVertex = class extends UI.AbstractSprite {
    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteAction.length + num_extra_actions, "vtx", false);
    }

    /** 
     * Visualizes the sprite.
     *  */
    vis() {
        if (!super.vis())
            return; //not displayed

        // class
        this.dom.classList.add(this.value(SpriteAction.Class));

        // outline
        const outline = this.value(SpriteAction.Outline);
        if (outline !== SpriteActionOutline.None)
            this.dom.classList.add(outline);

        // position and size, in pixel units
        let pos = this.value(SpriteAction.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteAction.Size);
        size = [
            Math.abs(size[0] * ui_params.cell_size),
            Math.abs(size[1] * ui_params.cell_size)];

        // position
        pos[0] -= size[0] / 2;
        pos[1] -= size[1] / 2;
        this.dom.style.inset = `${pos[1]}px auto auto ${pos[0]}px`;

        //size 
        this.dom.style.width = `${size[0]}px`;
        this.dom.style.height = `${size[1]}px`;
    }
};

UI.AbstractSpriteArrow = class extends UI.AbstractSprite {
    #dom_shape;

    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteAction.length + num_extra_actions, "arw", true);

        // construct
        this.#dom_shape = Utils.createSVGElement("line");
        this.dom.appendChild(this.#dom_shape);

        const dom_cap = Utils.createSVGElement("polygon");
        this.dom.appendChild(dom_cap);
    }

    vis() {
        if (!super.vis())
            return;

        const dom_cap = this.#dom_shape.nextSibling;

        // class
        for (const dom of [this.#dom_shape, dom_cap])
            dom.setAttribute("class", this.value(SpriteAction.Class))

        // pos, size, mag and rad.
        let pos = this.value(SpriteAction.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteAction.Size);
        size = [
            size[0] * ui_params.cell_size,
            size[1] * ui_params.cell_size];

        // css based values
        this.#dom_shape.setAttribute("x1", ui_params.arrow_width / 2);
        this.#dom_shape.setAttribute("y1", ui_params.arrow_cap / 2);
        this.#dom_shape.setAttribute("y2", ui_params.arrow_cap / 2);

        // position
        pos[0] -= ui_params.arrow_width / 2;
        pos[1] -= ui_params.arrow_cap / 2;
        this.dom.style.inset = `${pos[1]}px auto auto ${pos[0]}px`;

        // size 
        const mag = Math.hypot(size[0], size[1]);
        this.#dom_shape.setAttribute("x2", ui_params.arrow_width / 2 + mag);
        const w = ui_params.arrow_width + mag;
        const h = ui_params.arrow_cap;
        this.dom.setAttribute("viewBox", `0 0 ${w} ${h}`);
        this.dom.setAttribute("width", w);
        this.dom.setAttribute("height", h);
        const rad = Math.atan2(-size[1], size[0]);
        this.dom.style.transform = `rotate(${rad}rad)`;

        // arrow
        // const halfw = 0.5 * (ui_params.arrow_width + mag + ui_params.arrow_cap);
        const halfw = 0.9*mag - ui_params.arrow_cap
        dom_cap.setAttribute("points", `${halfw},0 ${halfw},${ui_params.arrow_cap} ${halfw + ui_params.arrow_cap},${ui_params.arrow_cap / 2}`);
    }
};