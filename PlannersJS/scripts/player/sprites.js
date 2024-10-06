"use strict";

UI.AbstractSprite = class {
    dom;
    canvas_id;
    #history;
    #current;
    cls_base;

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
        this.cls_base = sprite_cls;
        this.canvas_id = canvas_id;

        Object.freeze(this.dom);
        Object.freeze(this.canvas_id);
        Object.freeze(this.cls_base);
    }

    /** Returns the current value of an operation. */
    value(action_id) {
        return this.#history[action_id][this.#current[action_id]];
    }

    /** 
     * Registers new data to the sprite with the option of checking duplicate entries.
     * @param {number} action_id
     * @param {*} new_data **Cannot be _undefined_**
     * @param {boolean} [allow_duplicates=false] Defaults to false. 
     * Set to _false_ to check if the previous entry is a duplicate of the current. If it is a duplicate, the data is not registered and false is returned. 
     * If set to _true_, new_data is registered and the function returns true.
     * @returns {boolean}
     */
    register(action_id, new_data, allow_duplicates = false) {
        if (new_data === undefined)
            throw new Error(`Registering new data as "undefined"`);

        if (!allow_duplicates) {
            const prev_data = this.value(action_id);
            if (prev_data === new_data)
                return false;
        }

        this.#current[action_id] = this.#history[action_id].length;
        this.#history[action_id].push(new_data);
        return true;
    }

    /** Increments the counter to the next historical state of an operation, 
     * Does nothing if the counter is at the last operation. */
    redo(action_id) {
        if (this.#current[action_id] < this.#history[action_id].length) {
            ++this.#current[action_id];
            return true;
        }
        return false;
    }

    /** Decrements the counter to the previous historical state of an operation.
     * Does nothing if the counter is at the -1 position.
    */
    undo(action_id) {
        if (this.#current[action_id] >= 0) {
            --this.#current[action_id];
            return true;
        }
        return false;
    }

    /** Returns true if displayed. Reuse this in derived classes */
    vis() {
    }
}

