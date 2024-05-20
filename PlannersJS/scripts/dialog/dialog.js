"use strict";

UI.Dialog = class {
    dom;
    #current_form;

    constructor() {
        if (ui.dialog)
            throw new Error(`ui.dialog has already been initialized`);
        ui.dialog = this;

        this.dom = document.querySelector(".dialog");
        this.#current_form = null;
        this.hide();
        
        new UI.FormAlg();
        new UI.FormNewMap();

        for (const form of [
            ui.form_new_map,
            ui.form_alg]) {
            this.dom.appendChild(form.dom);
            form.hide();
        }

        Object.freeze(this.dom);
    }

    /**
     * Shows a form in the dialog box.
     * @param {UI.AbstractForm | *} form A form instance derived from UI.AbstractForm.
     */
    show(form) {
        this.#current_form = form;
        this.#current_form.show();
        this.dom.style.removeProperty("display");
    }

    /** 
     * Hides the dialog box.
     */
    hide() {
        this.dom.style.display = "none";
        if (this.#current_form === null) {
            return;
        }
        this.#current_form.hide();
        this.#current_form = null;
    }

    /**
     * Sends an ok response to the current form shown by the dialog box.
     */
    ok() { this.#current_form.ok(); }

    /**
     * Sends a cancel response to the current form shown by the dialog box.
     */
    cancel() { this.#current_form.cancel(); }
}
Object.seal(UI.Dialog);