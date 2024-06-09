"use strict";

UI.Tooltip = class {
    #dom;
    #dom_box;

    constructor() {
        if (ui.tooltip)
            throw new Error(`ui.tooltip has already been initialized.`);
        ui.tooltip = this;

        this.#dom = document.querySelector(".tooltip");
        this.#dom_box = this.#dom.querySelector(".box");
        this.hide();

        Object.freeze(this);
    }

    /**
     * Leave width or height as undefined for auto sizing.
     */
    setTip(dialog_pos, message, dom, width = undefined, height = undefined) {
        this.#dom_box.innerHTML = message;
        this.#dom_box.style.width = !width ? "auto" : width;
        this.#dom_box.style.height = !height ? "auto" : height;
        const base_rect = this.#dom.getBoundingClientRect();
        const dom_rect = dom.getBoundingClientRect();
        const box_rect = this.#dom_box.getBoundingClientRect();

        if (dialog_pos === TooltipPosition.Top) {
            this.#dom_box.className = "box b";
            this.#dom_box.style.top = "auto";
            this.#dom_box.style.right = "auto";
            this.#dom_box.style.bottom = `${-ui_params.tooltip_tail}px`;
            this.#dom_box.style.left = `${dom_rect.left + dom_rect.width / 2 - base_rect.left - box_rect.width / 2}px`;
        }
        else if (dialog_pos === TooltipPosition.TopLeft) {
            this.#dom_box.className = "box br";


        }
        else if (dialog_pos === TooltipPosition.Left) {
            this.#dom_box.className = "box r";

        }
        else if (dialog_pos === TooltipPosition.BottomLeft) {
            this.#dom_box.className = "box tr";

        }
        else if (dialog_pos === TooltipPosition.Bottom) {
            this.#dom_box.className = "box t";

        }
        else if (dialog_pos === TooltipPosition.BottomRight) {
            this.#dom_box.className = "box tl";
        }
        else if (dialog_pos === TooltipPosition.Right) {
            this.#dom_box.className = "box l";
            this.#dom_box.style.top = `${dom_rect.top + dom_rect.height / 2 - base_rect.top - box_rect.height / 2}px`;
            this.#dom_box.style.left = `${dom_rect.right - base_rect.left + ui_params.tooltip_tail}px`;
        }
        else if (dialog_pos === TooltipPosition.TopRight) {
            this.#dom_box.className = "box bl";
        }
        else
            throw new Error(`Unrecognized dialog_pos "${dialog_pos}"`);

        this.show();
    }

    show() { this.#dom_box.classList.remove("hide"); }

    hide() { this.#dom_box.classList.add("hide"); }
};