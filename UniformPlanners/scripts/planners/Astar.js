class AStar extends Planner {
  constructor() {
    super ('astar', 'A*', [
      'blocking',
      'directions',
      'origin',
      'anticlockwise',
      'metric',
      'fh_optimisation'
//      'gh_weights'
    ]);
  }
  run() {
    var prev_front_pos = undefined, idx=0;
    var step;
    // ==== Inits - Data ====
    // Get the options
    var opt_blocking = this.options.blocking;
    var opt_directions = this.options.directions;
    var opt_origin = this.options.origin;
    var opt_anticlockwise = this.options.anticlockwise;
    var opt_metric = this.options.metric;
    this.opt_directions = opt_directions;
    // Build the graph using the goal_position to do a one-pass calculation of the h-costs
    var graph = new AStar.Graph(this.map.num_i, this.map.num_j, this.goal_position, opt_metric);
    this.graph = graph;
    var list = new AStar.OpenList(this.options.fh_optimisation);
    
    // add start vertex to unvisited list
    var expanded_vertex = graph.vertices(this.start_position);
    expanded_vertex.set_g(); // set g-cost to zero
    list.add(expanded_vertex, expanded_node);
   // Get the search directions
    var neighbor_dirs = Dir.list_dirs(opt_origin, opt_anticlockwise, opt_directions);
    // neighbor_vecs : the relative vectors of the neighbors
    this.neighbor_vecs = neighbor_dirs.map(Dir.dir_to_vec);
    // get the neighbor dirs as string
    // also get the direction type (ordinal is true)
    var dir_to_string = neighbor_dirs.map(Dir.dir_to_string);
    var dir_is_ordinal = neighbor_dirs.map(Dir.is_ordinal);
    
    // ==== Inits - GUI ====
    this.new_info_text_pane('i', 'Status', '<b>Initialising...</b>');
    this.new_info_list_pane('c', 'Current Vertex', 'Put the starting vertex in the Queue. It is programmatically simpler to implement it this way', [['Position', 'F-cost', 'G-cost', 'H-cost', 'Parent']]);
    this.new_info_list_pane('n', 'Neighbors', '', [['Dir.', 'Position', 'F-cost', 'G-cost', 'H-cost', 'State']]);
    this.new_info_list_pane('u', 'Open List', '', [['Vertex', 'F-cost', 'G-cost', 'H-cost', 'Parent']]);
    step = this.add_step(false, false);
    // update the starting vertex cell with cost information
    step.set_cell_text(this.start_position, this.cost_to_string(expanded_vertex.f, 1));
    // update the unvisited info description with starting vertex
    step.set_list_description('u', 'Added the starting vertex');
    // add the start vertex into the unvisited info list
    step.insert_list_item('u', 0, [
      this.start_position.string(), 
      this.cost_to_string(expanded_vertex.f, 2),
      this.cost_to_string(expanded_vertex.f.g, 2),
      this.cost_to_string(expanded_vertex.f.h, 2),
      'undefined']);
    // color the new entry in the unvisited info list
    step.color_list_item('u', 0, true);
    // add a N/A entry to the current vertex
    step.insert_list_item('c', 0, ['-', '-', '-', '-', '-']);
    // add entries to the neighbors info
    for (var n=0; n<dir_to_string.length; n++) {
      step.insert_list_item('n', n, [dir_to_string[n], '-', '-', '-', '-', '-']);
    }
    
    
    // ======================== Exploring part ================================
    var expanded_pos, neighbor_vertex, neighbor_pos, neighbor_nodes, neighbor_poses, neighbor_pos_string, 
      neighbor_gc_string, neighbor_hc_string, neighbor_fc_string, expanded_pos_string, tentative_g, 
      neighbor, expanded_node, prior_g_cost, num_expansions=0;
    var path_found = false;
    step = this.add_step(true);
    while(list.is_populated()) {
      // ======================== Retrieve Lowest Cost Vertex ================================
      // get the lowest cost vertex from the unvisited list
      expanded_node = list.get_cheapest_node();
      expanded_vertex = expanded_node.vertex;
      // get its position
      expanded_pos = expanded_vertex.position;
      // get the string
      expanded_pos_string = expanded_pos.string();
      // ==== GUI ====
      // remove the first item in the unvisited info list
      step.remove_list_item('u', 0);
      // set sim status string
      step.set_info_text('i', '<b>Exploring...</b></br>- Retrieve cheapest (f-cost) vertex from open-list.')
      // set current vertex status to reflect removal
      step.set_list_description('c', 'Retrieved cheapest vertex.');
      // set unvisited vertex status to reflect removal
      step.set_list_description('u', 'Removed first element, because the list was already sorted'); 
      // empty the neighbor status
      step.set_list_description('n', ''); 
      // set the current vertex info to the lowest cost node
      step.edit_list_item('c', 0, [
        expanded_pos_string, 
        this.cost_to_string(expanded_vertex.f, 2),
        this.cost_to_string(expanded_vertex.f.g, 2),
        this.cost_to_string(expanded_vertex.f.h, 2),
        expanded_vertex.parent === undefined ? 
          'undefined' : 
          expanded_vertex.parent.position.string()
      ]);
      // set current cell as visited
      step.set_cell_class(expanded_pos, 'cell_visited');
      // update the "front" cell of the algorithm
      if (prev_front_pos !== undefined) // for the start
        step.set_cell_class(prev_front_pos, 'cell_front', true);
      step.set_cell_class(expanded_pos, 'cell_front');
      prev_front_pos = expanded_pos
      // reset the neighbors info
      for (var n=0; n<dir_to_string.length; n++) {
        step.edit_list_item('n', n, [dir_to_string[n], '?', '?', '?', '?', '?']);
      }
      
      // ======================== Ignore Vertex if Parent is Different as Recorded ================================
      if (expanded_node.parent !== undefined && expanded_node.has_equal_parents() === false) {
        // === GUI ===
        // Set current vertex status to reflect skipping
        step.set_list_description('c', 'A cheaper path was already found. <em>Skip</em>');
        // Add a new step for the next retrieval
        step = this.add_step();
        continue;
      }
      // Increment the number of expansions
      num_expansions++;
      
      // ======================== Get the neighbors ================================
      neighbor_nodes = this.get_neighbor_nodes(expanded_pos);
      // ==== GUI ====
      step = this.add_step();
      // update the sim status to reflect neighbor checking
      step.set_info_text('i', '<b>Exploring...</b></br>- Retrieve cheapest (f-cost) vertex from open-list.</br>&ensp;- Check its neighbors');
      step.set_list_description('c', 'Checking neighbors...');
      // For each neighbor
      for (var n=0; n<neighbor_nodes.length; n++) {
        // get pos and graph vertex
        neighbor = neighbor_nodes[n];
        neighbor_pos = neighbor.position;
        neighbor_pos_string = neighbor_pos.string();
        neighbor_vertex = neighbor.vertex;
        
        // ======================== Is Neighbor in Map? ================================
        if (neighbor_vertex === null) {
          // ==== GUI ====
          // update current vertex information
          step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is <b>out of map</b>. <em>Skip</em>'));
          // update neighbor information
          step.edit_list_item('n', n, [
            dir_to_string[n],
            neighbor_pos_string,
            '-',
            '-',
            '-',
            '<i>Not in map</i>'
          ]);
          // highlight neighbor info row
          step.color_list_item('n', n, true);
          // add a step for next neighbor
          step = this.add_step();
          // unhighlight
          step.color_list_item('n', n, false);
          continue;
        }
        // set cell focus if in map
        step.set_cell_focus(neighbor_pos, true);
        // get the cell h cost as string
        neighbor_hc_string = this.cost_to_string(neighbor_vertex.f.h, 2);
        
        // ======================== Is Neighbor Parent? ================================
        if (expanded_vertex.parent !== undefined && neighbor_vertex.position.equals(expanded_vertex.parent.position)) {
          // ==== GUI ====
          // update current vertex information
          step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is the <b>parent</b>. <em>Skip</em>'));
          // update neighbor information
          step.edit_list_item('n', n, [
            dir_to_string[n],
            neighbor_pos_string,
            'skip',
            'skip',
            'skip',
            '<i>Parent</i>'
          ]);
          // highlight neighbor info row
          step.color_list_item('n', n, true);
          // add a step for next neighbor
          step = this.add_step();
          // unhighlight
          step.color_list_item('n', n, false);
          // blur
          step.set_cell_focus(neighbor_pos, false);
          continue;
        }
        
        // ======================== Is Neighbor an Obstacle? ================================
        if (neighbor.is_obstacle === true) {
          // ==== GUI ====
          // Update the cell with the words 'OBS' to reflect encounter
          step.set_cell_text(neighbor_pos, 'OBS');
          // Update current vertex information 
          step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is an <b>obstacle</b>. <em>Skip</em>'));
          // update neighbor information
          step.edit_list_item('n', n, [
            dir_to_string[n],
            neighbor_pos_string,
            '&infin;',
            '&infin;',
            neighbor_hc_string,
            '<i>Obstacle</i>'
          ]);
          // highlight neighbor info row
          step.color_list_item('n', n, true);
          // add a new step for next neighbor
          step = this.add_step();
          // blur the current neighbor focus
          step.set_cell_focus(neighbor_pos, false);
          //unhighlight neighbors info row
          step.color_list_item('n', n, false);
          continue;
        } else if (opt_directions === Dir.DIAGONAL && opt_blocking === true && dir_is_ordinal[n] === true) {
          // ======================== Check Diagonal Blocking? ================================
          var prev_nb = neighbor_nodes[Dir.rotate(n, -1)]; // not technically correct but works
          var next_nb = neighbor_nodes[Dir.rotate(n, 1)];
          if ((prev_nb === null || prev_nb.is_obstacle === true) && 
            (next_nb === null || next_nb.is_obstacle === true)) {
            // block the passage to the ordinal cell if cardinal cells have obstacles
            // Update current vertex information 
            step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is <b>not an obstacle</b>, but passage to it is blocked. <em>Skip</em>'));
            // update neighbor information
            step.edit_list_item('n', n, [
              dir_to_string[n],
              neighbor_pos_string,
              'skip',
              'skip',
              'skip',
              '<i>Blocked</i>'
            ]);
            // highlight neighbor info row
            step.color_list_item('n', n, true);
            // add a new step for next neighbor
            step = this.add_step();
            // blur the current neighbor focus
            step.set_cell_focus(neighbor_pos, false);
            // unhighlight neighbors info row
            step.color_list_item('n', n, false);
            continue;
          }
        }
        
        // ======================== Is Neighbor the GOAL? ================================
        if (neighbor_pos.equals(this.goal_position) === true) {
          // set the goal node's parent as the current vertex
          neighbor_vertex.parent = expanded_vertex;
          // update the cost of the goal vertex
          neighbor_vertex.set_g(neighbor_vertex.find_g(expanded_vertex));
          
          // ==== GUI ====
          // update the sim state info to reflect path found
          step.set_info_text('i', '<b>Path found!</b><br/>- Trace back to the starting vertex by iterating over the parent vertices');
          // update the current vertex info to reflect that goal is found in one of its neighbors
          step.set_list_description('c', '<em>GOAL</em> found in neighbor!');
          // update neighbor info
          step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is the <em>GOAL</em>!'));
          // update the front to the goal
          step.set_cell_class(neighbor_pos, 'cell_front');
          // remove the current cell as the front
          step.set_cell_class(expanded_pos, 'cell_front', true);
          // update the neighbor info panel
          step.edit_list_item('n', n, [
            dir_to_string[n],
            neighbor_pos_string,
            this.cost_to_string(neighbor_vertex.f, 2),
            this.cost_to_string(neighbor_vertex.f.g, 2),
            neighbor_hc_string,
            '<em>GOAL</em>'
          ]);
          // highlight neighbor info row
          step.color_list_item('n', n, true);
          
          // ======================== Trace to start ================================
          // ==== GUI ====
          step = this.add_step(true); // major step
          // clear the description
          step.set_list_description('n', '');
          // unhighlight neighbors info row
          step.color_list_item('n', n, false);
          // reset the neighbors info panel
          for (var n=0; n<dir_to_string.length; n++)
            step.edit_list_item('n', n, [dir_to_string[n], '-', '-', '-', '-', '-']);
          // set the current vertex info panel as the goal
          step.edit_list_item('c', 0, [
            neighbor_pos_string,
            this.cost_to_string(neighbor_vertex.f, 2),
            this.cost_to_string(neighbor_vertex.f.g, 2),
            neighbor_hc_string,
            expanded_pos_string
          ]);
          // update the current vertex description
          step.set_list_description('c', '<b>The <em>Goal</em> Vertex</b>');
          
          // ---- Begin Tracing ----
          while (true) {
            expanded_vertex = neighbor_vertex.parent;
            if (expanded_vertex === undefined)
              break; // at the start vertex
            // Draw the optimal path
            step.draw_path(neighbor_vertex.position, expanded_vertex.position, UIPath.PATH);
            // Move down the chain
            neighbor_vertex = expanded_vertex;
          }
          path_found = true;
          break;
        }
        
        // ======================== Neighbor can be Visited if Cheaper than Before ================================
        // Calculate the tentative cost
        tentative_g = neighbor_vertex.find_g(expanded_vertex);
        if (neighbor_vertex.g_cost > tentative_g.total) {
          // there is a cheaper path to neighbor vertex (vertices initialised with Infinity cost)
          prior_g_cost = neighbor_vertex.g_cost;
          // update its cost object
          neighbor_vertex.set_g(tentative_g);
          // ==== GUI ====
          // get the costs
          neighbor_gc_string = this.cost_to_string(neighbor_vertex.f.g, 2);
          neighbor_fc_string = this.cost_to_string(neighbor_vertex.f, 2);
          if (prior_g_cost === Infinity) { 
            // ---- new encounter ----
            // current vertex info to reflect the new vertex encounter
            step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is <b>new</b>. Add this to the open-list with the current vertex as parent.'));
            // update neighbor information
            step.edit_list_item('n', n, [
              dir_to_string[n], 
              neighbor_pos_string,
              neighbor_fc_string,
              neighbor_gc_string,
              neighbor_hc_string, 
              '<i>New encounter</i>'
            ]);
          } else { 
            // ---- vertex was encountered before ----
            // current vertex info to reflect a cheaper encounter
            step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' was <b>encountered before, but not yet visited</b>. This means that it is cheaper to get to it from the current vertex. Add this to the open-list with the current vertex as parent.</br>Its previous open-list entry will be ignored.'));
            // update neighbor information
            step.edit_list_item('n', n, [
              dir_to_string[n], 
              neighbor_pos_string, 
              neighbor_fc_string,
              neighbor_gc_string,
              neighbor_hc_string, 
              '<i>Replaced parent</i>'
            ]);
          }
          
          // ======================== Add Neighbor to Open List ================================
          // update the neighbor vertex with the new parent
          neighbor_vertex.parent = expanded_vertex;
          // Add to open ist
          idx = list.add(neighbor_vertex);
          
          // ==== GUI ====
          // modify the open info list
          step.insert_list_item('u', idx, [
            neighbor_pos_string,
            neighbor_fc_string,
            neighbor_gc_string,
            neighbor_hc_string, 
            expanded_pos_string,
          ]);
          // modify the open info list description
          step.set_list_description('u', 'Added neighbor vertex '.concat(neighbor_pos_string, ' after cost sorting'));
          // highlight the current list row
          step.color_list_item('u', idx, true);
          // remove the previous paths to the neighbor
          step.remove_paths(neighbor_pos);
          // draw a new path to the neighbor
          step.draw_path(neighbor_pos, expanded_pos, UIPath.TRACE);
          // update the neighbor cell class as encountered
          step.set_cell_class(neighbor_pos, 'cell_encountered');
          // update the neighbor cell cost
          step.set_cell_text(neighbor_pos, this.cost_to_string(tentative_g, 1));
          // highlight the neighbor info row
          step.color_list_item('n', n, true);
          // add a new step for the next neighbor
          step = this.add_step();
          // unhighlight the current list row
          step.color_list_item('u', idx, false);
        } else { 
          // ======================== Neighbor is not Cheaper than before ================================
          // ==== GUI ====
          // update the current vertex info
          step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is <b>cheaper to visit from its parent</b> than from the current vertex. <em>Skip</em>'));
          // update neighbor info
          step.edit_list_item('n', n, [
            dir_to_string[n], 
            neighbor_pos_string, 
            this.cost_to_string(neighbor_vertex.f, 2),
            this.cost_to_string(neighbor_vertex.f.g, 2), 
            neighbor_gc_string,
            '<i>Not a child</i>'
          ]);
          // highlight the neighbor info row
          step.color_list_item('n', n, true);
          // add a new step for the next neighbor
          step = this.add_step();
        }
        // unhighlight the neighbor info row
        step.color_list_item('n', n, false);
        // blur the focus from the cell
        step.set_cell_focus(neighbor_pos, false);
        
      } // end of for loop of neighbors
      // assign the current step as a major step because we are retrieving a new node from the list
      step.major = true;
      //
      if (path_found === true)
        break;
    } // end of while loop
    // ======================== End the Search ================================
    // check if the while loop found the path
    if (path_found === false) { // no path found
      step = this.add_step(true);
      step.set_info_text('i', '<center><h1>No Path Found!</h1><em>'.concat(num_expansions, '</em> expansions were done. This is the number of vertices / cells where neighbors are checked.</p></center>'));
    } else { // path found
      step.set_info_text('i', '<center><h1>Complete!</h1><p>$<em>'.concat(this.cost_to_string(graph.vertices(this.goal_position).f.g, 2), "</em> is the path's G-cost</p><p><em>", num_expansions, '</em> expansions were done. This is the number of vertices / cells where neighbors are checked.</p></center>'));
    }
    // update the unvisited list info panel
    step.set_list_description('u', 'Items left in the unvisited list');
    
  }
  get_neighbor_nodes(vec) {
    // returns position, the graph vertex, and obstacle information
    var nodes=[], neighbor_pos, v;
    for (var i=0; i<this.neighbor_vecs.length; i++) {
      neighbor_pos = vec.add(this.neighbor_vecs[i]);
      v = this.graph.vertices(neighbor_pos);
      nodes[i] = {
        position : neighbor_pos,
        vertex : v,
        is_obstacle : (v === null) ? true : this.map.cells(neighbor_pos).is_obstacle()
      };
    }
    return nodes;
  }
  cost_to_string(cost_obj, dp=1) {
    return cost_obj.total.toFixed(dp);
  }
}
AStar.FCost = class {
  constructor(metric, is_start=false) {
    this.g = new Dist(Infinity, Infinity, metric);
    this.h = new Dist(Infinity, Infinity, metric);
    this.total = Infinity;
    this.metric = metric;
  }
};
AStar.Vertex = class {
  constructor(i, j, metric) {
    this.position = new Vec(i, j);
    this.parent = undefined;
    this.f = new AStar.FCost(metric);
  }
  get f_cost() {
    return this.f.total;
  }
  get g_cost() {
    return this.f.g.total;
  }
  get h_cost() {
    return this.f.h.total;
  }
  get i() {
    return this.position.i;
  }
  get j() {
    return this.position.j;
  }
  set_f() {
    this.f.total = this.f.g.add(this.f.h).total;
  }
  find_g(parent_vertex) {
    var f = this.f;
    var g = Dist.vecs_separation(parent_vertex.position, this.position, f.metric);
    g = parent_vertex.f.g.add(g);
    return g;
  }
  set_g(g) {
    var f = this.f;
    if (g === undefined) {
      f.g = new Dist(0, 0, f.metric);
    } else {
      f.g = g;
    }
    this.set_f();
  }
  set_h(goal_position) {
    var f = this.f;
    f.h = Dist.vecs_separation(this.position, goal_position, f.metric);
    this.set_f();
  }
}
AStar.Graph = class {
  constructor(num_i, num_j, goal_position, metric=Dist.DIAGONAL) {
    this._v = Array(num_i);
    var row, cell;
    for (var i=0; i<num_i; i++) {
      row = Array(num_j);
      for (var j=0; j<num_j; j++) {
        cell = new AStar.Vertex(i, j, metric);
        row[j] = cell;
      }
      this._v[i] = row;
    }
    this.ni = num_i;
    this.nj = num_j;
    this.set_h_costs(goal_position);
  }
  set_h_costs(goal_position) {
    var row;
    for (var i=0; i<this.ni; i++) {
      row = this._v[i];
      for (var j=0; j<this.nj; j++) {
        row[j].set_h(goal_position);
      }
    }
  }
  in_map(vec) {
    return (vec.i >= 0 && vec.i < this.ni && vec.j >= 0 && vec.j < this.nj);
  }
  vertices(vec) {
    if (this.in_map(vec)) {
      return this._v[vec.i][vec.j];
    } else {
      return null;
    }
  }
}
AStar.OpenNode = class {
  constructor(vertex, parent_vertex) {
    this.vertex = vertex;
    this.parent = parent_vertex;
  }
  has_equal_parents() {
    return this.vertex.parent.position.equals(this.vertex.position);
  }
}
AStar.OpenList = class {
  constructor(fh_optimisation=true) {
    this._q = [];
    if (fh_optimisation === true) { // f cost sorting is optimised
      this.is_cheaper = function(vertex1, vertex2) {
        return vertex1.f_cost <= vertex2.f_cost || vertex1.f_cost === vertex2.f_cost && vertex1.h_cost < vertex2.h_cost;
      }
    } else { // vanilla
      this.is_cheaper = function(vertex1, vertex2) {
        return vertex1.f_cost <= vertex2.f_cost;
      }
    }
  }
  add(vertex, parent_vertex) {
    var node = new AStar.OpenNode(vertex, parent_vertex);
    for (var q=0; q<this._q.length; q++) {
      if (this.is_cheaper(vertex, this._q[q].vertex) === true) {
        this._q.splice(q, 0, node);
        return q;
      }
    }
    // not encountered, most expensive
    this._q.push(node);
    return this._q.length - 1;
  }
  get_cheapest_node() {
    return this._q.shift();
  }
  peek_cheapest_node() {
    return this._q[0];
  }
  is_populated() {
    return this._q.length !== 0;
  }
}
new AStar();