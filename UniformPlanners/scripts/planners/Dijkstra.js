class Dijkstra extends Planner {
  constructor() {
    super('dijkstra', 'Dijkstra', [
      'blocking',
      'directions',
      'origin',
      'anticlockwise',
      'metric'
    ]);
  }
  run() {
    // ======================== Inits ================================
    var prev_front_pos = undefined, idx=0;
    var step;
    // ==== Inits - Data ====
    var graph = new Dijkstra.Graph(this.map.num_i, this.map.num_j);
    this.graph = graph;
    var list = new Dijkstra.UnvisitedList();
    // Get the options
    var opt_blocking = this.options.blocking;
    var opt_directions = this.options.directions;
    var opt_origin = this.options.origin;
    var opt_anticlockwise = this.options.anticlockwise;
   
    // add start vertex to unvisited list
    var expanded_vertex = graph.vertices(this.start_position);
    this.modify_cost(expanded_vertex, 0, 0);
    list.add(expanded_vertex);
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
    this.new_info_list_pane('c', 'Visited (Current) Vertex', 'Put the starting vertex in the Unvisited List. It is programmatically simpler to implement it this way', [['Position', 'Cost', 'Parent']]);
    this.new_info_list_pane('n', 'Neighbors', '', [['Direction', 'Position', 'Cost', 'State']]);
    this.new_info_list_pane('u', 'Unvisited List', '', [['Neighbor', 'Cost', 'Parent']]);
    step = this.add_step(false, false);
    // update the starting vertex cell with cost information
    step.set_cell_text(this.start_position, this.cost_to_string(expanded_vertex));
    // update the unvisited info description with starting vertex
    step.set_list_description('u', 'Added the starting vertex');
    // add the start vertex into the unvisited info list
    step.insert_list_item('u', 0, [this.vec_to_string(this.start_position), 0, '-']);
    // color the new entry in the unvisited info list
    step.color_list_item('u', 0, true);
    // add a N/A entry to the current vertex
    step.insert_list_item('c', 0, ['-', '-', '-']);
    // add entries to the neighbors info
    for (var n=0; n<dir_to_string.length; n++) {
      step.insert_list_item('n', n, [dir_to_string[n], '-', '-', '-']);
    }
    
    // ======================== Exploring part ================================
    var expanded_pos, neighbor_vertex, neighbor_pos, neighbor_nodes, neighbor_poses, neighbor_pos_string, 
      neighbor_cost_string, expanded_pos_string, tentative_cost_obj, neighbor, num_expansions=0;
    var path_found = false;
    while(list.is_populated()) {
      // ======================== Retrieve Lowest Cost Vertex ================================
      // get the lowest cost vertex from the unvisited list
      expanded_vertex = list.get_lowest_cost_vertex();
      // get its position
      expanded_pos = expanded_vertex.position;
      // get the string
      expanded_pos_string = this.vec_to_string(expanded_pos);
      // ==== GUI ====
      // remove the first item in the unvisited info list
      step.remove_list_item('u', 0);
      // set sim status string
      step.set_info_text('i', '<b>Exploring...</b></br>- Retrieve lowest cost vertex from unvisited-list.')
      // set current vertex status to reflect removal
      step.set_list_description('c', 'Retrieved vertex with lowest cost.');
      // set unvisited vertext status to reflect removal
      step.set_list_description('u', 'Removed first element, because the list was already sorted'); 
      // empty the neighbor status
      step.set_list_description('n', ''); 
      // set the current vertex info to the lowest cost node
      step.edit_list_item('c', 0, [
        expanded_pos_string, 
        this.cost_to_string(expanded_vertex, 2),
        expanded_vertex.parent === undefined ? 
          'Starting vertex has no parent' : 
          this.vec_to_string(expanded_vertex.parent)
      ]);
      // update the "front" cell of the algorithm
      if (prev_front_pos !== undefined) // for the start
        step.set_cell_class(prev_front_pos, 'cell_front', true);
      step.set_cell_class(expanded_pos, 'cell_front');
      prev_front_pos = expanded_pos
      // reset the neighbors info
      for (var n=0; n<dir_to_string.length; n++) {
        step.edit_list_item('n', n, [dir_to_string[n], '?', '?', '?']);
      }
      
      // ======================== Ignore Vertex if Visited ================================
      if (expanded_vertex.visited === true) {
        // === GUI ===
        // Set current vertex status to reflect skipping
        step.set_list_description('c', 'A cheaper path was already found, since the vertex was marked as "<b>visited</b>". <em>Skip</em>');
        // Add a new step for the next retrieval
        step = this.add_step();
        continue;
      }
      // increment the number of expansions
      num_expansions++;
      
      // ======================== Get the neighbors ================================
      neighbor_nodes = this.get_neighbor_nodes(expanded_pos);
      // ==== GUI ====
      step = this.add_step();
      // update the sim status to reflect neighbor checking
      step.set_info_text('i', '<b>Exploring...</b></br>- Retrieve lowest cost vertex from open-list.</br>&ensp;- Check its neighbors');
      step.set_list_description('c', 'Checking neighbors...');
      // For each neighbor
      for (var n=0; n<neighbor_nodes.length; n++) {
        // get pos and graph vertex
        neighbor = neighbor_nodes[n];
        neighbor_pos = neighbor.position;
        neighbor_pos_string = this.vec_to_string(neighbor_pos);
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
          var prev_nb = neighbor_nodes[Dir.rotate(n, -1)];// not technically correct but works
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
        // set current cell as visited
        step.set_cell_class(expanded_pos, 'cell_visited');
        
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
        
        // ======================== Is Neighbor the GOAL? ================================
        if (neighbor_pos.equals(this.goal_position) === true) {
          // set the goal node's parent as the current vertex
          neighbor_vertex.parent = expanded_vertex;
          // update the cost of the goal vertex
          neighbor_vertex.cost_obj = this.add_cost_from_parent(expanded_vertex, dir_is_ordinal[n]);
          
          // ==== GUI ====
          step = this.add_step();
          // update the sim state info to reflect path found
          step.set_info_text('i', '<b>Path found!</b><br/>- Trace back to the starting vertex by iterating over the parent vertices');
          // update the current vertex info to reflect that goal is found in one of its neighbors
          step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is the <b>GOAL</b>!'));
          // update the front to the goal
          step.set_cell_class(neighbor_pos, 'cell_front');
          // remove the current cell as the front
          step.set_cell_class(expanded_pos, 'cell_front', true);
          // update the neighbor info panel
          step.edit_list_item('n', n, [
            dir_to_string[n],
            neighbor_pos_string,
            this.cost_to_string(neighbor_vertex, 2),
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
            step.edit_list_item('n', n, [dir_to_string[n], '-', '-', '-']);
          // set the current vertex info panel as the goal
          step.edit_list_item('c', 0, [
            neighbor_pos_string,
            this.cost_to_string(neighbor_vertex, 2),
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
        tentative_cost_obj = this.add_cost_from_parent(expanded_vertex, dir_is_ordinal[n]);
        if (neighbor_vertex.cost > tentative_cost_obj.total) {
          // there is a cheaper path to neighbor vertex (vertices initialised with Infinity cost)
          // ==== GUI ====
          neighbor_cost_string = this.cost_to_string(tentative_cost_obj, 2);
          if (neighbor_vertex.cost === Infinity) { 
            // ---- new encounter ----
            // current vertex info to reflect the new vertex encounter
            step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' is <b>new</b>. Add this to the unvisited_list with the current vertex as parent.'));
            // update neighbor information
            step.edit_list_item('n', n, [
              dir_to_string[n], 
              neighbor_pos_string, 
              neighbor_cost_string, 
              '<i>New encounter</i>'
            ]);
          } else { 
            // ---- vertex was encountered before ----
            // current vertex info to reflect a cheaper encounter
            step.set_list_description('n', 'Neighbor '.concat(neighbor_pos_string, ' was <b>encountered before, but not yet visited</b>. This means that it is cheaper to get to it from the current vertex. Add this to the unvisited_list with the current vertex as parent.</br>Its previous unvisited-list entry will be ignored.'));
            // update neighbor information
            step.edit_list_item('n', n, [
              dir_to_string[n], 
              neighbor_pos_string, 
              neighbor_cost_string, 
              '<i>Replaced parent</i>'
            ]);
          }
          // update its cost object
          neighbor_vertex.cost_obj = tentative_cost_obj;
          
          // ======================== Add Neighbor to Unvisited List ================================
          // update the neighbor vertex with the new parent
          neighbor_vertex.parent = expanded_vertex;
          // Add to unvisited ist
          idx = list.add(neighbor_vertex);
          
          // ==== GUI ====
          // modify the unvisited info list
          step.insert_list_item('u', idx, [
            neighbor_pos_string,
            neighbor_cost_string,
            expanded_pos_string,
          ]);
          // modify the unvisited info list description
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
          step.set_cell_text(neighbor_pos, this.cost_to_string(tentative_cost_obj, 1));
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
          step.edit_list_item('n', n, [dir_to_string[n], neighbor_pos_string, neighbor_cost_string, '<i>Not a child</i>']);
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
      step.set_info_text('i', '<center><h1>Complete!</h1><p>$<em>'.concat(this.cost_to_string(graph.vertices(this.goal_position), 2), "</em> is the path's cost</p><p><em>", num_expansions, '</em> expansions were done. This is the number of vertices / cells where neighbors are checked.</p></center>'));
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
  vec_to_string(vec) {
    return '('.concat(vec.i, ', ', vec.j, ')');
  }
  cost_to_string(arg0, dp=1) {
    if (arg0 instanceof Dijkstra.Vertex)
      return arg0.cost.toFixed(dp);
    else
      return arg0.total.toFixed(dp);
  }
  modify_cost(vertex, num_ordinals, num_cardinals) {
    vertex.cost_obj = new Dijkstra.Cost(num_ordinals, num_cardinals);
  }
  add_cost_from_parent(parent_vertex, ordinal) { // adjacent only
    if (ordinal === false) {
      var nd = 0; var nc = 1;
    } else {
      var nd = 1; var nc = 0;
    }
    var co = parent_vertex.cost_obj;
    return new Dijkstra.Cost(co.ordinals + nd, co.cardinals + nc)
  }
}
Dijkstra.Graph = class {
  constructor(num_i, num_j) {
    this._v = Array(num_i);
    var row;
    for (var i=0; i<num_i; i++) {
      row = Array(num_j);
      for (var j=0; j<num_j; j++) {
        row[j] = new Dijkstra.Vertex(i, j);
      }
      this._v[i] = row;
    }
    this.ni = num_i;
    this.nj = num_j;
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
Dijkstra.Vertex = class {
  constructor(i, j) {
    this.position = new Vec(i, j);
    this.parent = undefined;
    this.cost_obj = new Dijkstra.Cost(Infinity, Infinity);
    this.visited = false; // don't really have to use this logically since we can compare cost, but it is slightly faster.
  }
  get cost() {
    return this.cost_obj.total;
  }
  get i() {
    return this.position.i;
  }
  get j() {
    return this.position.j;
  }
}
Dijkstra.Cost = class {
  constructor(num_ordinals, num_cardinals) {
    this.ordinals = num_ordinals;
    this.cardinals = num_cardinals;
    this.total = num_ordinals * Math.SQRT2 + num_cardinals;
  }
}
Dijkstra.UnvisitedList = class {
  constructor() {
    this._q = [];
  }
  add(vertex) {
    for (var q=0; q<this._q.length; q++) {
      if (vertex.cost < this._q[q].cost) {
        this._q.splice(q, 0, vertex);
        return q;
      }
    }
    // not encountered, most expensive
    this._q.push(vertex);
    return this._q.length - 1;
  }
  get_lowest_cost_vertex() {
    return this._q.shift();
  }
  peek_lowest_cost_vertex() {
    return this._q[0];
  }
  is_populated() {
    return this._q.length !== 0;
  }
}
new Dijkstra();