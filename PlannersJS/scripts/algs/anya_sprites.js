Algs.AnyaSpriteNode = class extends UI.AbstractSprite {
  #dom_root;
  #dom_left_ray;
  #dom_right_ray;
  #dom_sector;
  #dom_left_arrow;
  #dom_right_arrow;
  #dom_interval;

  constructor(canvas_id) {
    super(canvas_id, AnyaAction.length, "anya-node", true);
    this.dom.setAttribute("class", this.cls_base);

    // ====== Create Sector (sec) =================
    this.#dom_sector = Utils.createSVGElement("path");
    this.#dom_sector.classList.add("sec");
    this.dom.appendChild(this.#dom_sector);
    Object.freeze(this.#dom_sector);

    // ====== Create Interval ==========
    this.#dom_interval = Utils.createSVGElement("path");
    this.#dom_interval.classList.add("interval");
    this.dom.appendChild(this.#dom_interval);
    Object.freeze(this.#dom_interval);

    // ====== Create Left Ray (ray) ===============
    this.#dom_left_ray = Utils.createSVGElement("path");
    this.#dom_left_ray.classList.add("ray");
    this.dom.appendChild(this.#dom_left_ray);
    Object.freeze(this.#dom_left_ray);
    this.#dom_left_arrow = Utils.createSVGElement("path");
    this.#dom_left_arrow.classList.add("arrow");
    this.dom.appendChild(this.#dom_left_arrow);
    Object.freeze(this.#dom_left_arrow);

    // ====== Create Right Ray (ray) ===============
    this.#dom_right_ray = Utils.createSVGElement("path");
    this.#dom_right_ray.classList.add("ray");
    this.dom.appendChild(this.#dom_right_ray);
    Object.freeze(this.#dom_right_ray);
    this.#dom_right_arrow = Utils.createSVGElement("path");
    this.#dom_right_arrow.classList.add("arrow");
    this.dom.appendChild(this.#dom_right_arrow);
    Object.freeze(this.#dom_right_arrow);

    // ====== Create root (root) ===========
    this.#dom_root = Utils.createSVGElement("circle");
    this.#dom_root.classList.add("root");
    this.dom.appendChild(this.#dom_root);
    Object.freeze(this.#dom_root);
  }

  #setDisplay(display) {
    if (display === false) {
      this.dom.style.display = "none";
      return false;
    }
    this.dom.style.removeProperty("display");
    return true;
  }

  /**
   *
   * @param {AnyaNodeStatus} status
   */
  #setStatus(status) {
    this.dom.setAttribute("stat", status);
  }

  #drawRoot(min_bound, max_bound, root_coord, root_radius) {
    this.#dom_root.setAttribute("r", root_radius);
    this.#dom_root.setAttribute("cx", root_coord[0]);
    this.#dom_root.setAttribute("cy", root_coord[1]);
    Utils.updateMinBound(min_bound, [
      root_coord[0] - root_radius,
      root_coord[1] - root_radius,
    ]);
    Utils.updateMaxBound(max_bound, [
      root_coord[0] + root_radius,
      root_coord[1] + root_radius,
    ]);
  }

  /**
   *
   * @param {Element} ray_dom
   * @param {Element} arrow_dom
   * @param {boolean} display
   * @param {[number, number]} min_bound
   * @param {[number, number]} max_bound
   * @param {[number, number]} root_coord in pixels
   * @param {number} root_radius in pixels
   * @param {[number, number]} ray_diff in pixels
   * @param {number} ray_arrow_length in pixels
   * @param {number} ray_arrow_width in pixels
   */
  #drawRay(
    ray_dom,
    arrow_dom,
    display,
    min_bound,
    max_bound,
    root_coord,
    root_radius,
    ray_diff,
    ray_arrow_length,
    ray_arrow_width
  ) {
    // ============== Display ======================
    if (!display) {
      ray_dom.style.display = "none";
      arrow_dom.style.display = "none";
      return;
    }
    ray_dom.style.removeProperty("display");
    arrow_dom.style.removeProperty("display");

    // =============== Determine start and end points of ray ================
    const ray_unit_diff = Utils.unitCoord(ray_diff);
    const ray_from_coord = [
      root_coord[0] + ray_unit_diff[0] * root_radius,
      root_coord[1] + ray_unit_diff[1] * root_radius,
    ];
    const ray_to_coord = [
      root_coord[0] + ray_diff[0],
      root_coord[1] + ray_diff[1],
    ];

    // =============== Determine the arrow ===================
    const ray_unit_normal = [-ray_unit_diff[1], ray_unit_diff[0]];
    const arrow_tip_other = [
      ray_to_coord[0] - ray_unit_diff[0] * ray_arrow_length,
      ray_to_coord[1] - ray_unit_diff[1] * ray_arrow_length,
    ];
    const arrow0 = [
      arrow_tip_other[0] - (ray_unit_normal[0] * ray_arrow_width) / 2,
      arrow_tip_other[1] - (ray_unit_normal[1] * ray_arrow_width) / 2,
    ];
    const arrow1 = [
      arrow_tip_other[0] + (ray_unit_normal[0] * ray_arrow_width) / 2,
      arrow_tip_other[1] + (ray_unit_normal[1] * ray_arrow_width) / 2,
    ];

    // ============== Draw the ray ======================
    ray_dom.setAttribute(
      "d",
      `M ${ray_from_coord.join(",")} L ${ray_to_coord.join(",")}`
    );
    arrow_dom.setAttribute(
      "d",
      `M ${ray_to_coord.join(",")} L ${arrow0.join(",")} L ${arrow1.join(
        ","
      )} Z`
    );
    // `M ${ray_from_coord.join(",")} L ${ray_to_coord.join(",")}`);

    // ============== Update bounds =====================
    for (const coord of [ray_to_coord, arrow0, arrow1])
      Utils.updateBounds(min_bound, max_bound, coord);
    // Utils.updateBounds(min_bound, max_bound, ray_to_coord);
  }

  /**
   * @param {Element} sector_dom
   * @param {boolean} display
   * @param {*} root_radius
   * @param {*} left_ray_diff
   * @param {*} right_ray_diff
   * @param {*} root_coord
   * @returns
   */
  #drawSector(
    sector_dom,
    display,
    root_radius,
    left_ray_diff,
    right_ray_diff,
    root_coord
  ) {
    // ============== Display ======================
    if (!display) {
      sector_dom.style.display = "none";
      return;
    }
    sector_dom.style.removeProperty("display");

    // ======= calculate interior and exterior coords ===========
    const left_unit_diff = Utils.unitCoord(left_ray_diff);
    const right_unit_diff = Utils.unitCoord(right_ray_diff);
    const int_radius = root_radius;
    const left_int_coord = [
      root_coord[0] + left_unit_diff[0] * int_radius,
      root_coord[1] + left_unit_diff[1] * int_radius,
    ];
    const right_int_coord = [
      root_coord[0] + right_unit_diff[0] * int_radius,
      root_coord[1] + right_unit_diff[1] * int_radius,
    ];
    const left_ext_coord = [
      root_coord[0] + left_ray_diff[0],
      root_coord[1] + left_ray_diff[1],
    ];
    const right_ext_coord = [
      root_coord[0] + right_ray_diff[0],
      root_coord[1] + right_ray_diff[1],
    ];

    // interior arc
    const int_arc = `M ${left_int_coord.join(
      ","
    )} A ${int_radius} ${int_radius} 0 0 1 ${right_int_coord.join(",")}`;

    // =========== Draw the sector ===================
    sector_dom.setAttribute(
      "d",
      `${int_arc} L ${right_ext_coord} ${left_ext_coord} Z`
    );

    // bounds are updated by ray, so no need to update.
  }

  #drawIntervalFlat(
    dom,
    min_bound,
    max_bound,
    root_coord,
    root_radius,
    interval
  ) {
    const interval_length = Utils.euclidean(interval);
    if (interval_length < root_radius) dom.style.display = "none";
    else dom.style.removeProperty("display");

    const unit = Utils.unitCoord(interval);
    const end = Utils.addCoords(root_coord, interval);
    const begin = Utils.addCoords(
      root_coord,
      Utils.multiplyCoord(unit, root_radius)
    );

    dom.setAttribute("d", `M ${begin.join(",")} L ${end.join(",")}`);
    Utils.updateBounds(min_bound, max_bound, end);
  }

  #drawIntervalCone(dom, root_coord, left_ray_diff, right_ray_diff) {
    const to_left = Utils.addCoords(root_coord, left_ray_diff);
    const to_right = Utils.addCoords(root_coord, right_ray_diff);

    if (Utils.approxEq(to_left, to_right)) dom.style.display = "none";
    else dom.style.removeProperty("display");

    dom.setAttribute("d", `M ${to_left.join(",")} L ${to_right.join(",")}`);
  }

  #setDimensions(min_bound, max_bound, param_stroke_width) {
    // Update bounds due to line widths
    const buffer = param_stroke_width;
    min_bound = Utils.subtractCoords(min_bound, [buffer, buffer]);
    max_bound = Utils.addCoords(max_bound, [buffer, buffer]);

    // ========= Update SVG dimensions ==============
    const size = Utils.subtractCoords(max_bound, min_bound);
    this.dom.setAttribute("width", `${size[0]}px`);
    this.dom.setAttribute("height", `${size[1]}px`);
    this.dom.setAttribute(
      "viewBox",
      `${min_bound[0]} ${min_bound[1]} ${size[0]} ${size[1]}`
    );
    this.dom.style.inset = `${min_bound[1]}px auto auto ${min_bound[0]}px`;
  }

  drawCone(
    display,
    z_index,
    root_coord,
    status,
    left_ray_diff,
    right_ray_diff
  ) {
    // ============== check display =============
    if (!this.#setDisplay(display)) return;

    // ============== ZIndex ====================
    this.dom.style.zIndex = z_index;

    // ============== Class ====================
    this.#setStatus(status);

    //  ============= Get values =====================
    const root_radius = ui_params.sprite_anya_root_radius * ui_params.cell_size;
    root_coord = ui.gridToPx(root_coord);
    left_ray_diff = ui.gridToPxVector(left_ray_diff);
    right_ray_diff = ui.gridToPxVector(right_ray_diff);
    const param_ray_arrow_length = ui_params.sprite_anya_ray_arrow_length;
    const param_ray_arrow_width = ui_params.sprite_anya_ray_arrow_width;
    let min_bound = [Infinity, Infinity];
    let max_bound = [-Infinity, -Infinity];

    // ============== Root =================
    this.#drawRoot(min_bound, max_bound, root_coord, root_radius);

    // ============== Interval ===================
    this.#drawIntervalCone(
      this.#dom_interval,
      root_coord,
      left_ray_diff,
      right_ray_diff
    );

    // ============== Draw Rays ==================
    this.#drawRay(
      this.#dom_left_ray,
      this.#dom_left_arrow,
      true,
      min_bound,
      max_bound,
      root_coord,
      root_radius,
      left_ray_diff,
      param_ray_arrow_length,
      param_ray_arrow_width
    );
    this.#drawRay(
      this.#dom_right_ray,
      this.#dom_right_arrow,
      true,
      min_bound,
      max_bound,
      root_coord,
      root_radius,
      right_ray_diff,
      param_ray_arrow_length,
      param_ray_arrow_width
    );

    // ============== Draw Sector ========================
    this.#drawSector(
      this.#dom_sector,
      true,
      root_radius,
      left_ray_diff,
      right_ray_diff,
      root_coord
    );

    //=============== Set dimensions ==================
    this.#setDimensions(
      min_bound,
      max_bound,
      ui_params.sprite_anya_stroke_width
    );
  }

  drawFlat(display, z_index, root_coord, status, interval) {
    // ============== check display =============
    if (!this.#setDisplay(display)) return;

    // ============== ZIndex ====================
    this.dom.style.zIndex = z_index;

    // ============== Class ====================
    this.#setStatus(status);

    //  ============= Get values =====================
    const root_radius = ui_params.sprite_anya_root_radius * ui_params.cell_size;
    root_coord = ui.gridToPx(root_coord);
    let min_bound = [Infinity, Infinity];
    let max_bound = [-Infinity, -Infinity];

    // ============== Root =================
    this.#drawRoot(min_bound, max_bound, root_coord, root_radius);

    // ============== Draw Interval  =========
    this.#drawIntervalFlat(
      this.#dom_interval,
      min_bound,
      max_bound,
      root_coord,
      root_radius,
      ui.gridToPxVector(interval)
    );

    // ============== Draw Rays ==================
    this.#drawRay(this.#dom_left_ray, this.#dom_left_arrow, false);
    this.#drawRay(this.#dom_right_ray, this.#dom_right_arrow, false);

    // ============== Draw Sector ========================
    this.#drawSector(this.#dom_sector, false);

    //=============== Set dimensions ==================
    this.#setDimensions(
      min_bound,
      max_bound,
      ui_params.sprite_anya_stroke_width
    );
  }

  vis() {
    const type = this.value(AnyaAction.Type);
    if (type === AnyaNodeType.Cone) {
      this.drawCone(
        this.value(AnyaAction.Display),
        this.value(AnyaAction.ZIndex),
        this.value(AnyaAction.Root),
        this.value(AnyaAction.Status),
        this.value(AnyaAction.Interval0),
        this.value(AnyaAction.Interval1)
      );
    } else if (type === AnyaNodeType.Flat) {
      this.drawFlat(
        this.value(AnyaAction.Display),
        this.value(AnyaAction.ZIndex),
        this.value(AnyaAction.Root),
        this.value(AnyaAction.Status),
        this.value(AnyaAction.Interval1)
      );
    } else {
      throw new TypeError(`Anya node type is not cone or flat.`);
    }
  }
};
