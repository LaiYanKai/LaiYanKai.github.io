"use strict";

Algs.AbstractPriorityQueue = class {
    #cost_indices;
    #thresh;
    #new_node;
    #comparator;
    #front;
    #back;
    #length;

    get length() { return this.#length; }
    empty() { return this.#front === null; }
    filled() { return this.#front !== null; }

    /**
     * @param {boolean} is_fifo
     * @param {number} thresh;
     * @param  {...integer} cost_indices the index of costs to access
     */
    constructor(is_fifo, thresh, ...cost_indices) {
        for (const cost_idx of cost_indices)
            if (!Number.isInteger(cost_idx) || cost_idx < 0)
                throw new Error(`cost_indices can only contain non-negative integers. cost_indices="${cost_indices}"`);

        this.#cost_indices = cost_indices;
        this.#new_node = null;
        this.#thresh = thresh;
        this.#front = null;
        this.#back = null;
        this.#length = 0;

        this.#comparator = is_fifo ?
            this.#compareCostsFIFO.bind(this) :
            this.#compareCostsLIFO.bind(this);
    }

    /** 
     * Queues a node into the priority queue, even if it has been queued.
     * **Assumes that node is not in the list.**
     * @param {Algs.AbstractPriorityQueueNode} node
     * @returns {boolean} true if requeued. False if newly queued.
    */
    requeue(node) {
        if (node.queued === true) {
            this.#remove(node);
        }

        let queued_node = this.#front;

        while (queued_node !== null && this.#comparator(node, queued_node) === false) {
            queued_node = queued_node.pq_next;
        }
        this.#insertBefore(node, queued_node);
    }

    /** 
     * Inserts new_node before queued_node
     * @param {Algs.AbstractPriorityQueueNode} new_node Assumes that new_node is **not** in the list.
     * @param {Algs.AbstractPriorityQueueNode | null} queued_node Assumes that queued_node **is** in the list. If null, new_node is added to the back of the list.
    */
    #insertBefore(new_node, queued_node) {
        if (queued_node === null) { // insert at back
            if (this.#front === null) { // nothing in the list
                this.#front = new_node;
                this.#back = new_node;
            }
            else { //front and back exists
                this.#back.pq_next = new_node;
                new_node.pq_prev = this.#back;
                new_node.pq_next = null;
                this.#back = new_node;
            }
        } else { // insert before queued_node
            if (queued_node.pq_prev === null) { // queued_node is the front
                queued_node.pq_prev = new_node;
                new_node.pq_next = queued_node;
                new_node.pq_prev = null;
                this.#front = new_node;
            }
            else { // queued_node is somewhere in betweens
                const prev_node = queued_node.pq_prev;
                prev_node.pq_next = new_node;
                new_node.pq_prev = prev_node;
                queued_node.pq_prev = new_node;
                new_node.pq_next = queued_node;
            }
        }
        new_node.queued = true;
        ++this.#length;
    }

    /** 
     * @param {Algs.AbstractPriorityQueueNode} queued_node 
     * @param {Algs.AbstractPriorityQueueNode} new_node 
     * @param {boolean} tie_breaker 
     */
    #compareCosts(new_node, queued_node, tie_breaker) {
        for (const cost_idx of this.#cost_indices) {
            const queued_cost = queued_node.costs[cost_idx];
            if (queued_cost > new_node.costs[cost_idx] + this.#thresh) {
                return true; // queued node is more expensive.
            }
            else if (queued_cost < new_node.costs[cost_idx] - this.#thresh) {
                return false; // queued node is less expensive
            }
            else { // queued node has roughly the same cost
                continue; // check the next cost
            }
        }
        // if this point is reached, the queued node has the same costs as the new node.
        return tie_breaker;
    }

    #compareCostsFIFO(new_node, queued_node) {
        return this.#compareCosts(new_node, queued_node, false);
    }

    #compareCostsLIFO(new_node, queued_node) {
        return this.#compareCosts(new_node, queued_node, true);
    }

    /** Removes a node from the priority queue, 
     * and returns the index where the node was located.
     * Will throw an error if the node is not found.
    */
    #remove(node) {
        const pq_prev = node.pq_prev;
        const pq_next = node.pq_next;

        if (pq_prev === null)  // at front
            this.#front = pq_next;
        else
            pq_prev.pq_next = pq_next;

        if (pq_next === null) // at back
            this.#back = pq_prev;
        else
            pq_next.pq_prev = pq_prev;

        node.pq_next = null;
        node.pq_prev = null;
        node.queued = false;
        --this.#length;
    }

    /** Pops the first(cheapest) node from the priority queue and returns it. */
    pop() {
        const node = this.#front;
        if (node !== null)
            this.#remove(node);
        return node;
        // return this.#nodes.shift();
    }

    /** Required to remove cyclic references */
    clear() {
        let node = this.#front;
        while (node !== null) {
            const pq_next = node.pq_next;
            node.pq_prev = null;
            node.pq_next = null;
            node = pq_next;
        }
        this.#length = 0;
    }
};
Object.seal(Algs.AbstractPriorityQueue);


Algs.AbstractQueue = class {
    #nodes;

    get length() { return this.#nodes.length; }
    get empty() { return this.#nodes.length === 0; }

    /**
     */
    constructor() {
        this.#nodes = Array();
    }

    /** Enqueues the node to the back of the queue and returns the index where the node is inserted. */
    insert(node) {
        this.#nodes.push(node);
        return this.length - 1;
    }

    // Dequeues the node at the front of the queue and returns the node.
    pop() {
        return this.#nodes.shift();
    }
};
Object.seal(Algs.AbstractQueue);

Algs.AbstractStack = class {
    #nodes;

    get length() { return this.#nodes.length; }
    get empty() { return this.#nodes.length === 0; }

    /**
     */
    constructor() {
        this.#nodes = Array();
    }

    /** Pushes the node to the top of the stack and returns 0. */
    insert(node) {
        this.#nodes.unshift(node);
        return 0; // for consistency with how the ui tables are visualized.
    }

    // Pops the node at the top of the stack and returns the node.
    pop() {
        return this.#nodes.shift(); // for consistency with how the ui tables are visualized.
    }
};
Object.seal(Algs.AbstractStack);