"use strict";

Algs.R2PSpriteLink = class extends UI.AbstractSprite {
  #dom_anchor;
  #dom_anchor_line;
  #dom_anchor_line2;
  #dom_curve;
  #dom_arrow;
  #src_ids;
  #tgt_ids;

  getSrcIds() {
    return this.#src_ids.slice();
  }
  getTgtIds() {
    return this.#tgt_ids.slice();
  }

  constructor(canvas_id) {
    super(canvas_id, R2PActionLink.length, "r2l", true);
    this.dom.setAttribute("class", this.cls_base);

    // ====== Create curve (curve) ===========
    this.#dom_curve = Utils.createSVGElement("path");
    this.#dom_curve.classList.add("curve");
    this.dom.appendChild(this.#dom_curve);
    Object.freeze(this.#dom_curve);

    // ====== Create arrow (arrow) ===========
    this.#dom_arrow = Utils.createSVGElement("path");
    this.#dom_arrow.classList.add("arrow");
    this.dom.appendChild(this.#dom_arrow);
    Object.freeze(this.#dom_arrow);

    // ====== Create anchor (anchor) ===========
    this.#dom_anchor = Utils.createSVGElement("path");
    this.#dom_anchor.classList.add("anchor");
    this.dom.appendChild(this.#dom_anchor);
    Object.freeze(this.#dom_anchor);

    // ====== Create embellishing lines ==========
    this.#dom_anchor_line = Utils.createSVGElement("path");
    this.#dom_anchor_line2 = Utils.createSVGElement("path");
    this.dom.appendChild(this.#dom_anchor_line);
    this.dom.appendChild(this.#dom_anchor_line2);
    this.#dom_anchor_line.classList.add("line");
    this.#dom_anchor_line2.classList.add("line");
    Object.freeze(this.#dom_anchor_line);
    Object.freeze(this.#dom_anchor_line2);

    this.#src_ids = [];
    this.#tgt_ids = [];
  }

  #tryAddRels(redo, action_id, data) {
    const ids =
      action_id === R2PActionLink.AddSrcId ? this.#src_ids : this.#tgt_ids;
    let [id, add] = data;
    const idx = ids.indexOf(id);
    if (!redo) add = !add;
    if (add && idx < 0) ids.push(id);
    else if (!add && idx >= 0) ids.splice(idx, 1);
    else return false; // no action should be registered.
    return true;
  }

  /**
   * @param {boolean} display
   * @returns {boolean}
   */
  #setDisplay(display) {
    if (display === false) this.dom.style.display = "none";
    else this.dom.style.removeProperty("display");
    return display;
  }

  /**
   *
   * @param {R2PTreeDir | undefined} tdir
   * @param {R2PLinkStatus | undefined} status
   * @param {R2PLinkType | undefined} type
   */
  #setClass(tdir, status, type) {
    this.dom.setAttribute("tdir", tdir);
    this.dom.setAttribute("lstat", status);
    this.dom.setAttribute("ltype", type);
  }

  /**
   *
   * @param {[number, number]} min_bound
   * @param {[number, number]} max_bound
   * @param {R2PSide} side
   * @param {number} knob
   * @param {[number, number]} anchor_coord
   * @param {[number, number]} root_coord
   * @param {number} anchor_radius
   * @param {number} root_radius
   */
  #drawCurveAndArrow(
    min_bound,
    max_bound,
    side,
    knob,
    anchor_coord,
    root_coord,
    anchor_radius,
    root_radius,
    param_knob,
    param_arrow_length,
    param_arrow_width,
    param_arrow_position
  ) {
    // =========== Derive coords and directions =============
    let diff = Utils.subtractCoords(root_coord, anchor_coord);
    if (diff[0] === 0 && diff[1] === 0) {
      this.#dom_curve.setAttribute("d", `M${anchor_coord.join(",")}`);
      this.#dom_arrow.setAttribute("d", `M${anchor_coord.join(",")}`);
      Utils.updateBounds(min_bound, max_bound, anchor_coord);
    } else {
      let unit_diff = Utils.unitCoord(diff);

      // ============ Derive knob location ===============
      let knob_unit_diff = [side * unit_diff[1], -side * unit_diff[0]];
      let knob_coord = Utils.divideCoord(
        Utils.addCoords(anchor_coord, root_coord),
        2
      ); // halfway point
      knob_coord = Utils.addCoords(
        knob_coord,
        Utils.multiplyCoord(knob_unit_diff, param_knob * knob)
      );

      // ============ Derive curve_anchor position ======================
      // let curve_anchor_coord = Utils.unitCoord( // temp reuse
      //     Utils.subtractCoords(knob_coord, anchor_coord));
      // curve_anchor_coord = Utils.multiplyCoord(curve_anchor_coord, anchor_); // temp reuse
      // curve_anchor_coord = Utils.addCoords(anchor_coord, curve_anchor_coord);
      let curve_anchor_coord = anchor_coord;

      let curve_root_coord = Utils.subtractCoords(knob_coord, root_coord); // temp reuse
      curve_root_coord = Utils.unitCoord(curve_root_coord);
      curve_root_coord = Utils.multiplyCoord(curve_root_coord, root_radius); // temp reuse
      curve_root_coord = Utils.addCoords(root_coord, curve_root_coord);

      // ============= Draw the quadratic bezier curve =================
      this.#dom_curve.setAttribute(
        "d",
        `M ${curve_anchor_coord.join(",")} Q ${knob_coord.join(
          ","
        )} ${curve_root_coord.join(",")}`
      );

      // ============= Derive arrow coordinates ==================
      let arrow_tip_coord = [
        Utils.quadraticBezier(
          param_arrow_position,
          curve_anchor_coord[0],
          knob_coord[0],
          curve_root_coord[0]
        ),
        Utils.quadraticBezier(
          param_arrow_position,
          curve_anchor_coord[1],
          knob_coord[1],
          curve_root_coord[1]
        ),
      ];
      let unit_arrow = Utils.unitCoord([
        Utils.quadraticBezierGrad(
          param_arrow_position,
          curve_anchor_coord[0],
          knob_coord[0],
          curve_root_coord[0]
        ),
        Utils.quadraticBezierGrad(
          param_arrow_position,
          curve_anchor_coord[1],
          knob_coord[1],
          curve_root_coord[1]
        ),
      ]);
      let unit_normal = [unit_arrow[1], -unit_arrow[0]];
      unit_arrow = Utils.addCoords(
        arrow_tip_coord, // reuse as position at the other end of the arrow.
        Utils.multiplyCoord(unit_arrow, -param_arrow_length)
      );
      let arrow1 = Utils.addCoords(
        unit_arrow,
        Utils.multiplyCoord(unit_normal, param_arrow_width / 2)
      );
      let arrow2 = Utils.addCoords(
        unit_arrow,
        Utils.multiplyCoord(unit_normal, -param_arrow_width / 2)
      );

      // ============= Draw the arrow ===============
      this.#dom_arrow.setAttribute(
        "d",
        `M ${arrow_tip_coord.join(",")} L ${arrow1.join(",")} L ${arrow2.join(
          ","
        )} Z`
      );

      // ============= Update Bounds ================
      for (const coord of [arrow1, arrow2, knob_coord, root_coord])
        Utils.updateBounds(min_bound, max_bound, coord);
    }
  }

  /**
   *
   * @param {[number, number]} min_bound
   * @param {[number, number]} max_bound
   * @param {R2PLinkType} type
   * @param {[number, number]} anchor_coord
   * @param {number} anchor_radius
   */
  #drawAnchor(min_bound, max_bound, type, anchor_coord, anchor_radius) {
    // ============= Draw Node depending on type ================
    if (type === R2PLinkType.Eu || type === R2PLinkType.Ey) {
      let tmp = anchor_radius;
      const coord0 = Utils.addCoords(anchor_coord, [tmp, 0]);
      const coord1 = Utils.addCoords(anchor_coord, [0, tmp]);
      const coord2 = Utils.addCoords(anchor_coord, [-tmp, 0]);
      const coord3 = Utils.addCoords(anchor_coord, [0, -tmp]);
      this.#dom_anchor.setAttribute(
        "d",
        `M ${coord0.join(",")} L ${coord1.join(",")} L ${coord2.join(
          ","
        )} L ${coord3.join(",")} Z`
      );
      if (type === R2PLinkType.Ey) this.#dom_anchor.classList.add("fill");
      else this.#dom_anchor.classList.remove("fill");
      Utils.updateMinBound(
        min_bound,
        Utils.addCoords(anchor_coord, [-tmp, -tmp])
      );
      Utils.updateMaxBound(
        max_bound,
        Utils.addCoords(anchor_coord, [tmp, tmp])
      );
      this.#dom_anchor_line.style.display = "none";
      this.#dom_anchor_line2.style.display = "none";
    } else if (type === R2PLinkType.Oc) {
      const coord0 = Utils.addCoords(anchor_coord, [
        anchor_radius,
        anchor_radius,
      ]);
      const coord1 = Utils.addCoords(anchor_coord, [
        -anchor_radius,
        anchor_radius,
      ]);
      const coord2 = Utils.addCoords(anchor_coord, [
        -anchor_radius,
        -anchor_radius,
      ]);
      const coord3 = Utils.addCoords(anchor_coord, [
        anchor_radius,
        -anchor_radius,
      ]);
      this.#dom_anchor.setAttribute(
        "d",
        `M ${coord0.join(",")} L ${coord1.join(",")} L ${coord2.join(
          ","
        )} L ${coord3.join(",")} Z`
      );
      this.#dom_anchor.classList.remove("fill");
      Utils.updateMinBound(
        min_bound,
        Utils.addCoords(anchor_coord, [-anchor_radius, -anchor_radius])
      );
      Utils.updateMaxBound(
        max_bound,
        Utils.addCoords(anchor_coord, [anchor_radius, anchor_radius])
      );
      this.#dom_anchor_line.style.display = "none";
      this.#dom_anchor_line2.style.display = "none";
    } else if (type === R2PLinkType.Tm) {
      let tmp = Math.SQRT1_2 * anchor_radius;
      const coord0 = Utils.addCoords(anchor_coord, [tmp, -tmp]);
      const coord1 = Utils.addCoords(anchor_coord, [-tmp, tmp]);
      const half0 = `A ${anchor_radius} ${anchor_radius} 0 0 1 ${coord1.join(
        ","
      )}`;
      const half1 = `A ${anchor_radius} ${anchor_radius} 0 0 1 ${coord0.join(
        ","
      )}`;
      this.#dom_anchor.setAttribute(
        "d",
        `M ${coord0.join(",")} ${half0} ${half1} Z`
      );
      this.#dom_anchor.classList.remove("fill");
      Utils.updateMinBound(
        min_bound,
        Utils.addCoords(anchor_coord, [-anchor_radius, -anchor_radius])
      );
      Utils.updateMaxBound(
        max_bound,
        Utils.addCoords(anchor_coord, [anchor_radius, anchor_radius])
      );
      // --------- create line -------------
      this.#dom_anchor_line.style.removeProperty("display");
      this.#dom_anchor_line.setAttribute(
        "d",
        `M ${coord0.join(",")} L ${coord1.join(",")}`
      );
      this.#dom_anchor_line2.style.display = "none";
    } else if (type === R2PLinkType.Un) {
      let tmp = Math.SQRT1_2 * anchor_radius;
      const coord0 = Utils.addCoords(anchor_coord, [tmp, -tmp]);
      const coord1 = Utils.addCoords(anchor_coord, [-tmp, -tmp]);
      const coord2 = Utils.addCoords(anchor_coord, [-tmp, tmp]);
      const coord3 = Utils.addCoords(anchor_coord, [tmp, tmp]);
      const half0 = `A ${anchor_radius} ${anchor_radius} 0 0 1 ${coord2.join(
        ","
      )}`;
      const half1 = `A ${anchor_radius} ${anchor_radius} 0 0 1 ${coord0.join(
        ","
      )}`;
      this.#dom_anchor.setAttribute(
        "d",
        `M ${coord0.join(",")} ${half0} ${half1}`
      );
      this.#dom_anchor.classList.remove("fill");
      Utils.updateMinBound(
        min_bound,
        Utils.addCoords(anchor_coord, [-anchor_radius, -anchor_radius])
      );
      Utils.updateMaxBound(
        max_bound,
        Utils.addCoords(anchor_coord, [anchor_radius, anchor_radius])
      );
      // --------- create line -------------
      this.#dom_anchor_line.style.removeProperty("display");
      this.#dom_anchor_line.setAttribute(
        "d",
        `M ${coord0.join(",")} L ${coord2.join(",")}`
      );
      this.#dom_anchor_line2.style.removeProperty("display");
      this.#dom_anchor_line2.setAttribute(
        "d",
        `M ${coord1.join(",")} L ${coord3.join(",")}`
      );
    } else if (type === R2PLinkType.Vu || type === R2PLinkType.Vy) {
      const coord0 = Utils.addCoords(anchor_coord, [anchor_radius, 0]);
      const coord2 = Utils.addCoords(anchor_coord, [-anchor_radius, 0]);
      const half0 = `A ${anchor_radius} ${anchor_radius} 0 0 1 ${coord2.join(
        ","
      )}`;
      const half1 = `A ${anchor_radius} ${anchor_radius} 0 0 1 ${coord0.join(
        ","
      )}`;
      this.#dom_anchor.setAttribute(
        "d",
        `M ${coord0.join(",")} ${half0} ${half1} Z`
      );
      if (type === R2PLinkType.Vy) this.#dom_anchor.classList.add("fill");
      else this.#dom_anchor.classList.remove("fill");
      Utils.updateMinBound(
        min_bound,
        Utils.addCoords(anchor_coord, [-anchor_radius, -anchor_radius])
      );
      Utils.updateMaxBound(
        max_bound,
        Utils.addCoords(anchor_coord, [anchor_radius, anchor_radius])
      );
      this.#dom_anchor_line.style.display = "none";
      this.#dom_anchor_line2.style.display = "none";
    } else {
      throw new RangeError(
        `type should be a member of R2PLinkType:${R2PLinkType}`
      );
    }
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

  /**
   *
   * @param {number} action_id
   * @param {*} new_data
   * @returns {boolean}
   */
  register(action_id, new_data) {
    if (
      action_id === R2PActionLink.AddSrcId ||
      action_id === R2PActionLink.AddTgtId
    ) {
      if (!this.#tryAddRels(true, action_id, new_data)) {
        return false; // no register if an id is already found in the src_ids, tgt_ids.}
      } else {
        super.register(action_id, new_data, true); // allow duplicates
        return true;
      }
    } else {
      const prev_data = this.value(action_id);
      if (new_data === prev_data) return false;
      switch (action_id) {
        case R2PActionLink.ProgRay:
        case R2PActionLink.SrcCoord:
        case R2PActionLink.TgtCoord:
          if (
            prev_data &&
            new_data &&
            Utils.equalIntegerCoords(prev_data, new_data)
          ) {
            return false; // don't register if prev_data is same as new_data
          }
          break;
        case R2PActionLink.LeftRay:
        case R2PActionLink.RightRay:
          if (prev_data && new_data && prev_data.isEquals(new_data))
            return false;
          break;
        default:
          break;
      }
      super.register(action_id, new_data, true); // there will be no duplicates at this point.
      return true;
    }
  }

  redo(action_id) {
    const redone = super.redo(action_id);
    if (
      action_id === R2PActionLink.AddSrcId ||
      action_id === R2PActionLink.AddTgtId
    ) {
      this.#tryAddRels(true, action_id, this.value(action_id));
    }
    return redone;
  }

  undo(action_id) {
    if (
      action_id === R2PActionLink.AddSrcId ||
      action_id === R2PActionLink.AddTgtId
    ) {
      this.#tryAddRels(false, action_id, this.value(action_id));
    }
    return super.undo(action_id);
  }

  vis() {
    // check display
    if (!this.#setDisplay(this.value(R2PActionLink.Display))) return;

    //  ============= Get values =====================
    const root_radius = ui_params.sprite_link_root_radius * ui_params.cell_size;
    const anchor_radius =
      ui_params.sprite_link_anchor_radius * ui_params.cell_size;
    const tdir = this.value(R2PActionLink.Tdir);
    const side = this.value(R2PActionLink.Side);
    const type = this.value(R2PActionLink.Type);
    let tgt_coord = ui.gridToPx(this.value(R2PActionLink.TgtCoord));
    let src_coord = ui.gridToPx(this.value(R2PActionLink.SrcCoord));
    const status = this.value(R2PActionLink.Status);

    let anchor_coord, root_coord;
    if (tdir === R2PTreeDir.Src) {
      anchor_coord = tgt_coord;
      root_coord = src_coord;
    } else if (tdir === R2PTreeDir.Tgt) {
      anchor_coord = src_coord;
      root_coord = tgt_coord;
    }
    const knob = this.value(R2PActionLink.Knob);
    let min_bound = [Infinity, Infinity];
    let max_bound = [-Infinity, -Infinity];

    // ============== Class ====================
    this.#setClass(tdir, status, type);

    // ============== ZIndex ====================
    this.dom.style.zIndex = this.value(R2PActionLink.ZIndex);

    // ============== Curve and Arrow ==================
    this.#drawCurveAndArrow(
      min_bound,
      max_bound,
      side,
      knob,
      anchor_coord,
      root_coord,
      anchor_radius,
      root_radius,
      ui_params.sprite_link_knob,
      ui_params.sprite_link_arrow_length,
      ui_params.sprite_link_arrow_width,
      ui_params.sprite_link_arrow_position
    );

    // ============== anchor ==================
    this.#drawAnchor(min_bound, max_bound, type, anchor_coord, anchor_radius);

    //=============== Set dimensions ==================
    this.#setDimensions(
      min_bound,
      max_bound,
      ui_params.sprite_link_stroke_width
    );
  }
};

