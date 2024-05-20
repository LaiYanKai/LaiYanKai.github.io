"use strict";

UI.Cursor = class {
    dom;

    constructor(dom) {
        this.dom = dom;
        Object.freeze(this);
    }

    /** puts the top-left of the cursor at the pixel location. */
    moveTo(px) {
        this.dom.style.insetInline = px[0].toString() + "px";
        this.dom.style.insetBlock = px[1].toString() + "px";
    }

    /** centers the cursor at the px */
    moveToPx(px) {
        px[0] -= ui_params.cursor_dia / 2;
        px[1] -= ui_params.cursor_dia / 2;
        this.moveTo(px);
    }

    /** centers the cursor at the vertex */
    moveToVertex(vertex) { this.moveToPx(ui.gridToPx(vertex)); }

    disableTransition() { this.dom.style.transition = "none"; }

    enableTransition() { this.dom.style.removeProperty("transition"); }
}
Object.seal(UI.Cursor);

ui.cursor_start = new UI.Cursor(
    document.querySelector(".body>.graph>.layers>.cursors>.cursor-start")
);

ui.cursor_goal = new UI.Cursor(
    document.querySelector(".body>.graph>.layers>.cursors>.cursor-goal")
);

UI.Cursors = class {
    dom;
    _event;
    _px_prev;
    _raytracer;

    constructor() {
        if (ui.cursors)
            throw new Error(`ui.cursors has already been initialized.`);
        ui.cursors = this;

        this.dom = document.querySelector(".body>.graph>.layers>.cursors");
        Object.freeze(this.dom);

        this._raytracer = new RayTracer();
        Object.freeze(this._raytracer);

        this._event = CursorEvent.Null;

        this.addEvents();
    }

    addEvents() {
        this.dom.addEventListener("mousedown", ui.cursors._mouseDown);
        this.dom.addEventListener("mousemove", ui.cursors._mouseMove);
        this.dom.addEventListener("mouseup", ui.cursors._mouseUp);
    }

    /** Cannot use this.(...).bind(this) while removing. */
    removeEvents() {
        this.dom.removeEventListener("mousedown", ui.cursors._mouseDown);
        this.dom.removeEventListener("mousemove", ui.cursors._mouseMove);
        this.dom.removeEventListener("mouseup", ui.cursors._mouseUp);
    }

    _mouseDown(e) {
        e.stopPropagation();
        const _this = ui.cursors;
        if (e.target == _this.dom) {
            _this._event = CursorEvent.Draw;
            const bounds = _this.dom.getBoundingClientRect();
            _this._px_prev = [
                e.clientX - bounds.x,
                e.clientY - bounds.y];
            _this.#draw(_this._px_prev, _this._px_prev);
        }
        else if (e.target == ui.cursor_start.dom) {
            _this._event = CursorEvent.Start;
            _this._px_prev = [e.offsetX, e.offsetY];
        }
        else if (e.target == ui.cursor_goal.dom) {
            _this._event = CursorEvent.Goal;
            _this._px_prev = [e.offsetX, e.offsetY];
        }
    }

    _mouseMove(e) {
        e.stopPropagation();
        // do nothing if no events
        const _this = ui.cursors;
        if (_this._event == CursorEvent.Null)
            return;
        else if (e.buttons == 0) {   // trigger mouse up if not null event and the mouse is not pressed.
            _this._mouseUp(e, true);
            return;
        }

        // do nothing if outside bounds
        const bounds = _this.dom.getBoundingClientRect();
        const px_pointer = [
            e.clientX - bounds.x,
            e.clientY - bounds.y];
        if (px_pointer[0] < 0 || px_pointer[0] > bounds.width || px_pointer[1] < 0 || px_pointer[1] > bounds.height)
            return;

        if (_this._event == CursorEvent.Draw) {
            _this.#draw(_this._px_prev, px_pointer);
            _this._px_prev = px_pointer;
        }
        else if (_this._event == CursorEvent.Start) {
            const px_cursor = [
                px_pointer[0] - _this._px_prev[0],
                px_pointer[1] - _this._px_prev[1]];
            ui.cursor_start.moveTo(px_cursor);
            ui.cursor_start.disableTransition();
            const px_cursor_center = [
                px_cursor[0] + ui_params.cursor_dia / 2,
                px_cursor[1] + ui_params.cursor_dia / 2,];
            ui_states.start = ui.pxToGrid(px_cursor_center);
            ui.tool_start_x.change(ui_states.start[0]);
            ui.tool_start_y.change(ui_states.start[1]);
        }
        else if (_this._event == CursorEvent.Goal) {
            const px_cursor = [
                px_pointer[0] - _this._px_prev[0],
                px_pointer[1] - _this._px_prev[1]];
            ui.cursor_goal.moveTo(px_cursor);
            ui.cursor_goal.disableTransition();
            const px_cursor_center = [
                px_cursor[0] + ui_params.cursor_dia / 2,
                px_cursor[1] + ui_params.cursor_dia / 2,];
            ui_states.goal = ui.pxToGrid(px_cursor_center);
            ui.tool_goal_x.change(ui_states.goal[0]);
            ui.tool_goal_y.change(ui_states.goal[1]);
        }
    }

    _mouseUp(e, skip_move = false) {
        const _this = ui.cursors;

        if (!skip_move)
            _this._mouseMove(e);
        if (_this._event == CursorEvent.Start)
            ui.cursor_start.enableTransition();
        else if (_this._event == CursorEvent.Goal)
            ui.cursor_goal.enableTransition();

        _this._event = CursorEvent.Null;
    }

    #draw(from_px, to_px) {
        // convert to vertex (grid) coordinates
        const from = ui.pxToGrid(from_px);
        const to = ui.pxToGrid(to_px);

        const cells = ui.cells;
        const _this = ui.cursors;

        _this._raytracer.init(from, to);
        do {
            let cell_coord = Utils.adjCellFromVertex(
                _this._raytracer.getRoot(),
                _this._raytracer.getSgn());
            let cell = cells.at(cell_coord);
            if (cell) {
                cell.cost = ui_states.draw_cost;
                cell.vis();
            }
            _this._raytracer.update();
        } while (!_this._raytracer.hasReached());
    }
}