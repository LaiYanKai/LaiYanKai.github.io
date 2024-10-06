"use strict";

Algs.R2PPose = class {
  /** @type {R2PSide} */
  side;
  /** @type {DirIndex} */
  didx;
  /** @type {[number, number]} */
  coord;
  /** @type {boolean} */
  convex;

  /**
   * @param {R2PSide} side The side of the pose.
   * @param {DirIndex} didx  The directional index.
   * @param {[number, number]} coord The position.
   * @param {boolean} convex true for convex, false for non-convex, for corners.
   */
  constructor(
    side = R2PSide.L,
    didx = DirIndex.NW,
    coord = [0, 0],
    convex = false
  ) {
    this.side = side;
    this.didx = didx;
    this.coord = coord;
    this.convex = convex;
  }

  toString() {
    let str = "";
    str = str.concat(`${this.convex ? "+" : "-"}`);
    str = str.concat(`${R2PSide.toString(this.side)}`);
    str = str.concat(`${this.didx}`);
    str = str.concat(`:${this.coord.join(",")}`);
    return str;
  }
};

Algs.R2PBest = class {
  /** @type {null | [number, number]} */
  to_cur;
  /** @type {number} */
  min_cost;

  constructor() {
    this.to_cur = null;
    this.min_cost = Infinity;
  }
};

