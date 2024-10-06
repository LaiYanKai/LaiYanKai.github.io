"use strict";

Algs.RRTSpriteCircle = class extends UI.AbstractSprite {
  #dom_circ;

  constructor(canvas_id) {
    super(canvas_id, RRTActionCircle.length, "rrt-circ", true);
    this.dom.setAttribute("class", this.cls_base);

    // ====== Create circle =================
    this.#dom_circ = Utils.createSVGElement("circle");
    this.#dom_circ.classList.add("circ");
    this.dom.appendChild(this.#dom_circ);
    Object.freeze(this.#dom_circ);
  }

  #setDisplay(display) {
    if (display === false) {
      this.dom.style.display = "none";
      return false;
    }
    this.dom.style.removeProperty("display");
    return true;
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

  #drawCirc(min_bound, max_bound, position, radius) {
    this.#dom_circ.setAttribute("cx", position[0]);
    this.#dom_circ.setAttribute("cy", position[1]);
    this.#dom_circ.setAttribute("r", radius);
    min_bound[0] = position[0] - radius;
    min_bound[1] = position[1] - radius;
    max_bound[0] = position[0] + radius;
    max_bound[1] = position[1] + radius;
  }

  /**
   *
   * @param {boolean} display
   * @param {number} z_index
   * @param {[number, number]} position
   * @param {number} radius
   */
  draw(display, z_index, position, radius) {
    // ============== check display =============
    if (!this.#setDisplay(display)) return;

    // ============== ZIndex ====================
    this.dom.style.zIndex = z_index;

    //  ============= Get values =====================
    position = ui.gridToPx(position);
    radius *= ui_params.cell_size;

    // ============== Draw Circle =================
    const min_bound = [0, 0];
    const max_bound = [0, 0];
    this.#drawCirc(min_bound, max_bound, position, radius);

    //=============== Set dimensions ==================
    this.#setDimensions(
      min_bound,
      max_bound,
      ui_params.sprite_rrt_circ_stroke_width
    );
  }

  vis() {
    this.draw(
      this.value(RRTActionCircle.Display),
      this.value(RRTActionCircle.ZIndex),
      this.value(RRTActionCircle.Position),
      this.value(RRTActionCircle.Radius)
    );
  }
};
