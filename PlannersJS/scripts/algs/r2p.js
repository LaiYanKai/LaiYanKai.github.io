"use strict";


Algs.R2P = class extends Algs.AbstractAlg {
    /** @type {Algs.R2PCanvasLinks} */
    #canvas;
    /** @type {Algs.R2PMapper} */
    #mapper;
    /** @type {Algs.R2PCorners} */
    #corners;
    /** @type {Algs.R2PLinks} */
    #links;
    /** @type {Algs.R2POpenList} */
    #open_list;

    /** @type {Algs.R2PCorner} */
    #start_crn;
    /** @type {Algs.R2PCorner} */
    #goal_crn;
    /** @type {[number, number]} */
    #start_coord;
    /** @type {[number, number]} */
    #goal_coord;

    /** @type {[number, number][]} */
    #path = [];

    /** @type {Algs.R2PCorner[]} */
    #overlap_buffer = [];

    /** @type {number} */
    #num_interrupt = 10;

    /** @type {UI.Step} */
    #step;

    #debug = true;

    constructor(alg_params) {
        super(["1: Smallest", "2: Every Corner", "3: Every Poll"], 0, alg_params);

        this.#mapper = new Algs.R2PMapper(alg_params.lethal);
        this.#corners = new Algs.R2PCorners();
        this.#links = new Algs.R2PLinks();
        this.#open_list = new Algs.R2POpenList();

        this.#canvas = new Algs.R2PCanvasLinks(0);

        this.setCanvases([this.#canvas]);

        // Set up lenses
        const lenses = [
            new UI.LensNone(this.#canvas, "None", "None")];
        super.setLenses(lenses, 0);
    }


    #initial(start_coord, goal_coord) {
        this.#newLargeStep();

        this.#overlap_buffer = [];
        this.#path = []; // redundant
        this.#start_coord = start_coord;
        this.#goal_coord = goal_coord;

        // ================ check if start is locked in =====================
        let locked_in = true;
        for (const didx of [1, 3, 5, 7]) {
            let coord = Utils.dirIndexToDir(didx);
            coord = Utils.adjCellFromVertex(this.#start_coord, coord);
            if (this.#mapper.cellAccess(coord) === true) {
                locked_in = false;
                break;
            }
        }
        if (locked_in) {
            this.#path = [];
            return true;
        }

        // =============== check if there is a direct los togoal =================
        const cast_result = this.#cast(this.#start_coord, this.#goal_coord);
        if (cast_result === null) {
            this.#path = [this.#goal_coord, this.#start_coord];

            // ---- visualize
            const sprite = this.#canvas.add(0);
            this.#step.registerWithData(sprite,
                R2PActionLink.Display, true);
            const cost = Utils.euclidean(
                Utils.subtractCoords(this.#goal_coord, this.#start_coord));
            this.#step.registerWithData(sprite,
                R2PActionLink.Cost, cost);
            this.#step.registerWithData(sprite,
                R2PActionLink.Knob, 0);
            this.#step.registerWithData(sprite,
                R2PActionLink.LeftRay, null);
            this.#step.registerWithData(sprite,
                R2PActionLink.RightRay, null);
            this.#step.registerWithData(sprite,
                R2PActionLink.ProgRay, null);
            this.#step.registerWithData(sprite,
                R2PActionLink.Side, R2PSide.L);
            this.#step.registerWithData(sprite,
                R2PActionLink.SrcCoord, this.#start_coord.slice());
            this.#step.registerWithData(sprite,
                R2PActionLink.Status, R2PLinkStatus.Path);
            this.#step.registerWithData(sprite,
                R2PActionLink.Tdir, R2PTreeDir.Tgt);
            this.#step.registerWithData(sprite,
                R2PActionLink.TgtCoord, this.#goal_coord.slice());
            this.#step.registerWithData(sprite,
                R2PActionLink.Type, R2PLinkType.Vy);
            this.#step.registerWithData(sprite,
                R2PActionLink.ZIndex, 0);
            this.#closeStep();
            return true;
        }

        // =============== collided =================
        // ----------- initialize all crns  ---------------
        this.#start_crn = this.#corners.at(R2PSide.L, 2, start_coord, false);
        this.#goal_crn = this.#corners.at(R2PSide.L, 2, goal_coord, false);
        const [left_col_pose, right_col_pose] = cast_result;
        const left_trace_crn = new Algs.R2PCorner(R2PSide.L, left_col_pose.didx, left_col_pose.coord, left_col_pose.convex, -1);
        const right_trace_crn = new Algs.R2PCorner(R2PSide.R, right_col_pose.didx, right_col_pose.coord, right_col_pose.convex, -1);

        // -------------- initialize rays -------------------------
        const ray_coord = Utils.subtractCoords(this.#goal_coord, this.#start_coord);
        const ray = this.#createRayFromCoord(ray_coord, true, true);
        const rev_ray_coord = Utils.subtractCoords(this.#start_coord, this.#goal_coord);
        const rev_ray_opened = this.#createRayFromCoord(rev_ray_coord, false, true);
        const rev_ray_closed = this.#createRayFromCoord(rev_ray_coord, true, true);
        const deep_start = Utils.addCoords(start_coord, Utils.unitCoord(rev_ray_coord));
        const deep_goal = Utils.addCoords(goal_coord, Utils.unitCoord(ray_coord));

        // ------- initialize goal link -------
        const goal_link = this.#createLink();
        this.#changeLink(goal_link,
            this.#goal_crn, R2PLinkType.Vy, R2PTreeDir.Tgt,
            null, null, null,
            [], [], false, R2PListDir.Back);
        this.#setLinkCost(goal_link, 0);
        this.#step.registerWithData(goal_link.sprite,
            R2PActionLink.TgtCoord, deep_goal.slice());

        // ---------------- initialize links for left trace ---------------------
        const left_src3_link = this.#createLink();
        this.#changeLink(left_src3_link,
            this.#start_crn, R2PLinkType.Vy, R2PTreeDir.Src,
            null, null, null,
            [], [], false, R2PListDir.Auto);
        this.#setLinkCost(left_src3_link, 0);
        this.#step.registerWithData(left_src3_link.sprite,
            R2PActionLink.SrcCoord, deep_start.slice());

        const left_ssrc_link = this.#createLink();
        this.#changeLink(left_ssrc_link,
            this.#start_crn, R2PLinkType.Vy, R2PTreeDir.Src,
            ray, rev_ray_closed, null,
            [left_src3_link], [], false, R2PListDir.Auto);
        this.#setLinkCost(left_ssrc_link, 0);

        const left_src_link = this.#createLink();
        this.#changeLink(left_src_link,
            left_trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
            rev_ray_opened, ray, ray_coord,
            [left_ssrc_link], [], false, R2PListDir.Back);

        const left_tgt_link = this.#createLink();
        this.#changeLink(left_tgt_link,
            left_trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
            null, null, rev_ray_coord,
            [], [goal_link], false, R2PListDir.Back);

        // ----------------- initialize links for right trace --------------------
        const right_src3_link = this.#createLink();
        this.#changeLink(right_src3_link,
            this.#start_crn, R2PLinkType.Vy, R2PTreeDir.Src,
            null, null, null,
            [], [], false, R2PListDir.Auto);
        this.#setLinkCost(right_src3_link, 0);
        this.#step.registerWithData(right_src3_link.sprite,
            R2PActionLink.SrcCoord, deep_start.slice());

        const right_ssrc_link = this.#createLink();
        this.#changeLink(right_ssrc_link,
            this.#start_crn, R2PLinkType.Vy, R2PTreeDir.Src,
            rev_ray_closed, ray, null,
            [right_src3_link], [], false, R2PListDir.Auto);
        this.#setLinkCost(right_ssrc_link, 0);

        const right_src_link = this.#createLink();
        this.#changeLink(right_src_link,
            right_trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
            ray, rev_ray_opened, ray_coord,
            [right_ssrc_link], [], false, R2PListDir.Back);

        const right_tgt_link = this.#createLink();
        this.#changeLink(right_tgt_link,
            right_trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
            null, null, rev_ray_coord,
            [], [goal_link], false, R2PListDir.Back);

        // ------------- Trace -------------------
        this.#tracer(new Algs.R2PTrace(left_trace_crn));
        this.#tracer(new Algs.R2PTrace(right_trace_crn));
        return false;
    }

    /**
     * 
     * @param {[number, number]} start_coord 
     * @param {[number, number]} goal_coord 
     * @returns {[number, number][]}
     */
    run(start_coord, goal_coord) {
        start_coord = [Math.round(start_coord[0]), Math.round(start_coord[1])];
        goal_coord = [Math.round(goal_coord[0]), Math.round(goal_coord[1])];

        if (this.#initial(start_coord, goal_coord))
            return this.#path;
        0; //this.#dbg("initial done");

        // create start links
        while (!this.#open_list.isEmpty()) {
            this.#newLargeStep();

            //
            const qnode = this.#poll();
            0; //this.#dbg(`polled qnode ${qnode}`);
            0; //this.#dbg(`polled qnode link: ${qnode.link}`);

            if (qnode.type === R2PQueueType.Cast) {
                if (this.#caster(qnode))
                    break;
            }
            else if (qnode.type === R2PQueueType.Trace) {
                this.#setupTracerFromLink(qnode.link);
            }

            this.#overlapRule();
        }

        this.#step.changeRank(2); // convert last step to large step;
        this.#closeStep();
        this.destructor();
        console.log("complete");
        return this.#path;
    }

    destructor() {
        this.#links.destructor();
        this.#open_list.destructor();
    }

    #atCrn(test_coord, test_didx, at_crn) {
        return Utils.equalIntegerCoords(test_coord, at_crn.coord) &&
            test_didx === at_crn.didx;
    }

    #dbg(...args) {
        if (this.#debug)
            console.log(...args);
    }


    // ============== Steps and Visualization methods=======================
    #newLargeStep() {
        this.#closeStep();
        this.#step = new UI.Step(2);
    }

    #newMedStep() {
        this.#closeStep();
        this.#step = new UI.Step(1);
    }

    #newSmallStep() {
        this.#closeStep();
        this.#step = new UI.Step(0);
    }

    #closeStep() {
        if (this.#step) {
            ui.player.register(this.#step);

            /**@type{Set<Algs.R2PSpriteLink>} */
            let sprites = new Set();
            for (const act of this.#step.actions())
                sprites.add(act.sprite);
            for (const sprite of sprites)
                sprite.vis();

            0; //this.#dbg("");
        }

        this.#step = null;
    }

    /** 
     * Traces to the next corner,
     * and updates the current corner's coordinates, convexity and didx in place.
     * Returns true if at map boundary, false otherwise.
     * @param {Algs.R2PTrace} tr 
     * @returns {boolean}
     */
    #trace(tr) {
        const trace_crn = tr.crn;
        const trace_didx = this.#getNextTraceDirIdx(trace_crn);

        const next_pose = this.#mapper.trace(trace_crn.side, trace_crn.coord, trace_didx);
        trace_crn.didx = next_pose.didx;
        trace_crn.convex = next_pose.convex;
        trace_crn.coord = next_pose.coord;

        for (let i = 0; i < trace_crn.numLinks(R2PTreeDir.Src); ++i) {
            const link = trace_crn.linkAt(R2PTreeDir.Src, i);
            this.#step.registerWithData(link.sprite,
                R2PActionLink.TgtCoord, trace_crn.coord.slice());
        }
        for (let i = 0; i < trace_crn.numLinks(R2PTreeDir.Tgt); ++i) {
            const link = trace_crn.linkAt(R2PTreeDir.Tgt, i);
            this.#step.registerWithData(link.sprite,
                R2PActionLink.SrcCoord, trace_crn.coord.slice());
        }

        const out_of_map = trace_crn.didx === 0;
        if (out_of_map) {
            0; //this.#dbg("[TR] At map boundary!");
        }

        return out_of_map;
    }

    /**
     * Casts from one corner to another. 
     * Returns null if reached, or an array 
     * [first left corner, left trace didx, first right corner, right trace didx] 
     * from the collision point.
     * @param {[number, number]} from_crn 
     * @param {[number, number]} to_crn 
     * @returns {null | [Algs.R2PPose, Algs.R2PPose]} 
     */
    #cast(from_coord, to_coord) {
        const result = this.#mapper.cast(from_coord, to_coord);
        return result;
    }

    /**
     * Projects from one corner in a direction.
     * Always collides for R2+ in a rectangular map.
     * Returns an array.
     * @param {Algs.R2PCorner} from_crn 
     * @param {[number, number]} diff 
     * @returns {[Algs.R2PCorner, Algs.R2PCorner]}
     */
    #project(from_crn, diff) {
        const [left_pose, right_pose] = this.#mapper.project(from_crn.coord, diff);
        return [left_pose, right_pose];
    }

    /**
     * Gets the next trace direction by assuming that a trace has reached _crn_.
     * @param {Algs.R2PCorner} crn 
     * @returns {DirIndex}
     */
    #getNextTraceDirIdx(crn) {
        // left convex +1, left ncv +3
        let didx = crn.convex ? 1 : 3;
        didx *= -crn.side;
        return Utils.addDirIndex(crn.didx, didx);
    }

    /**
     * Gets the reverse of the previous trace direction by assuming that a trace has reached _crn_.
     * i.e. treat the crn as having the reverse side, and find the next trace direction.
     * @param {Algs.R2PCorner} crn 
     * @returns {DirIndex}
     */
    #getPrevTraceDirIdx(crn) {
        // left convex +1, left ncv +3
        let didx = crn.convex ? 1 : 3;
        didx *= crn.side;
        return Utils.addDirIndex(crn.didx, didx);
    }

    #overlapRule() {
        // shrinks the source tree
        for (const buffer_crn of this.#overlap_buffer) {

            // shrink the source tree for the left-side crn and right-side crn at the coordinates and didx.
            this.#overlapRuleGotoSrcVyEyFromCrn(buffer_crn);
            const other_crn = this.#corners.hasOtherSide(buffer_crn);
            if (other_crn)
                this.#overlapRuleGotoSrcVyEyFromCrn(buffer_crn);
        }

        // clear the  overlap buffer
        this.#overlap_buffer = [];
    }

    /**
     * Called only when crn_with_cheapest will be placed with the cheapest tdir link so far, 
     * and crn_with_cheapest is updated with the best information (cheapesr cost, to_cur)
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PCorner} crn_with_cheapest 
     */
    #overlapRuleConvToEy(tdir, crn_with_cheapest) {
        const other_crn = this.#corners.hasOtherSide(crn_with_cheapest);
        // therefore has [other_crn, crn_with_cheapest]

        for (const crn of [crn_with_cheapest, other_crn]) {
            // ========== Skip if crn don't exist, or if doesn't have any best info ============
            if (!crn)
                continue;
            const best = crn.hasBest(tdir);
            if (!best) // has no Vy / Ey links
                continue;

            // ============== For each tdir-Vy link at crn ===========
            while (1) {
                const link = crn.findLink(tdir, R2PLinkType.Vy);
                if (!link)
                    break;
                const root_to_cur = link.getDiff();

                // ----------- Discard link and affected links if this link satisfies overlap rule 7 ---------------
                const can_discard = best.to_cur &&
                    tdir * crn.side * Utils.detCoords(best.to_cur, root_to_cur) > 0;
                const root_link = link.getFirstRootLink();
                if (can_discard) {
                    this.#disconnectLink(tdir, link, root_link);
                    this.#eraseTree(-tdir, link);
                    this.#eraseTree(tdir, root_link);
                }
                // ------- otherwise, convert this link and leaf links to Ey/Eu links, and discard costly links ---------
                else {
                    if (this.#overlapRuleConvToEyForVyLink(tdir, link, root_link))
                        this.#eraseTree(tdir, root_link);
                }
            }
        }
    }

    /**
     * For #overlapRuleConvToEy. Converts this link and -tdir (leaf) links to Ey/Eu links, discarding any links that satisfy the overlap rule
     * Discards the link and leaf links if the link is vy/ey and has diff sides for the anchored crn and root crn (overlap rule).
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PLink} link 
     * @param {Algs.R2PLink} root_link Root link of link.
     * @returns {boolean} true if link is erased, false otherwise.
     */
    #overlapRuleConvToEyForVyLink(tdir, link, root_link) {
        const root_crn = link.getRootCrn();
        const anchor_crn = link.crn;

        // ========= Discard this link and leaf (-tdir) links if the
        //  current link is vy/ey and has diff sides for connected crns ============
        if (anchor_crn.side !== root_crn.side &&
            (link.type === R2PLinkType.Vy || link.type === R2PLinkType.Ey)) {
            this.#disconnectLink(tdir, link, root_link);
            this.#eraseTree(-tdir, link);
            return true;
        }

        // ========= Convert to tgt tree and queue a cast at this link if this link is SrcVu link ============
        if (link.type !== R2PLinkType.Vy) {
            // tdir-tree link is not Vy type.
            if (tdir === R2PTreeDir.Src && link.type === R2PLinkType.Vu) {
                this.#overlapRuleConvertToTgtTree(link);
                const f = link.cost + root_link.cost;
                this.#queue(R2PQueueType.Cast, link, f);
            }
            // nothing to do if S-tree link is not Vu (Eu/Ey), as it is already expensive.
            // nothing to do if T-tree link is Vu/Oc/Tm/Un (will be adjusted later by future searches), and Eu cannot exist for T-tree links.
            return false;
        }

        // ========== For tdir Vy Nodes, recurse ==============
        for (let i = 0; i < link.numNeighbors(-tdir);) {
            const leaf_link = link.neighborAt(-tdir, i);
            if (!this.#overlapRuleConvToEyForVyLink(tdir, leaf_link, link))
                ++i; // If not erased, ++i. If erased, i stays the same.
        }

        // ========== Delete this link if no more leaf links ============
        if (link.numNeighbors(-tdir) === 0) {
            this.#disconnectLink(tdir, link, root_link);
            this.#eraseLink(link);
            return true;
        }
        // ========== If there are still leaf links, convert to Ey type ===========
        else {
            this.#changeLink(link,
                link.crn, R2PLinkType.Ey, tdir,
                link.left_ray, link.right_ray, null,
                undefined, undefined, false, R2PListDir.Auto);
            return false;
        }

    }

    /**
     * 
     * @param {undefined | Algs.R2PCorner} crn 
     */
    #overlapRuleGotoSrcVyEyFromCrn(crn) {
        if (crn === undefined)
            return;

        let found_links = [
            crn.findLink(R2PTreeDir.Src, R2PLinkType.Vu),
            crn.findLink(R2PTreeDir.Src, R2PLinkType.Eu)];

        // ======= For each SrcVu or SrcVy link still in the corner ======,
        while (found_links[0] !== undefined || found_links[1] !== undefined) {
            for (let i = 0; i < 2; ++i) {
                if (found_links[i] !== undefined) {
                    // ============= Find the first link whose src link is an svy or sey type ==========
                    let first_link = found_links[i];
                    let src_link;
                    while (1) {
                        src_link = first_link.getFirstRootLink();
                        if (src_link.type === R2PLinkType.Vy || src_link.type === R2PLinkType.Ey)
                            break;
                        first_link = src_link;
                    }

                    // ============= convert to T-tree ==================
                    this.#overlapRuleConvertToTgtTree(first_link);

                    // ============= queue this link ==================
                    const f = first_link.cost + src_link.cost;
                    this.#queue(R2PQueueType.Cast, first_link, f);

                    // ============ Refind another link of the same type at the corner (SrcVu / SrcEu)==========
                    found_links[i] = crn.findLink(R2PTreeDir.Src,
                        i === 0 ? R2PLinkType.Vu : R2PLinkType.Eu);
                }
            }
        }
    }

    /**
     * Converts and unqueues this link and all tgt links to T-tree Vu links.
     * @param {Algs.R2PLink} link 
     */
    #overlapRuleConvertToTgtTree(link) {

        // =========== try to unqueue ================
        this.#unqueue(link);

        // =========== Reached leaf of T-tree, return ================
        if (link.tdir === R2PTreeDir.Tgt)
            return;

        // =========== Recurse for each tgt link ===========
        for (let i = 0; i < link.numNeighbors(R2PTreeDir.Tgt); ++i) {
            const tgt_link = link.neighborAt(R2PTreeDir.Tgt, i);
            this.#overlapRuleConvertToTgtTree(tgt_link);
        }

        // =========== Convert this link to T-tree, Vu link ===========
        const src_crn = link.getRootCrn();
        this.#changeLink(link,
            src_crn, R2PLinkType.Vu, R2PTreeDir.Tgt,
            link.left_ray, link.right_ray, null,
            undefined, undefined, true, R2PListDir.Auto);
    }


    /**
     * Returns true if path is found, false otherwise.
     * @param {R2POpenListNode} qnode 
     * @returns {boolean} 
     */
    #caster(qnode) {
        const cast_link = qnode.link;
        if (cast_link.tdir !== R2PTreeDir.Tgt)
            throw new Error(`cast_link is not tgt`);

        const src_coord = cast_link.crn.coord;
        const tgt_coord = cast_link.getRootCrn().coord;
        const cast_result = this.#cast(src_coord, tgt_coord);

        if (cast_result === null) {
            return this.#casterReached(cast_link);
        }
        else {
            this.#casterCollided(cast_result[0], cast_result[1], cast_link);
            return false;
        }
    }

    /**
     * Returns true if path is found, false otherwise
     * @param {Algs.R2PLink} cast_link 
     * @returns {boolean}
     */
    #casterReached(cast_link) {
        const src_link = cast_link.neighborAt(R2PTreeDir.Src, 0);
        const tgt_link = cast_link.neighborAt(R2PTreeDir.Tgt, 0);
        if (src_link.type === R2PLinkType.Vy && tgt_link.type === R2PLinkType.Vy) {
            //path found
            this.#casterReachedFoundPath(cast_link);
            return true;
        } else if (tgt_link.type === R2PLinkType.Tm) {
            // reached tm
            this.#casterReachedTm(cast_link);
        } else if ((tgt_link.type !== R2PLinkType.Vy && tgt_link.type !== R2PLinkType.Ey)
            && (src_link.type !== R2PLinkType.Vy && src_link.type !== R2PLinkType.Ey)) {
            // no vis
            this.#casterReachedWithoutCumVis(cast_link);
        }
        else {
            // one side has vis
            this.#casterReachedWithCumVis(cast_link);
        }
        return false;
    }

    #casterReachedFoundPath(cast_link) {
        this.#newLargeStep();

        let path = [];
        this.#step.registerWithData(cast_link.sprite,
            R2PActionLink.Status, R2PLinkStatus.Path);

        let link = cast_link.neighborAt(R2PTreeDir.Src, 0);
        while (1) {
            path.push(link.crn.coord);
            if (link.crn === this.#start_crn)
                break;
            this.#step.registerWithData(link.sprite,
                R2PActionLink.Status, R2PLinkStatus.Path);
            this.#newSmallStep();
            link = link.neighborAt(R2PTreeDir.Src, 0);
        }
        this.#newMedStep();
        link = cast_link.neighborAt(R2PTreeDir.Tgt, 0);
        while (1) {
            path.unshift(link.crn.coord);
            if (link.crn === this.#goal_crn)
                break;
            this.#step.registerWithData(link.sprite,
                R2PActionLink.Status, R2PLinkStatus.Path);
            this.#newSmallStep();
            link = link.neighborAt(R2PTreeDir.Tgt, 0);
        }

        0; //this.#dbg("found path ", path.map((coord) => coord.join(",")).join("; "));
    }

    /**
     * 
     * @param {Algs.R2PLink} cast_link  src or tgt tree link
     */
    #casterReachedTm(cast_link) {

        // check if a turning point can be added at tgt crn
        const src_crn = cast_link.neighborAt(R2PTreeDir.Src, 0).crn;
        const tgt_crn = cast_link.neighborAt(R2PTreeDir.Tgt, 0).crn;
        const tgt_edge_didx = this.#getNextTraceDirIdx(tgt_crn);
        const tgt_edge = Utils.dirIndexToDir(tgt_edge_didx);
        const src_to_tgt = Utils.subtractCoords(tgt_crn.coord, src_crn.coord);
        const can_place = tgt_crn.convex === true &&
            tgt_crn.side * Utils.detCoords(src_to_tgt, tgt_edge) > 0;

        // =========== Merge Ray =============
        const cast_ray_closed = this.#createRayFromCoord(src_to_tgt, true, true);
        this.#mergeRay(-tgt_crn.side, cast_link, cast_ray_closed);

        // ===== Treat as a normal trace if no points can be placed at the tgt ==========
        if (!can_place) {
            this.#setupTracerFromLink(cast_link);
            return;
        }

        // if placeable, check which tgt links are castable
        let tgt_links = []; // repurpose to store castable links
        0; //this.#dbg(`[CTm] Can place pt at reached Tm.`);
        for (let i = 0; i < cast_link.numNeighbors(R2PTreeDir.Tgt); ++i) {
            const tgt_link = cast_link.neighborAt(i);
            const is_vis = tgt_crn.side * Utils.detCoords(tgt_edge, tgt_link.getDiff()) >= 0;
            if (is_vis) {
                tgt_links.push(tgt_link);
                0; //this.#dbg(`[CTm] Can cast from new pt @ reached Tm for ${tgt_link}`);
            }
            else {
                0; //this.#dbg(`[CTm] Not castable from new pt @ reached Tm for ${tgt_link}`);
            }
        }



        // if there are castable links, create a new cast link and move the castable links to the next cast link
        if (tgt_links.length > 0) {
            0; //this.#dbg(`[CTm] Prepare for castable tgt links`);
            const new_cast_link = this.#createLink();
            this.#changeLink(new_cast_link,
                tgt_crn, R2PLinkType.Vu, R2PTreeDir.Tgt,
                cast_link.left_ray, cast_link.right_ray, null,
                cast_link.copyNeighbors(R2PTreeDir.Src), tgt_links, false, R2PListDir.Back);

            // move the castable links to this new_cast_link
            this.#disconnectLinks(R2PTreeDir.Tgt, cast_link, tgt_links);
            // this.#connectLinks(R2PTreeDir.Tgt, new_cast_link, tgt_links);

            // single / no cv
            const src_link = new_cast_link.neighborAt(R2PTreeDir.Src, 0);
            if (src_link.type === R2PLinkType.Vy || src_link.type === R2PLinkType.Ey) {
                0; //this.#dbg(`[CTm] Call CumulativeVis for new castable link`);
                this.#casterReachedWithCumVis(new_cast_link);
            }
            else {
                0; //this.#dbg(`[CTm] Call NonCumulativeVis for new castable link`);
                this.#casterReachedWithoutCumVis(new_cast_link);
            }
        }

        // Erase cast_link if no more tgts.
        if (cast_link.numNeighbors(R2PTreeDir.Tgt) === 0) {
            this.#eraseTree(R2PTreeDir.Src, cast_link);
        }
        // Trace from cast_link if have tgts (non-castable ones)
        else {
            0; //this.#dbg(`[CTm] Prepare trace for reached Tm for non-castable links`);
            this.#setupTracerFromLink(cast_link);
        }

    }

    /**
     * 
     * @param {Algs.R2PLink} cast_link 
     */
    #casterReachedWithoutCumVis(cast_link) {
        const tgt_crn = cast_link.getRootCrn();
        const src_crn = cast_link.crn;

        // ============ convert link to src vu link, anchored at tgt crn ====================
        this.#changeLink(cast_link,
            tgt_crn, R2PLinkType.Vu, R2PTreeDir.Src,
            cast_link.left_ray, cast_link.right_ray, null,
            undefined, undefined, true, R2PListDir.Auto);
        // ====== merge ray =========
        const cast_ray_coord = Utils.subtractCoords(tgt_crn.coord, src_crn.coord);
        const cast_ray_closed = this.#createRayFromCoord(cast_ray_coord, true, true);
        const cast_ray_opened = this.#createRayFromCoord(cast_ray_coord, false, false);
        this.#mergeRay(-tgt_crn.side, cast_link, cast_ray_closed);

        // isolate all tgt links to merge ray
        const tgt_links = cast_link.copyNeighbors(R2PTreeDir.Tgt);
        for (const tgt_link of tgt_links) {
            const new_tgt_link = this.#isolateLink(R2PTreeDir.Src, tgt_link, cast_link);
            this.#mergeRay(tgt_crn.side, new_tgt_link, cast_ray_opened);
        }

        // =========== get number of links anchored at tgt_crn that is connected to the cast_link ======================
        const num_links_from_cast = 1 + cast_link.numNeighbors(R2PTreeDir.Tgt);
        // get number of links anchored at tgt_crn
        let num_links_at_crn = tgt_crn.numLinks(R2PTreeDir.Src) + tgt_crn.numLinks(R2PTreeDir.Tgt);
        // mark for overlap if number of links at cast same as number of links at tgt crn
        if (num_links_from_cast === num_links_at_crn) {
            const other_crn = this.#corners.hasOtherSide(tgt_crn);
            if (other_crn)
                num_links_at_crn += other_crn.numLinks(R2PTreeDir.Src) + other_crn.numLinks(R2PTreeDir.Tgt);
        }

        // ============== push to overlap if reached a crn (& other crn) with other links ===============
        if (num_links_from_cast !== num_links_at_crn) {
            this.#addToOverlapBuffer(tgt_crn);
        }
        // ============== if crn (& other crn) contains only links from cast_link, queue =============
        else {

            // queue the tgt links
            for (let i = 0; i < cast_link.numNeighbors(R2PTreeDir.Tgt); ++i) {
                const new_tgt_link = cast_link.neighborAt(R2PTreeDir.Tgt, i);
                const f = cast_link.cost + new_tgt_link.cost;
                this.#queue(R2PQueueType.Cast, new_tgt_link, f);
            }
        }

        this.#step.registerWithData(cast_link.sprite,
            R2PActionLink.Status, R2PLinkStatus.None);
    }

    /**
     * 
     * @param {Algs.R2PLink} cast_link  has tdir === tgt
     */
    #casterReachedWithCumVis(cast_link) {
        if (cast_link.tdir !== R2PTreeDir.Tgt)
            throw TypeError(`cast_link must be tgt type in casterReachedWithCumVis`);
        0; //this.#dbg(`[CR] Cast reached with CV for cast link: ${cast_link}`);

        const src_link = cast_link.neighborAt(R2PTreeDir.Src, 0);
        const first_tgt_link = cast_link.neighborAt(R2PTreeDir.Tgt, 0);
        const next_tdir = (src_link.type === R2PLinkType.Vy
            || src_link.type === R2PLinkType.Ey)
            ? R2PTreeDir.Tgt : R2PTreeDir.Src;

        const prev_first_link = next_tdir === R2PTreeDir.Src
            ? first_tgt_link : src_link;
        const next_first_link = next_tdir === R2PTreeDir.Src
            ? src_link : first_tgt_link;

        // =========== Discard if prev corner is Ey and reached corner is opposite side ==============
        if (prev_first_link.type === R2PLinkType.Ey
            && prev_first_link.crn.side !== next_first_link.crn.side) {
            // remove this link
            this.#disconnectLink(R2PTreeDir.Src, cast_link, src_link);
            this.#eraseTree(R2PTreeDir.Tgt, cast_link);
            this.#eraseTree(R2PTreeDir.Src, src_link);
            return;
        }

        // ========== Determine cost and retrieve best info at next crn ====================
        let cost_at_next = next_tdir === R2PTreeDir.Tgt
            ? src_link.cost + cast_link.getLength()
            : cast_link.cost;
        const best_at_next = next_first_link.crn.best(-next_tdir);
        const other_next_crn = this.#corners.hasOtherSide(next_first_link.crn);

        const prev_to_next = next_tdir === R2PTreeDir.Tgt
            ? Utils.multiplyCoord(cast_link.getDiff(), -1)
            : cast_link.getDiff();

        // ================ Costly to reach next crn from cast link ===============
        if (Utils.approxGt(cost_at_next, best_at_next.min_cost)) {
            // if satisfy overlap rule 7
            const can_discard = best_at_next.to_cur &&
                next_tdir * next_first_link.crn.side
                * Utils.detCoords(best_at_next.to_cur, prev_to_next) > 0;
            if (can_discard) {
                this.#disconnectLink(R2PTreeDir.Src, cast_link, src_link);
                this.#eraseTree(R2PTreeDir.Tgt, cast_link);
                this.#eraseTree(R2PTreeDir.Src, src_link);
                return;
            }
            // if dose not satisfy overlap rule 7, convert cast link to an Ey link
            else {
                this.#changeLink(cast_link,
                    next_first_link.crn, R2PLinkType.Ey, -next_tdir,
                    cast_link.left_ray, cast_link.right_ray, null,
                    undefined, undefined, true, R2PListDir.Auto);
            }
        }
        // ================ Cheapest so far to reach next crn from cast link ===============
        else if (Utils.approxGt(best_at_next.min_cost, cost_at_next)) {
            const best_at_other = other_next_crn ? other_next_crn.best(-next_tdir) : null;

            // update best info (only the current side)
            // best info will be used by overlapRuleConvtoEy
            best_at_next.min_cost = cost_at_next; // === cost_at_next
            best_at_next.to_cur = prev_to_next;

            // ----------- More expensive than the other side's best ----------
            if (best_at_other && Utils.approxGt(cost_at_next, best_at_other.min_cost)) {
                // there should not be any svy links at this corner

                // convert cast link to ey
                this.#changeLink(cast_link,
                    next_first_link.crn, R2PLinkType.Ey, -next_tdir,
                    cast_link.left_ray, cast_link.right_ray, null,
                    undefined, undefined, true, R2PListDir.Auto);
            }
            // ----------- Cheaper or eq cost as the other side's best ----------
            else {
                if (best_at_other)
                    best_at_other.min_cost = cost_at_next;

                // convert other links at corner to expensive branches
                this.#overlapRuleConvToEy(-next_tdir, next_first_link.crn);

                // convert cast link to vys
                this.#changeLink(cast_link,
                    next_first_link.crn, R2PLinkType.Vy, -next_tdir,
                    cast_link.left_ray, cast_link.right_ray, null,
                    undefined, undefined, true, R2PListDir.Auto);
            }


        }
        // ================ Equal cost so far ================= 
        else {
            const replace_to_cur = next_tdir * next_first_link.crn.side
                * Utils.detCoords(prev_to_next, best_at_next.to_cur) > 0;
            if (replace_to_cur) { // replace best.to_cur if it is likely to reject more future searches
                best_at_next.to_cur = prev_to_next;
            }

            // convert cast link to prev's link type.
            this.#changeLink(cast_link,
                next_first_link.crn, prev_first_link.type, -next_tdir,
                cast_link.left_ray, cast_link.right_ray, null,
                undefined, undefined, true, R2PListDir.Auto);
        }

        // ============== Isolate next links and queue them ==============
        if (next_tdir === R2PTreeDir.Tgt) {
            // merge rays
            const cast_ray_opened = this.#createRayFromCoord(prev_to_next, false, false);
            const cast_ray_closed = this.#createRayFromCoord(prev_to_next, true, true);
            this.#mergeRay(-next_first_link.crn.side, cast_link, cast_ray_closed);

            // isolate and queue
            const tgt_links = cast_link.copyNeighbors(next_tdir);
            for (const tgt_link of tgt_links) {
                const new_tgt_link = this.#isolateLink(R2PTreeDir.Src, tgt_link, cast_link);

                this.#mergeRay(next_first_link.crn.side, new_tgt_link, cast_ray_opened);
                const f = cast_link.cost + new_tgt_link.cost;
                this.#queue(R2PQueueType.Cast, new_tgt_link, f);
            }

        }
        else {
            const f = cast_link.cost + src_link.cost;

            // isolate, convert to T-tree link
            const ssrc_crn = src_link.neighborAt(R2PTreeDir.Src, 0).crn;
            const new_src_link = this.#isolateLink(R2PTreeDir.Tgt, src_link, cast_link);
            this.#changeLink(new_src_link,
                ssrc_crn, R2PLinkType.Vu, R2PTreeDir.Tgt,
                new_src_link.left_ray, new_src_link.right_ray, null,
                undefined, undefined, true, R2PListDir.Back);

            // queue
            this.#queue(R2PQueueType.Cast, new_src_link, f);
        }

        this.#step.registerWithData(cast_link.sprite,
            R2PActionLink.Status, R2PLinkStatus.None);
    }

    #casterCollidedThirdTrace(cast_link) {
        // return if tgt is not goal
        const has_third = cast_link.getRootCrn() === this.#goal_crn;
        if (!has_third) {
            return null;
        }

        // return if at map boundary
        const src_crn = cast_link.neighborAt(R2PTreeDir.Src, 0).crn;
        const trace_side = src_crn.side;
        const trace_didx = this.#getNextTraceDirIdx(src_crn);
        const third_pose = this.#mapper.trace(trace_side, src_crn.coord, trace_didx);
        if (third_pose.didx === 0) {
            return null;
        }

        // check if reverse trace is at map boundary
        const rev_trace_didx = this.#getPrevTraceDirIdx(src_crn);
        const rev_pose = this.#mapper.trace(-trace_side, src_crn.coord, rev_trace_didx);
        if (rev_pose.didx === 0) {
            return null;
        }

        // init trace crn
        const trace_crn = new Algs.R2PCorner(third_pose.side, third_pose.didx, third_pose.coord, third_pose.convex, -1);
        const tgt_crn = cast_link.neighborAt(R2PTreeDir.Tgt, 0).crn;
        const cast_ray_coord = Utils.subtractCoords(tgt_crn.coord, src_crn.coord);
        const cast_ray = this.#createRayFromCoord(cast_ray_coord, true, true);

        // generate src link
        const new_src_link = this.#createLink();
        const src_prog_ray = Utils.subtractCoords(trace_crn.coord, src_crn.coord);
        this.#changeLink(new_src_link,
            trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
            cast_link.left_ray, cast_link.right_ray, src_prog_ray,
            cast_link.copyNeighbors(R2PTreeDir.Src), [], false, R2PListDir.Back);
        this.#mergeRay(trace_side, new_src_link, cast_ray);

        // generate un link at src crn
        const new_un_link = this.#createLink();
        this.#changeLink(new_un_link,
            src_crn, R2PLinkType.Un, R2PTreeDir.Tgt,
            null, null, null,
            [], cast_link.copyNeighbors(R2PTreeDir.Tgt), true, R2PListDir.Auto);

        // generate oc link at rev crn
        const rev_crn = this.#corners.at(src_crn.side, rev_pose.didx, rev_pose.coord, rev_pose.convex);
        const new_oc_link = this.#createLink();
        this.#changeLink(new_oc_link,
            rev_crn, R2PLinkType.Oc, R2PTreeDir.Tgt,
            null, null, null,
            [], [new_un_link], true, R2PListDir.Auto);

        // generate tgt link
        const new_tgt_link = this.#createLink();
        const tgt_prog_ray = Utils.subtractCoords(trace_crn.coord, rev_crn.coord);
        this.#changeLink(new_tgt_link,
            trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
            null, null, tgt_prog_ray,
            [], [new_oc_link], false, R2PListDir.Back);

        return new Algs.R2PTrace(trace_crn);
    }

    /**
     * 
     * @param {Algs.R2PLink} cast_link 
     * @param {R2PSide} trace_side 
     * @param {Algs.R2PPose} col_pose 
     * @returns {null | Algs.R2PTrace}
     */
    #casterCollidedMjrMnrTrace(cast_link, trace_side, col_pose) {
        // return if at map boundary
        if (col_pose.didx === 0) {
            return null;
        }
        0; //this.#dbg();

        // init trace crn
        const trace_crn = new Algs.R2PCorner(trace_side, col_pose.didx, col_pose.coord, col_pose.convex, -1);
        const cast_ray_coord = Utils.multiplyCoord(cast_link.getDiff(), -1);
        const cast_ray = this.#createRayFromCoord(cast_ray_coord, true, true);


        // generate src link
        const new_src_link = this.#createLink();
        this.#changeLink(new_src_link,
            trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
            cast_link.left_ray, cast_link.right_ray, cast_ray_coord,
            cast_link.copyNeighbors(R2PTreeDir.Src), [], false, R2PListDir.Back);
        this.#mergeRay(-trace_side, new_src_link, cast_ray);

        // generate tgt link
        const new_tgt_link = this.#createLink();
        const tgt_prog_ray = [-cast_ray_coord[0], -cast_ray_coord[1]];
        this.#changeLink(new_tgt_link,
            trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
            null, null, tgt_prog_ray,
            [], cast_link.copyNeighbors(R2PTreeDir.Tgt), false, R2PListDir.Back);

        return new Algs.R2PTrace(trace_crn);
    }

    /**
     * Generates trace from collisions
     * @param {Algs.R2PPose} left_col_pose
     * @param {Algs.R2PPose} right_col_pose
     * @param {Algs.R2PLink} cast_link 
     */
    #casterCollided(left_col_pose, right_col_pose, cast_link) {
        const src_coord_str = cast_link.crn.coord.join(",");
        const tgt_coord_str = cast_link.getRootCrn().coord.join(",");
        const dbg_str = ` CastCollided (${src_coord_str}) to (${tgt_coord_str})`;
        0; //this.#dbg(`[CC] ${dbg_str}`);

        // ============ Get Values ===================
        const mjr_side = cast_link.crn.side;
        const mnr_side = -mjr_side;
        let mnr_col_pose, mjr_col_pose;
        if (mjr_side === R2PSide.L) {
            mjr_col_pose = left_col_pose;
            mnr_col_pose = right_col_pose;
        }
        else {
            mjr_col_pose = right_col_pose;
            mnr_col_pose = left_col_pose;
        }

        // create links for mnr and third trace iff source is not Ey (Overlap rule 2).
        let mnr_trace = null, third_trace = null;
        if (cast_link.neighborAt(R2PTreeDir.Src, 0).type !== R2PLinkType.Ey) {
            // Generate mnr trace corner and links if not at map boundary
            mnr_trace = this.#casterCollidedMjrMnrTrace(cast_link, mnr_side, mnr_col_pose);

            // Generate third trace and links if not at map boundary
            third_trace = this.#casterCollidedThirdTrace(cast_link);
        }

        // Generate mjr trace corner and links if not at map boundary
        const mjr_trace = this.#casterCollidedMjrMnrTrace(cast_link, mjr_side, mjr_col_pose);


        // Delete cast_link
        this.#eraseLink(cast_link);

        // Generate traces
        if (mnr_trace) {
            0; //this.#dbg(`[CC] MnrTrace for ${dbg_str}`);
            this.#tracer(mnr_trace);
        }
        if (!mnr_trace || !mnr_trace.refound_src) {
            if (third_trace) {
                0; //this.#dbg(`[CC] ThirdTrace for ${dbg_str}`);
                this.#tracer(third_trace);
            }
        }
        else { // refound src, no need to do third trace
            if (third_trace) {
                // delete links in third trace
                this.#eraseTree(R2PTreeDir.Src, third_trace.crn.linkAt(R2PTreeDir.Src, 0));
                this.#eraseTree(R2PTreeDir.Tgt, third_trace.crn.linkAt(R2PTreeDir.Tgt, 0));
            }
        }
        if (mjr_trace) {
            0; //this.#dbg(`[CC] MjrTrace for ${dbg_str}`);
            this.#tracer(mjr_trace);
        }
    }

    /**
     * 
     * @param {R2PSide} side 
     * @param {Algs.R2PLink} link 
     * @param {Algs.R2PRay} new_ray 
     */
    #mergeRay(side, link, new_ray) {
        const old_ray = side === R2PSide.L ? link.left_ray : link.right_ray;
        const can_replace = (old_ray === null || side * Utils.detCoords(old_ray.getCoord(), new_ray.getCoord()) > 0);
        if (can_replace) {
            0; //this.#dbg(`[MR] Replace Old${side}Ray(${old_ray}) with new ray (${new_ray}) for link ${link}`);
            if (side === R2PSide.L) {
                link.left_ray = new_ray.copy();
                this.#step.registerWithData(link.sprite,
                    R2PActionLink.LeftRay, new_ray.copy());
            } else {
                link.right_ray = new_ray.copy();
                this.#step.registerWithData(link.sprite,
                    R2PActionLink.RightRay, new_ray.copy());
            }

            if (link.left_ray !== null && link.right_ray !== null &&
                Utils.detCoords(link.left_ray.getCoord(), link.right_ray.getCoord()) > 0)
                throw new Error("wtf");
        }
    }

    /**
     * 
     * @param {Algs.R2PLink} src_link 
     */
    #setupTracerFromLink(src_link) {
        const tgt_links = src_link.copyNeighbors(R2PTreeDir.Tgt);
        const tm_crn = src_link.neighborAt(R2PTreeDir.Tgt, 0).crn;
        const trace_crn = new Algs.R2PCorner(tm_crn.side, tm_crn.didx, tm_crn.coord, tm_crn.convex, -1);
        const src_prog_ray = src_link.getDiff(); // note place here to prevent deletions

        // ---------- Isolate and move tgt links to trace crn ----------------
        for (const tgt_link of tgt_links) {
            const new_tgt_link = this.#isolateLink(R2PTreeDir.Src, tgt_link, src_link); // make sure to point only to src link
            const tgt_prog_ray = new_tgt_link.getDiff();
            this.#changeLink(new_tgt_link,
                trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                null, null, tgt_prog_ray,
                [], undefined, false, R2PListDir.Back); // disconnect src link
        }

        // ----------- Move src link to trace crn ---------
        this.#changeLink(src_link,
            trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
            src_link.left_ray, src_link.right_ray, src_prog_ray,
            undefined, undefined, false, R2PListDir.Back); // there should not be any tgt links in src link 

        // ----- Trace -----------
        this.#tracer(new Algs.R2PTrace(trace_crn));
    }

    /**
     * Make sure prog, left, and right rays are properly set before tracer.
     * @param {Algs.R2PTrace} tr
     */
    #tracer(tr) {
        // set prog, left and right rays before tracer

        while (1) {
            this.#newMedStep();
            0; //this.#dbg(`[TR] At ${tr.crn} ======`);

            tr.all_src_prog = true;
            tr.all_tgt_prog = true;

            // ========== Skip if refound src corner ==============
            if (this.#tracerRefoundSrcRoot(tr))
                break;
            // ========== Process src link ===================
            if (this.#tracerProcess(tr, R2PTreeDir.Src))
                break; // no more src links
            // ========== Process tgt link ===================
            if (this.#tracerProcess(tr, R2PTreeDir.Tgt))
                break; // no more tgt links

            // ========== Interrupt ==================
            if (this.#tracerInterruptRule(tr))
                break;

            // ========== Place rule ================
            if (this.#tracerPlaceRule(tr))
                break;

            // ========== Move to next corner ================
            if (this.#trace(tr))
                break; // at map boundary

            ++tr.num_crns;
        }

        // ============ try to erase unused links ==============
        for (const tdir of [R2PTreeDir.Src, R2PTreeDir.Tgt]) {
            const links = tr.crn.copyLinks(tdir);
            for (const link of links)
                this.#eraseTree(tdir, link);
        }
    }

    #addToOverlapBuffer(crn) {
        0; //this.#dbg(`[OB] Add to overlap buffer for ${crn}`);
        if (!this.#overlap_buffer.includes(crn))
            this.#overlap_buffer.push(crn);
    }

    /**
     * 
     * @param {Algs.R2PTrace} tr 
     * @returns {boolean}
     */
    #tracerPlaceRule(tr) {
        const trace_crn = tr.crn;

        // ============ Try to place turning point and cast if current traced corner is convex ====================
        if (trace_crn.convex) {
            const src_link = trace_crn.linkAt(R2PTreeDir.Src, 0);
            // ---------- Cannot place if no src prog ---------------
            if (!src_link.is_prog)
                return false;

            // ---------- Cannot place if next trace dir does not decrease src prog ---------------
            const next_trace_dir = Utils.dirIndexToDir(this.#getNextTraceDirIdx(trace_crn));
            const is_rev = trace_crn.side * Utils.detCoords(src_link.prog_ray, next_trace_dir) > 0;
            if (!is_rev)
                return false;

            // ----------- Re-anchor src link to turning point ------------
            const place_crn = this.#corners.at(trace_crn.side, trace_crn.didx, trace_crn.coord, trace_crn.convex);
            const ssrc_link = src_link.getFirstRootLink();
            const placed_link_type = (ssrc_link.type === R2PLinkType.Eu || ssrc_link.type === R2PLinkType.Ey) ?
                R2PLinkType.Eu : R2PLinkType.Vu;
            this.#changeLink(src_link,
                place_crn, placed_link_type, R2PTreeDir.Src,
                src_link.left_ray, src_link.right_ray, null,
                undefined, undefined, true, R2PListDir.Auto);

            // --------- Mark for overlap check if num links at placed crn (incl. its opp side) > 1 ------------
            if (!tr.has_overlap && placed_link_type !== R2PLinkType.Eu) {
                let num_links_at_place = place_crn.numLinks(R2PTreeDir.Src) + place_crn.numLinks(R2PTreeDir.Tgt);
                const other_crn = this.#corners.hasOtherSide(place_crn);
                if (num_links_at_place === 1 && other_crn)
                    num_links_at_place += other_crn.numLinks(R2PTreeDir.Src) + other_crn.numLinks(R2PTreeDir.Tgt);
                tr.has_overlap = num_links_at_place > 1;
                if (tr.has_overlap)
                    0; //this.#dbg(`Has overlap at ${place_crn}`);
            }

            // ----------- Check if castable to some targets -------------
            const tgt_links = trace_crn.copyLinks(R2PTreeDir.Tgt);
            for (const tgt_link of tgt_links) {
                const is_vis = tgt_link.is_prog
                    && trace_crn.side * Utils.detCoords(next_trace_dir, tgt_link.prog_ray) >= 0;
                // -------------- Is Castable -----------------
                if (is_vis) {
                    this.#changeLink(tgt_link,
                        place_crn, R2PLinkType.Vu, R2PTreeDir.Tgt,
                        null, null, null,
                        [src_link], undefined, true, R2PListDir.Auto);

                    // ----- Has overlap, or Eu turning point added, do not queue, use overlap rule -----------------
                    if (tr.has_overlap || placed_link_type === R2PLinkType.Eu) {
                        this.#addToOverlapBuffer(place_crn);
                    }
                    // ----- Queue if no overlap and is Vu turning point --------------
                    else {
                        const f = src_link.cost + tgt_link.cost;
                        this.#queue(R2PQueueType.Cast, tgt_link, f);
                    }
                }
            }

            if (trace_crn.numLinks(R2PTreeDir.Tgt) === 0)
                return true; // all tgt links are castable.

            // ----------- Create new src link if there are remaining tgt links -------------------
            const new_src_link = this.#createLink();
            this.#changeLink(new_src_link,
                trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
                null, null, next_trace_dir,
                [src_link], [], false, R2PListDir.Front);

            return false;
        }
        // ============ Try to place phantom point if current traced corner is nonconvex ====================
        else {
            // place a phantom point?
            const tgt_links = trace_crn.copyLinks(R2PTreeDir.Tgt);
            const next_trace_dir = Utils.dirIndexToDir(this.#getNextTraceDirIdx(trace_crn));
            const new_ttgt_links = [];

            // ----------- Check if phantom point can be placed------------
            for (const tgt_link of tgt_links) {
                if (!tgt_link.is_prog)
                    continue;

                const is_rev = trace_crn.side * Utils.detCoords(next_trace_dir, tgt_link.prog_ray) > 0; // opposite from src
                if (!is_rev)
                    continue;

                new_ttgt_links.push(tgt_link);
            }

            // ----------- Phantom point can be placed --------
            if (new_ttgt_links.length > 0) {
                const place_crn = this.#corners.at(trace_crn.side, trace_crn.didx, trace_crn.coord, trace_crn.convex);
                const new_tgt_link = this.#createLink();

                // ---- Reanchor all affected old tgt links ---------
                for (const new_ttgt_link of new_ttgt_links) {
                    this.#changeLink(new_ttgt_link,
                        place_crn, R2PLinkType.Un, R2PTreeDir.Tgt,
                        null, null, null,
                        [new_tgt_link], undefined, true, R2PListDir.Auto);
                }

                // ---- Create new tgt link ----------
                this.#changeLink(new_tgt_link,
                    trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                    null, null, next_trace_dir,
                    [], undefined, false, R2PListDir.Front);
            }
            return false;
        }

    }

    /**
     * 
     * @param {Algs.R2PTrace} tr 
     * @returns {boolean} 
     */
    #tracerInterruptRule(tr) {
        if (tr.num_crns < this.#num_interrupt || tr.all_src_prog === false || tr.all_tgt_prog === false) {
            return false;
        }  // ====================== Interruptable =========================
        else {
            const trace_crn = tr.crn;
            const tm_crn = this.#corners.at(trace_crn.side, trace_crn.didx, trace_crn.coord, trace_crn.convex);

            // -------------- Place src link at new tm corner ----------------
            const src_link = trace_crn.linkAt(R2PTreeDir.Src, 0);
            this.#changeLink(src_link,
                tm_crn, R2PLinkType.Tm, R2PTreeDir.Src,
                src_link.left_ray, src_link.right_ray, null,
                undefined, undefined, true, R2PListDir.Auto);

            // -------------- Place tgt link at new tm corner ----------------
            let min_tgt_cost = Infinity;
            const tgt_links = trace_crn.copyLinks(R2PTreeDir.Tgt);
            for (const tgt_link of tgt_links) {
                this.#changeLink(tgt_link,
                    tm_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                    null, null, null,
                    [src_link], undefined, true, R2PListDir.Auto);
                if (min_tgt_cost > tgt_link.cost)
                    min_tgt_cost = tgt_link.cost
            }

            // -------- No queue and push to overlap if there overlapping turning points were placed ----------
            if (tr.has_overlap) {
                this.#addToOverlapBuffer(tm_crn);
            }
            else {
                // --------------- Otherwise, Queue ---------------------
                const f = src_link.cost + min_tgt_cost;
                this.#queue(R2PQueueType.Trace, src_link, f);
            }

            // trace_crn should now have no links.
            return true;
        }
    }



    /**
     * 
     * @param {Algs.R2PTrace} tr 
     */
    #tracerRefoundSrcRoot(tr) {
        const trace_crn = tr.crn;
        const src_link = trace_crn.linkAt(R2PTreeDir.Src, 0);
        const src_root_crn = src_link.neighborAt(R2PTreeDir.Src, 0).crn;
        const refound = this.#atCrn(trace_crn.coord, trace_crn.didx, src_root_crn);
        tr.refound_src = refound;
        if (refound) {
            0; //this.#dbg(`[TR] Refound Src`);
        }
        return refound;
    }

    /**
     * Returns true if all tdir links from trace_crn are removed.
     * @param {Algs.R2PTrace} tr 
     * @param {R2PTreeDir} tdir
     * @returns {boolean}
     */
    #tracerProcess(tr, tdir) {
        const trace_crn = tr.crn;
        for (let link_idx = 0; link_idx < trace_crn.numLinks(tdir); ++link_idx) {
            const link = trace_crn.linkAt(tdir, link_idx);

            // ========== Progression Rule ==============
            if (this.#tracerProgRule(tr, link))
                continue;

            // ========== Sector Rule (Src only) ==============
            if (this.#tracerAngSecRule(tr, link)) {
                --link_idx; // required to continue checking the pruned vy corner
                continue;
            }

            // ========== SKip if start or goal ========
            if (this.#tracerIsStartOrGoal(link))
                continue;

            // ========== OcSec ================
            if (this.#tracerOcSecRule(tr, link))
                continue;

            // ========== Prune rule ====================
            if (this.#tracerPruneRule(tr, link)) {
                --link_idx;
                continue;
            }
        }

        return trace_crn.numLinks(tdir) === 0;
    }

    /**
     * 
     * @param {Algs.R2PTrace} tr 
     * @param {Algs.R2PLink} link 
     */
    #tracerPruneRule(tr, link) {
        const root_link = link.getFirstRootLink();
        const root_crn = root_link.crn;

        if (root_crn.side !== tr.crn.side)
            return false;

        const root_to_cur = link.getDiff();
        const prune_ray = root_link.getDiff();

        // ============= Can Prune =====================
        if (this.#crossedRay(link.tdir, root_crn.side, tr.crn, prune_ray, root_to_cur)) {
            0; //this.#dbg(`[TR] Prepare to Prune ${link}`);

            // ---------- Delete Current link ----------------
            const old_root_links = link.copyNeighbors(link.tdir);
            this.#eraseLink(link);

            // ---------- Move all of the current link's root link to the current trace -----------------
            for (const old_root_link of old_root_links) {
                const new_link = this.#isolateLink(-old_root_link.tdir, old_root_link, null);
                const prog_ray = Utils.subtractCoords(tr.crn.coord, new_link.getRootCrn().coord);
                this.#changeLink(new_link,
                    tr.crn, R2PLinkType.Tm, new_link.tdir,
                    new_link.left_ray, new_link.right_ray, prog_ray,
                    undefined, undefined, false, R2PListDir.Back);
            }

            return true;
        }
        // ============= Do nothing if cannot prune =======================
        else // cannot prune
            return false;
    }

    /**
     * 
     * @param {Algs.R2PTrace} tr 
     * @param {Algs.R2PLink} link 
     * @returns 
     */
    #tracerOcSecRule(tr, link) {
        const root_link = link.getFirstRootLink();
        const root_crn = root_link.crn;
        const trace_crn = tr.crn;

        if (root_crn.side === trace_crn.side)
            return false;

        const root_to_cur = link.getDiff();

        if (root_link.type === R2PLinkType.Oc) {
            // check if is behind the ray

            const ttgt_to_tgt = root_link.getDiff();
            if (root_crn.side * Utils.detCoords(ttgt_to_tgt, root_to_cur) > 0) {
                0; //this.#dbg(`[TR] Prepare to erase bcos 180 around TTgtOcLink ${root_link}`);

                // Rotated 180. Remove the link (tgt_link @ trace) and root_link (ttgt_link @ oc) from the trace.
                this.#eraseTree(R2PTreeDir.Tgt, link);
                return true;
            }
            else {   // in oc sec of nb_link.
                0; //this.#dbg(`[TR] In OcSec of TgtOcLink ${root_link}`);
                return false;
            }
        }

        // ============ Determine if in Ocsec ================
        const trace_side = -link.tdir * root_crn.side;
        let trace_didx = -trace_side * (root_crn.convex ? 1 : 3);
        trace_didx = Utils.addDirIndex(root_crn.didx, trace_didx);
        const trace_dir = Utils.dirIndexToDir(trace_didx);
        const in_ocsec = (trace_side * Utils.detCoords(trace_dir, root_to_cur)) > 0;

        if (in_ocsec) {
            // Get the corner adjacent to the root crn at the offending edge.
            const new_trace_pose = this.#mapper.trace(
                trace_side, root_crn.coord, trace_didx);

            // ========= In Ocsec of Src corner ==============
            if (link.tdir === R2PTreeDir.Src) {
                0; //this.#dbg(`[TR] Prepare to recurse bcos In OcSec of SSrclink  ${root_link}`);
                // Generate ROS trace
                const new_trace_crn = new Algs.R2PCorner(
                    new_trace_pose.side, new_trace_pose.didx, new_trace_pose.coord, new_trace_pose.convex, -1);

                // move the src link (link) to the new trace corner
                const src_prog_ray = Utils.subtractCoords(new_trace_crn.coord, root_crn.coord); // conincident to trace_dir
                this.#changeLink(link,
                    new_trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
                    link.left_ray, link.right_ray, src_prog_ray,
                    undefined, undefined, false, R2PListDir.Back);

                // move all current tgt links to a newly placed tm corner at the current traced position
                const tm_crn = this.#corners.at(trace_crn.side, trace_crn.didx, trace_crn.coord, trace_crn.convex);
                const new_tm_links = trace_crn.copyLinks(R2PTreeDir.Tgt);
                for (const new_tm_link of new_tm_links)
                    this.#changeLink(new_tm_link,
                        tm_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                        null, null, null,
                        undefined, undefined, true, R2PListDir.Auto);

                // create a new tgt link for the new trace corner and connect the new_tm_links to this. cost is auto calculated
                const new_tgt_link = this.#createLink();
                const tgt_prog_ray = Utils.subtractCoords(new_trace_crn.coord, tm_crn.coord);
                this.#changeLink(new_tgt_link,
                    new_trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                    null, null, tgt_prog_ray,
                    [], new_tm_links, false, R2PListDir.Back);

                // begin trace
                0; //this.#dbg(`[TR] Start OcSec Recurse.`);
                this.#tracer(new Algs.R2PTrace(new_trace_crn));

                // trace_crn should have zero links now.
            }
            // ========= In Ocsec of Non-Oc Tgt corner ==============
            else {
                0; //this.#dbg(`[TR] Place Oc bcos In OcSec of TTgtLink ${root_link}`);
                // Place the tgt link at the first corner from tgt crn.
                const oc_crn = this.#corners.at(root_crn.side,
                    new_trace_pose.didx, new_trace_pose.coord, new_trace_pose.convex);
                this.#changeLink(link,
                    oc_crn, R2PLinkType.Oc, R2PTreeDir.Tgt,
                    null, null, null,
                    undefined, undefined, true, R2PListDir.Auto);

                // Create new tgt link (new_link)
                const tgt_prog_ray = Utils.subtractCoords(trace_crn.coord, oc_crn.coord);
                const new_tgt_link = this.#createLink();
                this.#changeLink(new_tgt_link,
                    trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                    null, null, tgt_prog_ray,
                    [], [link], false, R2PListDir.Front);
            }

        }

        return true; // as long as root_crn.side !== trace_crn.side
    }

    /**
     * 
     * @param {Algs.R2PLink} link 
     */
    #tracerIsStartOrGoal(link) {
        const root_crn = link.neighborAt(link.tdir, 0).crn;
        if (link.tdir === R2PTreeDir.Src) {
            return this.#start_crn === root_crn;
        }
        else {
            return this.#goal_crn === root_crn;
        }
    }

    /**
     * Returns true if the _ray_at_root_ lies to _crn.side_ of _root_to_crn_, 
     * by taking into account the contour assumption at the corner _crn_.
     * The contour assumption is used to break ties when the 2D cross product of _ray_at_root and _root_to_crn evaluates to zero (parallel, or root_to_crn is zero)
     * The contour assumption breaks ties by considering the infinitesimal distance of the obstacle edge from the grid lines.
     * If the next traced edge under the contour assumption will cross the ray, crossedRay returns true.
     * Further assumes that all trace rules are obeyed before the corner
     * @param {R2PTreeDir} tdir The root is on a tdir-tree link
     * @param {R2PSide} side Will return true if ray_at_root lies on tdir*side of  root_to_cur
     * @param {Algs.R2PCorner} trace_crn The currently traced corner.
     * @param {[number, number]} ray_at_root The directional vector pointing from the root.
     * @param {[number, number]} root_to_cur The directional vector pointing from the root to the corner.
     * @returns {boolean}
     */
    #crossedRay(tdir, side, trace_crn, ray_at_root, root_to_cur) {
        let nrm_det = Utils.detCoords(ray_at_root, root_to_cur);
        if (nrm_det === 0) {
            // ray_at_root and root_to_cur are parallel, 
            // or root_to_cur is zero (at start / checkerboard)
            const crn_dir = Utils.dirIndexToDir(trace_crn.didx);
            nrm_det = Utils.detCoords(ray_at_root, crn_dir);
            // if still zero, means ray_at_root // root_to_cur // crn_dir, and will cross at the next traced corner
        }
        nrm_det *= tdir * side;
        return nrm_det > 0;
    }

    /**
     * 
     * @param {Algs.R2PTrace} tr
     * @param {Algs.R2PLink} src_link
     * @returns {boolean}
     */
    #tracerAngSecRule(tr, src_link) {
        // ============= Return if not link is not S-tree. =============
        if (src_link.tdir !== R2PTreeDir.Src)
            return false;

        const trace_crn = tr.crn;
        const side = trace_crn.side;
        const ray = side === R2PSide.L ? src_link.left_ray : src_link.right_ray;

        // =============== Return if there is no sector ray ==================
        if (ray === null)
            return false;

        // =============== check if Crossed ray ====================
        const ssrc_link = src_link.getFirstRootLink();
        const root_to_cur = src_link.getDiff();
        const ray_diff = ray.getCoord();
        0; //this.#dbg(`AS: ${trace_crn}; r${ray} ; r2c: ${root_to_cur.join(",")}`);
        if (this.#crossedRay(R2PTreeDir.Src, side, trace_crn, ray_diff, root_to_cur)) {
            0; //this.#dbg(`[TR] AngSec Crossed Ray [${ray_diff.join(",")}] for SrcLink ${src_link}`);

            // Mark the current ray as projected and checked
            const ray_was_closed = ray.closed;
            ray.closed = true;

            // Generate Recur Ang Sec (RAS) trace if cur trace does not overlap ray's collision point
            const [left_pose, right_pose] = this.#project(ssrc_link.crn, ray_diff);
            const prev_pose = side === R2PSide.L ? left_pose : right_pose
            if (!this.#atCrn(prev_pose.coord, prev_pose.didx, trace_crn)) {
                // Generate recur ang sec (RAS) trace.
                0; //this.#dbg(`[TR] Prepare Recur AS Trace`);

                // Create UN link on the first corner on the trace side of the collision point
                const un_pose = side === R2PSide.L ? left_pose : right_pose;
                const un_crn = this.#corners.at(-side, un_pose.didx, un_pose.coord, un_pose.convex);
                const new_un_link = this.#createLink();

                // Create new tgt link anchored at current node 
                const new_trace_pose = side === R2PSide.L ? right_pose : left_pose;
                const new_trace_crn = new Algs.R2PCorner(
                    -side, new_trace_pose.didx, new_trace_pose.coord, new_trace_pose.convex, -1);
                const new_tgt_link = this.#createLink();

                // Create new ttgt links anchored at current traced corner, and connect them
                const tm_crn = this.#corners.at(trace_crn.side, trace_crn.didx, trace_crn.coord, trace_crn.convex);
                for (let i = 0; i < trace_crn.numLinks(R2PTreeDir.Tgt); ++i) {
                    const old_tgt_link = trace_crn.linkAt(R2PTreeDir.Tgt, i);

                    const old_ttgt_links = old_tgt_link.copyNeighbors(R2PTreeDir.Tgt);

                    const new_tm_link = this.#createLink();
                    // connect links and calc cost
                    this.#changeLink(new_tm_link,
                        tm_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                        null, null, null,
                        [new_un_link], old_ttgt_links, true, R2PListDir.Auto);
                }

                // Finalize UN link
                this.#changeLink(new_un_link,
                    un_crn, R2PLinkType.Un, R2PTreeDir.Tgt,
                    null, null, null,
                    [new_tgt_link], undefined, true, R2PListDir.Auto);

                // Finalize new Tgt link
                const tgt_prog_ray = Utils.subtractCoords(new_trace_crn.coord, un_crn.coord);
                this.#changeLink(new_tgt_link,
                    new_trace_crn, R2PLinkType.Tm, R2PTreeDir.Tgt,
                    null, null, tgt_prog_ray,
                    [], undefined, false, R2PListDir.Back);

                // Create new src link anchored at new traced corner and connect to ssrc link
                const new_src_link = this.#createLink();
                const src_prog_ray = Utils.subtractCoords(new_trace_crn.coord, ssrc_link.crn.coord);

                this.#changeLink(new_src_link,
                    new_trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
                    src_link.left_ray, src_link.right_ray, src_prog_ray,
                    [ssrc_link], [], false, R2PListDir.Back); // note the cast ray is closed at this point. (src_link.left_ray or src_link.right_ray)

                // RAS trace
                0; //this.#dbg(`[TR] Begin Recur AS Trace`);
                this.#tracer(new Algs.R2PTrace(new_trace_crn));
            }

            // =============== Prune link if not rotated one round around start ====================
            // If no more sssrc link, (i.e. rotated one round around start, trace will stop)
            // If still have sssrc link, continue tracing.
            // Cannot prune if the ray was already closed
            if (ssrc_link.numNeighbors(R2PTreeDir.Src) > 0 && ray_was_closed === false) {
                0; //this.#dbg(`[TR] Begin Link Pruning for AS`);
                // Isolate SSrc link
                const new_src_link = this.#isolateLink(R2PTreeDir.Tgt, ssrc_link, src_link);

                // update prog ray for new src link (new_src_link), and anchor it to temp trace_crn.
                const src_prog_ray = Utils.subtractCoords(trace_crn.coord, new_src_link.getRootCrn().coord);
                // if (side === R2PSide.L)
                //     new_src_link.right_ray.closed = true;
                // else
                //     new_src_link.left_ray.closed = true;
                this.#changeLink(new_src_link,
                    trace_crn, R2PLinkType.Tm, R2PTreeDir.Src,
                    new_src_link.left_ray, new_src_link.right_ray, src_prog_ray,
                    undefined, [], false, R2PListDir.Back);
            }
            else {
                0; //this.#dbg(`[TR] No Link Pruning for AS`);
            }

            // Prune the src link
            this.#eraseTree(R2PTreeDir.Src, src_link);
            return true;
        }
        return false;
    }

    /**
     * Returns true if the ray is not progressed, false if progressed.
     * Assumes that no winding is involved, because all src and tgt prog will not decrease by more than 180 deg.
     * If root_to_cur is zero, the contour assumption will be used to evaluate root_to_cur to the direction of trace_crn.didx.
     * @param {R2PTreeDir} tdir The root lies in the tdir of cur. (i.e. on a tdir-tree link)
     * @param {Algs.R2PCorner} trace_crn The currently traced corner.
     * @param {[number, number]} prog_ray The directional vector pointing from the root, representing the maximum progression.
     * @param {[number, number]} root_to_cur The directional vector pointing from the root to the trace_crn.
     */
    #notProgressed(tdir, trace_crn, prog_ray, root_to_cur) {
        if (root_to_cur[0] === 0 && root_to_cur[1] === 0)
            root_to_cur = Utils.dirIndexToDir(trace_crn.didx);
        const nrm_det = tdir * trace_crn.side * Utils.detCoords(root_to_cur, prog_ray);
        return nrm_det > 0;
    }

    /**
     * 
     * @param {Algs.R2PTrace} tr 
     * @param {Algs.R2PLink} link 
     */
    #tracerProgRule(tr, link) {
        const root_to_cur = link.getDiff();
        const not_prog = this.#notProgressed(
            link.tdir, tr.crn, link.prog_ray, root_to_cur);
        if (not_prog) {
            if (link.tdir === R2PTreeDir.Src)
                tr.all_src_prog = false
            else
                tr.all_tgt_prog = false;
            link.is_prog = false;
            0; //this.#dbg(`[TR] Not Prog for ${link}`);
            return true;
        }
        else {
            // is progressed.
            if (link.tdir === R2PTreeDir.Src) {
                if (!link.is_prog && this.#tracerProgRuleSrcProgCast(tr, link)) {
                    return true;
                }
            }

            // update progression ray
            link.prog_ray = root_to_cur;
            link.is_prog = true;
            0; //this.#dbg(`[TR] Prog for ${link}`);

            this.#step.registerWithData(link.sprite,
                R2PActionLink.ProgRay, link.prog_ray.slice());
            return false;
        }
    }

    /** 
     * Returns true if a cast has occured in the direction of the source progression ray.
     * Assumes that this.#notProgressed() returned true at trace_crn (i.e. lies on progressed side of prog ray).
     * @param {Algs.R2PTrace} tr current traced corner.
     * @param {Algs.R2PLink} src_link The source link.
     * @returns {boolean}
     */
    #tracerProgRuleSrcProgCast(tr, src_link) {

        const trace_crn = tr.crn;
        // get sign direction of previous traced edge.
        const prev_trace_didx = this.#getPrevTraceDirIdx(trace_crn);
        const prev_trace_dir = Utils.dirIndexToDir(prev_trace_didx);

        // check if the traced edge crossed the opposite direction of the ray.
        const det1 = Utils.detCoords(src_link.getDiff(), prev_trace_dir);
        const det2 = Utils.detCoords(prev_trace_dir, src_link.prog_ray);

        // case for root_to_cur === 0 will never occur for 180 degree turns,
        // and the sufficient condition is > 0 instead of >= 0.
        const rotated_180 = det1 * det2 > 0;

        if (rotated_180) {


            // When rotated 180, there is always only one target link 
            // anchored at the phantom point where the progresion ray points to.
            if (trace_crn.numLinks(R2PTreeDir.Tgt) !== 1 ||
                trace_crn.numLinks(R2PTreeDir.Src) !== 1)
                throw new Error(`There are >1 src links or >1 tgt links for src prog cast`);

            // To connect tgt_link and ssrc_link
            // get the tgt link, convert it to unreachable
            const tgt_link = trace_crn.linkAt(R2PTreeDir.Tgt, 0);
            const ssrc_link = src_link.getFirstRootLink();

            // reanchor tgt link at the anchor of ssrc link
            this.#changeLink(tgt_link,
                ssrc_link.crn, R2PLinkType.Vu, R2PTreeDir.Tgt,
                null, null, null,
                [ssrc_link], undefined, false, R2PListDir.Auto);

            // reanchor ttgt links to Unreachable nodes.
            const ttgt_links = tgt_link.copyNeighbors(R2PTreeDir.Tgt);
            for (const ttgt_link of ttgt_links) {
                const new_ttgt_link = this.#isolateLink(R2PTreeDir.Src, ttgt_link, tgt_link);
                this.#changeLink(new_ttgt_link,
                    new_ttgt_link.crn, R2PLinkType.Un, R2PTreeDir.Tgt,
                    null, null, null,
                    undefined, undefined, false, R2PListDir.Auto);
            }
            this.#calcLinkCost(tgt_link);

            // remove src link
            this.#eraseLink(src_link);

            // calculate f cost
            const f = tgt_link.cost + ssrc_link.cost;

            // queue       
            0; //this.#dbg(`[TR] SrcProgCast for ${src_link}`);
            this.#queue(R2PQueueType.Cast, tgt_link, f);

            // crn_cur will now have zero links
        }
        return rotated_180;
    }

    /** 
     * @param {Algs.R2PLink} link
     * @param {number} cost
     */
    #setLinkCost(link, cost) {
        if (link.cost !== cost)
            this.#step.registerWithData(link.sprite,
                R2PActionLink.Cost, cost);
        link.cost = cost;
    }

    /**
     * @param {Algs.R2PLink} link
     */
    #calcLinkCost(link) {
        const prev_cost = link.cost;
        link.calcCost();
        if (prev_cost !== link.cost)
            this.#step.registerWithData(link.sprite,
                R2PActionLink.Cost, link.cost);
    }

    /**
     * @param {R2PQueueType} qtype
     * @param {Algs.R2PLink} link
     * @param {number} f
     */
    #queue(qtype, link, f) {
        if (link.qnode)
            throw new Error(`link is already queued!`);
        this.#open_list.queue(qtype, link, f);
        0; //this.#dbg(`------- [Q] Queue ${link.qnode}`);
        this.#newSmallStep();
        this.#step.registerWithData(link.sprite,
            R2PActionLink.Status, R2PLinkStatus.Queued);
    }


    /**
     * 
     * @returns {Algs.R2POpenListNode}
     */
    #poll() {
        const qnode = this.#open_list.poll();
        if (qnode)
            this.#step.registerWithData(qnode.link.sprite,
                R2PActionLink.Status, R2PLinkStatus.Expanding);
        return qnode;
    }

    /**
     * 
     * @param {Algs.R2PLink} link 
     */
    #unqueue(link) {
        const open_list_node = this.#open_list.unqueue(link);
        if (open_list_node) {
            this.#step.registerWithData(link.sprite,
                R2PActionLink.Status, R2PLinkStatus.None);
        }
    }

    /** 
     * @returns {Algs.R2PLink}
     */
    #createLink() {
        const link = this.#links.createLink();
        if (!link.sprite) {
            // was not created before
            const sprite = this.#canvas.add(link.id);
            link.initSprite(sprite);
        }
        // if (link.id % 1000 === 0)
        // 0; //this.#dbg(`asdf`);
        this.#step.registerWithData(link.sprite, R2PActionLink.Display, true);
        0; //this.#dbg(`[CL] Created Link[${link.id}]`);
        return link;
    }

    /**
     * 
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PLink} link 
     * @param {Algs.R2PLink[]} nb_links 
     */
    #disconnectLinks(tdir, link, nb_links) {
        for (const nb_link of nb_links)
            this.#disconnectLink(tdir, link, nb_link);
    }

    /**
     * 
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PLink} link 
     * @param {Algs.R2PLink} nb_link 
     */
    #disconnectLink(tdir, link, nb_link) {
        // ======== Visualization ===========
        let action_id = tdir === R2PTreeDir.Src
            ? R2PActionLink.AddSrcId : R2PActionLink.AddTgtId;
        this.#step.registerWithData(link.sprite, action_id,
            [nb_link.id, false]);

        action_id = tdir === R2PTreeDir.Src
            ? R2PActionLink.AddTgtId : R2PActionLink.AddSrcId;
        this.#step.registerWithData(nb_link.sprite, action_id,
            [link.id, false]);

        // ======== Proper disconnection ===========
        this.#links.disconnectLink(tdir, link, nb_link);
    }


    /**
     * 
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PLink} link 
     * @param {Algs.R2PLink[]} nb_links 
     */
    #connectLinks(tdir, link, nb_links) {
        for (const nb_link of nb_links)
            this.#connectLink(tdir, link, nb_link);
    }

    /**
     * 
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PLink} link 
     * @param {Algs.R2PLink} nb_link 
     */
    #connectLink(tdir, link, nb_link) {
        // ======== Visualization ===========
        let action_id = tdir === R2PTreeDir.Src
            ? R2PActionLink.AddSrcId : R2PActionLink.AddTgtId;
        this.#step.registerWithData(link.sprite, action_id,
            [nb_link.id, true]);
        if (link.tdir === tdir) {
            action_id = link.tdir === R2PTreeDir.Src
                ? R2PActionLink.SrcCoord : R2PActionLink.TgtCoord;
            this.#step.registerWithData(link.sprite,
                action_id, nb_link.crn.coord.slice());
        }

        action_id = tdir === R2PTreeDir.Src
            ? R2PActionLink.AddTgtId : R2PActionLink.AddSrcId;
        this.#step.registerWithData(nb_link.sprite, action_id,
            [link.id, true]);
        if (nb_link.tdir !== tdir) {
            action_id = nb_link.tdir === R2PTreeDir.Src
                ? R2PActionLink.SrcCoord : R2PActionLink.TgtCoord;
            this.#step.registerWithData(nb_link.sprite,
                action_id, link.crn.coord.slice());
        }

        // ======== Proper disconnection ===========
        this.#links.connectLink(tdir, link, nb_link);
    }

    /**
     * Ensures that a link to connected to only one nb_link in tdir direction.
     * The nb_link is assumed to be initially connected to link. 
     * If link is connected to multiple neighbor links, a new link is returned that connects only to nb_link. 
     * The old link will be disconnected from nb_link.
     * If link is connected to only one neighbor link, link is returned.
     * If nb_link is null, the returned link will follow the above but will have no tdir neigbhor links.
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PLink} link 
     * @param {null | Algs.R2PLink} nb_link
     */
    #isolateLink(tdir, link, nb_link) {
        if (!nb_link) {
            if (link.numNeighbors(tdir) === 0) {
                return link;
            }
            else {
                0; //this.#dbg(`[IL] Has >0 ${R2PTreeDir.toString(tdir)} for iso link ${link}`);
                const src_links = tdir === R2PTreeDir.Src ? [] : link.copyNeighbors(R2PTreeDir.Src);
                const tgt_links = tdir === R2PTreeDir.Src ? link.copyNeighbors(R2PTreeDir.Tgt) : [];
                const new_link = this.#createLink();
                this.#changeLink(new_link,
                    link.crn, link.type, link.tdir,
                    link.left_ray, link.right_ray, link.prog_ray,
                    src_links, tgt_links, true, R2PListDir.Back);
                return new_link;
            }
        }
        else {
            if (link.numNeighbors(tdir) === 1) {
                if (link.neighborAt(tdir, 0) !== nb_link)
                    throw new Error(`Not the same neighbor!`);
                return link;
            }
            else {
                0; //this.#dbg(`[IL] Has >1 ${R2PTreeDir.toString(tdir)} for iso link ${link}`);
                0; //this.#dbg(`[IL]      for nb link ${nb_link}`);
                const src_links = tdir === R2PTreeDir.Src ? [nb_link] : link.copyNeighbors(R2PTreeDir.Src);
                const tgt_links = tdir === R2PTreeDir.Src ? link.copyNeighbors(R2PTreeDir.Tgt) : [nb_link];
                const new_link = this.#createLink();
                this.#changeLink(new_link,
                    link.crn, link.type, link.tdir,
                    link.left_ray, link.right_ray, link.prog_ray,
                    src_links, tgt_links, true, R2PListDir.Back);
                this.#disconnectLink(tdir, link, nb_link);
                return new_link;
            }
        }
    }

    /**
     * Changes critical properties of the link. 
     * Does not change the queue status of the link.
     * @param {Algs.R2PLink} link  link to change
     * @param {Algs.R2PCorner} crn  cannot be null
     * @param {R2PLinkType} type 
     * @param {R2PTreeDir} tdir 
     * @param {null | Algs.R2PRay} left_ray Make sure not to copy the array pointer
     * @param {null | Algs.R2PRay} right_ray Make sure not to copy the array pointer
     * @param {null | [number, number]} prog_ray  Make sure not to copy the array pointer
     * @param {undefined | R2PLink[]} srcs Leave as undefined if no change.
     * @param {undefined | R2PLink[]} tgts Leave as undefined if no change.
     * @param {boolean} calc_cost True to recalculate cost
     * @param {R2PListDir} ldir How the link should be added to crn. (see Algs.R2PCorner.registerLink)
     */
    #changeLink(link, crn, type, tdir,
        left_ray, right_ray, prog_ray,
        srcs, tgts, calc_cost, ldir) {

        // all link parameters can be assigned directly without if statements.
        // if statements are needed to reduce memory for visualization purposes.
        const action_id = tdir === R2PTreeDir.Src
            ? R2PActionLink.TgtCoord : R2PActionLink.SrcCoord;
        this.#step.registerWithData(link.sprite,
            action_id, crn.coord.slice());
        this.#step.registerWithData(link.sprite,
            R2PActionLink.Side, crn.side);

        // ============= remove this link from crn ==========
        // crn.unregisterLink is affected by link.tdir and link.type
        // cannot change it until it is removed
        if (link.crn) {
            link.crn.unregisterLink(link);
        }

        // ========== change type =============
        this.#step.registerWithData(link.sprite,
            R2PActionLink.Type, type);
        link.type = type;

        // ========== change tdir =============v
        this.#step.registerWithData(link.sprite,
            R2PActionLink.Tdir, tdir);
        link.tdir = tdir;

        // =========== change crn =================
        // crn.registerLink is affected by link.tdir and link.type
        link.crn = crn;
        crn.registerLink(link, ldir);

        // ============ change srcs ================
        if (srcs !== undefined) {
            const old_srcs = link.copyNeighbors(R2PTreeDir.Src);
            this.#disconnectLinks(R2PTreeDir.Src, link, old_srcs);
            this.#connectLinks(R2PTreeDir.Src, link, srcs);
        }
        // ============ change tgts ================
        if (tgts !== undefined) {
            const old_tgts = link.copyNeighbors(R2PTreeDir.Tgt);
            this.#disconnectLinks(R2PTreeDir.Tgt, link, old_tgts);
            this.#connectLinks(R2PTreeDir.Tgt, link, tgts);
        }

        // ============= change left ray ===============
        if (left_ray) {
            this.#step.registerWithData(link.sprite,
                R2PActionLink.LeftRay, left_ray.copy());
            link.left_ray = left_ray.copy(); // can assign directly without if statements if no vis
        }
        else {
            this.#step.registerWithData(link.sprite,
                R2PActionLink.LeftRay, null);
            link.left_ray = null;
        }
        // ============= change right ray ===============
        if (right_ray) {
            this.#step.registerWithData(link.sprite,
                R2PActionLink.RightRay, right_ray.copy());
            link.right_ray = right_ray.copy(); // can assign directly without if statements if no vis
        }
        else {
            this.#step.registerWithData(link.sprite,
                R2PActionLink.RightRay, null);
            link.right_ray = null;
        }
        // ============= change prog ray ===============
        if (prog_ray) {
            this.#step.registerWithData(link.sprite,
                R2PActionLink.ProgRay, prog_ray.slice());
            link.prog_ray = prog_ray.slice(); // can assign directly without if statements if no vis
        }
        else {
            this.#step.registerWithData(link.sprite,
                R2PActionLink.ProgRay, null);
            link.prog_ray = null;
        }

        if (calc_cost)
            this.#calcLinkCost(link);

        0; //this.#dbg(`[CL] Changed to ${link}`);
    }

    /**
     * 
     * @param {Algs.R2PLink} link 
     */
    #eraseLink(link) {
        0; //this.#dbg(`[EL] Erasing Link ${link}`);
        this.#step.registerWithData(link.sprite, R2PActionLink.Display, false);

        // ---- unqueue -----
        this.#unqueue(link);

        // ---- unregister from Corner ------
        // affected by link.type and link.tdir
        if (link.crn) {
            link.crn.unregisterLink(link);
        }

        // ---- disconnect srcs and tgts ------
        let nb_links = link.copyNeighbors(R2PTreeDir.Src);
        this.#disconnectLinks(R2PTreeDir.Src, link, nb_links);
        nb_links = link.copyNeighbors(R2PTreeDir.Tgt);
        this.#disconnectLinks(R2PTreeDir.Tgt, link, nb_links);

        // ---- Reset this link for reuse -------
        this.#links.eraseLink(link);
    }

    /**
     * Erases the link if it does not have any -tdir neighbor links.
     * Function recursively called on the tdir neighbor links if the link is erased.
     * @param {R2PTreeDir} tdir 
     * @param {Algs.R2PLink} link 
     */
    #eraseTree(tdir, link) {
        if (link.numNeighbors(-tdir) === 0) {
            const next_links = link.copyNeighbors(tdir);

            this.#eraseLink(link);

            for (const next_link of next_links)
                this.#eraseTree(tdir, next_link);
        }
    }

    /**
     * 
     * @param {[number, number]} coord 
     * @param {boolean} closed 
     * @param {boolean} from_src 
     * @returns {Algs.R2PRay}
     */
    #createRayFromCoord(coord, closed, from_src) { return new Algs.R2PRay(coord[0], coord[1], closed, from_src); }
};