Algs.R2PCorner = class extends Algs.R2PPose {
  /** @type {number} */
  id;
  /** @type {Algs.R2PLink[]} */
  #srcs;
  /** @type {Algs.R2PLink[]} */
  #tgts;
  /** @type {Algs.R2PBest} */
  #best_src;
  /** @type {Algs.R2PBest} */
  #best_tgt;

  constructor(side, didx, coord, convex, id) {
    super(side, didx, coord, convex);
    this.id = id;
    this.#srcs = [];
    this.#tgts = [];
    this.#best_src = undefined;
    this.#best_tgt = undefined;
    Object.freeze(this.id);
    Object.freeze(this.coord);
    Object.freeze(this.didx);
    Object.freeze(this.side);
    Object.freeze(this.convex);
  }

  toString() {
    return super.toString();
  }

  /**
   *
   * @param {R2PTreeDir} tdir
   * @returns {Algs.R2PBest}
   */
  best(tdir) {
    if (tdir === R2PTreeDir.Src) {
      if (!this.#best_src) this.#best_src = new Algs.R2PBest();
      return this.#best_src;
    } else if (tdir === R2PTreeDir.Tgt) {
      if (!this.#best_tgt) this.#best_tgt = new Algs.R2PBest();
      return this.#best_tgt;
    }
  }

  /**
   * Returns the tdir best if it exists, otherwise, returns undeined
   * @param {undefined | Algs.R2PBest} tdir
   */
  hasBest(tdir) {
    if (tdir === R2PTreeDir.Src) return this.#best_src;
    else return this.#best_tgt;
  }

  /**
   * Registers a link to this corner.
   * Make sure link.type and link.tdir are correct before registering.
   * Use auto for all operations unless the corner is the current traced corner
   * @param {Algs.R2PLink} link
   * @param {R2PListDir} ldir
   */
  registerLink(link, ldir = R2PListDir.Auto) {
    if (link.crn !== this) throw `adding link to wrong corner`;

    const links = link.tdir === R2PTreeDir.Src ? this.#srcs : this.#tgts;
    if (ldir === R2PListDir.Auto) {
      let i = 0;
      while (i < links.length && link.type > links[i].type) {
        ++i;
      }
      links.splice(i, 0, link);
    } else if (ldir === R2PListDir.Front) links.unshift(link);
    // R2PListDir.Back
    else links.push(link);
  }

  /**
   *
   * @param {R2PTreeDir} tdir
   * @param {number} idx
   * @returns {undefined | Algs.R2PLink}
   */
  linkAt(tdir, idx) {
    const links = tdir === R2PTreeDir.Src ? this.#srcs : this.#tgts;
    return links[idx];
  }

  /** @returns {number} */
  numLinks(tdir) {
    return tdir === R2PTreeDir.Src ? this.#srcs.length : this.#tgts.length;
  }

  /** @returns {Algs.R2PLink[]} */
  copyLinks(tdir) {
    return tdir === R2PTreeDir.Src ? this.#srcs.slice() : this.#tgts.slice();
  }

  /**
   *
   * @param {Algs.R2PLink} link
   */
  unregisterLink(link) {
    if (link.crn !== this) throw `removing link from wrong corner`;

    const links = link.tdir === R2PTreeDir.Src ? this.#srcs : this.#tgts;
    const idx = links.indexOf(link);
    if (idx >= 0) links.splice(idx, 1);
    else throw new Error(`not found link ${link}`);
  }

  /**
   * Picks a link in this corner that satisfies the criteria (tdir, type).
   * If not found, undefined is returned
   * @param {R2PTreeDir} tdir
   * @param {Algs.R2PLinkType} type
   * @return {undefined | Algs.R2PLink}
   */
  findLink(tdir, type) {
    const links = tdir === R2PTreeDir.Src ? this.#srcs : this.#tgts;
    return links.find((link) => link.type === type);
  }
};

Algs.R2PCorners = class {
  #corners;

  constructor() {
    this.#corners = new Map();
  }

  /**
   * Finds the id of a corner based on its coordinate and didx.
   * @param {R2PSide} side The side of the corner
   * @param {DirIndex} didx The directional index pointing into the corner.
   * @param {[number, number]} coord The position of the corner
   * @returns {number}
   */
  #serializer(side, didx, coord) {
    return (
      ui.serializeVertex(coord) * 16 +
      Utils.wrapDirIndex(didx) * 2 +
      (side === R2PSide.R)
    );
  }

  /**
   * Returns a corner at the specified pose (side, didx, coord, convex).
   * If the corner does not exist, the corner is constructed and returned.
   * @param {R2PSide} side
   * @param {DirIndex} didx
   * @param {[number, number]} coord
   * @param {boolean} convex
   * @returns {Algs.R2PCorner}
   */
  at(side, didx, coord, convex) {
    const id = this.#serializer(side, didx, coord);
    if (this.#corners.has(id)) return this.#corners.get(id);
    else {
      const crn = new Algs.R2PCorner(side, didx, coord, convex, id);
      this.#corners.set(id, crn);
      return crn;
    }
  }

  /**
   * Returns the corner matching the three parameters if the corner exists.
   * Otherwise, returns undefined.
   * @param {R2PSide} side
   * @param {DirIndex} didx
   * @param {[number, number]} coord
   * @returns {undefined | Algs.R2PCorner}
   */
  has(side, didx, coord) {
    const id = this.#serializer(side, didx, coord);
    if (this.#corners.has(id)) return this.#corners.get(id);
    else return undefined;
  }

  /**
   * Returns the corner with the different side and same didx and coord as crn, if it exists.
   * If the corner has not been created, undefined is returned.
   * @param {R2PCorner} crn
   * @returns {undefined | Algs.R2PCorner}
   */
  hasOtherSide(crn) {
    const id = crn.id - crn.side;
    if (this.#corners.has(id)) return this.#corners.get(id);
    else return undefined;
  }
};

Algs.R2PLink = class {
  /** @readonly @type {number} Link id */
  id;
  /** @readonly @type {Algs.R2PSpriteLink} */
  sprite;
  /** Anchored corner. @type {null | Algs.R2PCorner} */
  crn;
  /** @type {R2PLinkType} */
  type;
  /** @type {R2PTreeDir} */
  tdir;
  /** @type {number} */
  cost;
  /** @type {null | Algs.R2PRay} */
  left_ray;
  /** @type {null | Algs.R2PRay} */
  right_ray;
  /** @type {[number, number]} */
  prog_ray;
  /** @type {Algs.R2PLink[]} */
  #srcs;
  /** @type {Algs.R2PLink[]} */
  #tgts;
  /** @type {Algs.R2POpenListNode} */
  qnode;
  /** @type {boolean} */
  is_prog;

  constructor(id) {
    this.id = id;
    this.cost = Infinity;
    this.left_ray = null;
    this.right_ray = null;
    this.prog_ray = null;
    this.is_prog = true;
    this.reset();

    Object.freeze(this.id);
  }

  toString(type = 1) {
    let str = `[L${this.id}:${R2PTreeDir.toString(
      this.tdir
    )}${R2PLinkType.toString(this.type)}]`;
    if (this.crn) str = str.concat(`(${this.crn.toString()})`);
    else str = str.concat("(null)");

    if (type >= 1) {
      str = str.concat(`, $(${this.cost.toFixed(3)})`);
    }

    if (type >= 1) {
      if (this.prog_ray) str = str.concat(`, Prg(${this.prog_ray.join(",")})`);
      else str = str.concat(`, Prg(null)`);
      if (this.left_ray) str = str.concat(`, LRay(${this.left_ray})`);
      else str = str.concat(`, LRay(null)`);
      if (this.right_ray) str = str.concat(`, RRay(${this.right_ray})`);
      else str = str.concat(`, RRay(null)`);
    }

    if (type >= 1) {
      str = str.concat(`, srcs[${this.#srcs.length}] {`);
      for (const src of this.#srcs) str = str.concat(`${src.toString(0)}, `);
      str = str.concat(`}, tgts [${this.#tgts.length}] {`);
      for (const tgt of this.#tgts) str = str.concat(`${tgt.toString(0)}, `);
      str = str.concat(`}`);
    }

    if (type >= 2) {
      str = str.concat(`, Q{${qnode}}`);
    }

    return str;
  }

  reset() {
    this.crn = undefined;
    this.clearNeighbors();
    this.qnode = null;
    this.is_prog = true;
  }

  /**
   * @param {Algs.R2PSpriteLink} sprite
   */
  initSprite(sprite) {
    this.sprite = sprite;
    Object.freeze(this.sprite);
  }

  /**
   * Gets the first this.tdir link.
   * @returns {undefined | Algs.R2PLink}
   */
  getFirstRootLink() {
    return this.#links(this.tdir)[0];
  }

  /**
   * Gets the corner at the root (opposite of anchor)
   * @returns {Algs.R2PCorner}
   */
  getRootCrn() {
    return this.getFirstRootLink().crn;
  }

  /**
   * Returns the difference vector of the anchor's coordinates from the root coordinates.
   * @returns {[number, number]}
   */
  getDiff() {
    return Utils.subtractCoords(this.crn.coord, this.getRootCrn().coord);
  }

  getLength() {
    return Utils.euclidean(this.getDiff());
  }

  /**
   * Finds the minimum cost of this link's link.tdir neighbors.
   * @returns {number}
   */
  getMinRootNeighborCost() {
    const nb_links = this.#links(this.tdir);
    let min_cost = Infinity;
    for (const nb_link of nb_links) {
      if (nb_link.cost < min_cost) min_cost = nb_link.cost;
    }
    return min_cost;
  }

  /**
   * Find and updates the link.cost with respect to the root neighbor links.
   * Returns the calculated link.cost.
   * @returns {number}
   */
  calcCost() {
    this.cost = this.getLength() + this.getMinRootNeighborCost();
    return this.cost;
  }

  /** @returns {Algs.R2PLink[]} */
  #links(tdir) {
    return tdir === R2PTreeDir.Src ? this.#srcs : this.#tgts;
  }

  /**
   * Number of tdir neighbors
   * @param {R2PTreeDir} tdir
   * @returns {number}
   */
  numNeighbors(tdir) {
    return this.#links(tdir).length;
  }

  /**
   * Removes the pointer to the tdir neighbor link.
   * Assumes that the neighbor's pointer exist in the link.
   * The neighbor link will still point to the current link after the operation, but the link will not point to the neighbor link.
   * @param {R2PTreeDir} tdir
   * @param {Algs.R2PLink} link_to_rem
   */
  removeNeighbor(tdir, link_to_rem) {
    const links = this.#links(tdir);
    const idx = links.indexOf(link_to_rem);
    if (idx >= 0) links.splice(idx, 1);
  }

  clearNeighbors() {
    this.#srcs = [];
    this.#tgts = [];
  }

  /**
   * Adds a pointer to the tdir neighbor link into this link.
   * Assumes that the pointer does not exist in this link, and no duplicate pointing will be checked.
   * Does not modify the neighbor link, and does not add this link's pointer into the neighbor link.
   * @param {R2PTreeDir} tdir
   * @param {Algs.R2PLink} new_link
   */
  addNeighbor(tdir, new_link) {
    this.#links(tdir).push(new_link);
  }

  /**
   * Gets the tdir neighbor link at the indexed position in the internal array of neighbor pointers.
   * @param {R2PTreeDir} tdir
   * @param {number} idx
   * @returns {undefined | Algs.R2PLink}
   */
  neighborAt(tdir, idx) {
    return this.#links(tdir).at(idx);
  }

  /**
   * Creates a shallow copy of the tdir neighbor pointers.
   * @param {R2PTreeDir} tdir
   * @returns {Algs.R2PLink[]}
   */
  copyNeighbors(tdir) {
    return tdir === R2PTreeDir.Src ? this.#srcs.slice() : this.#tgts.slice();
  }
};

Algs.R2PLinks = class {
  /** @type {Map<number, Algs.R2PLink>} */
  #links;
  /** @type {Algs.R2PLink[]} */
  #unused_links;
  /** @type {number} */
  #num_ids;

  constructor() {
    this.#links = new Map();
    this.#unused_links = [];
    this.#num_ids = 0;
  }

  /**
   * Returns a new link, either by creating it or reusing an older, erased link.
   * @returns {Algs.R2PLink}
   */
  createLink() {
    let new_link;
    if (this.#unused_links.length > 0) new_link = this.#unused_links.pop();
    else {
      const link_id = this.#num_ids;
      ++this.#num_ids;
      new_link = new Algs.R2PLink(link_id);
    }
    return new_link;
  }

  /**
   *
   * @param {R2PTreeDir} tdir nb_link is (tdir) link of link.
   * @param {Algs.R2PLink} link
   * @param {Algs.R2PLink} nb_link
   */
  connectLink(tdir, link, nb_link) {
    link.addNeighbor(tdir, nb_link);
    nb_link.addNeighbor(-tdir, link);
  }

  /**
   *
   * @param {R2PTreeDir} tdir  nb_link is (tdir) link of link.
   * @param {Algs.R2PLink} link
   * @param {Algs.R2PLink} nb_link
   */
  disconnectLink(tdir, link, nb_link) {
    link.removeNeighbor(tdir, nb_link);
    nb_link.removeNeighbor(-tdir, link);
  }

  /**
   * Removes a link and pushes it into an unused buffer.
   * Make sure srcs and tgts have been disconnected, qnode is removed
   * @param {Algs.R2PLink} link to remove.
   */
  eraseLink(link) {
    link.reset();
    this.#links.delete(link.id);
    // this.#unused_links.push(link);
  }

  /** Used only when destroying this to remove cyclic link pointers in all links */
  destructor() {
    // Automatic garbage collection will handle the clears etc.
    this.#links.forEach((link) => {
      link.reset();
    });
  }
};

Algs.R2PTrace = class {
  /**@type {Algs.R2PCorner} */
  crn;
  /**@type {boolean} */
  has_overlap;
  /**@type {number} */
  num_crns;
  /**@type {boolean} */
  all_src_prog;
  /**@type {boolean} */
  all_tgt_prog;
  /**@type {boolean} */
  refound_src;
  /**@type {Algs.R2PSpriteTrace} */
  sprite;

  constructor(crn, sprite) {
    this.crn = crn;
    this.has_overlap = false;
    this.num_crns = 0;
    this.all_src_prog = true;
    this.all_tgt_prog = true;
    this.refound_src = false;
    this.sprite = sprite;
  }
};

Algs.R2POpenListNode = class {
  /** @type {R2PQueueType} */
  type;
  /** @type {Algs.R2PLink} */
  link;
  /** @type {number} */
  f;
  /** @type {null | R2POpenListNode} */
  next;
  /** @type {null | R2POpenListNode} */
  prev;

  /**
   * @param {R2PQueueType} type
   * @param {Algs.R2PLink} link
   * @param {number} f
   * @param {null | Algs.R2POpenListNode} prev
   * @param {null | Algs.R2POpenListNode} next
   */
  constructor(type, link, f, prev = null, next = null) {
    this.type = type;
    this.link = link;
    this.link.qnode = this;
    this.f = f;
    this.next = next;
    this.prev = prev;
  }

  toString() {
    return `${R2PQueueType.toString(this.type)}\$${this.f.toFixed(
      3
    )}{ ${this.link.toString(0)} }`;
  }
};

Algs.R2POpenList = class {
  #front;

  constructor() {
    this.#front = null;
  }

  isEmpty() {
    return this.#front === null;
  }

  /**
   * Queues the link with the f cost
   * @param {R2PQueueType} type
   * @param {Algs.R2PLink} link link that is not queued.
   * @param {number} f
   */
  queue(type, link, f) {
    if (link.qnode) throw new Error(`Queued > once ${link}!`);
    const new_qnode = new Algs.R2POpenListNode(type, link, f);
    let prev_qnode = null;
    let qnode = this.#front;
    while (qnode && f > qnode.f) {
      prev_qnode = qnode;
      qnode = qnode.next;
    }
    if (prev_qnode) prev_qnode.next = new_qnode;
    else this.#front = new_qnode;
    new_qnode.prev = prev_qnode;
    if (qnode) qnode.prev = new_qnode;
    new_qnode.next = qnode;
  }

  /**
   * Returns the cheapest link and its f cost. Returns undefined if empty.
   * The polled link is always be a T-tree link.
   * @returns {undefined | Algs.R2POpenListNode }
   */
  poll() {
    if (this.isEmpty()) return undefined;
    return this.unqueue(this.#front.link);
  }

  /**
   * Unqueues this link and returns the link and f cost, if it is queued.
   * If the link is not queued, undefined is returned
   * @param {Algs.R2PLink} link T-tree link. link.qnode must be a valid {Algs.R2POpenListNode}.
   * @returns {undefined | Algs.R2POpenListNode}
   */
  unqueue(link) {
    const qnode = link.qnode;
    if (!qnode) return undefined;
    link.qnode = null;
    const prev_qnode = qnode.prev;
    const next_qnode = qnode.next;
    if (prev_qnode) prev_qnode.next = next_qnode;
    else this.#front = next_qnode;
    if (next_qnode) next_qnode.prev = prev_qnode;
    qnode.prev = null;
    qnode.next = null;
    return qnode;
  }

  /**
   * Called at the end of the run to remove cyclic pointers.
   */
  destructor() {
    while (this.#front !== null) {
      this.#front.prev = null;
      const next = this.#front.next;
      this.#front.next = null;
      this.#front = next;
    }
  }
};

Algs.R2PRay = class {
  /** @type {number} */
  dx;
  /** @type {number} */
  dy;
  /** @type {boolean} */
  closed;
  /** @type {boolean} For visualisatin only. */
  from_src;

  /**
   *
   * @param {number} dx
   * @param {number} dy
   * @param {boolean} closed
   * @param {boolean} from_src,
   */
  constructor(dx, dy, closed, from_src) {
    this.dx = dx;
    this.dy = dy;
    this.closed = closed;
    this.from_src = from_src;
  }

  getCoord() {
    return [this.dx, this.dy];
  }

  copy() {
    return new Algs.R2PRay(this.dx, this.dy, this.closed, this.from_src);
  }

  /**
   *
   * @param {R2PRay} ray
   */
  isEquals(ray) {
    return (
      this.dx === ray.dx &&
      this.dy === ray.dy &&
      this.closed === ray.closed &&
      this.from_src === ray.from_src
    );
  }

  toString() {
    return `${this.dx},${this.dy},${this.closed ? "1" : "0"}`;
  }
};
