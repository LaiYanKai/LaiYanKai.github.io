class AStar extends Planner {
  // get Graph() { return class Graph {
    // get Vertex() { return class Vertex {
      // get Cost() { return class Cost {
        // // required for floating point issues
        // constructor(diagonal, cardinal) {
          // this.update(diagonal, cardinal);
        // }
        // update(diagonal, cardinal) {
          // this.diagonal = diagonal;
          // this.cardinal = cardinal;
          // this.total = diagonal * Math.SQRT2 + cardinal;
        // }
      // }};
      // constructor(i, j) {
        // this.position = new Vec(i, j);
        // this.cost_obj = new this.Cost(Infinity, Infinity);
        // this.visited = false;
        // this.source = undefined;
        // // if (source_vertex !== undefined)
          // // this.check_for_cheaper_source(source_vertex); //update the cost
      // }
      // check_for_cheaper_source(potential_source_vertex) {
        // // returns true and update the source vertex if the source vertex has less cost
        // // returns false otherwise
        // if (this.source === undefined) {
          // this.source = potential_source_vertex;
          // var is_diagonal = Ord.is_diagonal(Ord.vecs_to_ord(potential_source_vertex.position, this.position));
          // if (is_diagonal === true)
            // this.cost_obj.update(potential_source_vertex.diagonal_cost + 1, potential_source_vertex.cardinal_cost);
          // else
            // this.cost_obj.update(potential_source_vertex.diagonal_cost, potential_source_vertex.cardinal_cost + 1);
          // return true;
        // } else {
          // var is_diagonal = Ord.is_diagonal(Ord.vecs_to_ord(potential_source_vertex.position, this.position));
          // if (is_diagonal === true)
            // var new_cost_obj = new this.Cost(potential_source_vertex.diagonal_cost + 1, potential_source_vertex.cardinal_cost);
          // else
            // var new_cost_obj = new this.Cost(potential_source_vertex.diagonal_cost, potential_source_vertex.cardinal_cost + 1);
          // if (new_cost_obj.cost < this.cost) {
            // this.source = potential_source_vertex;
            // this.cost_obj = new_cost_obj;
            // return true;
          // }
          // return false;
        // }
        
        // return false;
      // }
      // get cost() {
        // return this.cost_obj.total;
      // }
      // get diagonal_cost() {
        // return this.cost_obj.diagonal;
      // }
      // get cardinal_cost() {
        // return this.cost_obj.cardinal
      // }
      // get i() {
        // return this.position.i;
      // }
      // get j() {
        // return this.position.j;
      // }
    // }};
    // constructor(goal_vec) {
      // this.goal_vec = goal_vec;
      // this._vertices = [];
    // }
    // vertices(vec) {
      // // used for creating new vertex or getting a previous vertex
      // if (this._vertices[vec.i] === undefined) {
        // // create new vertex
        // var row = [];
        // var vertex = new this.Vertex(vec.i, vec.j);
        // row[vec.j] = vertex;
        // this._vertices[vec.i] = row;
        // return vertex;
      // } else if (this._vertices[vec.i][vec.j] === undefined)  {
        // var vertex = new this.Vertex(vec.i, vec.j);
        // this._vertices[vec.i][vec.j] = vertex;
        // return vertex;
      // } else {
        // // return vertex
        // return this._vertices[vec.i][vec.j];
      // }
    // }
  // }};
  constructor() {
    super('astar', 'A*');
    this.init();
  }
  init() {
    this.graph = new this.Graph();
    var start_vertex = this.graph.vertices(this.start_position);
    start_vertex.f.g.diagonals;
    this.unvisited_list = new this.UnvisitedList(start_vertex);
    this.unvisited_list.add_encounter(start_vertex);
  }
  run() {
    this.init() {
      
    }
  }
  get_neighbors(current_vec) {
    var vertex, next_position, next_cell, d, c, obs;
    var neighbors = [];
    for (const ord of Ord.list) {
      next_position = vertex.position.add(Ord.ord_to_vec(ord));
      next_cell = this.map.cells(next_position);
      if (next_cell === null) {
        vertex = null;
        obs = undefined;
      } else {
        vertex = this.graph.vertices(next_position)
        obs = next_cell.is_obstacle;
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
  }
  get_fcost(source_vertex, neighbor) {
    var f = new AStar.FCost();
    // calculate g cost
    var g = f.g; var gs = source_vertex.f.g;
    g.diagonals = gs.diagonals + neighbor.num_diagonals;
    g.cardinals = gs.cardinals + neighbor.num_cardinals;
    g.total = g.diagonals * Math.SQRT2 + g.cardinals;
    // calculate h cost
    var h = f.h; var hs = source_vertex.h.g;
    // get diagonal distance betw. neighbor and goal;
    var p = neighbor.vertex.position;
    var di = Math.abs(this.goal_position.i - p.i);
    var dj = Math.abs(this.goal_position.j - p.j);
    var c = di - dj, d;
    if (c > 0) {
      d = dj;
    } else {
      d = di;
      c = -c;
    }
    h.diagonals = d;
    h.cardinals = c;
    h.total = h.diagonals * Math.SQRT2 + h.cardinals;
    return f;
  }
};
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
    this.total = Infinity
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
    var tmp = this_v[vec.i];
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
    this.queue = [];
  }
  add_encounter(vertex) {
    for (var q=0; q<this.queue.length; q++) {
      if (vertex.fcost < this.queue[q].fcost) {
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
};
new AStar();