class AStar extends Planner {
  constructor() {
    super('astar', 'A*');
  }
  run() {
    this.graph = new AStar.Graph();
    // init start_vertex
    var start_vertex = this.graph.vertices(this.start_position);
    this.update_f(start_vertex, new AStar.Cost(0, 0), this.get_h(start_vertex));
    start_vertex.source = undefined;
    this.open_list = new AStar.OpenList();
    this.open_list.add(undefined, start_vertex);
    this.new_info_text_pane('i', 'Status', '<b>Initialising...</b>');
    this.new_info_list_pane('c', 'Expanded (Current) Vertex', 'Put the starting vertex in the open list, so it is programmatically simpler (in terms of looping) to implement.', [['Current', 'F', 'G', 'H', 'Parent']]);
    this.new_info_list_pane('ol', 'Open List', '', [['Neighbor', 'F','G','H', 'Parent']]);
    var neighbors, neighbor, expanded_vertex, expanded_node, step, tentative_g, neighbor_vertex, expanded_pos, neighbor_pos, idx=0;
    var path_found = false;
    var front_pos, prev_front_pos = undefined;
    var open_list = this.open_list;
    var goal_cost = Infinity;
    // fill the cost of the start vertex
    step = this.add_step(false, false);
    step.set_cell_text(this.start_position, open_list.peek_lowest_fcost_node().vertex.fcost.toFixed(1));
    step.set_list_description('ol', 'Added the starting vertex');
    // add the start vertex
    var start_vertex = open_list.peek_lowest_fcost_node().vertex;
    step.insert_list_item('ol', idx, [
      '('.concat(this.start_position.i, ', ', this.start_position.j, ')'), 
      start_vertex.fcost.toFixed(2),
      0,
      start_vertex.hcost.toFixed(2),
      '-'
      ]);
    step.insert_list_item('c', 0, ['-', '-', '-', '-', '-']);
    step.color_list_item('ol', 0, true);
    step = this.add_step();
    while (open_list.is_not_empty()) {
      // get the vertex with lowest fcost from open_list
      expanded_node = open_list.get_lowest_fcost_node();
      step.remove_list_item('ol', 0);
      step.set_info_text('i', '<b>Exploring...</b></br>- Retrieve lowest cost vertex from open-list.');
      step.set_list_description('c', 'Retrieved vertex with <b>lowest f-cost</b> <i>(vanilla implementation)</i> from open-list. If there are ties in f-costs, take the one with the <b>lowest h-cost</b> <i>(optimised)</i>.');
      step.set_list_description('ol', 'Removed first element, because the list was already sorted');      
      expanded_vertex = expanded_node.vertex;
      expanded_pos = expanded_vertex.position;
      step.edit_list_item('c', 0, [
        '('.concat(expanded_pos.i, ', ', expanded_pos.j, ')'), 
        expanded_vertex.fcost.toFixed(2),
        expanded_vertex.gcost.toFixed(2),
        expanded_vertex.hcost.toFixed(2),
        expanded_vertex.source === undefined ? 
          'Starting vertex has no parent' :
          '('.concat(expanded_vertex.source.position.i, ', ', expanded_vertex.source.position.j, ')')
      ]);
      // ignore if expanded vertex has a source vertex that is different from the source vertex recorded in the open list. 
      // This is because the expanded vertex already has a cheaper source.
      // current vertex may have already been added prior to the cheaper source update
      if (expanded_node.source !== undefined && expanded_vertex.source.position.equals(expanded_node.source.position) === false) {
        continue;
        step.set_list_description('c', 'The parent of the expanded vertex is different as the one recorded in the open list. This means a cheaper path to the vertex was found, so this open-list item is ignored');
        step.set_cell_focus(expanded_pos, true);
        step = this.add_step();
        step.set_cell_focus(expanded_pos, false);
      }
      // add a GUI Step - update the front cell
      if (prev_front_pos !== undefined)
        step.set_cell_class(prev_front_pos, 'cell_front', true);
      step.set_cell_class(expanded_pos, 'cell_front');
      prev_front_pos = expanded_pos;
      
      // get neighbors
      step = this.add_step();
      step.set_info_text('i', '<b>Exploring...</b></br>- Retrieve lowest cost vertex from open-list.</br>&nbsp;&nbsp;- Check its neighbors');
      neighbors = this.get_neighbors(expanded_vertex);
      for (var n=0; n<neighbors.length; n++) {
        neighbor = neighbors[n];
        neighbor_vertex = neighbor.vertex;
        neighbor_pos = neighbor.position;
        
        if (neighbor_vertex === null) {
          step.set_list_description('c', 'Neighbor ('.concat(neighbor_pos.i, ', ', neighbor_pos.j, ') is <b>out of map</b>. <em>Skip</em>'));
          step = this.add_step();
          // out of map, continue
          continue;
        }
        
        step.set_cell_focus(neighbor_pos, true);
        if (neighbor.obstacle ===  true) {
          // neighbor is an obstacle, continue
          step.set_cell_text(neighbor_pos, 'OBS');
          step.set_list_description('c', 'Neighbor ('.concat(neighbor_pos.i, ', ', neighbor_pos.j, ') is an <b>obstacle</b>. <em>Skip</em>'));
          step = this.add_step();
          step.set_cell_focus(neighbor_pos, false);
          continue;
        }
        
        // check if the neighbor is a goal
        if (neighbor_pos.equals(this.goal_position) === true) {
          // neighbor is goal, prepare to trace back to start
          // this is different from the vanilla implementation. this is very slightly more efficient.
          // this checks if the neighbor is the goal rather than checking if expanded vertex is the goal.
          // write the source.
          neighbor_vertex.source = expanded_vertex;
          goal_cost = this.get_g(expanded_vertex, neighbor).total;
          
          // GUI - update the information with new step
          step = this.add_step();
          step.set_cell_class(expanded_pos, 'cell_visited');
          step.set_info_text('i', '<b>Path found!</b><br/>- Trace back to the starting vertex by iterating over their parents.');
          // GUI - set the goal as the front and remove current as front
          step.set_cell_class(neighbor_pos, 'cell_front');
          step.set_cell_class(expanded_pos, 'cell_front', true);
          step.set_list_description('c', 'Neighbor ('.concat(neighbor_pos.i, ', ', neighbor_pos.j, ') is the <b>GOAL</b>!'));
          
          // trace back to start
          step = this.add_step(true);
          step.edit_list_item('c', 0, [
            '('.concat(neighbor_pos.i, ', ', neighbor_pos.j, ')'), 
            goal_cost.toFixed(2), 
            goal_cost.toFixed(2), 
            0, 
            '('.concat(expanded_pos.i, ', ', expanded_pos.j, ')'), 
          ]);
          while (true) {
            expanded_vertex = neighbor_vertex.source;
            if (expanded_vertex === undefined)
              break; // at start
            // step = this.add_step();
            step.draw_path(neighbor_vertex.position, expanded_vertex.position, UIPath.PATH);
            neighbor_vertex = expanded_vertex;
          }
          path_found = true;
          break;
        }
        
        // for a valid neighbor
        // calculate the tentative g cost
        
        tentative_g = this.get_g(expanded_vertex, neighbor);
        if (neighbor_vertex.gcost > tentative_g.total) {
          // add neighbor to open list if it has cheaper g cost
          // calculate h cost?
          if (neighbor_vertex.hcost === Infinity) {
            // calculate h cost because this is a new vertex
            this.update_f(neighbor_vertex, tentative_g, this.get_h(neighbor_vertex));
            step.set_list_description('c', 'Neighbor ('.concat(neighbor_pos.i, ', ', neighbor_pos.j, ') is <b>new</b>. Add this to the open-list with the current vertex as parent.'));
          } else {
            // vertex encountered before, just update g cost, no need recalc h cost
            this.update_g(neighbor_vertex, tentative_g);
            step.set_list_description('c', "Neighbor's (".concat(
              neighbor_pos.i, ', ', neighbor_pos.j, 
              ') parent is (', 
              neighbor_vertex.source.position.i, ', ', neighbor_vertex.source.position.j, 
              '), but it is <b>g-cost cheaper to go to it from the current vertex</b>. Update the neighbor with the current vertex as parent, and put it into the open-list. </br>The previous open-list item, added with the neighbor and its previous parent, will be ignored.'));
          }
          
          // update this neighbor_vertex with the expanded_vertex
          neighbor_vertex.source = expanded_vertex;
          
          // add to open list
          idx = this.open_list.add(expanded_vertex, neighbor_vertex);
          step.insert_list_item('ol', idx, [
            '('.concat(neighbor_pos.i, ', ', neighbor_pos.j, ')'), 
            neighbor_vertex.fcost.toFixed(2),
            neighbor_vertex.gcost.toFixed(2),
            neighbor_vertex.hcost.toFixed(2),
            '('.concat(expanded_pos.i, ', ', expanded_pos.j, ')')
            ]);
          step.set_list_description('ol', 'Added neighbor vertex ('.concat(neighbor_pos.i, ', ', neighbor_pos.j, ') after f-cost and h-cost sorting'));
          step.color_list_item('ol', idx, true);
          
          // GUI - add a path to cheapest source, and erase any existing paths
          step.remove_paths(neighbor_pos);
          step.draw_path(neighbor_pos, expanded_pos, UIPath.TRACE);
          
          // GUI - update cell class and text
          step.set_cell_text(neighbor_pos, neighbor_vertex.fcost.toFixed(1));
          step.set_cell_class(neighbor_pos, 'cell_encountered');
          
          step = this.add_step();
          step.color_list_item('ol', idx, false);
        } else {
          step.set_list_description('c', 'Neighbor ('.concat(
            neighbor_pos.i, ', ', neighbor_pos.j, 
            ') is <b>g-cost cheaper to visit from its parent</b> than from the current vertex. <em>Skip</em>'));
          step = this.add_step();
        }
        step.set_cell_focus(neighbor_pos, false);
      }
      step.major = true;
      // break out of while loop here if path is found
      if (path_found === true)
        break;
      // GUI - update expanded vertex as visited
      step.set_cell_class(expanded_pos, 'cell_visited');
    }
    // check if the while loop found the path
    if (path_found === false) {
      step = this.add_step(true);
      step.set_info_text('i', 'NO PATH FOUND!!');
    } else {
      step.set_info_text('i', '<b>Complete</b>! The path costs (g-cost) $'.concat(goal_cost.toFixed(2)));
      step.set_list_description('c', '<b>The <em>Goal</em> Vertex</b>');
    }
    step.set_list_description('ol', 'Items left in open list');
  }
  get_neighbors(expanded_vertex) {
    // the neighboring vertex fcost, source are not initialised / recalculated
    var vertex, next_position, next_cell, d, c, obs;
    var neighbors = [];
    for (const ord of Dir.list_dirs()) {
      next_position = expanded_vertex.position.add(Dir.dir_to_vec(ord));
      next_cell = this.map.cells(next_position);
      if (next_cell === null) {
        vertex = null;
        obs = undefined;
      } else {
        vertex = this.graph.vertices(next_position)
        obs = next_cell.is_obstacle();
      }
      // get ordinal / cardinal steps
      if (Dir.is_ordinal(ord)) {
        d = 1; c = 0;
      } else {
        d = 0; c = 1;
      }
      neighbors[ord] = {
        num_ordinals: d,
        num_cardinals: c,
        vertex: vertex,
        obstacle : obs,
        position: next_position
      }
    }
    return neighbors;
  }
  get_g(source, neighbor) {
    // neighbor returned from get_neighbors above. Must contain
    // calculate g cost object
    var gs = source.f.g;
    return new AStar.Cost(
      gs.ordinals + neighbor.num_ordinals,
      gs.cardinals + neighbor.num_cardinals
    );
  }
  update_g(vertex, g) {
    vertex.f.g = g;
    var h = vertex.f.h;
    // the below needs to be calculated this way to avoid floating point problems
    vertex.f.total = h.cardinals + g.cardinals + (g.ordinals + h.ordinals) * Math.SQRT2;
  }
  get_h(vertex) {
    // calculate h cost object
    // get ordinal distance betw. neighbor and goal;
    var p = vertex.position;
    var di = Math.abs(this.goal_position.i - p.i);
    var dj = Math.abs(this.goal_position.j - p.j);
    var c = di - dj, d;
    if (c > 0) {
      d = dj;
    } else {
      d = di;
      c = -c;
    }
    return new AStar.Cost(d, c);
  }
  update_f(vertex, g, h) {
    vertex.f.g = g;
    vertex.f.h = h;
    // the below needs to be calculated this way to avoid floating point problems
    vertex.f.total = h.cardinals + g.cardinals + (g.ordinals + h.ordinals) * Math.SQRT2;
  }
};
AStar.Cost = class {
  constructor(num_ordinals, num_cardinals) {
    this.ordinals = num_ordinals;
    this.cardinals = num_cardinals;
    this.total = num_ordinals * Math.SQRT2 + num_cardinals;
  }
}
AStar.FCost = class {
  constructor() {
    // var d = prev_gcost.ordinals + add_ordinals;
    // var c = prev_gcost.cardinals + add_cardinals
    this.g = {
      ordinals: Infinity,
      cardinals: Infinity,
      total : Infinity
    };
    this.h = {
      ordinals: Infinity,
      cardinals: Infinity,
      total: Infinity
    };
    this.total = Infinity;
  }
}
AStar.Vertex = class {
  constructor(vec) {
    this.position = vec;
    this.f = new AStar.FCost();
    this.source = undefined;
  }
  get fcost() {
    return this.f.total;
  }
  get hcost() {
    return this.f.h.total;
  }
  get gcost() {
    return this.f.g.total;
  }
};
AStar.Graph = class {
  constructor() {
    this._v = [];
  }
  vertices(vec) {
    // used for creating new vertex or getting a previous vertex
    var tmp = this._v[vec.i];
    if (tmp === undefined) {
      // create new vertex
      var row = [];
      var vertex = new AStar.Vertex(vec);
      row[vec.j] = vertex;
      this._v[vec.i] = row;
      return vertex;
    } 
    tmp = tmp[vec.j];
    if (tmp === undefined)  {
      var vertex = new AStar.Vertex(vec);
      this._v[vec.i][vec.j] = vertex;
      return vertex;
    }
    // return vertex
    return tmp;
  }
};
AStar.OpenList = class {
  constructor() {
    this.list = [];
  }
  add(source, vertex) {
    var fcost = vertex.fcost, hcost = vertex.hcost;
    var v;
    for (var q=0; q<this.list.length; q++) {
      v = this.list[q].vertex;
      if (fcost == v.fcost && hcost < v.hcost || fcost < v.fcost) {
        // comparing hcost is actly an optimisation and tie breaker
        this.list.splice(q, 0, {source: source, vertex: vertex});
        return q;
      }
    }
    // not encountered, most expensive
    this.list.push({source: source, vertex: vertex});
    return this.list.length - 1;
  }
  get_lowest_fcost_node() {
    return this.list.shift();
  }
  peek_lowest_fcost_node() {
    return this.list[0];
  }
  is_not_empty() {
    return this.list.length !== 0;
  }
};
/*
AStar.GraphRecord = class {
  constructor(num_i, num_j) {
    this.cells = [];
    var row;
    for (var i=0; i<num_i; i++) {
      row = [];
      for (var j=0; j<num_j; j++) {
        row.push(new AStar.VertexRecord(i, j))
      }
    }
  }
};
AStar.VertexRecord = class {
  constructor(i, j) {
    this.position = new Vec(i,j);
    this.f = Infinity;
    this.g = Infinity;
    this.h = Infinity;
    this.source = undefined;
  }
};
AStar.Records = class {
  constructor(graph, open_list) {
    this.graph;
  }
}
*/
new AStar();