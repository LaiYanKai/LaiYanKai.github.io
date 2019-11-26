class AStar extends Planner {
  constructor() {
    super('astar', 'A*');
    this.init();
  }
  init() {
    this.graph = new AStar.Graph();
    // init start_vertex
    var start_vertex = this.graph.vertices(this.start_position);
    this.update_f(start_vertex, new AStar.Cost(0, 0), this.get_h(start_vertex));
    this.graph = new AStar.Graph();
    this.open_list = new AStar.OpenList();
    this.open_list.add(undefined, start_vertex);
  }
  run() {
    this.init();
    var neighbors, expanded_vertex, expanded_node, step, tentative_g, neighbor_vertex, expanded_pos, neighbor_pos;
    var path_found = false;
    var front_pos, prev_pos = undefined;
    var open_list = this.open_list;
    var goal_cost = Infinity;
    this.new_info_text_pane(['info', 'Status'], 'Exploring...');
    while (open_list.is_not_empty()) {
      // get the vertex with lowest fcost from open_list
      expanded_node = open_list.get_lowest_fcost_node();
      expanded_vertex = expanded_node.vertex;
      // ignore if expanded vertex has a source vertex that is different from the source vertex recorded in the open list. 
      // This is because the expanded vertex already has a cheaper source.
      // current vertex may have already been added prior to the cheaper source update
      if (expanded_node.source !== undefined && expanded_vertex.source.position.equals(expanded_node.source.position) === false)
        continue;
      // add a GUI Step - update the front cell
      step = this.add_step();
      if (prev_pos !== undefined)
        step.set_cell_class(prev_pos, 'cell_front', true);
      expanded_pos = expanded_vertex.position;
      step.set_cell_class(expanded_pos, 'cell_front');
      prev_pos = expanded_pos;
      
      // get neighbors
      neighbors = this.get_neighbors(expanded_vertex);
      for (const neighbor of neighbors) {
        neighbor_vertex = neighbor.vertex;
        if (neighbor_vertex === null) 
          // out of map, continue
          continue;
        neighbor_pos = neighbor_vertex.position
        if (neighbor.obstacle ===  true) {
          // neighbor is an obstacle, continue
          step.set_cell_text(neighbor_pos, 'OBS');
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
          step.set_info_text('info', 'PATH FOUND!');
          // GUI - set the goal as the front and remove current as front
          step.set_cell_class(neighbor_pos, 'cell_front');
          step.set_cell_class(expanded_pos, 'cell_front', true);
          
          // trace back to start
          var start_trace = true;
          while (true) {
            expanded_vertex = neighbor_vertex.source;
            if (expanded_vertex === undefined)
              break; // at start
            step = this.add_step();
            if (start_trace === true) {
              step.set_info_text('info', 'Tracing back to start...');
              start_trace = false;
            }
            step.draw_path(neighbor_vertex.position, expanded_vertex.position);
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
          } else {
            // vertex encountered before, just update g cost, no need recalc h cost
            this.update_g(neighbor_vertex, tentative_g);
          }
          
          // update this neighbor_vertex with the expanded_vertex
          neighbor_vertex.source = expanded_vertex;
          
          // add to open list
          this.open_list.add(expanded_vertex, neighbor_vertex);
          
          // GUI - add a path to cheapest source, and erase any existing paths
          step.remove_paths(neighbor_pos);
          step.draw_path(neighbor_pos, expanded_pos, 'path_trace');
          
          // GUI - update cell class and text
          step.set_cell_text(neighbor_pos, neighbor_vertex.fcost.toFixed(1));
          step.set_cell_class(neighbor_pos, 'cell_encountered');
        }
      }
      // break out of while loop here if path is found
      if (path_found === true)
        break;
      // GUI - update expanded vertex as visited
      step.set_cell_class(expanded_pos, 'cell_visited');
    }
    // check if the while loop found the path
    if (path_found === false) {
      step = this.add_step();
      step.set_info_text('info', 'NO PATH FOUND!!');
    } else {
      step.set_info_text('info', 'Complete! Goal cost (g cost) is $'.concat(goal_cost.toFixed(3)));
    }
  }
  get_neighbors(expanded_vertex) {
    // the neighboring vertex fcost, source are not initialised / recalculated
    var vertex, next_position, next_cell, d, c, obs;
    var neighbors = [];
    for (const ord of Ord.list) {
      next_position = expanded_vertex.position.add(Ord.ord_to_vec(ord));
      next_cell = this.map.cells(next_position);
      if (next_cell === null) {
        vertex = null;
        obs = undefined;
      } else {
        vertex = this.graph.vertices(next_position)
        obs = next_cell.is_obstacle();
      }
      // get diagonal / cardinal steps
      if (Ord.is_diagonal(ord)) {
        d = 1; c = 0;
      } else {
        d = 0; c = 1;
      }
      neighbors[ord] = {
        num_diagonals: d,
        num_cardinals: c,
        vertex: vertex,
        obstacle : obs
      }
    }
    return neighbors;
  }
  get_g(source, neighbor) {
    // neighbor returned from get_neighbors above. Must contain
    // calculate g cost object
    var gs = source.f.g;
    return new AStar.Cost(
      gs.diagonals + neighbor.num_diagonals,
      gs.cardinals + neighbor.num_cardinals
    );
  }
  update_g(vertex, g) {
    vertex.f.g = g;
    var h = vertex.f.h;
    // the below needs to be calculated this way to avoid floating point problems
    vertex.f.total = h.cardinals + g.cardinals + (g.diagonals + h.diagonals) * Math.SQRT2;
  }
  get_h(vertex) {
    // calculate h cost object
    // get diagonal distance betw. neighbor and goal;
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
    vertex.f.total = h.cardinals + g.cardinals + (g.diagonals + h.diagonals) * Math.SQRT2;
  }
};
AStar.Cost = class {
  constructor(num_diagonals, num_cardinals) {
    this.diagonals = num_diagonals;
    this.cardinals = num_cardinals;
    this.total = num_diagonals * Math.SQRT2 + num_cardinals;
  }
}
AStar.FCost = class {
  constructor() {
    // var d = prev_gcost.diagonals + add_diagonals;
    // var c = prev_gcost.cardinals + add_cardinals
    this.g = {
      diagonals: Infinity,
      cardinals: Infinity,
      total : Infinity
    };
    this.h = {
      diagonals: Infinity,
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
    this.closed = false;
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
        return;
      }
    }
    // not encountered, most expensive
    this.list.push({source: source, vertex: vertex});
  }
  get_lowest_fcost_node() {
    return this.list.shift();
  }
  is_not_empty() {
    return this.list.length !== 0;
  }
};
new AStar();