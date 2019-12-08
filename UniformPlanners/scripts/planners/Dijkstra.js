class Dijkstra extends Planner {
  get UnvisitedList() { return class UnvisitedList {
    constructor() {
      this.queue = [];
    }
    add_encounter(vertex) {
      for (var q=0; q<this.queue.length; q++) {
        if (vertex.cost < this.queue[q].cost) {
          this.queue.splice(q, 0, vertex);
          return;
        }
      }
      // not encountered, most expensive
      this.queue.push(vertex);
    }
    get_min_vertex() {
      return this.queue.shift();
    }
    is_populated() {
      return this.queue.length !== 0;
    }
  }};
  get Graph() { return class Graph {
    get Vertex() { return class Vertex {
      get Cost() { return class Cost {
        // required for floating point issues
        constructor(diagonal, cardinal) {
          this.update(diagonal, cardinal);
        }
        update(diagonal, cardinal) {
          this.diagonal = diagonal;
          this.cardinal = cardinal;
          this.total = diagonal * Math.SQRT2 + cardinal;
        }
      }};
      constructor(i, j) {
        this.position = new Vec(i, j);
        this.cost_obj = new this.Cost(Infinity, Infinity);
        this.visited = false;
        this.source = undefined;
        // if (source_vertex !== undefined)
          // this.check_for_cheaper_source(source_vertex); //update the cost
      }
      check_for_cheaper_source(potential_source_vertex) {
        // returns true and update the source vertex if the source vertex has less cost
        // returns false otherwise
        if (this.source === undefined) {
          this.source = potential_source_vertex;
          var is_diagonal = Ord.is_diagonal(Ord.vecs_to_ord(potential_source_vertex.position, this.position));
          if (is_diagonal === true)
            this.cost_obj.update(potential_source_vertex.diagonal_cost + 1, potential_source_vertex.cardinal_cost);
          else
            this.cost_obj.update(potential_source_vertex.diagonal_cost, potential_source_vertex.cardinal_cost + 1);
          return true;
        } else {
          var is_diagonal = Ord.is_diagonal(Ord.vecs_to_ord(potential_source_vertex.position, this.position));
          if (is_diagonal === true)
            var new_cost_obj = new this.Cost(potential_source_vertex.diagonal_cost + 1, potential_source_vertex.cardinal_cost);
          else
            var new_cost_obj = new this.Cost(potential_source_vertex.diagonal_cost, potential_source_vertex.cardinal_cost + 1);
          if (new_cost_obj.cost < this.cost) {
            this.source = potential_source_vertex;
            this.cost_obj = new_cost_obj;
            return true;
          }
          return false;
        }
        
        return false;
      }
      get cost() {
        return this.cost_obj.total;
      }
      get diagonal_cost() {
        return this.cost_obj.diagonal;
      }
      get cardinal_cost() {
        return this.cost_obj.cardinal
      }
      get i() {
        return this.position.i;
      }
      get j() {
        return this.position.j;
      }
    }};
    constructor() {
      this._vertices = [];
    }
    vertices(position) {
      // used for creating new vertex or getting a previous vertex
      if (this._vertices[position.i] === undefined) {
        // create new vertex
        var row = [];
        var vertex = new this.Vertex(position.i, position.j);
        row[position.j] = vertex;
        this._vertices[position.i] = row;
        return vertex;
      } else if (this._vertices[position.i][position.j] === undefined)  {
        var vertex = new this.Vertex(position.i, position.j);
        this._vertices[position.i][position.j] = vertex;
        return vertex;
      } else {
        // return vertex
        return this._vertices[position.i][position.j];
      }
    }
  }};
  constructor() {
    super('dijkstra', 'Dijkstra');
    this.reset();
  }
  reset() {
    this.graph = new this.Graph();
    var start_vertex = this.graph.vertices(this.start_position);
    start_vertex.cost_obj.update(0, 0);
    this.unvisited_list = new this.UnvisitedList(start_vertex);
    this.unvisited_list.add_encounter(start_vertex);
  }
  run() {
    this.reset();
    this.new_info_text_pane(['info', 'Status'], 'Exploring...');
    var ul = this.unvisited_list;
    var step, vertex, next_position, next_cell, prev_vertex, next_vertex, vertex, n, m;
    var path_found = false;
    var prev_vertex = undefined;
    var goal_cost = Infinity;
    while (ul.is_populated()) {
      vertex = ul.get_min_vertex();
      // skip if this vertex is already visited (neighbours explored)
      if (vertex.visited === true)
        continue;
      // mark as visited
      vertex.visited = true;
      // colour the current cell
      step  = this.add_step();
      step.set_cell_class(vertex.position, 'cell_front');
      // step.set_cell_rgb(vertex.i, vertex.j, 1, 0.9, 0.88);
      if (prev_vertex !== undefined)
        step.set_cell_class(prev_vertex.position, 'cell_front', true);
      // expand the neighbours
      for (const ord of Ord.list) {
        next_position = vertex.position.add(Ord.ord_to_vec(ord));
        // check if goal is reached
        if (next_position.equals(this.goal_position)) {
          next_vertex = this.graph.vertices(next_position);
          next_vertex.source = vertex;
          goal_cost = vertex.cost + (Ord.is_diagonal(ord) ? Math.SQRT2 : 1);
          // GUI
          step = this.add_step();
          step.set_info_text('info', 'PATH FOUND!');
          step.set_cell_class(next_vertex.position, 'cell_front');
          step.set_cell_class(vertex.position, 'cell_front', true);
          // trace path to start
          vertex = next_vertex;
          var start_trace = true;
          while (true) {
            // draw the path
            next_vertex = vertex.source;
            if (next_vertex === undefined)
              break;
            // step = this.add_step();
            if (start_trace === true) {
              step.set_info_text('info', 'Tracing back to start...');
              start_trace = false;
            }
            step.draw_path(vertex.position, next_vertex.position, UIPath.PATH);
            vertex = next_vertex;
          }
          path_found = true;
          break;
        }
        // check if cell is inside the map
        next_cell = this.map.cells(next_position);
        if (next_cell === null) //  out of map
          continue;
        // check if cell is obstacle
        if (next_cell.is_obstacle()) {// is obstacle
          step.set_cell_text(next_position, 'OBS');
          continue;
        }
        // if cell is available, we add the vertex if not encountered, or get the vertex if encountered
        next_vertex = this.graph.vertices(next_position);
        // skip this vertex if already visited
        if (next_vertex.visited === true) 
          continue;         
        // check if this vertex is the cheapest to expand into next_vertex
        if (next_vertex.check_for_cheaper_source(vertex)) { 
          // it is cheaper. Add it to the unvisited_list
          this.unvisited_list.add_encounter(next_vertex);
          step.draw_path(next_vertex.position, vertex.position, UIPath.TRACE);
          
          // GUI
          step.set_cell_text(next_position, next_vertex.cost.toFixed(1));
          step.set_cell_class(next_position, 'cell_encountered');
        }
      }
      if (path_found === true)
        break;
      step.set_cell_class(vertex.position, 'cell_visited');
      prev_vertex = vertex;
    }
    if (path_found === false) {
      step = this.add_step();
      step.set_info_text('info', 'NO PATH FOUND!!');
    } else {
      step.set_info_text('info', 'Complete! The path costs $'.concat(goal_cost.toFixed(2)));
    }
  }
}
new Dijkstra();