Algs.R2PSpriteSector = class extends UI.AbstractSprite {
  #dom_src;
  #dom_left_ray;
  #dom_left_ext;
  #dom_right_ray;
  #dom_right_ext;
  #dom_sector;
  #dom_gradient;
  #dom_pattern;

  constructor(canvas_id, sprite_id) {
    super(canvas_id, R2PActionSector.length, "r2s", true);
    this.dom.setAttribute("class", this.cls_base);

    // ====== Create Defs ==============
    const dom_defs = Utils.createSVGElement("defs");
    this.dom.appendChild(dom_defs);

    // ====== Create Gradient ==============
    const gradient_id = `r2g${sprite_id}`;
    this.#dom_gradient = Utils.createSVGElement("radialGradient");
    dom_defs.appendChild(this.#dom_gradient);
    this.#dom_gradient.id = gradient_id;
    const dom_gradient_stop_start = Utils.createSVGElement("stop");
    this.#dom_gradient.appendChild(dom_gradient_stop_start);
    dom_gradient_stop_start.setAttribute("offset", "5%");
    dom_gradient_stop_start.classList.add("stop-start");
    const dom_gradient_stop_end = Utils.createSVGElement("stop");
    this.#dom_gradient.appendChild(dom_gradient_stop_end);
    dom_gradient_stop_end.setAttribute("offset", "95%");
    dom_gradient_stop_end.classList.add("stop-end");
    Object.freeze(this.#dom_gradient);

    // ====== Create Pattern ================
    const pattern_id = `r2p${sprite_id}`;
    this.#dom_pattern = Utils.createSVGElement("pattern");
    dom_defs.appendChild(this.#dom_pattern);
    this.#dom_pattern.id = pattern_id;
    this.#dom_pattern.setAttribute("viewBox", "0 0 1 1");
    this.#dom_pattern.setAttribute("patternUnits", "userSpaceOnUse");
    const dom_rect = Utils.createSVGElement("rect");
    this.#dom_pattern.appendChild(dom_rect);
    dom_rect.setAttribute("width", 1);
    dom_rect.setAttribute("height", 1);
    dom_rect.setAttribute("fill", `url('#${gradient_id}')`);
    Object.freeze(this.#dom_pattern);

    // ====== Create Sector (sec) =================
    this.#dom_sector = Utils.createSVGElement("path");
    this.#dom_sector.classList.add("sec");
    this.dom.appendChild(this.#dom_sector);
    this.#dom_sector.setAttribute("fill", `url('#${pattern_id}')`);
    Object.freeze(this.#dom_sector);

    // ====== Create Left Ext (ext) ===============
    this.#dom_left_ext = Utils.createSVGElement("path");
    this.#dom_left_ext.classList.add("ext");
    this.dom.appendChild(this.#dom_left_ext);
    Object.freeze(this.#dom_left_ext);

    // ====== Create Right Ext (ext) ===============
    this.#dom_right_ext = Utils.createSVGElement("path");
    this.#dom_right_ext.classList.add("ext");
    this.dom.appendChild(this.#dom_right_ext);
    Object.freeze(this.#dom_right_ext);

    // ====== Create Left Ray (ray) ===============
    this.#dom_left_ray = Utils.createSVGElement("path");
    this.#dom_left_ray.classList.add("ray");
    this.dom.appendChild(this.#dom_left_ray);
    Object.freeze(this.#dom_left_ray);

    // ====== Create Right Ray (ray) ===============
    this.#dom_right_ray = Utils.createSVGElement("path");
    this.#dom_right_ray.classList.add("ray");
    this.dom.appendChild(this.#dom_right_ray);
    Object.freeze(this.#dom_right_ray);

    // ====== Create src (src) ===========
    this.#dom_src = Utils.createSVGElement("circle");
    this.#dom_src.classList.add("src");
    this.dom.appendChild(this.#dom_src);
    Object.freeze(this.#dom_src);
  }

  #setDisplay(display) {
    if (display === false) {
      this.dom.style.display = "none";
      return false;
    }
    this.dom.style.removeProperty("display");
    return true;
  }

  #setClass(cls) {
    let add_cls = [],
      rem_cls = [];
    if (cls === R2PSectorClass.Active) add_cls.push("active");
    else rem_cls.push("active");
    if (cls === R2PSectorClass.Inactive) add_cls.push("inactive");
    else rem_cls.push("inactive");
    for (const cls of add_cls) this.dom.classList.add(cls);
    for (const cls of rem_cls) this.dom.classList.remove(cls);
  }

  #drawSrc(min_bound, max_bound, src_coord, src_radius) {
    this.#dom_src.setAttribute("r", src_radius);
    this.#dom_src.setAttribute("cx", src_coord[0]);
    this.#dom_src.setAttribute("cy", src_coord[1]);
    Utils.updateMinBound(min_bound, [
      src_coord[0] - src_radius,
      src_coord[1] - src_radius,
    ]);
    Utils.updateMaxBound(max_bound, [
      src_coord[0] + src_radius,
      src_coord[1] + src_radius,
    ]);
  }

  /**
   *
   * @param {R2PSide} side
   * @param {[number, number]} src_coord
   * @param {number} src_radius
   * @param {[number, number]} ray_diff
   * @param {boolean} from_src
   */
  #drawRayAndExt(
    min_bound,
    max_bound,
    side,
    src_coord,
    src_radius,
    ray_radius,
    ray_diff,
    from_src,
    ray_arrow_length,
    ray_arrow_width,
    map_px_size
  ) {
    // ============== Assign DOMs ===============
    let dom_ray, dom_ext;
    if (side === R2PSide.L) {
      dom_ray = this.#dom_left_ray;
      dom_ext = this.#dom_left_ext;
    } else if (side === R2PSide.R) {
      dom_ray = this.#dom_right_ray;
      dom_ext = this.#dom_right_ext;
    }

    // ============== Hide and return if there is no ray ===================
    if (!ray_diff) {
      dom_ray.setAttribute("display", "none");
      dom_ext.setAttribute("display", "none");
      return;
    } else {
      dom_ray.removeAttribute("display");
      dom_ext.removeAttribute("display");
    }

    // =============== Determine start and end points of ray ================
    let ray_from_coord, ray_to_coord;
    const ray_unit_diff = Utils.unitCoord(ray_diff);
    if (from_src) {
      ray_from_coord = [
        src_coord[0] + ray_unit_diff[0] * src_radius,
        src_coord[1] + ray_unit_diff[1] * src_radius,
      ];
      ray_to_coord = [
        src_coord[0] + ray_diff[0] - ray_unit_diff[0] * ray_radius,
        src_coord[1] + ray_diff[1] - ray_unit_diff[1] * ray_radius,
      ];
    } else {
      ray_from_coord = [
        src_coord[0] - ray_diff[0] + ray_unit_diff[0] * ray_radius,
        src_coord[1] - ray_diff[1] + ray_unit_diff[1] * ray_radius,
      ];
      ray_to_coord = [
        src_coord[0] - ray_unit_diff[0] * src_radius,
        src_coord[1] - ray_unit_diff[1] * src_radius,
      ];
    }

    // =============== Determine the arrow ===================
    const ray_unit_normal = [-side * ray_unit_diff[1], side * ray_unit_diff[0]];
    const arrow1 = [
      ray_to_coord[0] - (ray_unit_diff[0] * ray_arrow_length) / 2,
      ray_to_coord[1] - (ray_unit_diff[1] * ray_arrow_length) / 2,
    ];
    const arrow0 = [
      arrow1[0] + ray_unit_normal[0] * ray_arrow_width,
      arrow1[1] + ray_unit_normal[1] * ray_arrow_width,
    ];
    const arrow3 = [
      ray_to_coord[0] - ray_unit_diff[0] * ray_arrow_length,
      ray_to_coord[1] - ray_unit_diff[1] * ray_arrow_length,
    ];
    const arrow2 = [
      arrow3[0] + ray_unit_normal[0] * ray_arrow_width,
      arrow3[1] + ray_unit_normal[1] * ray_arrow_width,
    ];

    // ============== Draw the ray ======================
    dom_ray.setAttribute(
      "d",
      `M ${ray_from_coord.join(",")} L ${ray_to_coord.join(
        ","
      )} L ${arrow0.join(",")} L ${arrow1.join(",")} L ${arrow2.join(
        ","
      )} L ${arrow3.join(",")}`
    );

    // =============== Determine ext coordinates ===========
    let ext_from_coord;
    if (from_src) ext_from_coord = ray_to_coord;
    else
      ext_from_coord = [
        src_coord[0] + ray_unit_diff[0] * src_radius,
        src_coord[1] + ray_unit_diff[1] * src_radius,
      ];
    // Determine final coordinates at map edge
    let dx = -ext_from_coord[0]; // to calculate squared distance remaining to map's x boundary in direction of unit_diff
    if (ray_unit_diff[0] > 0) dx += map_px_size[0];
    let x_norm_sq = dx / ray_unit_diff[0];
    x_norm_sq *= x_norm_sq;
    let dy = -ext_from_coord[1]; // to calculate squared distance remaining to map's y boundary in direction of unit_diff
    if (ray_unit_diff[1] > 0) dy += map_px_size[1];
    let y_norm_sq = dy / ray_unit_diff[1];
    y_norm_sq *= y_norm_sq;
    let ext_to_coord;
    if (x_norm_sq > y_norm_sq)
      ext_to_coord = [
        ext_from_coord[0] + (dy * ray_unit_diff[0]) / ray_unit_diff[1],
        ext_from_coord[1] + dy,
      ];
    else
      ext_to_coord = [
        ext_from_coord[0] + dx,
        ext_from_coord[1] + (dx * ray_unit_diff[1]) / ray_unit_diff[0],
      ];

    // ============== Draw the ext =======================
    dom_ext.setAttribute(
      "d",
      `M ${ext_from_coord.join(",")} L ${ext_to_coord.join(",")}`
    );

    // ============== Update bounds =====================
    for (const coord of [ext_to_coord, ray_from_coord, arrow0, arrow3])
      Utils.updateBounds(min_bound, max_bound, coord);
  }

  #drawSector(
    min_bound,
    max_bound,
    src_radius,
    sector_radius,
    left_ray_diff,
    right_ray_diff,
    src_coord
  ) {
    if (!left_ray_diff || !right_ray_diff) {
      this.#dom_sector.setAttribute("display", "none");
      return;
    }
    this.#dom_sector.removeAttribute("display");

    // ======= Set the local bounds for gradient drawing =======
    let min_bound_sec = [Infinity, Infinity];
    let max_bound_sec = [-Infinity, -Infinity];

    // ======= calculate interior and exterior coords ===========
    const left_unit_diff = Utils.unitCoord(left_ray_diff);
    const right_unit_diff = Utils.unitCoord(right_ray_diff);
    const int_radius = src_radius;
    const ext_radius = sector_radius;
    const left_int_coord = [
      src_coord[0] + left_unit_diff[0] * int_radius,
      src_coord[1] + left_unit_diff[1] * int_radius,
    ];
    Utils.updateBounds(min_bound_sec, max_bound_sec, left_int_coord);
    const right_int_coord = [
      src_coord[0] + right_unit_diff[0] * int_radius,
      src_coord[1] + right_unit_diff[1] * int_radius,
    ];
    Utils.updateBounds(min_bound_sec, max_bound_sec, right_int_coord);
    const left_ext_coord = [
      src_coord[0] + left_unit_diff[0] * ext_radius,
      src_coord[1] + left_unit_diff[1] * ext_radius,
    ];
    Utils.updateBounds(min_bound_sec, max_bound_sec, left_ext_coord);
    const right_ext_coord = [
      src_coord[0] + right_unit_diff[0] * ext_radius,
      src_coord[1] + right_unit_diff[1] * ext_radius,
    ];
    Utils.updateBounds(min_bound_sec, max_bound_sec, right_ext_coord);

    // ========= Generate cardinal coords on the sector (at 0,90,180,270 degs of grid frame) ========
    let angle_left = Math.atan2(left_unit_diff[1], left_unit_diff[0]);
    let angle_right = Math.atan2(right_unit_diff[1], right_unit_diff[0]);
    if (angle_right < angle_left) angle_right += Math.PI * 2;
    let int_arc = `M ${left_int_coord.join(",")}`;
    let ext_arc = `L ${right_ext_coord.join(",")}`;
    for (let a of [-1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5]) {
      const angle = a * Math.PI;
      if (
        Utils.approxGt(angle, angle_left) &&
        Utils.approxGt(angle_right, angle)
      ) {
        const int_coord = [
          src_coord[0] + Math.cos(angle) * int_radius,
          src_coord[1] + Math.sin(angle) * int_radius,
        ];
        const ext_coord = [
          src_coord[0] + Math.cos(angle) * ext_radius,
          src_coord[1] + Math.sin(angle) * ext_radius,
        ];
        int_arc = int_arc.concat(
          ` A ${int_radius} ${int_radius} 0 0 1 ${int_coord.join(",")}`
        );
        ext_arc = ext_arc.concat(
          ` A ${ext_radius} ${ext_radius} 0 0 0 ${ext_coord.join(",")}`
        );

        // ======== Update bounds ===============
        Utils.updateBounds(min_bound_sec, max_bound_sec, ext_coord);
      }
    }
    // complete the arc
    int_arc = int_arc.concat(
      ` A ${int_radius} ${int_radius} 0 0 1 ${right_int_coord.join(",")}`
    );
    ext_arc = ext_arc.concat(
      ` A ${ext_radius} ${ext_radius} 0 0 0 ${left_ext_coord.join(",")}`
    );

    // =========== Draw the arc ===================
    this.#dom_sector.setAttribute("d", `${int_arc} ${ext_arc} Z`);

    // =========== Draw the gradient ==============
    // From bounding box, find origin relative position.
    const pattern_topleft = Utils.subtractCoords(src_coord, [
      ext_radius,
      ext_radius,
    ]);
    this.#dom_pattern.setAttribute("width", sector_radius * 2);
    this.#dom_pattern.setAttribute("height", sector_radius * 2);
    this.#dom_pattern.setAttribute(
      "patternTransform",
      `translate(${pattern_topleft.join(" ")})`
    );

    // ========== Update bounds
    Utils.updateBounds(min_bound, max_bound, min_bound_sec);
    Utils.updateBounds(min_bound, max_bound, max_bound_sec);
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

  /**
   *
   * @param {boolean} display
   * @param {number} z_index
   * @param {[number, number]} src_coord
   * @param {Algs.R2PRay} left_ray
   * @param {Algs.R2PRay} right_ray
   * @param {R2PSectorClass} cls
   * @returns
   */
  draw(display, z_index, src_coord, left_ray, right_ray, cls) {
    // check display
    if (!this.#setDisplay(display)) return;

    const param_ray_arrow_length = ui_params.sprite_sec_ray_arrow_length;
    const param_ray_arrow_width = ui_params.sprite_sec_ray_arrow_width;

    //  ============= Get values =====================
    const map_px_size = [
      ui_states.size[0] * ui_params.cell_size,
      ui_states.size[1] * ui_params.cell_size,
    ];
    const src_radius = ui_params.sprite_sec_src_radius * ui_params.cell_size;
    const ray_radius = ui_params.sprite_sec_ray_radius * ui_params.cell_size;
    const sector_radius = ui_params.sprite_sec_radius * ui_params.cell_size;
    src_coord = ui.gridToPx(src_coord);
    let left_ray_diff, right_ray_diff, left_from_src, right_from_src;
    if (left_ray) {
      left_ray_diff = ui.gridToPxVector(left_ray.getCoord());
      left_from_src = left_ray.from_src;
    }
    if (right_ray) {
      right_ray_diff = ui.gridToPxVector(right_ray.getCoord());
      right_from_src = right_ray.from_src;
    }

    let min_bound = [Infinity, Infinity];
    let max_bound = [-Infinity, -Infinity];

    // ============== ZIndex ====================
    this.dom.style.zIndex = z_index;

    // ============== Class ====================
    this.#setClass(cls);

    // ============== Src =================
    this.#drawSrc(min_bound, max_bound, src_coord, src_radius);

    // ============== Draw Rays ==================
    this.#drawRayAndExt(
      min_bound,
      max_bound,
      R2PSide.L,
      src_coord,
      src_radius,
      ray_radius,
      left_ray_diff,
      left_from_src,
      param_ray_arrow_length,
      param_ray_arrow_width,
      map_px_size
    );
    this.#drawRayAndExt(
      min_bound,
      max_bound,
      R2PSide.R,
      src_coord,
      src_radius,
      ray_radius,
      right_ray_diff,
      right_from_src,
      param_ray_arrow_length,
      param_ray_arrow_width,
      map_px_size
    );

    // ============== Draw Sector ========================
    this.#drawSector(
      min_bound,
      max_bound,
      src_radius,
      sector_radius,
      left_ray_diff,
      right_ray_diff,
      src_coord
    );

    //=============== Set dimensions ==================
    this.#setDimensions(min_bound, max_bound, ui_params.sprite_sec_ray_width); // assumes sprite_sec_ext_width is smaller.
  }

  vis() {
    this.draw(
      this.value(R2PActionSector.Display),
      this.value(R2PActionSector.ZIndex),
      this.value(R2PActionSector.SrcCoord),
      this.value(R2PActionSector.LeftRay),
      this.value(R2PActionSector.RightRay),
      this.value(R2PActionSector.Class)
    );
  }
};

Algs.R2PSpriteProg = class extends UI.AbstractSprite {
  #setDisplay(display) {
    if (display === false) {
      this.dom.style.display = "none";
      return false;
    }
    this.dom.style.removeProperty("display");
    return true;
  }

  draw(display, z_index, src_coord, diff) {
    // ============== display ===================
    if (!this.#setDisplay(display)) return;

    // ============== ZIndex ====================
    this.dom.style.zIndex = z_index;

    // ------------ Params ----------------
    const arrow_length = ui_params.sprite_prog_arrow_length;
    const arrow_width = ui_params.sprite_prog_arrow_width;
    const stroke_width = ui_params.sprite_prog_stroke_width;
    const src_radius = ui_params.sprite_prog_src_radius * ui_params.cell_size;
    const tgt_radius = ui_params.sprite_prog_tgt_radius * ui_params.cell_size;
    src_coord = ui.gridToPx(src_coord);
    diff = ui.gridToPxVector(diff);

    // ------------ Get Doms --------------
    const dom_line = this.dom.firstChild;
    const dom_arr0 = dom_line.nextSibling;
    const dom_arr1 = dom_arr0.nextSibling;
    const dom_arr2 = dom_arr1.nextSibling;
    const dom_arr3 = dom_arr2.nextSibling;

    // ============ Draw line and arrows ===================
    const mag = Utils.euclidean(diff);
    const tgt = mag - tgt_radius;
    dom_line.setAttribute("d", `M ${src_radius},0 H ${tgt}`);
    const horz1 = tgt - arrow_length / 2;
    const horz2 = horz1;
    const horz3 = tgt - arrow_length;
    const vert = arrow_width / 2;
    dom_arr0.setAttribute("d", `M ${tgt},0 L ${horz2},${-vert}`);
    dom_arr1.setAttribute("d", `M ${tgt},0 L ${horz2},${vert}`);
    dom_arr2.setAttribute("d", `M ${horz1},0 L ${horz3},${-vert}`);
    dom_arr3.setAttribute("d", `M ${horz1},0 L ${horz3},${vert}`);

    // ============ ViewBox and positioning ==============
    const transform_origin = [
      stroke_width / 2,
      (stroke_width + arrow_width) / 2,
    ];
    const top = src_coord[1] - transform_origin[1];
    const left = src_coord[0] - transform_origin[0];
    this.dom.style.inset = `${top}px auto auto ${left}px`;
    const width = stroke_width + mag;
    this.dom.setAttribute("width", `${width}px`);
    const height = stroke_width + arrow_width;
    this.dom.setAttribute("height", `${height}px`);
    this.dom.setAttribute(
      "viewBox",
      `${-transform_origin[0]} ${-transform_origin[1]} ${width} ${height}`
    );

    // ============ Rotate ==================
    this.dom.style.transformOrigin = `${transform_origin[0]}px ${transform_origin[1]}px`;
    const angle = Math.atan2(diff[1], diff[0]);
    this.dom.style.transform = `rotate(${(angle / Math.PI) * 180}deg)`;
  }

  constructor(canvas_id) {
    super(canvas_id, R2PActionProg.length, "r2p", true);
    this.dom.classList.add(this.cls_base);

    const dom_line = Utils.createSVGElement("path");
    this.dom.appendChild(dom_line);

    dom_line.classList.add("line");
    for (let i = 0; i < 4; ++i) {
      const dom_arrow = Utils.createSVGElement("path");
      dom_arrow.classList.add("arrow");
      this.dom.appendChild(dom_arrow);
    }
  }

  vis() {
    this.draw(
      this.value(R2PActionProg.Display),
      this.value(R2PActionProg.ZIndex),
      this.value(R2PActionProg.SrcCoord),
      this.value(R2PActionProg.Diff)
    );
  }
};

Algs.R2PSpriteTrace = class extends UI.AbstractSprite {
  #stack;

  constructor(canvas_id) {
    super(canvas_id, R2PActionTrace.length, "r2t", true);
    this.dom.classList.add(this.cls_base);

    const dom_line = Utils.createSVGElement("path");
    this.dom.appendChild(dom_line);
    this.#stack = [];
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
   * @param {R2PTraceClass} cls
   */
  #setClass(cls) {
    this.dom.setAttribute("tstat", cls);
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
      `${min_bound.join(" ")} ${size.join(" ")}`
    );
    this.dom.style.inset = `${min_bound[1]}px auto auto ${min_bound[0]}px`;
  }

  draw(display, z_index, cls, coords) {
    // ============== display ===================
    if (!this.#setDisplay(display)) return;

    // ============== ZIndex ====================
    this.dom.style.zIndex = z_index;

    // ============== set class ==================
    this.#setClass(cls);

    const min_bound = [Infinity, Infinity];
    const max_bound = [-Infinity, -Infinity];

    // ============== draw coords ================
    const dom_path = this.dom.firstChild;
    let path_str = "";
    for (const coord of coords) {
      const px = ui.gridToPx(coord);
      if (path_str === "") path_str = `M${px.join(",")}`;
      else path_str = `${path_str} L${px.join(",")}`;
      Utils.updateBounds(min_bound, max_bound, px);
    }
    dom_path.setAttribute("d", path_str);

    // ============= viewBox =========================
    this.#setDimensions(
      min_bound,
      max_bound,
      ui_params.sprite_trace_stroke_width
    );
  }

  /**
   *
   * @param {number} action_id
   * @param {*} new_data
   * @returns {boolean}
   */
  register(action_id, new_data) {
    if (action_id === R2PActionTrace.Add) {
      this.#stack.push(new_data.slice());
      return super.register(action_id, new_data.slice(), true); // skip duplicate check
    } else if (action_id === R2PActionTrace.Clear) {
      const stack = this.#stack;
      this.#stack = [];
      return super.register(action_id, stack, true); // skip duplicate check
    } else return super.register(action_id, new_data, false);
  }

  redo(action_id) {
    const redone = super.redo(action_id);
    if (action_id === R2PActionTrace.Add) {
      this.#stack.push(this.value(action_id));
    } else if (action_id === R2PActionTrace.Clear) {
      this.#stack = [];
    }
    return redone;
  }

  undo(action_id) {
    if (action_id === R2PActionTrace.Add) {
      this.#stack.pop();
    } else if (action_id === R2PActionTrace.Clear) {
      this.#stack = this.value(action_id).slice();
    }
    return super.undo(action_id);
  }

  vis() {
    this.draw(
      this.value(R2PActionTrace.Display),
      this.value(R2PActionTrace.ZIndex),
      this.value(R2PActionTrace.Class),
      this.#stack
    );
  }
};