UI.SpriteCell = class extends UI.AbstractSprite {
    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteActionNode.length + num_extra_actions, "cell", false);
    }

    /** 
     * Visualizes the sprite.
     *  */
    vis() {
        const display = this.value(SpriteActionNode.Display);
        if (display === false) {
            this.dom.style.display = "none";
            return;
        }
        this.dom.style.removeProperty("display");
        this.dom.setAttribute("class", this.cls_base);

        // z-index
        this.dom.style.zIndex = this.value(SpriteActionNode.ZIndex);

        // class
        this.dom.classList.add(this.value(SpriteActionNode.Class));

        // outline
        const outline = this.value(SpriteActionNode.Outline);
        if (outline !== SpriteActionOutline.None)
            this.dom.classList.add(outline);

        // position and size, in pixel units
        let pos = this.value(SpriteActionNode.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteActionNode.Size);
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


UI.SpriteVertex = class extends UI.AbstractSprite {
    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteActionNode.length + num_extra_actions, "vtx", false);
    }

    /** 
     * Visualizes the sprite.
     *  */
    vis() {
        const display = this.value(SpriteActionNode.Display);
        if (display === false) {
            this.dom.style.display = "none";
            return;
        }
        this.dom.style.removeProperty("display");
        this.dom.setAttribute("class", this.cls_base);

        // class
        this.dom.classList.add(this.value(SpriteActionNode.Class));

        // outline
        const outline = this.value(SpriteActionNode.Outline);
        if (outline !== SpriteActionOutline.None)
            this.dom.classList.add(outline);

        // position and size, in pixel units
        let pos = this.value(SpriteActionNode.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteActionNode.Size);
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

UI.SpriteArrow = class extends UI.AbstractSprite {
    #dom_shape;

    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteActionArrow.length + num_extra_actions, "arw", true);

        // construct
        this.#dom_shape = Utils.createSVGElement("line");
        this.dom.appendChild(this.#dom_shape);

        const dom_cap = Utils.createSVGElement("polygon");
        this.dom.appendChild(dom_cap);
    }

    vis() {
        const display = this.value(SpriteActionArrow.Display);
        if (display === false) {
            this.dom.style.display = "none";
            return;
        }
        this.dom.style.removeProperty("display");
        this.dom.setAttribute("class", this.cls_base);

        const dom_cap = this.#dom_shape.nextSibling;

        // z-index
        this.dom.style.zIndex = this.value(SpriteActionArrow.ZIndex);

        // class
        for (const dom of [this.#dom_shape, dom_cap])
            dom.setAttribute("class", this.value(SpriteActionArrow.Class))

        // pos, size, mag and rad.
        let pos = this.value(SpriteActionArrow.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteActionArrow.Size);
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
        const halfw = 0.9 * mag - ui_params.arrow_cap
        dom_cap.setAttribute("points", `${halfw},0 ${halfw},${ui_params.arrow_cap} ${halfw + ui_params.arrow_cap},${ui_params.arrow_cap / 2}`);
    }
};

UI.SpriteLine = class extends UI.AbstractSprite {   //line
    #dom_shape;

    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteActionLine.length + num_extra_actions, "line", true);  

        // construct
        this.#dom_shape = Utils.createSVGElement("line");
        this.dom.appendChild(this.#dom_shape);
    }
    setLineStyle(style) {
        // Here you can define different styles, for now, let's handle 'dotted'
        switch (style) {
            case 'dotted':
                // This sets the line to be dotted. Adjust the numbers to change the pattern.
                this.#dom_shape.setAttribute("stroke-dasharray", "5, 5");
                break;
            default:
                // A default case to handle solid lines or any other styles
                this.#dom_shape.removeAttribute("stroke-dasharray");
        }
    }

    vis() {
        const display = this.value(SpriteActionLine.Display);
        if (display === false) {
            this.dom.style.display = "none";
            return;
        }
        this.dom.style.removeProperty("display");
        this.dom.setAttribute("class", this.cls_base);

       

        // class
        for (const dom of [this.#dom_shape])
            dom.setAttribute("class", this.value(SpriteActionLine.Class))


          // outline
        const outline = this.value(SpriteActionLine .Outline);
        if (outline === SpriteActionOutline.Dotted)
                this.#dom_shape.setAttribute("stroke-dasharray", "5, 5");
           
        // pos, size, mag and rad.
        let pos = this.value(SpriteActionLine.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteActionLine.Size);
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

   
    }
};
UI.SpriteCircle = class extends UI.AbstractSprite {   //circle
    #dom_shape;

    constructor(canvas_id, num_extra_actions) {
        super(canvas_id, SpriteActionCircle.length + num_extra_actions, "circle", true);  

        // construct
        this.#dom_shape = Utils.createSVGElement("circle");
        this.dom.appendChild(this.#dom_shape);
    }
    setLineStyle(style) {
        // Here you can define different styles, for now, let's handle 'dotted'
        switch (style) {
            case 'dotted':
                // This sets the circle to be dotted. Adjust the numbers to change the pattern.
                this.#dom_shape.setAttribute("stroke-dasharray", "5, 5");
                break;
            default:
                // A default case to handle solid circles or any other styles
                this.#dom_shape.removeAttribute("stroke-dasharray");
        }
    }

    vis() {
        const display = this.value(SpriteActionCircle.Display);
        if (display === false) {
            this.dom.style.display = "none";
            return;
        }
        this.dom.style.removeProperty("display");
        this.dom.setAttribute("class", this.cls_base);

       

        // class
        for (const dom of [this.#dom_shape])
            dom.setAttribute("class", this.value(SpriteActionCircle.Class))

        // pos, size, mag and rad.
        let pos = this.value(SpriteActionCircle.Position);
        pos = ui.gridToPx(pos);
        let size = this.value(SpriteActionCircle.Size);
        size = [
            size[0] * ui_params.cell_size,
            size[1] * ui_params.cell_size];

        // css based values
        this.#dom_shape.setAttribute("cx", 100/ 2);
        this.#dom_shape.setAttribute("cy", 10 / 2);
        this.#dom_shape.setAttribute("r", ui_params.arrow_cap / 2);

        // position
        pos[0] -= ui_params.arrow_width / 2;
        pos[1] -= ui_params.arrow_cap / 2;
        this.dom.style.inset = `${pos[1]}px auto auto ${pos[0]}px`;

        // size 
        const mag = Math.hypot(size[0], size[1]);
        this.#dom_shape.setAttribute("x2", ui_params.arrow_width / 2 + mag);
        const w = 1000 ;
        const h = 1000;
        this.dom.setAttribute("viewBox", `0 0 ${w} ${h}`);
        this.dom.setAttribute("width", w);
        this.dom.setAttribute("height", h);
        const rad = Math.atan2(-size[1], size[0]);
        this.dom.style.transform = `rotate(${rad}rad)`;

   
    }
};
