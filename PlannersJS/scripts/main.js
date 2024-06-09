"use strict";

// load the files
const loader = {
    files: [
        ["enums/algs.js", false],
        ["enums/cursors.js", false],
        ["enums/dir_idx.js", false],
        ["enums/metric.js", false],
        ["enums/new_map.js", false],
        ["enums/action.js", false],
        ["enums/astar.js", false], // depends on sprites
        ["enums/dijkstra.js", false], // depends on sprites
        ["enums/r2p.js", false], // depends on sprites
        ["enums/bfs.js", false],
        ["enums/dfs.js", false],
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
        ["player/lens.js", false],
        ["player/player.js", false],
        ["algs/parameters.js", false],
        ["algs/containers.js", false],
        ["algs/algs.js", false],
        ["algs/astar.js", false],
        ["algs/dijkstra.js", false],
        ["algs/bfs.js", false],
        ["algs/dfs.js", false],
        ["algs/r2p_types.js", false],
        ["algs/r2p_sprites.js", false],
        ["algs/r2p_canvas.js", false],
        ["algs/r2p_mapper.js", false],
        ["algs/r2p.js", false],
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

loader.load();
