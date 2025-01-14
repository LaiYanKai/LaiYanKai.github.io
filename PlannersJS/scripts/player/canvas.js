"use strict";

UI.AbstractCanvas = class {
    canvas_id; // required to make sure a sprite belongs to a canvas
    dom;
    #sprites;
    #sprite_class;
    #sprite_args;

    /**
     * @param {number} canvas_id a non-negative integer >= 0
     * @param {UI.AbstractSprite | *} sprite_class 
     * @param  {...any} sprite_args 
     */
    constructor(canvas_id, sprite_class, ...sprite_args) {
        this.dom = document.createElement("div");
        this.dom.className = "sprites";
        this.#sprites = new Map();
        this.#sprite_class = sprite_class;
        this.#sprite_args = sprite_args;
        this.canvas_id = canvas_id;

        for (const prop of ["canvas_id", "dom", "#sprite_class", "#sprite_args"])
            Object.freeze(this[prop]);
    }

    /** 
     * Adds a sprite into the layer 
     * @param {number} id 
     * @returns {UI.AbstractSprite | *}
     */
    add(id) {
        const sprite = new this.#sprite_class(this.canvas_id, ...this.#sprite_args);
        this.dom.appendChild(sprite.dom);
        this.#sprites.set(id, sprite);
        return sprite;
    }
  

    /** 
     * Gets the sprite with an id 
     * @param {number} id
     * @returns {UI.AbstractSprite | *}
     */
    sprite(id) {
        // if (!this.#sprites.has(id))
        //     throw new Error(`No sprite with id "${id}"`);
        return this.#sprites.get(id);
    }

    /** generator for sprite 
     * @yields {[number, (UI.AbstractSprite | *)]} The id of the sprite and the sprite
    */
    *sprites() {
        for (const [id, sprite] of this.#sprites)
            yield [id, sprite];
    }
};

UI.AbstractCanvasCell = class extends UI.AbstractCanvas {

    /** 
     * Initializes a canvas with sprites based on the size
     * @param {[number, number]} size number of x cells and y cells.
     * */
    constructor(canvas_id, ...sprite_args) {
        super(canvas_id, UI.SpriteCell, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0,
        outline = SpriteActionOutline.None) {
        const sprite = super.add(id);
        sprite.register(
            SpriteActionNode.Position,
            [coord[0] + 0.5, coord[1] + 0.5]);
        sprite.register(
            SpriteActionNode.Size,
            [ui_params.sprite_cell_scale, ui_params.sprite_cell_scale]);
        sprite.register(
            SpriteActionNode.Display,
            display);
        sprite.register(
            SpriteActionNode.Class,
            sprite_class);
        sprite.register(
            SpriteActionNode.ZIndex,
            z_index);
        sprite.register(
            SpriteActionNode.Outline,
            outline);
        return sprite;
    }
};


UI.AbstractCanvasVertex = class extends UI.AbstractCanvas {

    /** 
     * Initializes a canvas with sprites based on the size
     * @param {[number, number]} size number of x vertices and y vertices.
     * */
    constructor(canvas_id, ...sprite_args) {
        super(canvas_id, UI.SpriteVertex, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0,
        outline = SpriteActionOutline.None) {
        const sprite = super.add(id);
        sprite.register(SpriteActionNode.Position,
            coord);
        sprite.register(SpriteActionNode.Size,
            [ui_params.sprite_vertex_scale, ui_params.sprite_vertex_scale]);
        sprite.register(SpriteActionNode.Display,
            display);
        sprite.register(SpriteActionNode.Class,
            sprite_class);
        sprite.register(SpriteActionNode.ZIndex,
            z_index);
        sprite.register(SpriteActionNode.Outline,
            outline);
        return sprite;
    }
};


UI.AbstractCanvasArrow = class extends UI.AbstractCanvas {
    /** 
     * Initializes a canvas for adding arrows that can only occur from each cell (e.g. arrows that point from the cell to a parent).
     * */
    constructor(canvas_id, ...sprite_args) {
        super(canvas_id, UI.SpriteArrow, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, size, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0) {
        const sprite = super.add(id);
        sprite.register(SpriteActionNode.Position,
            coord);
        sprite.register(SpriteActionNode.Size,
            size);
        sprite.register(SpriteActionNode.Display,
            display);
        sprite.register(SpriteActionNode.Class,
            sprite_class);
        sprite.register(SpriteActionNode.ZIndex,
            z_index);
        // arrow does not have outline
        // sprite.register(
        //     SpriteActionNode.Outline,
        //     false);
        return sprite;
    }
};

UI.AbstractCanvasLine = class extends UI.AbstractCanvas {
    /** 
     * Initializes a canvas for adding arrows that can only occur from each cell (e.g. arrows that point from the cell to a parent).
     * */
    constructor(canvas_id, ...sprite_args) {
        super(canvas_id, UI.SpriteLine, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, size, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0, outline = SpriteActionOutline.None) {
        const sprite = super.add(id);
        sprite.register(SpriteActionNode.Position,
            coord);
        sprite.register(SpriteActionNode.Size,
            size);
        sprite.register(SpriteActionNode.Display,
            display);
        sprite.register(SpriteActionNode.Class,
            sprite_class);
        sprite.register(SpriteActionNode.ZIndex,
            z_index);
        // arrow does not have outline
        sprite.register(
            SpriteActionNode.Outline,
            outline);
        return sprite;
    }
};
UI.AbstractCanvasCircle = class extends UI.AbstractCanvas {
    /** 
     * Initializes a canvas for adding arrows that can only occur from each cell (e.g. arrows that point from the cell to a parent).
     * */
    constructor(canvas_id, ...sprite_args) {
        super(canvas_id, UI.SpriteCircle, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, size, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0) {
        const sprite = super.add(id);
        sprite.register(SpriteActionNode.Position,
            coord);
        sprite.register(SpriteActionNode.Size,
            size);
        sprite.register(SpriteActionNode.Display,
            display);
        sprite.register(SpriteActionNode.Class,
            sprite_class);
        sprite.register(SpriteActionNode.ZIndex,
            z_index);
        // arrow does not have outline
        // sprite.register(
        //     SpriteActionNode.Outline,
        //     false);
        return sprite;
    }
};