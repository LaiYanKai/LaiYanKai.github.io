"use strict";

UI.AbstractSprite = class {
    dom_svg;
    #history;
    #current;

    // Use sparingly, and reuse sprites as much as possible.
    constructor(num_operations, sprite_class_name) {
        this.#history = Array(num_operations);
        for (let i = 0; i < num_operations; ++i)
            this.#history[i] = Array();
        this.#current = Array(num_operations).fill(-1);

        // construct
        this.dom_svg = Utils.createSVGElement("svg");
        this.dom_svg.className.baseVal = sprite_class_name;

        Object.freeze(this.dom_svg);
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
            this.dom_svg.style.display = "none";
            return false;
        }
        else {
            this.dom_svg.style.removeProperty("display");

            // z-index
            this.dom_svg.style.zIndex = this.value(SpriteAction.ZIndex);
            return true;
        }
    }
}

UI.AbstractSpriteCell = class extends UI.AbstractSprite {
    #dom_shape;

    constructor(num_extra_actions) {
        super(SpriteAction.length + num_extra_actions, "cell");

        // construct
        this.#dom_shape = Utils.createSVGElement("rect");
        this.dom_svg.appendChild(this.#dom_shape);
    }

    /** 
     * Visualizes the sprite.
     *  */
    vis() {
        if (!super.vis())
            return; //not displayed

        // class
        this.#dom_shape.setAttribute("class", this.value(SpriteAction.Class))
        
        // outline
        const outline = this.value(SpriteAction.Outline);
        if (outline !== SpriteActionOutline.None)
            this.#dom_shape.classList.add(outline);

        // position and size, in pixel units
        let pos = this.value(SpriteAction.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteAction.Size);
        size = [
            Math.abs(size[0] * ui_params.cell_size),
            Math.abs(size[1] * ui_params.cell_size)];

        // css based values
        this.#dom_shape.setAttribute("x", ui_params.cell_border_width / 2);
        this.#dom_shape.setAttribute("y", ui_params.cell_border_width / 2);
        this.#dom_shape.setAttribute("rx", ui_params.cell_border_radius);
        this.#dom_shape.setAttribute("ry", ui_params.cell_border_radius);

        // position
        pos[0] -= size[0] / 2;
        pos[1] -= size[1] / 2;
        this.dom_svg.style.inset = `${pos[1]}px auto auto ${pos[0]}px`;

        //size 
        this.dom_svg.setAttribute("viewBox", `0 0 ${size[0]} ${size[1]}`);
        this.dom_svg.setAttribute("width", size[0]);
        this.dom_svg.setAttribute("height", size[1]);
        this.#dom_shape.setAttribute("width", size[0] - ui_params.cell_border_width);
        this.#dom_shape.setAttribute("height", size[1] - ui_params.cell_border_width);
    }
};


UI.AbstractSpriteVertex = class extends UI.AbstractSprite {
    #dom_shape;

    constructor(num_extra_actions) {
        super(SpriteAction.length + num_extra_actions, "vtx");

        // construct
        this.#dom_shape = Utils.createSVGElement("ellipse");
        this.dom_svg.appendChild(this.#dom_shape);
    }

    /** 
     * Visualizes the sprite.
     *  */
    vis() {
        if (!super.vis())
            return; //not displayed

        // class
        this.#dom_shape.setAttribute("class", this.value(SpriteAction.Class))

        // outline
        const outline = this.value(SpriteAction.Outline);
        if (outline !== SpriteActionOutline.None)
            this.#dom_shape.classList.add(outline);

        // position and size, in pixel units
        let pos = this.value(SpriteAction.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteAction.Size);
        size = [
            Math.abs(size[0] * ui_params.cell_size),
            Math.abs(size[1] * ui_params.cell_size)];

        // circle attributes (position)
        this.#dom_shape.setAttribute("cx", size[0] / 2);
        this.#dom_shape.setAttribute("cy", size[1] / 2);

        // position
        pos[0] -= size[0] / 2;
        pos[1] -= size[1] / 2;
        this.dom_svg.style.inset = `${pos[1]}px auto auto ${pos[0]}px`;

        //size 
        this.dom_svg.setAttribute("viewBox", `0 0 ${size[0]} ${size[1]}`);
        this.dom_svg.setAttribute("width", size[0]);
        this.dom_svg.setAttribute("height", size[1]);
        this.#dom_shape.setAttribute("rx", (size[0] - ui_params.cell_border_width) / 2);
        this.#dom_shape.setAttribute("ry", (size[1] - ui_params.cell_border_width) / 2);
    }
};

UI.AbstractSpriteArrow = class extends UI.AbstractSprite {
    #dom_shape;

    constructor(num_extra_actions) {
        super(SpriteAction.length + num_extra_actions, "arw");

        // construct
        this.#dom_shape = Utils.createSVGElement("line");
        this.dom_svg.appendChild(this.#dom_shape);

        const dom_cap = Utils.createSVGElement("polygon");
        this.dom_svg.appendChild(dom_cap);
    }

    vis() {
        if (!super.vis())
            return;

        const dom_cap = this.#dom_shape.nextSibling;

        // class
        const class_name = this.value(SpriteAction.Class);
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
        this.dom_svg.style.inset = `${pos[1]}px auto auto ${pos[0]}px`;

        // size 
        const mag = Math.hypot(size[0], size[1]);
        this.#dom_shape.setAttribute("x2", ui_params.arrow_width / 2 + mag);
        const w = ui_params.arrow_width + mag;
        const h = ui_params.arrow_cap;
        this.dom_svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        this.dom_svg.setAttribute("width", w);
        this.dom_svg.setAttribute("height", h);
        const rad = Math.atan2(-size[1], size[0]);
        this.dom_svg.style.transform = `rotate(${rad}rad)`;

        // arrow
        const halfw = 0.5 * (ui_params.arrow_width + mag - 2 * ui_params.arrow_cap);
        dom_cap.setAttribute("points", `${halfw},0 ${halfw},${ui_params.arrow_cap} ${halfw + ui_params.arrow_cap},${ui_params.arrow_cap / 2}`);
    }
};