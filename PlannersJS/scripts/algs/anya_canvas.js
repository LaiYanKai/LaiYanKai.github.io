"use strict";

Algs.AnyaCanvasNodes = class extends UI.AbstractCanvas {
  constructor(canvas_id) {
    super(canvas_id, Algs.AnyaSpriteNode);
  }

  #add(id) {
    /** @type {Algs.AnyaSpriteNode} */
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
   * @param {AnyaNodeStatus} status
   * @param {[number]} f
   * @param {[number]} g
   * @param {[number]} h
   * @param {[number, number]} interval0 first interval coordinate, with root as the origin.
   * @param {[number, number]} interval1 second interval coordinate, with root as the origin.
   * @returns {Algs.AnyaSpriteNode}
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
    sprite.register(AnyaAction.Display, display);
    sprite.register(AnyaAction.ZIndex, z_index);
    sprite.register(AnyaAction.Root, root_coord);
    sprite.register(AnyaAction.Status, status);
    sprite.register(AnyaAction.Type, AnyaNodeType.Cone);
    sprite.register(AnyaAction.FCost, f);
    sprite.register(AnyaAction.GCost, g);
    sprite.register(AnyaAction.HCost, h);
    sprite.register(AnyaAction.Interval0, interval0);
    sprite.register(AnyaAction.Interval1, interval1);
    return sprite;
  }

  /**
   * Creates a Flat Sprite
   * @param {number} id
   * @param {boolean} display
   * @param {number} z_index
   * @param {[number, number]} root_coord
   * @param {AnyaNodeStatus} status
   * @param {[number]} f
   * @param {[number]} g
   * @param {[number]} h
   * @param {[number, number]} interval1
   * @returns {Algs.AnyaSpriteNode}
   */
  addFlat(id, display, z_index, root_coord, status, f, g, h, interval1) {
    const sprite = this.#add(id);
    sprite.register(AnyaAction.Display, display);
    sprite.register(AnyaAction.ZIndex, z_index);
    sprite.register(AnyaAction.Root, root_coord);
    sprite.register(AnyaAction.Status, status);
    sprite.register(AnyaAction.Type, AnyaNodeType.Flat);
    sprite.register(AnyaAction.FCost, f);
    sprite.register(AnyaAction.GCost, g);
    sprite.register(AnyaAction.HCost, h);
    sprite.register(AnyaAction.Interval1, interval1);
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
    const type = sprite.value(AnyaAction.Type);
    const type_str = AnyaNodeType.toString(type);

    // =============== Tdir, anchor, root ======================
    const root_coord = sprite.value(AnyaAction.Root);
    const root_str = `(${root_coord.join(",")})`;

    // =============== side, cost ======================
    const f_cost_str = `F = ${sprite.value(AnyaAction.FCost).toFixed(3)}`;
    const g_cost_str = `G = ${sprite.value(AnyaAction.GCost).toFixed(3)}`;
    const h_cost_str = `H = ${sprite.value(AnyaAction.HCost).toFixed(3)}`;

    // =============== Status ======================
    const status = sprite.value(AnyaAction.Status);
    let status_str = AnyaNodeStatus.toString(status);

    // ================= Interval ====================
    let interval_str = "Interval:";
    const interval1 = sprite.value(AnyaAction.Interval1);
    const interval_coord1 = Utils.addCoords(root_coord, interval1);
    if (type === AnyaNodeType.Cone) {
      const interval0 = sprite.value(AnyaAction.Interval0);
      const interval_coord0 = Utils.addCoords(root_coord, interval0);
      interval_str = `${interval_str} (${interval_coord0.join(
        ","
      )}) to (${interval_coord1.join(",")})`;
    } else if (type === AnyaNodeType.Flat) {
      interval_str = `${interval_str} (${root_coord.join(
        ","
      )}) to (${interval_coord1.join(",")})`;
    } else {
      throw new RangeError(`Unknown type ${type}`);
    }

    // // ================= Rays ========================
    // let left_ray_str = "", right_ray_str = "";
    // if (type === AnyaNodeType.Cone) {
    //     left_ray_str = `Left Ray: ${sprite.value(AnyaAction.LeftRay)}`;
    //     right_ray_str = `Right Ray: ${sprite.value(AnyaAction.RightRay)}`;
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
