"use strict";

UI.AbstractCanvas = class {
    dom;
    #sprites;
    #sprite_class;
    #sprite_args;

    /**
     * @param {UI.AbstractSprite} sprite_class 
     * @param  {...any} sprite_args 
     */
    constructor(sprite_class, ...sprite_args) {
        this.dom = document.createElement("div");
        this.dom.className = "sprites";
        this.#sprites = new Map();
        this.#sprite_class = sprite_class;
        this.#sprite_args = sprite_args;
        Object.freeze(this.dom);
    }

    /** Adds a sprite into the layer */
    add(id) {
        const sprite = new this.#sprite_class(...this.#sprite_args);
        this.dom.appendChild(sprite.dom_svg);
        this.#sprites.set(id, sprite);
        return sprite;
    }

    /** Gets the sprite with an id */
    sprite(id) {
        // if (!this.#sprites.has(id))
        //     throw new Error(`No sprite with id "${id}"`);
        return this.#sprites.get(id);
    }

    /** generator for sprite */
    sprites = function* () {
        for (const [id, sprite] of this.#sprites)
            yield [id, sprite];
    }
};
Object.seal(UI.AbstractCanvas);

UI.AbstractCanvasCell = class extends UI.AbstractCanvas {

    /** 
     * Initializes a canvas with sprites based on the size
     * @param {[number, number]} size number of x cells and y cells.
     * */
    constructor(...sprite_args) {
        super(UI.AbstractSpriteCell, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0,
        outline = SpriteActionOutline.None) {
        const sprite = super.add(id);
        sprite.register(
            SpriteAction.Position,
            [coord[0] + 0.5, coord[1] + 0.5]);
        sprite.register(
            SpriteAction.Size,
            [ui_params.sprite_cell_scale, ui_params.sprite_cell_scale]);
        sprite.register(
            SpriteAction.Display,
            display);
        sprite.register(
            SpriteAction.Class,
            sprite_class);
        sprite.register(
            SpriteAction.ZIndex,
            z_index);
        sprite.register(
            SpriteAction.Outline,
            outline);
        return sprite;
    }
};
Object.seal(UI.AbstractCanvasCell);


UI.AbstractCanvasVertex = class extends UI.AbstractCanvas {

    /** 
     * Initializes a canvas with sprites based on the size
     * @param {[number, number]} size number of x vertices and y vertices.
     * */
    constructor(...sprite_args) {
        super(UI.AbstractSpriteVertex, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0,
        outline = SpriteActionOutline.None) {
        const sprite = super.add(id);
        sprite.register(SpriteAction.Position,
            coord);
        sprite.register(SpriteAction.Size,
            [ui_params.sprite_vertex_scale, ui_params.sprite_vertex_scale]);
        sprite.register(SpriteAction.Display,
            display);
        sprite.register(SpriteAction.Class,
            sprite_class);
        sprite.register(SpriteAction.ZIndex,
            z_index);
        sprite.register(SpriteAction.Outline,
            outline);
        return sprite;
    }
};
Object.seal(UI.AbstractCanvasVertex);


UI.AbstractCanvasArrow = class extends UI.AbstractCanvas {
    /** 
     * Initializes a canvas for adding arrows that can only occur from each cell (e.g. arrows that point from the cell to a parent).
     * */
    constructor(...sprite_args) {
        super(UI.AbstractSpriteArrow, ...sprite_args);
        Object.freeze(this);
    }

    add(id, coord, size, display = false,
        sprite_class = SpriteActionClass.Transparent,
        z_index = 0) {
        const sprite = super.add(id);
        sprite.register(SpriteAction.Position,
            coord);
        sprite.register(SpriteAction.Size,
            size);
        sprite.register(SpriteAction.Display,
            display);
        sprite.register(SpriteAction.Class,
            sprite_class);
        sprite.register(SpriteAction.ZIndex,
            z_index);
        // arrow does not have outline
        // sprite.register(
        //     SpriteAction.Outline,
        //     false);
        return sprite;
    }
};
Object.seal(UI.AbstractCanvasArrow);