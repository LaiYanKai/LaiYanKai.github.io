"use strict";

Algs.BFSCanvasCell = class extends UI.AbstractCanvasCell {
    constructor() {
        super(0, BFSAction.length);
    }

    add(status, ...abstract_canvas_cell_args) {
        const sprite = super.add(...abstract_canvas_cell_args);
        sprite.register(BFSAction.Status, status);
        sprite.dom.addEventListener(
            "mousemove", this.#setTip.bind(this, sprite), false);
        sprite.dom.addEventListener(
            "mouseout", ui.tooltip.hide.bind(ui.tooltip), false);
        return sprite;
    }

    #setTip(sprite, e) {
        const pos = Utils.subtractCoords(
            sprite.value(SpriteActionNode.Position), [0.5, 0.5]);
        const status = sprite.value(BFSAction.Status);
        let status_str;
        if (status === BFSNodeStatus.Queued)
            status_str = "Queued";
        else if (status === BFSNodeStatus.Expanding)
            status_str = "Expanding";
        else if (status === BFSNodeStatus.Visited)
            status_str = "Visited";
        else if (status === BFSNodeStatus.Undiscovered)
            status_str = "Undiscovered";
        else if (status === BFSNodeStatus.Path)
            status_str = "Path!";
       
        const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\n`;
        ui.tooltip.setTip(
            TooltipPosition.Right,
            message,
            sprite.dom,
        );
    }
};

Algs.BFSCanvasVertex = class extends UI.AbstractCanvasVertex {
    /** @type {UI.Tooltip} */
    constructor() {
        super(0, BFSAction.length);
    }

    add( status, ...abstract_canvas_cell_args) {
        const sprite = super.add(...abstract_canvas_cell_args);
        sprite.register(BFSAction.Status, status);
        sprite.dom.addEventListener(
            "mousemove", this.#setTip.bind(this, sprite), false);
        sprite.dom.addEventListener(
            "mouseout", ui.tooltip.hide.bind(ui.tooltip), false);
        return sprite;
    }

    #setTip(sprite, e) {
        const pos = sprite.value(SpriteActionNode.Position);
        const status = sprite.value(BFSAction.Status);
        let status_str;
        if (status === BFSNodeStatus.Queued)
            status_str = "Queued";
        else if (status === BFSNodeStatus.Expanding)
            status_str = "Expanding";
        else if (status === BFSNodeStatus.Visited)
            status_str = "Visited";
        else if (status === BFSNodeStatus.Undiscovered)
            status_str = "Undiscovered";
        else if (status === BFSNodeStatus.Path)
            status_str = "Path!";
        const message = `(${pos[0]}, ${[pos[1]]})\n${status_str}\n`;
        ui.tooltip.setTip(
            TooltipPosition.Right,
            message,
            sprite.dom,
        );
    }
}


Algs.BFSNode = class extends Algs.AbstractQueueNode {

    constructor(coord, sprite) {
        super(coord, 0, sprite);
    }
}


Algs.BFS = class extends Algs.AbstractGridAlg {
    /** @type {Algs.AbstractQueue} */
    #queue;
    /** @type {Map<Algs.BFSNode} */
    #nodes;
    /** @returns {UI.AbstractCanvasArrow} */
    get #canvas_arrows() { return this.canvas(1); }
    /** @returns {Algs.BFSCanvasCell | Algs.BFSCanvasVertex} */
    get #canvas_nodes() { return this.canvas(0); }
    /** @type{UI.Step} */
    #step; // current step
    /** @type{Array<[number, number]>} */
    #path;

    constructor(alg_params) {
        super(["1: Smallest", "2: Every Expansion"], 1, alg_params);

        // Set up canvases
        let size;
        const canvases = Array(2);
        if (alg_params.node_type === AlgNodeType.Cell) {
            canvases[0] = new Algs.BFSCanvasCell();
            this.#addArrow = this.#addArrowCell;
            size = ui_states.size;
        }
        else if (alg_params.node_type === AlgNodeType.Vertex) {
            canvases[0] = new Algs.BFSCanvasVertex();
            this.#addArrow = this.#addArrowVertex;
            size = Utils.addCoords(ui_states.size, [1, 1]);
        }
        canvases[1] = new UI.AbstractCanvasArrow(1, 0); // put arrows above the nodes
        super.setCanvases(canvases);

        // Check h_weight and g_weight
       
        // Set up lenses
        const lenses = [
            new UI.LensNone(this.#canvas_nodes, "None", "None"),
        ];
        super.setLenses(lenses, 0);

        // Set up Queue
        this.#queue = new Algs.AbstractQueue();

        // Set up Nodes and Sprites
        this.#nodes = new Map();
        for (let x = 0; x < size[0]; ++x) {
            for (let y = 0; y < size[1]; ++y) {
                const coord = [x, y];
                const id = this.serialize(coord);
            
                const sprite = this.#canvas_nodes.add(
                    BFSNodeStatus.Undiscovered,
                    id, coord,
                    true,
                    SpriteActionClass.Transparent,
                    0,
                    SpriteActionOutline.None);
                
                sprite.vis(); // sprites are not visualized at the first step.
                const node = new Algs.BFSNode(coord,sprite, null);
                this.#nodes.set(id, node);
            }
        }

    }

    run() {
        this.#path = [];

        // Create an initial step
        this.#newMjrStep();

        // Set up start node
        let xpd_node = this.#nodes.get(this.serialize(this.coord_start));

        xpd_node.parent = null;
        this.#queueNode(xpd_node);


        this.#closeStep();

        // prev_nb_node for visualization purposes
        let prev_nb_node = null;
        while (this.#queueFilled()) {
            this.#newMjrStep();
            this.#visualizeNeighbors(prev_nb_node, null);
            prev_nb_node = null;
            this.#visualizeClosed(xpd_node);

            xpd_node = this.#pollNode();
            this.#visualizeExpanded(xpd_node);

            if (this.#goalReached(xpd_node))  // will close current step if goal reached
                break;

            this.#closeStep();

            // there is no need to check if node is visited.
            for (const nb of this.getNb(xpd_node)) {
                this.#newMnrStep();

                // get neighbor node first for visualization purposes.
                let nb_coord, nb_id, nb_node = null; // null if out of map.
                if (nb.in_map === true) {
                    nb_coord = Utils.addCoords(xpd_node.coord, nb.dir);
                    nb_id = this.serialize(nb_coord);
                    nb_node = this.#nodes.get(nb_id);
                }

                this.#visualizeNeighbors(prev_nb_node, nb_node);
                prev_nb_node = nb_node;
                // continue if node is inaccessible.
                if (this.#nbNodeAccessible(nb) === true&& nb_node.parent === null) {
                    nb_node.parent = xpd_node;
                    this.#visualizeParent(nb_node, null, xpd_node);
                    this.#queueNode(nb_node);
                }
                

                this.#closeStep();
            }
        }

        // Required to remove cyclic references for garbage collection
        // this.#queue.clear();

        if (this.#path.length === 0)
            console.log("no path!");

    }

    

    #changeParent(node, new_parent_node) {
        this.#visualizeParent(node, node.parent, new_parent_node);
        node.parent = new_parent_node;
    }

    #queueNode(node) {
        if (this.#queue.insert(node) === -1) {    // visited
        }
        else {   // newly queued
            this.#visualizeOpened(node);
        }
    }

    #queueFilled() {
        const is_filled = this.#queue.filled();
 
        return is_filled;
    }

    #pollNode() {
        const xpd_node = this.#queue.pop();
        return xpd_node;
    }

    #goalReached(xpd_node) {
        if (Utils.equalIntegerCoords(xpd_node.coord, this.coord_goal)) {
            this.#closeStep();
            this.#newMnrStep();

            this.#path = [];
            let count = 0;
            while (count < 600) {
                count++;
                this.#path.push(xpd_node.coord);
                this.#visualizeFoundPathSegment(xpd_node);
                if (Utils.equalIntegerCoords(xpd_node.coord, this.coord_start)) {
                    this.#step.changeRank(this.num_ranks - 1);
                    this.#closeStep();
                    break;
                }
                this.#closeStep();
                this.#newMnrStep();
                xpd_node = xpd_node.parent; // reuse xpd_node
            }
            console.log("path", this.#path);
        }
        return this.#path.length > 0; // else
    }

    /**
     * 
     * @param {Algs.BFSNode} xpd_node 
     * @param {Algs.GridAlgNeighbor} nb 
     */
    #nbNodeAccessible(nb) {
        if (nb.node_access === true) {
            return true;
        }
        else {
            if (nb.node_chblocked === true) {   // true only if checkerboard is allowed

            }
            else if (nb.in_map === false) {

            }
            return false;
        }
    }


    // ============== Steps and Visualization methods=======================
    #newMjrStep() {
        this.#step = new UI.Step(1);
    }
    #newMnrStep() {
        this.#step = new UI.Step(0);
    }

    #visualizeExpanded(node) {
        this.#step.registerWithData(node.sprite, SpriteActionNode.Class, SpriteActionClass.Red);
        this.#step.registerWithData(node.sprite, BFSAction.Status, BFSNodeStatus.Expanding);

        const id = this.serialize(node.coord);
        const sprite = this.#canvas_arrows.sprite(id);
        if (sprite) {
            this.#step.registerWithData(sprite,
                SpriteActionArrow.Class,
                SpriteActionClass.Blue);
        }
    }

    #visualizeOpened(node) {
        this.#step.registerWithData(node.sprite, SpriteActionNode.Class, SpriteActionClass.Orange);
        this.#step.registerWithData(node.sprite, BFSAction.Status, BFSNodeStatus.Queued);
    }

    #visualizeClosed(node) {
        this.#step.registerWithData(node.sprite, SpriteActionNode.Class, SpriteActionClass.Blue);
        this.#step.registerWithData(node.sprite, BFSAction.Status, BFSNodeStatus.Visited);
    }

    #addArrow;
    #addArrowCell(id, node, new_parent) {
        return this.#canvas_arrows.add(
            id,
            Utils.addCoords(node.coord, [0.5, 0.5]),
            Utils.subtractCoords(new_parent.coord, node.coord),
            false,
            SpriteActionClass.Orange,
            0);
    }
    #addArrowVertex(id, node, new_parent) {
        return this.#canvas_arrows.add(
            id,
            node.coord,
            Utils.subtractCoords(new_parent.coord, node.coord),
            false,
            SpriteActionClass.Orange,
            0);
    }

    #visualizeParent(node, old_parent, new_parent) {
        const id = this.serialize(node.coord);
        if (old_parent === null) {  // create new arrow
            const sprite = this.#addArrow(id, node, new_parent);
            this.#step.registerWithData(sprite,
                SpriteActionArrow.Display,
                true);
        }
        else {   // reroute current arrow
            const sprite = this.#canvas_arrows.sprite(id);
            this.#step.registerWithData(
                sprite, SpriteActionArrow.Size,
                Utils.subtractCoords(new_parent.coord, node.coord));
        }
    }

    #visualizeNeighbors(prev_nb_node, new_nb_node) {
        if (new_nb_node !== null)
            this.#step.registerWithData(
                new_nb_node.sprite, SpriteActionNode.Outline,
                SpriteActionOutline.Red);

        if (prev_nb_node !== null)
            this.#step.registerWithData(
                prev_nb_node.sprite, SpriteActionNode.Outline,
                SpriteActionOutline.None);
    }

    #visualizeFoundPathSegment(node) {

        const id = this.serialize(node.coord);
        const arrow_sprite = this.#canvas_arrows.sprite(id);
        if (arrow_sprite)
            this.#step.registerWithData(
                arrow_sprite, SpriteActionArrow.Class,
                SpriteActionClass.Red);
        this.#step.registerWithData(
            node.sprite, SpriteActionNode.Class,
            SpriteActionClass.Red);
        this.#step.registerWithData(
            node.sprite, BFSAction.Status,
            BFSNodeStatus.Path);
    }

    #closeStep() {
        ui.player.register(this.#step);
        this.#step = null;
    }
};