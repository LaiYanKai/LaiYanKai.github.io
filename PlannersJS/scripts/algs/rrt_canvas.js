"use strict";
"use strict";

Algs.RRTCanvasNodes = class extends UI.AbstractCanvas {
  constructor(canvas_id) {
    super(canvas_id, Algs.RRTSpriteNode);
  }

  #add(id) {
    /** @type {Algs.RRTSpriteNode} */
    const sprite = super.add(id);

    sprite.dom.addEventListener(
      "mousemove",
      this.#mouseMove.bind(this, sprite),
      false
    );
    sprite.dom.addEventListener(
      "mouseout",
      this.#mouseOut.bind(this, sprite),
      false
    );

    return sprite;
  }

  /**
   * Creates a Cone Sprite
   * @param {number} id
   * @param {boolean} display
   * @param {number} z_index
   * @param {[number, number]} root_coord
   * @param {RRTNodeStatus} status
   * @param {[number]} f
   * @param {[number]} g
   * @param {[number]} h
   * @param {[number, number]} interval0 first interval coordinate, with root as the origin.
   * @param {[number, number]} interval1 second interval coordinate, with root as the origin.
   * @returns {Algs.RRTSpriteNode}
   */
  addCone(
    id,
    display,
    z_index,
    root_coord,
    status,
    f,
    g,
    h,
    interval0,
    interval1
  ) {
    const sprite = this.#add(id);
    sprite.register(RRTAction.Display, display);
    sprite.register(RRTAction.ZIndex, z_index);
    sprite.register(RRTAction.Root, root_coord);
    sprite.register(RRTAction.Status, status);
    sprite.register(RRTAction.Type, RRTNodeType.Cone);
    sprite.register(RRTAction.FCost, f);
    sprite.register(RRTAction.GCost, g);
    sprite.register(RRTAction.HCost, h);
    sprite.register(RRTAction.Interval0, interval0);
    sprite.register(RRTAction.Interval1, interval1);
    return sprite;
  }

  /**
   * Creates a Flat Sprite
   * @param {number} id
   * @param {boolean} display
   * @param {number} z_index
   * @param {[number, number]} root_coord
   * @param {RRTNodeStatus} status
   * @param {[number]} f
   * @param {[number]} g
   * @param {[number]} h
   * @param {[number, number]} interval1
   * @returns {Algs.RRTSpriteNode}
   */
  addFlat(id, display, z_index, root_coord, status, f, g, h, interval1) {
    const sprite = this.#add(id);
    sprite.register(RRTAction.Display, display);
    sprite.register(RRTAction.ZIndex, z_index);
    sprite.register(RRTAction.Root, root_coord);
    sprite.register(RRTAction.Status, status);
    sprite.register(RRTAction.Type, RRTNodeType.Flat);
    sprite.register(RRTAction.FCost, f);
    sprite.register(RRTAction.GCost, g);
    sprite.register(RRTAction.HCost, h);
    sprite.register(RRTAction.Interval1, interval1);
    return sprite;
  }

  #mouseMove(sprite, e) {
    this.#setTip(sprite, e);
  }

  #mouseOut(e) {
    ui.tooltip.hide();
  }

  #setTip(sprite, e) {
    // =============== Type ======================
    const type = sprite.value(RRTAction.Type);
    const type_str = RRTNodeType.toString(type);

    // =============== Tdir, anchor, root ======================
    const root_coord = sprite.value(RRTAction.Root);
    const root_str = `(${root_coord.join(",")})`;

    // =============== side, cost ======================
    const f_cost_str = `F = ${sprite.value(RRTAction.FCost).toFixed(3)}`;
    const g_cost_str = `G = ${sprite.value(RRTAction.GCost).toFixed(3)}`;
    const h_cost_str = `H = ${sprite.value(RRTAction.HCost).toFixed(3)}`;

    // =============== Status ======================
    const status = sprite.value(RRTAction.Status);
    let status_str = RRTNodeStatus.toString(status);

    // ================= Interval ====================
    let interval_str = "Interval:";
    const interval1 = sprite.value(RRTAction.Interval1);
    const interval_coord1 = Utils.addCoords(root_coord, interval1);
    if (type === RRTNodeType.Cone) {
      const interval0 = sprite.value(RRTAction.Interval0);
      const interval_coord0 = Utils.addCoords(root_coord, interval0);
      interval_str = `${interval_str} (${interval_coord0.join(
        ","
      )}) to (${interval_coord1.join(",")})`;
    } else if (type === RRTNodeType.Flat) {
      interval_str = `${interval_str} (${root_coord.join(
        ","
      )}) to (${interval_coord1.join(",")})`;
    } else {
      throw new RangeError(`Unknown type ${type}`);
    }

    // // ================= Rays ========================
    // let left_ray_str = "", right_ray_str = "";
    // if (type === RRTNodeType.Cone) {
    //     left_ray_str = `Left Ray: ${sprite.value(RRTAction.LeftRay)}`;
    //     right_ray_str = `Right Ray: ${sprite.value(RRTAction.RightRay)}`;
    // }

    // =================== Message =====================
    let message = `<span>`;
    message = `${message}${type_str}`;
    message = `${message} at ${root_str}`;
    message = `${message}<br/>${status_str}`;
    message = `${message}<br/>${f_cost_str}`;
    message = `${message}<br/>${g_cost_str}`;
    message = `${message}<br/>${h_cost_str}`;
    message = `${message}<br/>${interval_str}`;
    message = `${message}</span>`;

    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};
