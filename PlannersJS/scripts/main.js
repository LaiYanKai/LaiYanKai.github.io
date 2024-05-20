"use strict";

// load the files
const loader = {
    files: [
        ["enums/alg.js", false],
        ["enums/cursors.js", false],
        ["enums/dir_idx.js", false],
        ["enums/metric.js", false],
        ["enums/new_map.js", false],
        ["enums/player.js", false],
        ["enums/sprites.js", false],
        ["enums/astar.js", false], // depends on sprites
        ["enums/tooltip.js", false],
        ["utils/utils.js", false],
        ["utils/raytracer.js", false],
        ["ui.js", false],
        ["graph/layers/cells.js", false],
        ["graph/layers/cursors.js", false],
        ["graph/layers/layers.js", false],
        ["graph/rulers.js", false],
        ["graph/graph.js", false],
        ["toolbar/tools.js", false],
        ["toolbar/toolbar.js", false],
        ["dialog/forms.js", false],
        ["dialog/form_new_map.js", false],
        ["dialog/form_alg.js", false],
        ["dialog/dialog.js", false],
        ["overlay.js", false],
        ["tooltip/tooltip.js", false],
        ["key_binder.js", false],
        ["player/sprites.js", false],
        ["player/canvas.js", false],
        ["player/player.js", false],
        ["algs/parameters.js", false],
        ["algs/containers.js", false],
        ["algs/algs.js", false],
        ["algs/astar.js", false],
    ],
    num_loaded: 0,

    load() {
        for (var i = 0; i < this.files.length; ++i) {
            const script = document.createElement("script");
            script.async = false;
            script.type = "text/javascript";
            script.src = `./scripts/${this.files[i][0]}`;
            script.addEventListener('load', this.loaded.bind(this, i));
            document.body.appendChild(script);
        }
    },

    loaded(i, event)
    {
        ++this.num_loaded;
        this.files[i][1] = true;
        if (this.num_loaded === this.files.length)
            ui.init();
    }
};
Object.seal(loader);

loader.load();
