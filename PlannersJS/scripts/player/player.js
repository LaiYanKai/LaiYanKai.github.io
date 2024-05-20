"use strict";

UI.Player = class {
    /** from setInterval() for playback. @type {number}  */
    #handler;
    /** buffer of sprites that need to be revisualized. @type {Set<number>} */
    #vis_buffer;
    /** array of current index of each step rank. @type {number[]} */
    #step_idx_of_rank;
    /** array of number of steps for each step rank. @type {number[]} */
    #num_steps_in_rank;
    /** number of step ranks @type {number} */
    #num_ranks;
    /** array of steps  @type {UI.Steps[]}*/
    #steps; // array of UI.Steps

    /** Initializer */
    constructor() {
        if (ui.player)
            throw new Error(`ui.player has already been initialized.`);
        ui.player = this;

        this.unload();
        this.pause();
    }

    /** 
     * Prepares the player for parsing steps from a new algorithm .
     * @param {number} num_ranks The number of step ranks in an algorithm.
    */
    load(num_ranks) {
        if (!Utils.isFiniteNonNegativeInteger(num_ranks))
            throw new Error(`"num_ranks" has to be an finite non-negative integer. Got "${num_ranks}"`);

        this.#num_ranks = num_ranks;
        this.#step_idx_of_rank = Array(this.#num_ranks).fill(-1);
        this.#num_steps_in_rank = Array(this.#num_ranks).fill(0);
        this.#vis_buffer = new Set();
        this.#steps = [];
    }

    /** Clears the player and any step information. */
    unload() {
        this.#num_ranks = 0;
        this.#step_idx_of_rank = [];
        this.#num_steps_in_rank = [];
        this.#vis_buffer = new Set();
        this.#steps = [];
    }

    /** 
     * Gets the current step index for a step rank. 
     * @returns {number}
    */
    stepIdx(rank) { return this.#step_idx_of_rank[rank]; }

    /** 
     * Gets the number of steps for a step rank. 
     * @returns {number}
    */
    numSteps(rank) { return this.#num_steps_in_rank[rank]; }

    /** 
     * Revisualizes all modified sprites since the last call to vis(), 
     * and clears the visualization buffer. 
    */
    vis() {
        for (const sprite of this.#vis_buffer)
            sprite.vis();
        this.#vis_buffer.clear();
    }

    /** Pauses the player and revisualizes all moodified sprites. */
    pause() {
        if (this.#handler)
            clearInterval(this.#handler);
        this.#handler = null;
        this.vis();
    }

    /** 
     * Plays the player. 
     * @param {function} tool_step_changer accepts an input value that changes the value in ui.tool_step.
    */
    playForward(tool_step_changer) {
        this.pause();
        this.#handler = setInterval(
            (e) => {
                const is_last_step = this.#redoByRank(ui_states.rank) === false;
                this.vis();
                if (is_last_step)
                    ui.pause();
                tool_step_changer(this.stepIdx(ui_states.rank));
            },
            ui_params.play_interval);
    }

    /** 
     * Rewinds the player. 
     * @param {function} tool_step_changer accepts an input value that changes the value in ui.tool_step.
    */
    playReverse(tool_step_changer) {
        this.pause();
        this.#handler = setInterval(
            (e) => {
                const is_first_step = this.#undoByRank(ui_states.rank) === false;
                this.vis();
                if (is_first_step)
                    ui.pause();
                tool_step_changer(this.stepIdx(ui_states.rank));
            },
            ui_params.play_interval);
    }

    /**
     * Goes to the step corresponding to step_idx and rank 
      */
    gotoStep(rank, step_idx) {
        if (!Utils.isFiniteNonNegativeInteger(rank) || rank >= this.#num_ranks)
            throw new Error(`rank "${rank}" is not an integer or is out of range.`);

        if (!Utils.isFiniteNonNegativeInteger(rank) || step_idx >= this.#num_steps_in_rank[rank])
            throw new Error(`step_idx "${step_idx} is not an integer or is out of range."`)

        const curr_idx = this.stepIdx(rank);
        console.log(rank, this.#step_idx_of_rank);
        if (curr_idx >= step_idx)
            this.#undoByRankTo(rank, step_idx);
        else
            this.#redoByRankTo(rank, step_idx);
        console.log(this.#step_idx_of_rank);
        this.vis();
    }


    /** 
     * Undoes the smallest step. 
     * @returns {null | UI.Step} Returns null if at the first step.
     * Otherwise, returns the step before the current smallest step, 
    */
    #undo() {
        const from_idx = this.#step_idx_of_rank[0];
        if (from_idx <= 0)
            return null;

        const step = this.#steps[from_idx];

        for (let r = 0; r <= step.rank; ++r)
            --this.#step_idx_of_rank[r];

        for (const action of step.actions()) {
            action.undo();
            this.#vis_buffer.add(action.sprite);
        }

        return this.#steps[from_idx - 1];
    }

    /** 
     * Redoes the smallest step. 
     * @returns {null | UI.Step} Returns null if at the last step.
     * Otherwise, returns the step after current smallest step.
    */
    #redo() {
        const to_idx = this.#step_idx_of_rank[0] + 1;
        if (to_idx >= this.#num_steps_in_rank[0])
            return null;

        const next_step = this.#steps[to_idx];

        // increment the step indices for each affected rank.
        for (let r = 0; r <= next_step.rank; ++r)
            ++this.#step_idx_of_rank[r];

        // for each step, do all actions
        for (const action of next_step.actions()) {
            action.redo();
            this.#vis_buffer.add(action.sprite);
        }

        return next_step;
    }

    /** 
     * Undoes steps until a step with the rank is reached.
     * @param {number} rank the step rank to undo until.
     * @returns {boolean} Returns true if can be undone, false if reached the first step.
    */
    #undoByRank(rank) {
        while (1) {
            const new_step = this.#undo();
            if (new_step === null)
                return false; // reached the start

            if (new_step.rank >= rank)
                return true;
        }
    }

    /** 
     * Redoes steps until a step with the rank is reached.
     * @param {number} rank the step rank to redo until.
     * @returns {boolean} Returns true if can be redone, false if reached the last step.
    */
    #redoByRank(rank) {
        while (1) {
            const redone_step = this.#redo();
            if (redone_step === null)
                return false; // reached the start

            if (redone_step.rank >= rank)
                return true;
        }
    }

    /** Undo all actions until a step with the specified rank and index is reached
    * @param rank rank of the step to reach.
    * @param step_idx the index of the step (of the rank) to reach
    */
    #undoByRankTo(rank, step_idx) {
        while (1) {
            if (this.stepIdx(rank) === step_idx)
                break;
            if (this.#undoByRank(rank) === false)
                break; // redundancy
        }
    }

    /** redo all actions until a step is reached
     * @param rank rank of the step to reach.
     * @param step_idx the index of the step (of the rank) to reach
     */
    #redoByRankTo(rank, step_idx) {
        while (1) {
            if (this.stepIdx(rank) === step_idx)
                break;
            if (this.#redoByRank(rank) === false)
                break; // redundancy
        }
    }

    /** 
     * Registers a step, akin to closing the step.
     * The step should not be modified after it is registered. 
     * @param {UI.Step} step 
    */
    register(step) {
        for (let rank = 0; rank <= step.rank; ++rank) {
            ++this.#step_idx_of_rank[rank];

            if (this.numSteps(rank) <= this.stepIdx(rank))
                this.#num_steps_in_rank[rank] = this.stepIdx(rank) + 1;
        }
        Object.freeze(step);

        this.#steps.push(step);
    }
};
Object.seal(UI.Player);

UI.Step = class {
    #rank;
    #actions;

    get rank() { return this.#rank; }

    /** 
     * @param {number} rank the step rank
    */
    constructor(rank) {
        this.#actions = Array();
        this.changeRank(rank);
    }

    /** 
     * Registers an action associated with a sprite.
     * Does not modify the sprite. Useful for the initial step where sprite should is initialized somewhere else.
     * @param {UI.AbstractSprite | *} sprite Any sprite that is derived from UI.AbstractSprite.
     * @param {SpriteAction | number} action_id The action index for a sprite.
    */
    register(sprite, action_id) {
        this.#actions.push(new UI.Action(sprite, action_id));
    }

    /** 
     * Registers an action associated with a sprite and assigns the new action data into the sprite.
     * @param {UI.AbstractSprite | *} sprite Any sprite that is derived from UI.AbstractSprite.
     * @param {SpriteAction | number} action_id The action index for a sprite.
     * @param {*} new_action_data the new action data to register with the sprite.
    */
    registerWithData(sprite, action_id, new_action_data) {
        sprite.register(action_id, new_action_data);
        this.register(sprite, action_id);
    }

    /** 
     * Changes the rank of the step.
     *  @param {number} rank the step rank
    */
    changeRank(rank) { this.#rank = rank; }

    /** 
     * A generator that returns the actions. 
    */
    actions = function* () {
        for (const action of this.#actions)
            yield action;
    }
};
Object.freeze(UI.Step);

UI.Action = class {
    sprite;
    action_id;

    constructor(sprite, action_id) {
        this.sprite = sprite;
        this.action_id = action_id;
        Object.freeze(this);
    }

    redo() { this.sprite.redo(this.action_id); }

    undo() { this.sprite.undo(this.action_id); }
};
Object.freeze(UI.Action);

UI.AbstractLens = class {
    #min;
    #max;
    #canvas;
    #action_id;

    get canvas() { return this.#canvas; }
    get action_id() { return this.#action_id; }
    /**
     */
    constructor(canvas, action_id) {
        if (!(canvas instanceof UI.AbstractCanvas))
            throw new Error(`"canvas" should be an AbstractCanvas instance.`);
        if (!Number.isInteger(action_id))
            throw new Error(`"action_id" should be an integer, got ${action_id}.`);

        this.#canvas = canvas;
        this.#action_id = action_id;

        this.#min = Infinity;
        this.#max = -Infinity;
    }

    updateBounds(value) {
        if (value < this.#min)
            this.#min = value;
        else if (value > this.#max)
            this.#max = value;
    }

    // override
    vis() {
    }
};