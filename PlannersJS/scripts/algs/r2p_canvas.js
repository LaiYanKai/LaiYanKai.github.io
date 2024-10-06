"use strict";

Algs.R2PCanvasLinks = class extends UI.AbstractCanvas {
  /** @type {Algs.R2PSpriteSector} The angular sector that appears when a link is hovered */
  #sprite_sector;
  /** @type {Algs.R2PSpriteProg} The progression ray that appears when a link is hovered*/
  #sprite_prog;

  constructor(canvas_id) {
    super(canvas_id, Algs.R2PSpriteLink);

    // Sector lies below all sprites in this canvas
    this.#sprite_sector = new Algs.R2PSpriteSector(
      canvas_id,
      `r2s_${canvas_id}`
    );
    this.dom.appendChild(this.#sprite_sector.dom);

    // Prog ray lies above the sector, and below all sprites of this canvas
    this.#sprite_prog = new Algs.R2PSpriteProg(canvas_id);
    this.dom.appendChild(this.#sprite_prog.dom);
  }

  add(id) {
    /** @type {Algs.R2PSpriteLink} */
    const sprite = super.add(id);
    sprite.register(R2PActionLink.Display, false);
    // sprite.register(R2PActionLink.ZIndex, 0);
    sprite.register(R2PActionLink.Id, id);
    sprite.register(R2PActionLink.Knob, 0);
    // sprite.register(R2PActionLink.Status, R2PLinkStatus.None);

    // sprite.register(R2PActionLink.LeftRay, null);
    // sprite.register(R2PActionLink.RightRay, null);
    // sprite.register(R2PActionLink.ProgRay, null);
    // sprite.register(R2PActionLink.Cost, Infinity);
    // sprite.register(R2PActionLink.Side, null);
    // sprite.register(R2PActionLink.Tdir, tdir);
    // sprite.register(R2PActionLink.Type, type);

    // sprite.dom.addEventListener(
    //     "mousemove", this.#setTip.bind(this, sprite), false);
    // sprite.dom.addEventListener(
    //     "mouseout", ui.tooltip.hide.bind(ui.tooltip), false);

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

  #mouseMove(sprite, e) {
    this.#setSectorAndProg(sprite, e);
    this.#setTip(sprite, e);
  }

  #mouseOut(e) {
    this.#unsetSectorAndProg();
    ui.tooltip.hide();
  }

  #setSectorAndProg(sprite, e) {
    const prog_ray = sprite.value(R2PActionLink.ProgRay);
    const src_coord = sprite.value(R2PActionLink.SrcCoord);
    if (prog_ray) {
      const tdir = sprite.value(R2PActionLink.Tdir);
      const from_coord =
        tdir === R2PTreeDir.Src
          ? src_coord
          : sprite.value(R2PActionLink.TgtCoord);
      this.#sprite_prog.draw(true, 0, from_coord, prog_ray);
    } else this.#sprite_prog.draw(false);
    const left_ray = sprite.value(R2PActionLink.LeftRay);
    const right_ray = sprite.value(R2PActionLink.RightRay);
    this.#sprite_sector.draw(
      true,
      0,
      src_coord,
      left_ray,
      right_ray,
      R2PSectorClass.Inactive
    );
  }

  #unsetSectorAndProg(e) {
    this.#sprite_prog.draw(false);
    this.#sprite_sector.draw(false);
  }

  #setTip(sprite, e) {
    // =============== Type ======================
    const type = sprite.value(R2PActionLink.Type);
    let type_str;
    if (type === R2PLinkType.Eu)
      type_str =
        "Eu"; //Anchor is <u>E</u>xpensive point with <u>u</u>nknown cumulative visibility";
    else if (type === R2PLinkType.Ey)
      type_str =
        "Ey"; //Anchor is <u>E</u>xpensive point with cumulative visibility (<u>y</u>es)";
    else if (type === R2PLinkType.Oc)
      type_str =
        "Oc"; // Anchor from limited trace in target <u>oc</u>cupied sector";
    else if (type === R2PLinkType.Tm)
      type_str = "Tm"; // Anchor is phantom or <u>t</u>e<u>m</u>porary point";
    else if (type === R2PLinkType.Un)
      type_str = "Un"; // Anchor is <u>un</u>reachable";
    else if (type === R2PLinkType.Vu)
      type_str =
        "Vu"; // Anchor has <u>u</u>nknown cumulative <u>v</u>isibility";
    else if (type === R2PLinkType.Vy) type_str = "Vy"; // Anchor has cumulative <u>v</u>isibility (<u>y</u>es)";
    type_str = `${type_str}`;

    // =============== Tdir, anchor, root ======================
    const tdir = sprite.value(R2PActionLink.Tdir);
    let tdir_str, anchor, root;
    if (tdir === R2PTreeDir.Src) {
      tdir_str = "S-tree";
      anchor = sprite.value(R2PActionLink.TgtCoord);
      root = sprite.value(R2PActionLink.SrcCoord);
    } else if (tdir === R2PTreeDir.Tgt) {
      tdir_str = "T-tree";
      anchor = sprite.value(R2PActionLink.SrcCoord);
      root = sprite.value(R2PActionLink.TgtCoord);
    }
    const pos_str = `(${anchor.join(",")})`;
    // const root_str = `Root: (${root.join(",")})`;

    // ============= Id ======================
    const id_str = `${sprite.value(R2PActionLink.Id)}`;

    // =============== side, cost ======================
    const side = sprite.value(R2PActionLink.Side);
    const side_str = `${side === R2PSide.L ? "Left" : "Right"}`;
    const cost = sprite.value(R2PActionLink.Cost).toFixed(3);
    const cost_str = `${isNaN(cost) ? "Unknown" : cost}`;

    // =============== Status ======================
    const status = sprite.value(R2PActionLink.Status);
    let status_str = R2PLinkStatus.toString(status);

    // ================= Rays ========================
    const left_ray = sprite.value(R2PActionLink.LeftRay);
    const right_ray = sprite.value(R2PActionLink.RightRay);
    let left_ray_str = "None",
      right_ray_str = "None";
    if (left_ray)
      left_ray_str = `[${left_ray.dx}, ${left_ray.dy}], ${
        left_ray.closed ? "closed" : "open"
      }`;
    if (right_ray)
      right_ray_str = `[${right_ray.dx}, ${right_ray.dy}], ${
        right_ray.closed ? "closed" : "open"
      }`;
    const prog_ray = sprite.value(R2PActionLink.ProgRay);
    let prog_ray_str = ``;
    if (prog_ray) prog_ray_str = `[${prog_ray.join(",")}]`;

    // ================= Srcs , Tgts ======================
    const srcs_str = `{ ${sprite.getSrcIds().join(", ")} }`;
    const tgts_str = `{ ${sprite.getTgtIds().join(", ")} }`;

    // =================== Message =====================
    let message = `<span>`;
    message = `${message}<b>Link</b> (Id:<b>${id_str}</b>) (${tdir_str})`;
    if (status && status !== R2PLinkStatus.None)
      message = `${message}<br/>${status_str}`;
    message = `${message}<br/><hr/><b>Anchor</b>: ${pos_str}<br/>${side_str}-sided, ${type_str} type<br/>Cost=${cost_str}`;
    message = `${message}<br/><hr/><b>Left Ray</b>: ${left_ray_str}`;
    message = `${message}<br/><b>Right Ray</b>: ${right_ray_str}`;
    message = `${message}<br/><hr/><b>Source Links</b> (Id): ${srcs_str}`;
    message = `${message}<br/><b>Target Links</b> (Id): ${tgts_str}`;
    if (prog_ray_str !== "")
      message = `${message}<br/><hr/><b>Progression Ray</b>: ${prog_ray_str}`;
    message = `${message}</span>`;

    ui.tooltip.setTip(TooltipPosition.Right, message, sprite.dom);
  }
};

Algs.R2PCanvasTrace = class extends UI.AbstractCanvas {
  /** @type {Set<Algs.R2PSpriteTrace>} */
  #avail_sprites;
  #num_ids;

  /** @param {number}  canvas_id*/
  constructor(canvas_id) {
    super(canvas_id, Algs.R2PSpriteTrace);

    this.#avail_sprites = new Set();
    this.#num_ids = 0;
  }

  add = undefined;

  /**
   *
   * @returns {Algs.R2PSpriteTrace}
   */
  getAvailable() {
    if (this.#avail_sprites.size === 0) {
      const sprite = super.add(this.#num_ids);
      ++this.#num_ids;
      sprite.register(R2PActionTrace.Display, false);
      return sprite;
    } else {
      const sprite = this.#avail_sprites.keys().next().value;
      this.#avail_sprites.delete(sprite);
      return sprite;
    }
  }

  /**
   * @param {Algs.R2PSpriteTrace} sprite
   */
  markAvailable(sprite) {
    this.#avail_sprites.add(sprite);
  }
};
