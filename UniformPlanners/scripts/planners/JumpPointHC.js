class JPSHC extends Planner {
  constructor() {
    super ('jpshc', 'Jump Point S. (Handcrafted)', [
      'blocking',
      'origin',
      'anticlockwise',
      'metric',
      'fh_optimisation',
      'time_ordering',
      'gh_weights',
    ]);
  }
  reset() {
    this.graph = undefined;
    this.list = undefined;
    this.dir_lut = undefined;
    this.wg = NaN;
    this.wh = NaN;
    this.rotate_sign = NaN;
    this.path_found = false;    
  }
  find_g(parent_vertex, child_vertex) {
    var g = JPSHC.Cost.from_vecs(parent_vertex.position, child_vertex.position, this.wg);
    return JPSHC.Cost.add(parent_vertex.g, g);
  }
  update_g(vertex, g) {
    if (g !== undefined) {
      vertex.g = g;
    } else {
      vertex.g = new JPSHC.Cost(0, 0, this.wg);
    }
    vertex.f = JPSHC.Cost.add(vertex.g, vertex.h);
    vertex.update_cnt++;
    if (vertex.f.total === Infinity)
      throw '';
    
    this.step.set_cell_text(vertex.position, vertex.f.toString(2));
    this.step.set_cell_class(vertex.position, 'cell_encountered');
  }
  get_blocking_poses(xp_pos, start_dir) {
    var dl = this.dir_lut;
    return [
      xp_pos.add(dl[start_dir].blocking.vecs[0]),
      xp_pos.add(dl[start_dir].blocking.vecs[1])
    ];
  }
  get_empty_poses(xp_pos, start_dir) {
    var dl = this.dir_lut;
    return [
      xp_pos.add(dl[start_dir].empty.vecs[0]),
      xp_pos.add(dl[start_dir].empty.vecs[1])
    ];
  }
  get_obstacle_poses(xp_pos, start_dir) {
    var dl = this.dir_lut;
    return [
      xp_pos.add(dl[start_dir].obstacle.vecs[0]),
      xp_pos.add(dl[start_dir].obstacle.vecs[1])
    ];
  }
  get_front_pos(xp_pos, start_dir) {
    return xp_pos.add(this.dir_lut[start_dir].front.vec);
  }
  init_dir_lut() {
    this.dir_lut = {};
    var info, nb_dirs, nb_vecs;
    for (const start_dir of Dir.list_dirs()) {
      info = {};
      if (Dir.is_ordinal(start_dir)) {
        nb_dirs = Dir.nearest(start_dir, this.rotate_sign*3);
        nb_vecs = nb_dirs.map(Dir.dir_to_vec);
        info.front = {
          dir : start_dir,
          vec : nb_vecs[3]
        };
        info.blocking = {
          dirs : [nb_dirs[2], nb_dirs[4]],
          vecs : [nb_vecs[2], nb_vecs[4]]
        };
        info.empty = {
          dirs : [nb_dirs[1], nb_dirs[5]],
          vecs : [nb_vecs[1], nb_vecs[5]]
        };
        info.obstacle = {
          dirs : [nb_dirs[0], nb_dirs[6]],
          vecs : [nb_vecs[0], nb_vecs[6]]
        };
      } else {
        nb_dirs = Dir.nearest(start_dir, this.rotate_sign*2);
        nb_vecs = nb_dirs.map(Dir.dir_to_vec);
        info.front = {
          dir : start_dir,
          vec : nb_vecs[2]
        };
        info.blocking = {
          dirs : [start_dir],
          vecs : [nb_vecs[2]]
        };
        info.empty = {
          dirs : [nb_dirs[1], nb_dirs[3]],
          vecs : [nb_vecs[1], nb_vecs[3]]
        };
        info.obstacle = {
          dirs : [nb_dirs[0], nb_dirs[4]],
          vecs : [nb_vecs[0], nb_vecs[4]]
        };
      }
      this.dir_lut[start_dir] = info;
    }
  }
  vertex_is_cheaper(start_vertex, xp_vertex) {
    // returns cost if xp_vertex easier to get to from start_vertex
    var tentative_g = this.find_g(start_vertex, xp_vertex);
    if (xp_vertex.g_cost < tentative_g.total) {
      return false;
    }
    return tentative_g;
  }
  set_node_start(pos) {
    var gui = this.gui;
    if (gui.ns_pos !== undefined)
      this.step.set_cell_class(gui.ns_pos, 'cell_front', true)
    this.step.set_cell_class(pos, 'cell_front');
    gui.ns_pos = pos;
  }
  set_node_first(pos, dir) {
    var gui = this.gui;
    if (pos === undefined) {
      if (gui.nf_pos !== undefined) {
        this.step.set_cell_class(gui.nf_pos, gui.nf_class, true);
        gui.nf_pos = undefined;
      }
      return;
    }
    if (gui.nf_pos !== undefined)
      this.step.set_cell_class(gui.nf_pos, gui.nf_class, true);
    var tmp = 'cell_0_'.concat(dir);
    this.step.set_cell_class(pos, tmp);
    gui.nf_class = tmp;
    gui.nf_pos = pos;
  }
  set_cell_front(pos, dir) {
    var gui = this.gui;
    if (pos === undefined) {
      if (gui.c_pos !== undefined) {
        this.step.set_cell_class(gui.c_pos, gui.c_class, true);
        gui.c_pos = undefined;
      }
      return;
    }
    if (gui.c_pos !== undefined)
      this.step.set_cell_class(gui.c_pos, gui.c_class, true);
    var tmp = 'cell_2_'.concat(dir);
    this.step.set_cell_class(pos, tmp);
    gui.c_class = tmp;
    gui.c_pos = pos;
  }
  find_forced_neighbors(start_vertex, start_dir, xp_vertex, 
    obs_vertex, empty_vertex, empty_dir, jp_added) {
    // jp_added is from the same context as xp_vertex. Only true when jps are added when xp_vertex is checked
    // this.jp_cnt is from the same context as start_vertex (jp_cnt = number of jp added with start_vertex, max 9)
    // returns null if xp_vertex is cheaper to get to from somewhere
    // return true if FN identified, false otherwise
    var xp_pos = xp_vertex.position;
    var start_pos = start_vertex.position;
    var start_dir_str = this.gui.dir_to_string[start_dir];
    var obs_pos = obs_vertex.position;
    var empty_pos = empty_vertex.position;
    var old_g;
    
  }
  gui_list_add(idx, start_dir, start_vertex, first_vertex, type='') {
    // ==== GUI ====
    this.step.draw_path(first_vertex.position, start_vertex.position, UIPath.TRACE);
    this.step.insert_list_item('u', idx, [
      type,
      start_vertex.position.toString(),
      start_vertex.update_cnt,
      this.gui.dir_to_string[start_dir],
      first_vertex.position.toString(),
      first_vertex.f.toString(2),
      first_vertex.g.toString(2),
      first_vertex.h.toString(2)
    ]);
    this.step.color_list_item('u', idx, true);
    this.step.set_list_description('u', 'Added and Sorted '.concat(first_vertex.position.toString()));
  }
  gui_list_post_add(idx) {
    this.step.color_list_item('u', idx, false);
    // this.step.set_list_description('u', '');
  }
  gui_list_retrieve(ret_node) {
    this.step.set_list_description('u', 'Retrieved '.concat(ret_node.first_vertex.position.toString()));
    this.step.remove_list_item('u', 0);
  }
  start() {
    // -------------------------------- Initialise the Start Vertex ----------------------------------
    var nb_dirs = Dir.list_dirs(this.options.origin, this.options.anticlockwise, Dir.DIAGONAL);
    var nb_vecs = nb_dirs.map(Dir.dir_to_vec);
    var nb_vertex, blocking_vecs, vertex0, vertex1, nb_dir, idx;
    // start - set the start position as zero cost;
    var xp_vertex = this.graph.vertices(this.start_position);
    this.update_g(xp_vertex);
    // ==== GUI ====
    this.add_step();
    // start - add the neighboring vertices
    for (var i=0; i<nb_dirs.length; i++) {
      nb_dir = nb_dirs[i];
      nb_vertex = this.graph.vertices(this.start_position.add(nb_vecs[i]));
      if (nb_vertex === null) {
        // start - nb_vertex is outside map
        continue;
      } else if (nb_vertex.obstacle === true) {
        // start - nb_vertex is an obstacle
        continue;
      } else if (this.options.blocking && Dir.is_ordinal(nb_dir)) {
        blocking_vecs = this.dir_lut[nb_dir].blocking.vecs;
        vertex0 = this.graph.vertices(this.start_position.add(blocking_vecs[0]));
        vertex1 = this.graph.vertices(this.start_position.add(blocking_vecs[1]));
        if (vertex0.obstacle && vertex1.obstacle) {
          // start - neighbor cannot be diagonally accessed
          continue;
        }
      }
      // start - nb can be accessed
      // start - set the nb to current as parent
      nb_vertex.parent = xp_vertex;
      // start - find the cost;
      this.update_g(nb_vertex, this.find_g(xp_vertex, nb_vertex));
      // start - add to list
      idx = this.list.add(nb_dir, xp_vertex, nb_vertex);
      // ==== GUI ==== 
      this.gui_list_add(idx, nb_dir, xp_vertex, nb_vertex, 'Start')
      this.add_step();
      this.gui_list_post_add(idx);
    }
  }
  skip_cardinally(start_dir, start_vertex, prev_xp_pos, xp_vertex, ord_to_card=false) {
    console.log('SC: ', start_dir, start_vertex.position.toString(), prev_xp_pos, xp_vertex.position.toString());
    this.num_expansions++;
    // INITS
    var start_pos = start_vertex.position;
    var xp_pos = xp_vertex.position;
    var front_pos = this.get_front_pos(xp_pos, start_dir);
    var front_vertex = this.graph.vertices(front_pos);
    var empty_poses = this.get_empty_poses(xp_pos, start_dir);
    var obs_poses = this.get_obstacle_poses(xp_pos, start_dir);
    var result = null;
    var jp_added = false, xp_cost_found = false;
    var obs_pos, empty_pos;
    var empty_dirs = this.dir_lut[start_dir].empty.dirs;
    var obs_dirs = this.dir_lut[start_dir].obstacle.dirs;
    var old_g, idx, empty_vertex, obs_vertex, tentative_g;
    
    // ==== GUI - Set Cell Front, Update Front Info ====
    this.set_cell_front(xp_pos, start_dir);
    this.step.set_cell_class(xp_pos, 'cell_visited');
    if (ord_to_card === false && prev_xp_pos === undefined)
      this.step.edit_list_item('n', 0, ['Current', this.gui.dir_to_string[start_dir], xp_pos.toString(), '*'.concat(xp_vertex.parent.position.toString()), '*'.concat(xp_vertex.f.toString(2)), 'First']);
    else
      this.step.edit_list_item('n', 0, ['Current', this.gui.dir_to_string[start_dir], xp_pos.toString(), '?', '?','?']);
    this.step.edit_list_item('n', 1, ['Front', this.gui.dir_to_string[start_dir], front_pos.toString(), '?', '?','?']);
    this.step.edit_list_item('n', 2, ['Obs-A', this.gui.dir_to_string[obs_dirs[0]], obs_poses[0].toString(), '?', '?', '?']);
    this.step.edit_list_item('n', 3, ['Empty-A', this.gui.dir_to_string[empty_dirs[0]], empty_poses[0].toString(), '?', '?', '?']);
    this.step.edit_list_item('n', 4, ['Obs-B', this.gui.dir_to_string[obs_dirs[1]], obs_poses[1].toString(), '?', '?', '?']);
    this.step.edit_list_item('n', 5, ['Empty-B', this.gui.dir_to_string[empty_dirs[1]], empty_poses[1].toString(), '?', '?', '?']);
    // for previous move highlight
    this.step.color_list_item('n', 0, false);
    // ==== GUI - Draw Paths ====
    if (prev_xp_pos !== undefined) {
      this.step.remove_paths(prev_xp_pos, start_pos);
    }
    this.step.draw_path(xp_pos, start_pos, UIPath.TRACE2);
    
    // ============================== Cardinal - Current Vertex is Goal ================================
    if (xp_pos.equals(this.goal_position) === true) {
      if (xp_vertex.parent === undefined) {
        xp_vertex.parent = start_vertex;
        this.update_g(xp_vertex, this.find_g(start_vertex, xp_vertex));
      }
      this.path_found = true;
      this.add_step(true);
      this.step.draw_path(xp_pos, start_pos, UIPath.TRACE);
      // GUI - reset fronts
      this.set_cell_front();
      this.set_node_first();
      this.set_node_start(xp_pos, start_dir);
      this.step.set_list_description('n', '<em>Goal</em> Found!');
      this.step.edit_list_item('n', 0, [
        'Current',
        this.gui.dir_to_string[start_dir],
        xp_pos.toString(),
        start_pos.toString(), 
        xp_vertex.f.toString(2),
        '<em>Goal</em>'
      ]);
      this.step.color_list_item('n', 0, true);
      this.add_step()
      // update the current expansion
      this.step.edit_list_item('c', 0, [
        xp_vertex.parent.position.toString(),
        xp_vertex.parent.update_cnt,
        this.gui.dir_to_string[start_dir],
        xp_pos.toString(),
        xp_vertex.f.toString(2),
        xp_vertex.g.toString(2),
        xp_vertex.h.toString(2)
      ]);
      this.step.color_list_item('n', 0, false);
      // return as new jump-point
      return true;
    }
    
    this.add_step();
    // focus the front
    this.step.set_cell_focus(front_pos, true);
    // ============================== Cardinal - Check Front ? ================================
    if (front_vertex === null) {
      // Cardinal - Front vertex NULL (outside map) ==> JP NULL
      this.step.set_list_description('n', '<b>Front</b> is <b>outside the map</b>, so any jump-points must not exist. Forward expansion is also impossible. End the search.');
      this.step.edit_list_item('n', 1, [
        'Front',
        this.gui.dir_to_string[start_dir],
        empty_poses[0].toString(),
        '-',
        '-',
        '\u2717 Outside'
      ]);
      this.step.edit_list_item('n', 3, [
        'Empty-A',
        this.gui.dir_to_string[empty_dirs[0]],
        front_pos.toString(),
        '-',
        '-',
        '\u2717 Blocked'
      ]);
      this.step.edit_list_item('n', 5, [
        'Empty-A',
        this.gui.dir_to_string[empty_dirs[1]],
        empty_poses[1].toString(),
        '-',
        '-',
        '\u2717 Blocked'
      ]);
      this.step.color_list_item('n', 1, true);
      this.step.color_list_item('n', 3, true);
      this.step.color_list_item('n', 5, true);
      this.add_step();
      this.step.color_list_item('n', 1, false);
      this.step.color_list_item('n', 3, false);
      this.step.color_list_item('n', 5, false);
      // blur the front
      this.step.set_cell_focus(front_pos, false);
      return false;
    } else if (this.options.blocking && front_vertex.obstacle) {
      // Cardinal - Front vertex OBS ==> Diagonally Blocked if Obs Vtx. is obs, else no advancing possible.
      this.step.set_list_description('n', '<b>Front</b> '.concat( 
        front_pos.toString(),
        ' is an <b>obstacle</b>, so no jump-points can be added because they are blocked. Forward expansion is also impossible. End the search.'));
      this.step.edit_list_item('n', 1, [
        'Front',
        this.gui.dir_to_string[start_dir],
        front_pos.toString(),
        '-',
        '-',
        '\u2717 Obs'
      ]);
      this.step.edit_list_item('n', 3, [
        'Empty-A',
        this.gui.dir_to_string[empty_dirs[0]],
        front_pos.toString(),
        '-',
        '-',
        '\u2717 Blocked'
      ]);
      this.step.edit_list_item('n', 5, [
        'Empty-A',
        this.gui.dir_to_string[empty_dirs[1]],
        empty_poses[1].toString(),
        '-',
        '-',
        '\u2717 Blocked'
      ]);
      this.step.color_list_item('n', 1, true);
      this.step.color_list_item('n', 3, true);
      this.step.color_list_item('n', 5, true);
      this.add_step();
      this.step.color_list_item('n', 1, false);
      this.step.color_list_item('n', 3, false);
      this.step.color_list_item('n', 5, false);
      // blur the front
      this.step.set_cell_focus(front_pos, false);
      return false;
    }
    
    // ==== GUI ====
    this.step.set_list_description('n', '<b>Front</b> '.concat(
      front_pos.toString(),
      this.options.blocking === true ? ' is in map and not an obstacle' : '',
      ', so it does not obstruct the jump-point placements on both sides.'
    ));
    this.step.edit_list_item('n', 1, [
      'Front',
      this.gui.dir_to_string[start_dir],
      front_pos.toString(),
      '-',
      '-',
      '\u2714 Empty'
    ]);
    this.step.color_list_item('n', 1, true);
    this.add_step();
    this.step.color_list_item('n', 1, false);
    this.step.set_cell_focus(front_pos, false);
    
    for (var i=0; i<2; i++) {     
      // ============================== Cardinal - (#) Obs Outside Map ? ================================
      obs_pos = obs_poses[i];
      obs_vertex = this.graph.vertices(obs_pos);
      if (obs_vertex === null) {
        // Obs Vertex Null ==> empty is null so no JP can be added
        this.step.set_list_description('n', ''.concat(
          i === 0 ? '<b>Obs-A</b>': '<b>Obs-B</b>',
          ' is <b>outside the map</b>. So a jump-point in ',
          i === 0 ? '<b>Empty-A</b>': '<b>Empty-B</b>',
          ' is also outside. So, a jump-point cannot exist on this side'));
        this.step.edit_list_item('n', i*2+2, [
          i === 0 ? 'Obs-A': 'Obs-B',
          this.gui.dir_to_string[obs_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Outside'
        ]);
        this.step.color_list_item('n', i*2+2, true);
        this.add_step();
        this.step.color_list_item('n', i*2+2, false);
        continue;
      }
      
      // ================================= Cardinal - (#) Search for FN ? ================================
      empty_pos = empty_poses[i];
      empty_vertex = this.graph.vertices(empty_pos);
      
      // ==== GUI =====
      // Focus on the FN area
      this.step.set_cell_focus(obs_pos, true);
      this.step.color_list_item('n', i*2+2, true);
      // ==== Obstacle vertex is obstacle ====
      if (obs_vertex.obstacle === true) {
        // ==== GUI - Update Obstacle Info ====
        this.step.set_list_description('n', ''.concat(
          i === 0 ? '<b>Obs-A</b> ': '<b>Obs-B</b> ',
          obs_pos.toString(),
          ' is an <b>obstacle</b>. Checking ',
          i === 0 ? '<b>Empty-A</b> ': '<b>Empty-B</b> ',
          empty_pos.toString(),
          '...'
        ));
        this.step.edit_list_item('n', i*2+2, [
          i === 0 ? 'Obs-A': 'Obs-B',
          this.gui.dir_to_string[obs_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2714 Obs'
        ]);
        this.add_step();
        this.step.set_cell_focus(obs_pos, false);
        this.step.color_list_item('n', i*2+2, false);
        this.step.set_cell_focus(empty_pos, true);
        this.step.color_list_item('n', i*2+3, true);
        // === Empty vertex is empty ====
        if (empty_vertex.obstacle === false) {
          // ==== GUI - Set Empty Vertex as Empty ====
          this.step.set_list_description('n', ''.concat(
            i === 0 ? '<b>Empty-A</b> ': '<b>Empty-B</b> ',
            empty_pos.toString(),
            ' is <b>empty</b>. Forced-neighbor / successor / jump-point can be found in there if the intermediate jump-point ',
            xp_pos.toString(),
            ' is cheaper than previous expansions, if applicable.'
          ));
          this.step.edit_list_item('n', i*2+3, [
            i === 0 ? 'Empty-A': 'Empty-B',
            this.gui.dir_to_string[empty_dirs[i]],
            empty_pos.toString(),
            '-',
            '-',
            '\u2714 Empty',
          ]);
          this.add_step();
          // Don't recalculate cost of xp_vertex or redraw unnecessarily
          if (xp_cost_found === false) {
            this.step.set_cell_focus(xp_pos, true);
            this.step.set_cell_focus(empty_pos, false);
            this.step.color_list_item('n', i*2+3, false);
            // ============================ Cardinal - (#) Was Expanded Vertex Cheaper ? =======================
            tentative_g = this.vertex_is_cheaper(start_vertex, xp_vertex);
            if (tentative_g === false) {
              // Expanded vertex is not cheaper to get to. The expanded vertex is a jp that was already found
              // Terminate search here, bcos paths elsewhere from xp_vertex is cheaper
              // ==== GUI ====
              this.step.set_list_description('n', 
                'Getting to the intermediate jump-point '.concat(
                xp_pos.toString(),
                ' from ',
                start_pos.toString(),
                ' is <b>not cheaper</b> than from its previous parent ',
                xp_vertex.parent.position.toString(),
                '. End the forward search. *Old values.'));
              this.step.edit_list_item('n', 0, [
                'Current',
                this.gui.dir_to_string[empty_dirs[i]],
                xp_pos.toString(),
                '*'.concat(xp_vertex.parent.position.toString()),
                '*'.concat(xp_vertex.f.toString(2)),
                '\u2717 Not cheap'
              ]);
              this.step.color_list_item('n', 0, true);
              this.add_step();
              this.step.color_list_item('n', 0, false);
              this.step.set_cell_focus(xp_pos, false);
              return false;
            }
            
            // Update parent of xp_vertex
            xp_vertex.parent = start_vertex;
            // Update intermediate jumppoint xp_vertex with new cost
            this.update_g(xp_vertex, tentative_g);
            
            // ==== GUI =====
            // Remove any paths with xp_vertex as child
            this.step.remove_paths(xp_pos);
            // add back the path pointing to the parent, this time as an upgraded TRACE
            this.step.draw_path(xp_pos, start_pos, UIPath.TRACE);
            this.step.set_list_description('n', 'Intermediate jump-point '.concat(
              xp_pos.toString(),
              ' is <b>newly expanded</b> / is <b>cheaper</b> than previous expansions. Now check if ',
              i === 0 ? '<b>Empty-A</b> ': '<b>Empty-B</b> ',
              empty_pos.toString(),
              ' is cheaper to access from the jump-point...'
            ));
            this.step.edit_list_item('n', 0, [
              'Current',
              this.gui.dir_to_string[start_dir],
              xp_pos.toString(),
              start_pos.toString(),
              xp_vertex.f.toString(2),
              '\u2714 Cheaper'
            ]);
            this.step.color_list_item('n', 0, true);
            this.add_step();
            this.step.set_cell_focus(xp_pos, false);
            this.step.color_list_item('n', 0, false);
            xp_cost_found = true;
            this.step.set_cell_focus(empty_pos, true);
            this.step.color_list_item('n', i*2+3, true);
          }
          
          // ================================ Cardinal - (#) Was Forced Neighbor Cheaper ? ===========================
          tentative_g = this.vertex_is_cheaper(xp_vertex, empty_vertex);
          if (tentative_g === false) {
            // Forced neighbor more expensive to get from here, skip
            this.step.set_list_description('n', ''.concat(
              i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
              empty_pos.toString(),
              ' is <b>not cheaper</b> to get to than its previous parent ',
              empty_vertex.parent.position.toString(),
              i === 0 ? '. Check the next side.' : '.',
              ' *Old values.'
            ));
            this.step.edit_list_item('n', i*2+3, [
              i === 0 ? 'Empty-A' : 'Empty-B',
              this.gui.dir_to_string[empty_dirs[i]],
              empty_pos.toString(),
              '*'.concat(empty_vertex.parent.position.toString()),
              '*'.concat(empty_vertex.f.toString(2)),
              '\u2717 Not cheap'
            ]);
            jp_added = jp_added || false;
            this.add_step();
            this.step.set_cell_focus(empty_pos, false);
            this.step.color_list_item('n', i*2+3, false);
            continue;
          } 
          
          // Forced neighbor is cheaper to get from here, add to open list
          this.update_g(empty_vertex, tentative_g);
          empty_vertex.parent = xp_vertex;
          idx = this.list.add(empty_dirs[i], xp_vertex, empty_vertex);
          
          // ==== GUI =====
          this.gui_list_add(idx, empty_dirs[i], xp_vertex, empty_vertex, 'F.Nb.');
          // remove all previous paths from empty_pos
          this.step.remove_paths(empty_pos);
          this.step.draw_path(empty_pos, xp_pos, UIPath.TRACE);
          this.step.set_list_description('n', ''.concat(
            i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
            empty_pos.toString(),
            ' is <b>newly expanded</b> / <b>cheaper</b> than previous expansions. Add it to the open-list!'
          ));
          this.step.edit_list_item('n', i*2+3, [
            i === 0 ? 'Empty-A' : 'Empty-B',
            this.gui.dir_to_string[empty_dirs[i]],
            empty_pos.toString(),
            xp_pos.toString(),
            empty_vertex.f.toString(2),
            '\u2714 <b>F.Nb.</b>'
          ]);
          // highlight addition
          this.add_step();
          this.step.color_list_item('n', i*2+3, false);
          this.step.set_cell_focus(empty_pos, false);
          this.gui_list_post_add(idx);
          jp_added = true;
        } else { // empty_vertex not empty
          // update the empty entry
          this.step.set_list_description('n', ''.concat(
            i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
            empty_pos.toString(),
            ' is an <b>obstacle</b>. So, a jump-point cannot exist there.'
          ));
          // ==== GUI - Empty Vertex is Obs ====
          this.step.edit_list_item('n', i*2+3, [
            i === 0 ? 'Empty-A': 'Empty-B',
            this.gui.dir_to_string[empty_dirs[i]],
            empty_pos.toString(),
            '-',
            '-',
            '\u2717 Obs',
          ]);
          this.step.color_list_item('n', i*2+3, true);
          this.add_step();
          this.step.color_list_item('n', i*2+3, false);
          this.step.set_cell_focus(empty_pos, false);
        }
      } else { // obs vertex not obstacle
        // ==== GUI - Obs Vertex is Empty ====
        this.step.set_list_description('n', ''.concat(
          i === 0 ? '<b>Obs-A</b> ' : '<b>Obs-B</b> ',
          obs_pos.toString(),
          ' is <b>empty</b>. So, no jump-point can exist in ',
          i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
          empty_pos.toString()
        ));
        this.step.edit_list_item('n', i*2+2, [
          i === 0 ? 'Obs-A': 'Obs-B',
          this.gui.dir_to_string[obs_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Empty',
        ]);
        this.step.color_list_item('n', i*2+2, true);
        this.add_step();
        this.step.set_cell_focus(obs_pos, false);
      }
      
      // ==== GUI ====
      // unhighlight
      this.step.color_list_item('n', i*2+2, false);
    } // end of neighbor search
    
    // ===================================== Cardinal - Move Forward ? =================================
    this.step.set_cell_focus(front_pos, true);
    if (jp_added === true) {
      this.step.color_list_item('n', 1, true);
      // jump-point was added, check to see if need to add front to open-list
      if (front_vertex.obstacle === false) {
        // front-vertex is accessible, check if front vertex is cheaper
        tentative_g = this.vertex_is_cheaper(start_vertex, front_vertex);
        if (tentative_g === false) { 
          // ==== Front Vertex is Not Cheaper ====
          this.step.set_list_description('n', '<b>Front</b> '.concat(
            front_pos.toString(), 
            ' is <b>empty but not cheaper</b> to access from ',
            start_pos.toString(),
            ' than its previous parent ',
            front_vertex.parent.position.toString(),
            '. It will not be added to the open-list. *Old values.'));
          this.step.edit_list_item('n', 1, [
            'Front',
            this.gui.dir_to_string[start_dir],
            front_pos.toString(),
            '*'.concat(front_vertex.parent.position.toString()),
            '*'.concat(front_vertex.f.toString(2)),
            '\u2717 Not cheap',
          ]);
          this.step.color_list_item('n', 1, true);
          this.add_step();
        } else {
          // ==== Front Vertex is Cheaper, Add to open list ====
          this.update_g(front_vertex, tentative_g);
          // ==== GUI ====
          this.step.set_list_description('n', '<b>Front</b> '.concat(
            front_pos.toString(), 
            ' is <b>empty</b> and <b>newly expanded / <b>cheaper</b> than its previous expansions. It will be added to the open-list.',
          ));
          this.step.edit_list_item('n', 1, [
            'Front',
            this.gui.dir_to_string[start_dir],
            front_pos.toString(),
            start_pos.toString(),
            front_vertex.f.toString(2),
            '\u2714 Cheaper',
          ]);
          front_vertex.parent = start_vertex;
          // ==== Add Front-Vertex to Open-List
          idx = this.list.add(start_dir, start_vertex, front_vertex, 'Front');
          this.gui_list_add(idx, start_dir, start_vertex, front_vertex, 'Front');
          this.step.color_list_item('n', 1, true);
          this.add_step();
          this.gui_list_post_add(idx);
        }
      } else {
        // ==== Front-vertex is not accessible ====
        this.step.set_list_description('n', '<b>Front</b> '.concat(
          front_pos.toString(), 
          ' is <b>obstructed</b>. It cannot be added to the open-list.'));
        this.step.edit_list_item('n', 1, [
          'Front',
          this.gui.dir_to_string[start_dir],
          front_pos.toString(),
          '-',
          '-',
          '\u2717 Obs',
        ]);
        this.add_step();
      }
      this.step.set_cell_focus(front_pos, false);
      this.step.color_list_item('n', 1, false);
      return true;
    } else if (front_vertex.obstacle === false) { 
      // ==== no jump-point and front is accessible ====
      this.step.set_list_description('n', 'Move into <b>Front</b> '.concat(front_pos.toString(), ' because it is <b>empty</b>.'));
      this.step.set_cell_focus(front_pos, false);
      return this.skip_cardinally(start_dir, start_vertex, xp_pos, front_vertex);
    } else { 
      // ==== no jump-point but front is not accessible ====
      this.step.set_list_description('n', '<b>Front</b> vertex '.concat(front_pos.toString(), ' is <b>obstructed</b>. End the forward expansion.'));
      this.step.edit_list_item('n', 1, [
        'Front',
        this.gui.dir_to_string[start_dir],
        front_pos.toString(),
        '-',
        '-',
        '\u2717 Obs'
      ]);
      this.step.color_list_item('n', 1, true);
      this.add_step();
      this.step.set_cell_focus(front_pos, false);
      this.step.color_list_item('n', 1, false);
      return false;
    }
  }
  skip_ordinally(start_dir, start_vertex, prev_xp_pos, xp_vertex) {
    console.log('SO: ', start_dir, start_vertex.position.toString(), prev_xp_pos, xp_vertex.position.toString());
    this.num_expansions++;
    // INITS
    var start_pos = start_vertex.position;
    var xp_pos = xp_vertex.position;
    var front_pos = this.get_front_pos(xp_pos, start_dir);
    var front_vertex = this.graph.vertices(front_pos);
    var empty_poses = this.get_empty_poses(xp_pos, start_dir);
    var obs_poses = this.get_obstacle_poses(xp_pos, start_dir);
    var blocking_poses = this.get_blocking_poses(xp_pos, start_dir);
    var empty_dirs = this.dir_lut[start_dir].empty.dirs;
    var obs_dirs = this.dir_lut[start_dir].obstacle.dirs;
    var blocking_dirs = this.dir_lut[start_dir].blocking.dirs;
    var empty_pos, obs_pos, blocking_pos, front_blocked=true, front_outside=false;
    var old_g, empty_vertex, idx, obs_vertex, blocking_vertex, tentative_g;
    var xp_cost_found = false;
    var jp_added = false;
    
    // ==== GUI - Set Cell Front, Update Front Info ====
    this.set_node_first(xp_pos, start_dir);
    this.step.set_cell_class(xp_pos, 'cell_visited');
    this.set_cell_front();
    if (prev_xp_pos !== undefined )
      this.step.edit_list_item('d', 0, ['Current', this.gui.dir_to_string[start_dir], xp_pos.toString(), '?', '?','?']);
    else // first ordinal always have a cost
      this.step.edit_list_item('d', 0, ['Current', this.gui.dir_to_string[start_dir], xp_pos.toString(), '*'.concat(xp_vertex.parent.position.toString()), '*'.concat(xp_vertex.f.toString(2)), 'First']);
    this.step.edit_list_item('d', 1, ['Card-A', this.gui.dir_to_string[blocking_dirs[0]], blocking_poses[0].toString(), '?', '?', '?']);
    this.step.edit_list_item('d', 2, ['Obs-A', this.gui.dir_to_string[obs_dirs[0]], obs_poses[0].toString(), '?', '?', '?']);
    this.step.edit_list_item('d', 3, ['Empty-A', this.gui.dir_to_string[empty_dirs[0]], empty_poses[0].toString(), '?', '?', '?']);
    this.step.edit_list_item('d', 4, ['Card-B', this.gui.dir_to_string[blocking_dirs[1]], blocking_poses[1].toString(), '?', '?', '?']);
    this.step.edit_list_item('d', 5, ['Obs-B', this.gui.dir_to_string[obs_dirs[1]], obs_poses[1].toString(), '?', '?', '?']);
    this.step.edit_list_item('d', 6, ['Empty-B', this.gui.dir_to_string[empty_dirs[1]], empty_poses[1].toString(), '?', '?', '?']);
    this.step.edit_list_item('d', 7, ['Front', this.gui.dir_to_string[start_dir], front_pos.toString(), '?', '?','?']);
    // ==== GUI - Draw paths ====
    if (prev_xp_pos !== undefined) {
      this.step.remove_paths(prev_xp_pos, start_pos);
      this.step.draw_path(xp_pos, start_pos, UIPath.TRACE2);
    }
    // for previous move highlight
    this.step.color_list_item('d', 0, false);
    
    // ============================== Ordinal - Current Vertex is Goal ================================
    if (xp_pos.equals(this.goal_position) === true) {
      if (xp_vertex.parent === undefined) {
        xp_vertex.parent = start_vertex;
        this.update_g(xp_vertex, this.find_g(start_vertex, xp_vertex));
      }
      this.path_found = true;
      this.add_step(true);
      this.step.draw_path(xp_pos, start_pos, UIPath.TRACE);
      // GUI - reset fronts
      this.set_cell_front();
      this.set_node_first();
      this.set_node_start(xp_pos, start_dir);
      this.step.set_list_description('d', '<em>Goal</em> Found!');
      this.step.edit_list_item('d', 0, [
        'Current',
        this.gui.dir_to_string[start_dir],
        xp_pos.toString(),
        start_pos.toString(), 
        xp_vertex.f.toString(2),
        '<em>Goal</em>'
      ]);
      // update the current expansion
      this.step.edit_list_item('c', 0, [
        xp_vertex.parent.position.toString(),
        xp_vertex.parent.update_cnt,
        this.gui.dir_to_string[start_dir],
        xp_pos.toString(),
        xp_vertex.f.toString(2),
        xp_vertex.g.toString(2),
        xp_vertex.h.toString(2)
      ]);
      this.step.color_list_item('d', 0, true);
      this.add_step()
      this.step.color_list_item('d', 0, false);
      // return as new jump-point
      return true;
    }
    
    // ==== GUI - Draw Paths ====
    this.add_step();
    
    for (var i=0; i<2; i++) {
      // Ordinal - get the relevant vertex and pos
      empty_pos = empty_poses[i];
      empty_vertex = this.graph.vertices(empty_pos);
      obs_pos = obs_poses[i];
      obs_vertex = this.graph.vertices(obs_pos);
      blocking_pos = blocking_poses[i];
      blocking_vertex = this.graph.vertices(blocking_pos);
      // ============================== Ordinal - (#) Check Blocking Vertices ================================
      if (blocking_vertex === null) {
        // Ordinal - blocking vertex outside map ==> front, empty vertices outside map
        // ==== GUI ====
        this.step.set_list_description('d', ''.concat(
          i === 0 ? '<b>Card-A</b> ': '<b>Card-B</b> ',
          blocking_pos.toString(),
          ' is <b>outside the map</b>, so the Front and Empty vertices are outside the map, and cardinal expansion on this side is not possible.',
          i === 0 ? ' Search next side for a jump-point.' : ''
        ));
        this.step.edit_list_item('d', i*3+1, [
          i===0 ? 'Card-A' : 'Card-B',
          this.gui.dir_to_string[blocking_dirs[i]],
          blocking_pos.toString(),
          '-',
          '-',
          '\u2717 Outside'
        ]);
        this.step.color_list_item('d', i*3+1, true);
        this.step.edit_list_item('d', i*3+3, [
          i===0 ? 'Empty-A' : 'Empty-B',
          this.gui.dir_to_string[empty_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Outside'
        ]);
        this.step.color_list_item('d', i*3+3, true);
        this.step.edit_list_item('d', 7, [
          'Front',
          this.gui.dir_to_string[start_dir],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Outside'
        ]);
        this.step.color_list_item('d', 7, true);
        this.add_step();
        this.step.color_list_item('d', i*3+1, false);
        this.step.color_list_item('d', i*3+3, false);
        this.step.color_list_item('d', 7, false);
        front_outside = true;
        continue;
      } else if (this.options.blocking === true && blocking_vertex.obstacle === true) {
        // Ordinal - Blocking Vertex Obstacle ==> Jump point not accessible
        // ==== GUI ====
        this.step.set_list_description('d', ''.concat(
          i === 0 ? '<b>Card-A</b> ': '<b>Card-B</b> ',
          blocking_pos.toString(),
          ' is an <b>obstacle</b>, so it obstructs the placement of a possible jump-point in ',
          i === 0 ? '<b>Empty-A</b> ': '<b>Empty-B</b> ',
          empty_pos.toString(),
          ', and it prevents the cardinal-expansion on this side',
          i === 0 ? '. Search next side for a jump-point.' : '.'
        ));
        
        this.step.edit_list_item('d', i*3+1, [
          i===0 ? 'Card-A' : 'Card-B',
          this.gui.dir_to_string[blocking_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Obs'
        ]);
        this.step.color_list_item('d', i*3+1, true);
        this.step.edit_list_item('d', i*3+3, [
          i===0 ? 'Empty-A' : 'Empty-B',
          this.gui.dir_to_string[empty_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Blocked'
        ]);
        this.step.color_list_item('d', i*3+3, true);
        this.step.set_cell_focus(blocking_pos, true);
        
        // Also possible Front is not accessible
        front_blocked = front_blocked && true;
        
        // ==== GUI ====
        this.add_step();
        this.step.color_list_item('d', i*3+1, false);
        this.step.color_list_item('d', i*3+3, false);
        this.step.set_cell_focus(blocking_pos, false);
        continue;
      }
      // set the front to be unblocked, because we need both blocking vertices to be obstacle for the front to be blocked.
      front_blocked = false;
      
      // ==== GUI ====
      this.step.set_cell_focus(blocking_pos, true);
      this.step.set_list_description('d', ''.concat(
        i === 0 ? '<b>Card-A</b> ': '<b>Card-B</b> ',
        blocking_pos.toString(),
        ' is in the map',
        this.options.blocking === true ? ' and not an obstacle' : '',
        ', so it does not obstruct the placement of a possible jump-point in ',
        i === 0 ? '<b>Empty-A</b> ': '<b>Empty-B</b> ',
        empty_pos.toString(),
        ', and cardinal-expansion is possible on this side.'
      ));
      this.step.edit_list_item('d', i*3+1, [
        i === 0 ? 'Card-A': 'Card-B',
        this.gui.dir_to_string[blocking_dirs[i]],
        blocking_pos.toString(),
        '-',
        '-',
        '\u2714 Empty',
      ]);
      this.step.color_list_item('d', i*3+1, true);
      this.add_step();
      this.step.color_list_item('d', i*3+1, false);
      this.step.set_cell_focus(blocking_pos, false);
      
      // ============================== Ordinal - (#) Obs Vertex Outside Map? ================================
      if (obs_vertex === null) {
        // obstacle vertex outside map ==> empty_vertex outside map, no jp can be added
        // ==== GUI ====
        this.step.set_list_description('d', ''.concat(
          i === 0 ? '<b>Obs-A/b>': '<b>Obs-B</b>',
          ' is <b>outside the map</b>. So a jump-point in ',
          i === 0 ? '<b>Empty-A</b>': '<b>Empty-B</b>',
          ' is also outside. So, a jump-point cannot exist on this side'));
        this.step.edit_list_item('d', i*3+2, [
          i === 0 ? 'Obs-A': 'Obs-B',
          this.gui.dir_to_string[obs_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Outside'
        ]);
        this.step.color_list_item('d', i*3+2, true);
        this.step.edit_list_item('d', i*3+3, [
          i === 0 ? 'Empty-A': 'Empty-B',
          this.gui.dir_to_string[empty_dirs[i]],
          empty_pos.toString(),
          '-',
          '-',
          '\u2717 Outside'
        ]);
        this.step.color_list_item('d', i*3+3, true);
        this.add_step();
        this.step.color_list_item('d', i*3+2, false);
        this.step.color_list_item('d', i*3+3, false);
        continue;
      }
      
      // ============================== Ordinal - (#) Search for FN ? ================================
      // ==== GUI ====
      // Focus on the FN area
      this.step.set_cell_focus(obs_pos, true);
      // ==== Obstacle vertex is obstacle ====
      if (obs_vertex.obstacle === true) {
        // ==== GUI - Update Obstacle Info ====
        this.step.edit_list_item('d', i*3+2, [
          i === 0 ? 'Obs-A': 'Obs-B',
          this.gui.dir_to_string[obs_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2714 Obs'
        ]);
        this.step.color_list_item('d', i*3+2, true);
        this.add_step();
        this.step.set_cell_focus(obs_pos, false);
        this.step.color_list_item('d', i*3+2, false);
        this.step.set_cell_focus(empty_pos, true);
        this.step.color_list_item('d', i*3+3, true);
        // ==== Empty vertex is empty ====
        if (empty_vertex.obstacle === false) {
          // ==== GUI - Set Empty Vertex as Empty ====
          this.step.set_list_description('d', ''.concat(
            i === 0 ? '<b>Empty-A</b> ': '<b>Empty-B</b> ',
            empty_pos.toString(),
            ' is <b>empty</b>. Forced-neighbor / successor / jump-point can be found in there if the intermediate jump-point ',
            xp_pos.toString(),
            ' and ',
            i === 0 ? '<b>Empty-A</b>': '<b>Empty-B</b>',
            ' are cheaper than previous expansions, if applicable.'
          ));
          this.step.edit_list_item('d', i*3+3, [
            i === 0 ? 'Empty-A': 'Empty-B',
            this.gui.dir_to_string[empty_dirs[i]],
            empty_pos.toString(),
            '-',
            '-',
            '\u2714 Empty',
          ]);
          this.add_step();
          // Don't recalculate cost of xp_vertex or redraw unnecessarily
          if (xp_cost_found === false) {
            this.step.set_cell_focus(xp_pos, true);
            this.step.set_cell_focus(empty_pos, false);
            this.step.color_list_item('d', i*3+3, false);
            // ============================ Ordinal - (#) Was Expanded Vertex Cheaper ? =======================
            tentative_g = this.vertex_is_cheaper(start_vertex, xp_vertex);
            if (tentative_g === false) {
              // Expanded vertex is not cheaper to get to. The expanded vertex is a jp that was already found
              // Terminate search here, bcos paths elsewhere from xp_vertex is cheaper
              // ==== GUI ====
              this.step.set_list_description('d', 
                'Getting to the intermediate jump-point '.concat(
                xp_pos.toString(),
                ' from ',
                start_pos.toString(),
                ' is <b>more costly than / equally costly as</b> from its previous parent ',
                xp_vertex.parent.position.toString(),
                '. End the forward search. *Old values.'));
              this.step.edit_list_item('d', 0, [
                'Current',
                this.gui.dir_to_string[empty_dirs[i]],
                xp_pos.toString(),
                '*'.concat(empty_vertex.parent.position.toString()),
                '*'.concat(empty_vertex.f.toString(2)),
                '\u2717 Not cheap'
              ]);
              this.step.color_list_item('d', 0, true);
              this.add_step();
              this.step.color_list_item('d', 0, false);
              this.step.set_cell_focus(xp_pos, false);
              return false;
            }
            
            // Update parent of xp_vertex
            xp_vertex.parent = start_vertex;
            // Update intermediate jumppoint xp_vertex with new cost
            this.update_g(xp_vertex, tentative_g);
            
            // ==== GUI =====
            // Remove any paths with xp_vertex as child
            this.step.remove_paths(xp_pos);
            // add back the path pointing to the parent, this time as an upgraded TRACE
            this.step.draw_path(xp_pos, start_pos, UIPath.TRACE);
            this.step.set_list_description('d', 'Intermediate jump-point '.concat(
              xp_pos.toString(),
              ' is <b>newly expanded</b> / is <b>cheaper</b> than previous expansions. Now check if ',
              i === 0 ? '<b>Empty-A</b> ': '<b>Empty-B</b> ',
              empty_pos.toString(),
              ' is cheaper to access from the jump-point...'
            ));
            this.step.edit_list_item('d', 0, [
              'Current',
              this.gui.dir_to_string[start_dir],
              xp_pos.toString(),
              start_pos.toString(),
              xp_vertex.f.toString(2),
              '\u2714 Cheaper'
            ]);
            this.step.color_list_item('d', 0, true);
            this.add_step();
            this.step.set_cell_focus(xp_pos, false);
            this.step.color_list_item('d', 0, false);
            this.step.set_cell_focus(empty_pos, true);
            this.step.color_list_item('d', i*3+3, true);
            xp_cost_found = true;
          }
          
          // ================================ Ordinal - (#) Was Forced Neighbor Cheaper ? ===========================
          tentative_g = this.vertex_is_cheaper(xp_vertex, empty_vertex);
          if (tentative_g === false) {
            // Forced neighbor more expensive to get from here, skip
            this.step.set_list_description('d', ''.concat(
              i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
              empty_pos.toString(),
              ' is <b>not cheaper</b> to get to than its previous parent ',
              empty_vertex.parent.position.toString(),
              i === 0 ? '. Check the next side.' : '.',
              ' It will not be added to the open-list. *Old values.'
            ));
            this.step.edit_list_item('d', i*3+3, [
              i === 0 ? 'Empty-A' : 'Empty-B',
              this.gui.dir_to_string[start_dir],
              '*'.concat(empty_vertex.parent.position.toString()),
              '*'.concat(empty_vertex.f.toString(2)),
              '\u2717 Not cheap'
            ]);
            jp_added = jp_added || false;
            this.add_step();
            this.step.color_list_item('d', i*3+3, false);
            this.step.set_cell_focus(empty_pos, false);
            continue;
          }
          
          // Forced neighbor is cheaper to get from here, add to open list
          this.update_g(empty_vertex, tentative_g);
          empty_vertex.parent = xp_vertex;
          idx = this.list.add(empty_dirs[i], xp_vertex, empty_vertex);
          
          // ==== GUI =====
          this.gui_list_add(idx, empty_dirs[i], xp_vertex, empty_vertex, 'F.Nb.');
          this.step.set_list_description('d', ''.concat(
            i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
            empty_pos.toString(),
            ' is <b>newly expanded</b> / <b>cheaper</b> than previous expansions. Add it to the open-list!'
          ));
          this.step.edit_list_item('d', i*3+3, [
            i === 0 ? 'Empty-A' : 'Empty-B',
            this.gui.dir_to_string[empty_dirs[i]],
            empty_pos.toString(),
            xp_pos.toString(),
            empty_vertex.f.toString(2),
            '\u2714 <b>F.Nb.</b>'
          ]);
          // remove all previous paths from empty_pos
          this.step.remove_paths(empty_pos);
          this.step.draw_path(empty_pos, xp_pos, UIPath.TRACE);
          this.add_step();
          this.gui_list_post_add(idx);
          this.step.set_cell_focus(empty_pos, false);
          this.step.color_list_item('d', i*3+3, false);
          this.step.color_list_item('d', 0, false);
          jp_added = true;
        } else { // Empty vertex is obstacle
          // ==== GUI - Empty Vertex is Obs ====
          this.step.set_list_description('d', ''.concat(
            i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
            empty_pos.toString(),
            ' is an <b>obstacle</b>. So, a jump-point cannot exist there.'
          ));
          this.step.edit_list_item('d', i*3+3, [
            i === 0 ? 'Empty-A': 'Empty-B',
            this.gui.dir_to_string[empty_dirs[i]],
            empty_pos.toString(),
            '-',
            '-',
            '\u2717 Obs',
          ]);
          this.step.color_list_item('d', i*3+3, true);
          this.add_step();
          this.step.color_list_item('d', i*3+3, false);
          this.step.set_cell_focus(empty_pos, false);
        }
      } else { // Obs vertex is empty
        // ==== GUI - Obs Vertex is Empty ====
        this.step.set_list_description('d', ''.concat(
          i === 0 ? '<b>Obs-A</b> ' : '<b>Obs-B</b> ',
          obs_pos.toString(),
          ' is <b>empty</b>. So, no jump-point can exist in ',
          i === 0 ? '<b>Empty-A</b> ' : '<b>Empty-B</b> ',
          empty_pos.toString()
        ));
        this.step.edit_list_item('d', i*3+2, [
          i === 0 ? 'Obs-A': 'Obs-B',
          this.gui.dir_to_string[obs_dirs[i]],
          obs_pos.toString(),
          '-',
          '-',
          '\u2717 Empty',
        ]);
        this.step.color_list_item('d', i*3+2, true);
        this.add_step();
        this.step.set_cell_focus(obs_pos, false);
      }
      
      // ==== GUI ====
      // unhighlight
      this.step.color_list_item('d', i*3+2, false);
      
      // ===================================== Ordinal - (#) Expand Cardinally =================================
      if (blocking_vertex.obstacle === false) {
        // Don't recalculate cost of xp_vertex or redraw unnecessarily
        if (xp_cost_found === false) {
          this.step.set_cell_focus(xp_pos, true);
          // ============================ Ordinal - (#) Was Expanded Vertex Cheaper ? =======================
          tentative_g = this.vertex_is_cheaper(start_vertex, xp_vertex);
          if (tentative_g === false) {
            // Expanded vertex is not cheaper to get to. The expanded vertex is a jp that was already found
            // Terminate search here, bcos paths elsewhere from xp_vertex is cheaper
            // ==== GUI ====
            this.step.set_list_description('d', 
              'Getting to the intermediate jump-point '.concat(
              xp_pos.toString(),
              ' from ',
              start_pos.toString(),
              ' is <b>more costly than / equally costly as</b> from its previous parent ',
              xp_vertex.parent.position.toString(),
              '. End the forward search. *Old values.'));
            this.step.edit_list_item('d', 0, [
              'Current',
              this.gui.dir_to_string[empty_dirs[i]],
              xp_pos.toString(),
              '*'.concat(xp_vertex.parent.position.toString()),
              '*'.concat(xp_vertex.f.toString(2)),
              '\u2717 Not cheap'
            ]);
            this.step.color_list_item('d', 0, true);
            this.add_step();
            this.step.color_list_item('d', 0, false);
            this.step.color_list_item('d', i*3+2, false);
            this.step.color_list_item('d', i*3+3, false);
            this.step.set_cell_focus(xp_pos, false);
            return false;
          }
          
          // Update parent of xp_vertex
          xp_vertex.parent = start_vertex;
          // Update intermediate jumppoint xp_vertex with new cost
          this.update_g(xp_vertex, tentative_g);
          
          // ==== GUI =====
          // Remove any paths with xp_vertex as child
          this.step.remove_paths(xp_pos);
          // add back the path pointing to the parent, this time as an upgraded TRACE
          this.step.draw_path(xp_pos, start_pos, UIPath.TRACE);
          this.step.set_list_description('d', 'The intermediate jump-point '.concat(
            xp_pos.toString(),
            ' is <b>newly expanded</b> / <b>cheaper</b> than previous expansions. We can now explore cardinally!'
          ));
          this.step.edit_list_item('d', 0, [
            'Current',
            this.gui.dir_to_string[start_dir],
            xp_pos.toString(),
            start_pos.toString(),
            xp_vertex.f.toString(2),
            '\u2714 Cheaper'
          ]);
          this.step.color_list_item('d', 0, true);
          this.add_step();
          this.step.set_cell_focus(xp_pos, false);
          this.step.color_list_item('d', 0, false);
          xp_cost_found = true;
        }
        
        this.step.set_list_description('d', 'Checking Cardinals in <b>'.concat(this.gui.dir_to_string[blocking_dirs[i]], '</b> direction...'))
        jp_added = this.jump_ord_to_card(blocking_dirs[i], xp_vertex, blocking_vertex) || jp_added;
        if (this.path_found === true)
          return true;
        // remove front
        this.set_cell_front();
      }
      
    } // end of neighbor serach
    
    // ===================================== Ordinal - Move Forward ? =================================
    if (front_outside === true) {
      if (jp_added === true) {
        this.step.set_list_description('d', '<b>Front</b> vertex is <b>outside the map</b>. It will not be added to the open-list.');
        return true;
      } else {
        this.step.set_list_description('d', '<b>Front</b> vertex is <b>outside the map</b>. End the forward expansion.');
        this.step.edit_list_item('d', 7, [
          'Front',
          this.gui.dir_to_string[start_dir],
          front_pos.toString(),
          '-',
          '-',
          '\u2717 Outside'
        ]);
        this.step.color_list_item('d', 7, true);
        this.add_step();
        this.step.color_list_item('d', 7, false);
        return false;
      }
    } 
    this.step.set_cell_focus(front_pos, true);
    if (front_blocked === true) {
      if (jp_added === true) {
        this.step.set_list_description('d', 
          '<b>Front</b> '.concat(
          front_pos.toString(),
          ' is <b>blocked</b>. It will not be added to the open-list.'));
        this.step.edit_list_item('d', 7, [
          'Front',
          this.gui.dir_to_string[start_dir],
          front_pos.toString(),
          '-',
          '-',
          '\u2717 Blocked',
        ]);
        this.step.color_list_item('d', 7, true);
        this.add_step();
        this.step.color_list_item('d', 7, false);
        this.step.set_cell_focus(front_pos, false);
        return true;
      } else {
        this.step.set_list_description('d', 
          '<b>Front</b> '.concat(
          front_pos.toString(),
          ' is <b>blocked</b>. End the forward search.'));
        this.step.edit_list_item('d', 7, [
          'Front',
          this.gui.dir_to_string[start_dir],
          front_pos.toString(),
          '-',
          '-',
          '\u2717 Blocked',
        ]);
        this.step.color_list_item('d', 7, true);
        this.add_step();
        this.step.color_list_item('d', 7, false);
        this.step.set_cell_focus(front_pos, false);
        return false;
      }
    } else if (front_vertex.obstacle === false) { 
      if (jp_added === true) {
        // front-vertex is accessible, check if front vertex is cheaper
        tentative_g = this.vertex_is_cheaper(start_vertex, front_vertex);
        if (tentative_g === false) { 
          // ==== Front Vertex is Not Cheaper ====
          this.step.set_list_description('d', '<b>Front</b> '.concat(
            front_pos.toString(), 
            ' is <b>empty but not cheaper</b> to access from ',
            start_pos.toString(),
            ' than its previous parent ',
            front_vertex.parent.position.toString(),
            '. It will not be added to the open-list. *Old values.'));
          this.step.edit_list_item('d', 7, [
            'Front',
            this.gui.dir_to_string[start_dir],
            front_pos.toString(),
            '*'.concat(front_vertex.parent.position.toString()),
            '*'.concat(front_vertex.f.toString(2)),
            '\u2717 Not cheap',
          ]);
          this.step.color_list_item('d', 7, true);
          this.add_step();
          this.step.color_list_item('d', 7, false);
        } else {
          // ==== Front Vertex is Cheaper, Add to open list ====
          this.update_g(front_vertex, tentative_g);
          // ==== GUI ====
          this.step.set_list_description('d', '<b>Front</b> '.concat(
            front_pos.toString(), 
            ' is <b>empty</b>', 
            front_vertex.parent !== undefined ? ' and <b>cheaper</b> to access from '.concat(
              start_pos.toString(),
              ' than its previous parent ',
              front_vertex.parent.position.toString()) : '',
            '. It will be added to the open-list.',
          ));
          this.step.edit_list_item('d', 7, [
            'Front',
            this.gui.dir_to_string[start_dir],
            front_pos.toString(),
            start_pos.toString(),
            front_vertex.f.toString(2),
            '\u2714 Cheaper',
          ]);
          this.step.color_list_item('d', 7, true);
          
          // ==== Add Front-Vertex to Open-List
          front_vertex.parent = start_vertex;
          idx = this.list.add(start_dir, start_vertex, front_vertex);
          this.gui_list_add(idx, start_dir, start_vertex, front_vertex, 'Front');
          this.add_step();
          this.gui_list_post_add(idx);
          this.step.color_list_item('d', 7, false);
        }
        this.step.set_cell_focus(front_pos, false);
        return true;
      } else { /// jp not added, front is empty
        this.step.edit_list_item('d', 7, [
          'Front',
          this.gui.dir_to_string[start_dir],
          front_pos.toString(),
          '-',
          '-',
          '\u2714 Empty'
        ]);
        this.step.color_list_item('d', 7, true);
        this.add_step();
        this.step.color_list_item('d', 7, false);
        // ==== no jump-point and front is accessible ====
        this.step.set_list_description('d', 'Move into <b>Front</b> '.concat(front_pos.toString(), ' because it is <b>empty</b>.'));
        this.step.set_cell_focus(front_pos, false);
        return this.skip_ordinally(start_dir, start_vertex, xp_pos, front_vertex);
      }
    } else { // front is obstacle
      if (jp_added === true) {
        this.step.set_list_description('d', '<b>Front</b> '.concat(
          front_pos.toString(), 
          ' is <b>obstructed</b>. It cannot be added to the open-list.'));
        this.step.edit_list_item('d', 7, [
          'Front',
          this.gui.dir_to_string[start_dir],
          front_pos.toString(),
          '-',
          '-',
          '\u2717 Obs',
        ]);
        this.step.color_list_item('d', 7, true);
        this.add_step();
        this.step.color_list_item('d', 7, false);
        this.step.set_cell_focus(front_pos, false);
        return true;
      } else {
        // ==== no jump-point but front is not accessible ====
        this.step.set_list_description('d', '<b>Front</b> '.concat(front_pos.toString(), ' is <b>obstructed</b>. End the forward expansion.'));
        this.step.edit_list_item('d', 7, [
          'Front',
          this.gui.dir_to_string[start_dir],
          front_pos.toString(),
          '-',
          '-',
          '\u2717 Obs'
        ]);
        this.step.color_list_item('d', 7, true);
        this.add_step();
        this.step.color_list_item('d', 7, false);
        this.step.set_cell_focus(front_pos, false);
        return false;
      }
    }
  }
  jump_ordinally(start_dir, start_vertex, first_vertex) {
    // clear the cardinal
    for (var i=0; i<6; i++)
      this.step.edit_list_item('n', i, ['?', '?', '?', '?', '?', '?']);
    this.step.set_list_description('n', '');
    this.step.set_list_description('d', 'Expand <b>ordinally</b> from '.concat(
      start_vertex.position.toString(), 
      ' in the <b>',
      this.gui.dir_to_string[start_dir],
      '</b> direction. *Old values.'
    ));
    return this.skip_ordinally(start_dir, start_vertex, undefined, first_vertex);
  }
  jump_ord_to_card(start_dir, start_vertex, first_vertex) {
    this.step.set_list_description('n', 'Expand <b>cardinally</b> in the <b>'.concat(
      this.gui.dir_to_string[start_dir],
      '</b> direction <b>from the ordinal</b> node ',
      start_vertex.position.toString(), 
      '.'
    ));
    var result = this.skip_cardinally(start_dir, start_vertex, undefined, first_vertex, true);
    this.step.set_cell_class(start_vertex.position, 'cell_visited');
    if (this.path_found === true) 
      return true;
    // clear the cardinal
    for (var i=0; i<6; i++)
      this.step.edit_list_item('n', i, ['?', '?', '?', '?', '?', '?']);
    this.step.set_list_description('n', '')
    return result;
  }
  jump_cardinally(start_dir, start_vertex, first_vertex) {
    // ==== GUI ====
    this.set_node_first();
    // clear the ordinal
    for (var i=0; i<8; i++)
      this.step.edit_list_item('d', i, ['?', '?', '?', '?', '?', '?']);
    this.step.set_list_description('d', '');
    this.step.set_list_description('n', 'Expand <b>cardinally</b> from '.concat(
      start_vertex.position.toString(), 
      ' in the <b>',
      this.gui.dir_to_string[start_dir],
      '</b> direction. *Old values.'
    ));
    return this.skip_cardinally(start_dir, start_vertex, undefined, first_vertex);
  }
  run() {
    // -------------------------------------------- Init --------------------------------------------
    this.num_expansions = 0;
    // ==== Inits - GUI ====
    this.gui = {
      ns_pos : undefined,
      nf_pos : undefined,
      nf_class: undefined,
      c_pos : undefined,
      c_class : undefined,
      dir_to_string : Dir.list_strings()
    }
    this.new_info_text_pane('i', 'Status', '<b>Initialising...</b>');
    this.new_info_list_pane('c', 'Current Open-List Node', '', [['Parent', 'Cnt.', 'Dir.', 'Pos.', 'F-$', 'G-$', 'H-$']]);
    this.new_info_list_pane('d', 'Ordinal Expansion', '', [['Type', 'Dir.', 'Pos.', 'Parent', 'F-$', 'State']]);
    this.new_info_list_pane('n', 'Cardinal Expansion', '', [['Type', 'Dir.', 'Pos.', 'Parent', 'F-$', 'State']]);
    this.new_info_list_pane('u', 'Open-List', '', [['Type', 'Parent', 'Cnt.', 'Dir.', 'Pos.', 'F-$', 'G-$', 'H-$']]);
    this.add_step(false, true);
    this.step.insert_list_item('c', 0, ['-', '-', '-', '-', '-', '-', '-']);
    for (var i=0; i<6; i++)
      this.step.insert_list_item('n', i, ['-', '-', '-', '-', '-', '-']);
    for (var i=0; i<8; i++)
      this.step.insert_list_item('d', i, ['-', '-', '-', '-', '-', '-']);
    
    // init options for the metric
    switch (this.options.metric) {
      case Dist.DIAGONAL:
        JPSHC.Cost = Cost_DIA;
        break;
      case Dist.MANHATTAN:
        JPSHC.Cost = Cost_MAN;
        break;
      case Dist.EUCLIDEAN:
        JPSHC.Cost = Cost_EUC;
        break;
    }
    // init the gh_weights
    [this.wg, this.wh] = this.options.gh_weights;
    // init the anticlockwise
    this.rotate_sign = this.options.anticlockwise ? 1 : -1;
    // Graph
    this.graph = new JPSHC.Graph(this);
    // Open List
    this.list = new JPSHC.OpenList(this);
    this.path_found = false;
    // Nb info LUT
    this.init_dir_lut(); // this.dir_lut
    // Init Start vertex
    this.start();
    
    var start_vertex, first_vertex, start_dir, node, xp_vertex, nb_vertex, num_ordinals, num_cardinals, cost;
    while (this.list.is_populated() && this.path_found === false) {
      // retrieve cheapest node
      node = this.list.get_cheapest_node();
      this.gui_list_retrieve(node);
      start_vertex = node.start_vertex;
      first_vertex = node.first_vertex;
      start_dir = node.start_dir;
      // ==== GUI - Update the Current Node ==== 
      this.step.edit_list_item('c', 0, [
        start_vertex.position.toString(), 
        start_vertex.update_cnt,
        this.gui.dir_to_string[start_dir],
        first_vertex.position.toString(),
        first_vertex.f.toString(2),
        first_vertex.g.toString(2),
        first_vertex.h.toString(2)
      ]);
      // ----------------------------------- Are Parents Different? ---------------------------------------
      if (node.has_identical_parents() === false) {
        // parents are not identical (cheaper path was found), skip
        if (start_vertex.position.equals(first_vertex.position) === false) {
          this.step.set_list_description('c', 'The entry in the open-list has a different parent '.concat(
            start_vertex.position.toString(),
            "as the vertex's parent ",
            first_vertex.parent.position.toString(),
            '. The vertex has a newer, cheaper parent, so <em>Skip</em>'));
        } else if (start_vertex.update_cnt !== node.update_cnt) {
          this.step.set_list_description('c', "The entry in the open-list has the same parent as the vertex's parent ".concat(
            start_vertex.position.toString(),
            ' but the entry has a different G-cost update count (',
            node.update_cnt,
            ") as the parent's G-cost update count (",
            start_vertex.update_cnt,
            '). The vertex has a parent with a cheaper grandparent, so the vertex is no longer valid. <em>Skip</em>'
          ));
        }
        this.add_step(true);
        continue;
      }
      // ==== GUI - Parents are identical ====
      this.step.set_list_description('c', 'Retrieved '.concat(first_vertex.position.toString(), ' from open-list'))
      this.set_cell_front();
      this.set_node_start(node.start_vertex.position);
      if (Dir.is_ordinal(start_dir) === true) {
        // ==== Ordinal ====
        this.jump_ordinally(start_dir, start_vertex, first_vertex);
      } else {
        // ==== Cardinal ====
        this.jump_cardinally(start_dir, start_vertex, first_vertex);
      }
      this.step.set_cell_class(start_vertex.position, 'cell_visited');
      this.step.major = true;
    } // end of while loop
    if (this.path_found === true) {
      nb_vertex = this.graph.vertices(this.goal_position);
      // modify the current node list
      this.step.set_list_description('c', 'The <em>Goal</em> Vertex');      
      this.set_node_first();
      this.set_cell_front();
      this.set_node_start(nb_vertex.position);
      num_ordinals = 0; num_cardinals = 0;
      while (true) {
        xp_vertex = nb_vertex.parent;
        // do whatever to update
        if (xp_vertex === undefined)
          break;
        this.step.draw_path(nb_vertex.position, xp_vertex.position, UIPath.PATH);
        console.log(nb_vertex.position.toString(), xp_vertex.position.toString());
        cost = Cost_DIA.from_vecs(nb_vertex, xp_vertex);
        num_ordinals += cost.axes[0];
        num_cardinals += cost.axes[1];
        nb_vertex = xp_vertex;
      }
      // remove the items in the expansion lists
      for (var i=5; i>=0; i--)
        this.step.remove_list_item('n', i);
      for (var i=7; i>=0; i--)
        this.step.remove_list_item('d', i);
      this.step.set_list_description('n', '');
      this.step.set_list_description('d', '');
      this.step.set_list_description('u', 'Items left in open-list');
      this.step.set_info_text('i', '<h1>Complete!</h1>'.concat(
        '<table class="summary"><tbody><tr><th>Value</th><th>Variable</th><th>Description</th></tr><tr><td>', 
        (new Cost_DIA(num_ordinals, num_cardinals)).toString(2), 
        '</td><th>G-cost</th><td class="description"><i>Diagonal</i> cost of the path</td></tr><tr><td>',
        num_ordinals,
        '</td><th>Ordinals</th><td class="description">Number of ordinal steps in the path</td></tr><tr><td>',
        num_cardinals,
        '</td><th>Cardinals</th><td class="description">Number of cardinal steps in the path</td></tr><tr><td>',
        num_cardinals + num_ordinals,
        '</td><th>Steps</th><td class="description">Total number of steps in the path</td></tr><tr><td>',
        this.num_expansions,
        '</td><th>Expansions</th><td class="description">Number of times a vertex and its neighbors are checked</td></tr></tbody></table>'
        )
      );	
    } else {
      // no path found
      this.step = this.add_step(true);
      this.step.set_info_text('i', '<h1>No Path Found!</h1>'.concat(
        '<table class="summary"><tbody><tr><th>Value</th><th>Variable</th><th>Description</th></tr><tr><td>',
        this.num_expansions,
        '</td><th>Expansions</th><td class="description">Number of times a vertex and its neighbors are checked</td></tr></tbody></table>'
        )
      );	
    }
  }
}
/*// =============================================== Coord Class ================================================
class Pos {
  constructor(i, j) {    
    this.i = i;
    this.j = j;
  }
  static round(pos) {
    return new Pos(Math.round(pos.i), Math.round(pos.j))
  }
  static add(pos0, pos1) {
    return new Pos(pos0.i + pos1.i, pos0.j + pos1.j);
  }
  static subtract(pos0, pos1) {
    return new Pos(pos0.i - pos1.i, pos0.j - pos1.j);
  }
  static equals(pos0, pos1) {
    return pos0.i === pos1.i && pos0.j === pos1.j;
  }
  toString(dp=0) {
    return '('.concat(this.i.toFixed(dp), ', ', this.j.toFixed(dp), ')');
  }
}
*/
// =============================================== Cost Classes ===============================================
class Cost {
  constructor(ax0, ax1, multiplier=1) {
    this.axes = [Math.abs(ax0), Math.abs(ax1)];
    this.multiplier = multiplier;
    this.total = NaN;
  }
  toString(dp=2) {
    return this.total.toFixed(dp);
  }
}
class Cost_EUC extends Cost {
  constructor(num_i=NaN, num_j=NaN, multiplier=1) {
    super(num_i, num_j, multiplier);
    this.calc_total();
  }
  calc_total() {
    var [a0, a1] = this.axes;
    this.total = Math.sqrt(a0*a0 + a1*a1) * this.multiplier;
  }
  static add(cost0, cost1) {
    if (cost0 instanceof Cost_EUC && cost1 instanceof Cost_EUC) {
      var tmp = new Cost_EUC();
      tmp.total = cost0.total + cost1.total;
      return tmp;
    } else {
      throw 'Cost_EUC.add: input not of Cost_EUC class'
    }
  }
  static from_vecs(vec0, vec1, multiplier=1) {
    return new Cost_EUC(vec0.i - vec1.i, vec0.j - vec1.j, multiplier);
  }
}
class Cost_DIA extends Cost {
  constructor(num_ords=NaN, num_cards=NaN, multiplier=1) {
    super(num_ords, num_cards, multiplier);
    this.calc_total();
  }
  calc_total() {
    var [a0, a1] = this.axes;
    this.total = (a0 * Math.SQRT2 + a1) * this.multiplier;
  }
  static add(cost0, cost1) {
    if (cost0 instanceof Cost_DIA && cost1 instanceof Cost_DIA) {
      if (cost0.multiplier === cost1.multiplier) { // optimise floating calc as much as possible
        return new Cost_DIA(cost0.axes[0] + cost1.axes[0], cost0.axes[1] + cost1.axes[1], cost0.multiplier);
      } else { // different multipliers, set new Multiplier as NaN, cannot optimise floating calc
        var tmp = new Cost_DIA();
        tmp.total = cost0.total + cost1.total;
        return tmp;
      }
    } else {
      throw 'Cost_DIA.add: input not of Cost_DIA class'
    }
  }
  static from_vecs(vec0, vec1, multiplier=1) {
    var di = Math.abs(vec0.i - vec1.i);
    var dj = Math.abs(vec0.j - vec1.j);
    if (di > dj) {
      var num_ords = dj;
      var num_cards = di - dj;
    } else {
      var num_ords = di;
      var num_cards = dj - di;
    }
    return new Cost_DIA(num_ords, num_cards, multiplier);
  }
}
class Cost_MAN extends Cost {
  constructor(num_i=NaN, num_j=NaN, multiplier=1) {
    super(num_i, num_j, multiplier);
    this.calc_total();
  }
  calc_total() {
    var [a0, a1] = this.axes;
    this.total = (a0 + a1) * this.multiplier;
  }
  static add(cost0, cost1) {
    if (cost0 instanceof Cost_MAN && cost1 instanceof Cost_MAN) {
      if (cost0.multiplier === cost1.multiplier) { // optimise floating calc as much as possible
        return new Cost_MAN(cost0.axes[0] + cost1.axes[0], cost0.axes[1] + cost1.axes[1], cost0.multiplier);
      } else { // different multipliers, set new Multiplier as NaN, cannot optimise floating calc
        var tmp = new Cost_MAN();
        tmp.total = cost0.total + cost1.total;
        return tmp;
      }
    } else {
      throw 'Cost_MAN.add: input not of Cost_MAN class'
    }
  }
  static from_vecs(vec0, vec1, multiplier=1) {
    return new Cost_MAN(vec0.i - vec1.i, vec0.j - vec1.j, multiplier)
  }
}
// =============================================== Graph Class ===============================================
JPSHC.Graph = class {
  constructor(planner) {
    this.num_i = planner.map.num_i;
    this.num_j = planner.map.num_j;
    this.v = Array(this.num_i);
    var row, cell;
    for (var i=0; i<this.num_i; i++) {
      row = Array(this.num_j);
      for (var j=0; j<this.num_j; j++) {
        cell = new JPSHC.Vertex(planner, i, j);
        row[j] = cell;
      }
      this.v[i] = row;
    }
  }
  in_map(vec) {
    return (vec.i >= 0 && vec.i < this.num_i && vec.j >= 0 && vec.j < this.num_j);
  }
  vertices(vec) {
    if (this.in_map(vec) === true) {
      return this.v[vec.i][vec.j];
    } else {
      return null;
    }
  } 
}
// ---------------------------------------------- Vertex -------------------------------------------------
JPSHC.Vertex = class {
  constructor(planner, i, j) {    
    this.position = new Vec(i, j);
    this.g = new JPSHC.Cost(Infinity, Infinity, planner.g_weight);
    this.h = JPSHC.Cost.from_vecs(planner.goal_position, this.position, planner.wh);
    this.f = JPSHC.Cost.add(this.g, this.h);
    this.obstacle = planner.map.cells(this.position).is_obstacle();
    this.parent = undefined;
    this.update_cnt = 0;
  }
  toString(vec_dp=0, cost_dp=2) {
    return this.position.toString(vec_dp).concat(' F', this.f.toString(cost_dp), 
      ' G', this.g.toString(cost_dp), ' H', this.h.toString(cost_dp));
  }
  get f_cost() {
    return this.f.total;
  }
  get g_cost() {
    return this.g.total;
  }
  get h_cost() {
    return this.h.total;
  }
  get i() {
    return this.position.i;
  }
  get j() {
    return this.position.j;
  }
}
// ============================================ Open List Class ==========================================
JPSHC.OpenNode = class {
  constructor(start_dir, start_vertex, first_vertex) {
    this.start_vertex = start_vertex;
    this.first_vertex = first_vertex;
    this.start_dir = start_dir;
    this.update_cnt = start_vertex.update_cnt;
  }
  has_identical_parents() {
    // checks that the parent is still the same
    var p0 = this.first_vertex.parent.position;
    var p1 = this.start_vertex.position;
    return p0.i === p1.i && p0.j === p1.j && this.update_cnt === this.start_vertex.update_cnt;
  }
  toString() {
    return ''.concat(this.start_dir, ' ', this.start_vertex.toString(), ' [', this.start_vertex.update_cnt, ',', this.update_cnt, '] ', this.first_vertex.toString());
  }
}
JPSHC.OpenList = class {
  constructor(planner) {
    this.q = [];
    this.planner = planner;
    var fh_optimisation = planner.options.fh_optimisation;
    var time_ordering = planner.options.time_ordering;
    if (fh_optimisation === true) { // f cost sorting is optimised
      if (time_ordering === 'LIFO') { // LIFO
        this.is_cheaper = function(vertex1, vertex2) {
          var f1 = Math.round(vertex1.f_cost * 1e7);
          var f2 = Math.round(vertex2.f_cost * 1e7);
          var h1 = Math.round(vertex1.h_cost * 1e7);
          var h2 = Math.round(vertex2.h_cost * 1e7);
          return f1 < f2 || f1 === f2 && h1 <= h2;
        }
      } else { // FIFO
        this.is_cheaper = function(vertex1, vertex2) {
          var f1 = Math.round(vertex1.f_cost * 1e7);
          var f2 = Math.round(vertex2.f_cost * 1e7);
          var h1 = Math.round(vertex1.h_cost * 1e7);
          var h2 = Math.round(vertex2.h_cost * 1e7);
          return f1 < f2 || f1 === f2 && h1 < h2;
        }
      }
    } else { // vanilla
      if (time_ordering === 'LIFO') { // LIFO
        this.is_cheaper = function(vertex1, vertex2) {
          var f1 = Math.round(vertex1.f_cost * 1e7);
          var f2 = Math.round(vertex2.f_cost * 1e7);
          return f1 <= f2;
        }
      } else { // FIFO
        this.is_cheaper = function(vertex1, vertex2) {
          var f1 = Math.round(vertex1.f_cost * 1e7);
          var f2 = Math.round(vertex2.f_cost * 1e7);
          return f1 < f2;
        }
      }
    }
  }
  add(start_dir, start_vertex, first_vertex) {
    var node = new JPSHC.OpenNode(start_dir, start_vertex, first_vertex);
    console.log('OPENLIST ADD: ', node.toString());
    for (var q=0; q<this.q.length; q++) {
      if (this.is_cheaper(first_vertex, this.q[q].first_vertex) === true) {
        this.q.splice(q, 0, node);
        return q;
      }
    }
    // not encountered, most expensive
    this.q.push(node);
    
    return this.q.length - 1;
  }
  get_cheapest_node() {
    console.log('------------------------------- ')
    this.debug();
    console.log('OPENLIST RET: ', this.q[0].toString());
    return this.q.shift();
  }
  is_populated() {
    return this.q.length !== 0;
  }
  debug() {
    var tmp = [];
    for (var i =0; i<this.q.length; i++) {
      tmp.push(this.q[i].toString());
    }
    console.log(tmp);
  }
}
new JPSHC();