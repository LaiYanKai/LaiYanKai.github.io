"use strict";

UI.Cell = class {
    dom;
    dom_text;
    cost;
    coord = [0, 0];

    constructor(x, y, cost) {
        this.cost = cost;
        this.coord = [x, y];

        this.dom = document.createElement("div");
        this.dom.className = "cell";
        this.dom_text = document.createTextNode("");
        this.dom.appendChild(this.dom_text);

        Object.freeze(this.dom);
        Object.freeze(this.dom_text);
        Object.freeze(this.coord);
    }

    /** Prints the cost to the dom element, and colors its text and background based on the cost */
    vis() {
        let norm_cost = 100 *
            (this.cost - ui_states.visual_min_cost) /
            (ui_states.visual_max_cost - ui_states.visual_min_cost);
        norm_cost = Utils.clamp(norm_cost, 0, 100);

        let light = 100 - 0.8 * norm_cost;
        this.dom.style.backgroundColor = "hsla(220, 20%, " + light.toString() + "%, 1)";
        if (norm_cost <= 50)
            light = 50 - norm_cost;
        else
            light = 130 - 0.6 * norm_cost;
        this.dom.style.color = "hsla(0, 0%, " + light.toString() + "%, 1)";

        this.text(this.cost);
    }

    /** Sets the text of the dom element */
    text(text) { this.dom_text.nodeValue = text; }
};

UI.Cells =  class{
    dom;
    #cells;

    constructor() {
        if (ui.cells)
            throw new Error(`ui.cells has already been initialized`);
        ui.cells = this;

        this.dom = document.querySelector(".body>.graph>.layers>.cells");
        this.#cells = [];

        Object.freeze(this.dom);
    }

    /** Removes all the DOM */
    #dismantle() {
        this.dom.replaceChildren();
        this.#cells = [];
    }

    /** Constructs the cells and appends the cell dom based on the size of costs.
     * @param costs 2d array, where costs[x][y] is the cost of the cell at (x,y).
     * Assumes that costs is a square matrix (consistent size across all costs[x] arrays).
    */
    #construct(costs) {
        this.#dismantle();

        const size = [costs.length, costs[0].length];

        this.#cells = Array(size[0]);
        for (let x = 0; x < size[0]; ++x) {
            const cell_column = Array(size[1]);
            for (let y = 0; y < size[1]; ++y) {
                cell_column[y] = new UI.Cell(x, y, costs[x][y]);
                cell_column[y].vis();
            }
            this.#cells[x] = cell_column;
        }

        this.dom.style.gridTemplateColumns = "repeat(" + size[0].toString() + ", 1fr)";//var(--cell-size-vis))";
        for (let y = size[1] - 1; y >= 0; --y) {
            for (let x = 0; x < size[0]; ++x)
                this.dom.appendChild(this.#cells[x][y].dom);
        }
    }


    /** Returns cell at coord if coord is in map, null otherwise
     * @param coord array of two ints */
    at(coord) {
        return ui.inMapCell(coord) ? this.#cells[coord[0]][coord[1]] : null;
    }

    /** Returns a 2D array of costs */
    costs() {
        const costs = Array(this.#cells.length);
        for (let x = 0; x < this.#cells.length; ++x)
            costs[x] = this.#cells[x].map((cell) => cell.cost);
        return costs;
    }

    /** Changes the number of cells to fit the number of elements in the 2d array of costs.
     * @param new_costs 2d array of costs. The number of cells along each axis depends on the shape of this 2d array. This 2d array also contains individual new cost information.
     * @param keep if true, the new costs provided in costs will be overwritten by the old costs. The number of cells will still depend on the shape of the costs 2d array.
     */
    resize(new_costs, keep) {
        if (new_costs.length == 0)
            throw new Error("new_costs is a zero length array");

        if (keep) {
            const old_costs = this.costs();
            const num_x = Math.min(old_costs.length, new_costs.length);
            for (let x = 0; x < num_x; ++x) {
                const num_y = Math.min(old_costs[x].length, new_costs[x].length);
                for (let y = 0; y < num_y; ++y)
                    new_costs[x][y] = old_costs[x][y];
            }
        }

        this.#dismantle();
        this.#construct(new_costs);
    }
}