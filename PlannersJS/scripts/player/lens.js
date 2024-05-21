
UI.AbstractLens = class {
    #min;
    #max;
    action_id;
    #canvas;
    option_text;
    option_label;

    get min() { return this.#min; }
    get max() { return this.#max; }

    /**
     * 
     * @param {AbstractCanvas} canvas 
     * @param {number} action_id 
     * @param {string} option_text
     * @param {string} option_label
     */
    constructor(canvas, action_id, option_text, option_label) {
        if (canvas instanceof UI.AbstractCanvas === false)
            throw new TypeError(`"canvas" must be an instance of AbstractCanvas`);
        if (!Number.isNaN(action_id) && !Utils.isFiniteNonNegativeInteger(action_id))
            throw new RangeError(`"action_id" must be an integer >= 0. NaN for unassociated lenses.`)
        if (typeof option_text !== "string")
            throw new TypeError(`"option_text" must be a string`);
        if (typeof option_label !== "string")
            throw new TypeError(`"option_label" must be a string`);

        this.#min = Infinity;
        this.#max = -Infinity;
        this.#canvas = canvas;
        this.action_id = action_id;
        this.option_text = option_text;
        this.option_label = option_label;

        for (const prop of ["#canvas", "#action_id", "option_text", "option_label"])
            Object.freeze(this[prop]);
    }

    /** Updates the bounds of the value */
    updateBounds(value) {
        if (value < this.#min) {
            this.#min = value;
        }
        if (value > this.#max) {
            this.#max = value;
        }
    }

    lensCanvas() {
        for (const [id, sprite] of this.#canvas.sprites())
            this.lensSprite(sprite);
    }

    lensSprite(sprite) { return sprite.canvas_id === this.#canvas.canvas_id; }
};

UI.LensRainbow = class extends UI.AbstractLens {
    /**
    * 
    * @param {UI.AbstractCanvas} canvas 
    * @param {number} action_id 
    * @param {string} option_text
    * @param {string} option_label
    */
    constructor(canvas, action_id, option_text, option_label) {
        super(canvas, action_id, option_text, option_label);
    }

    lensSprite(sprite) {
        if (!super.lensSprite(sprite)) // not the same id.
            return;
        const value = sprite.value(this.action_id);
        if (Number.isFinite(value) && !Number.isNaN(value)) {
            const hue = Math.round(300 * (this.max - value) / (this.max - this.min));
            sprite.dom.style.borderColor = `hsla(${hue},90%,40%)`;
            sprite.dom.style.background = `hsla(${hue},80%,50%)`;
        }
        else {
            sprite.dom.style.removeProperty("background");
            sprite.dom.style.removeProperty("border-color");
        }
    }
};

UI.LensNone = class extends UI.AbstractLens {
    /**
    * 
    * @param {AbstractCanvas} canvas 
    * @param {string} option_text
    * @param {string} option_label
    */
    constructor(canvas, option_text, option_label) {
        super(canvas, NaN, option_text, option_label);
    }

    lensSprite(sprite) {
        if (!super.lensSprite(sprite)) // not the same id.
            return;
        sprite.dom.style.removeProperty("background");
        sprite.dom.style.removeProperty("border-color");
    }
};