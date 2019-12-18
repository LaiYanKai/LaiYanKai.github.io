class JPS extends Planner {
  constructor() {
    super ('jps', 'Jump Point S.', [
      'blocking',
      'origin',
      'anticlockwise',
      'metric',
      'fh_optimisation',
      'time_ordering',
      'gh_weights',
    ]);
  }
  find_g(parent_vertex, child_vertex) {
    var g = JPS.Cost.from_vecs(parent_vertex.position, child_vertex.position, this.wg);
    return JPS.Cost.add(parent_vertex.g, g);
  }
  update_g(vertex, g) {
    if (g !== undefined) {
      vertex.g = g;
    } else {
      vertex.g = new JPS.Cost(0, 0, this.wg);
    }
    vertex.f = JPS.Cost.add(vertex.g, vertex.h);
  }
  init_neighbor_info(start_dir) {
    var nb_dirs, nb_vecs; var info = {};
    if (Dir.is_ordinal(start_dir)) {
      nb_dirs = Dir.nearest(start_dir, this.s*3);
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
      nb_dirs = Dir.nearest(start_dir, this.s*2);
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
    return info;
  }
  get_vertex(pos, direction_vec) {
    return this.graph.vertices(pos.add(direction_vec));
  }
  jump(start_vertex, start_dir) {
    var step;
    step = this.add_step();
    // start_vertex must be inside the map
    // check if this vertex is a goal
    if (start_vertex.position.equals(this.goal_position)) {
      console.log('hi');
      this.path_found = true;
      return true;
    }
    var start_dir_is_ordinal = Dir.is_ordinal(start_dir);
    // init neighbor infos (dirs and direction vectors)
    var nb_info = this.init_neighbor_info(start_dir);
    // init vertices
    var xp_vertex=start_vertex, xp_pos=start_vertex.position;
    var obs_vertices = [
      this.get_vertex(xp_pos, nb_info.obstacle.vecs[0]),
      this.get_vertex(xp_pos, nb_info.obstacle.vecs[1])
    ];
    var empty_vertices, empty_vertex, obs_vertex, blocking_vertices, blocking_vertex, 
      front_vertex, old_g, tentative_g;
    // begin
    console.log('Jumpstart: ', start_vertex.toString(), start_dir, 'parent:', start_vertex.parent.position.toString());
    var jump_point_added = false, jump_point_added_cardinally = false;
    while(jump_point_added === false) {
      // --------------------- Is this Vertex the goal? ---------------------
      if (xp_vertex.position.equals(this.goal_position)) {
        xp_vertex.parent = start_vertex;
        this.update_g(xp_vertex, this.find_g(start_vertex, xp_vertex));
        this.path_found = true;
        step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
        return true;
      }
      // get the empty vertices, vertices which should be empty for successors
      empty_vertices = [
        this.get_vertex(xp_pos, nb_info.empty.vecs[0]),
        this.get_vertex(xp_pos, nb_info.empty.vecs[1])
      ];      
      // get the front vertex
      front_vertex = this.get_vertex(xp_pos, nb_info.front.vec);
      if (start_dir_is_ordinal === true) {
        // --------------------- Setup Diagonal Blocking Vertices for Ordinal -------------------
        blocking_vertices = [
          this.get_vertex(xp_pos, nb_info.blocking.vecs[0]),
          this.get_vertex(xp_pos, nb_info.blocking.vecs[1])
        ];
        // --------------------- Check Cardinals -------------------
        for (var i=0; i<2; i++) {
          blocking_vertex = blocking_vertices[i];
          // check if this vertex is an obstacle
          if (blocking_vertex === null) {
            // console.log(xp_vertex.position, 'D. cardinal vertex outside map, Dir:', nb_info.blocking.dirs[i]);
            continue;
          } 
          if (blocking_vertex.obstacle === true) {
            // console.log(xp_vertex.position, 'D. cardinal vertex is blocked, Dir:', nb_info.blocking.dirs[i]);
            continue;
          }
          // get the movement cost
          old_g = xp_vertex.g;
          this.update_g(xp_vertex, this.find_g(start_vertex, xp_vertex));
          tentative_g = this.find_g(xp_vertex, blocking_vertex);
          if (tentative_g.total < blocking_vertex.g_cost) {
            // it is cheaper
            this.update_g(blocking_vertex, tentative_g);
            blocking_vertex.parent = xp_vertex;
            // update parent vertex for xp_vertex
            if (start_vertex.position.equals(xp_vertex.position) === false)
              xp_vertex.parent = start_vertex;
            // now check cardinally
            console.log(xp_vertex.position, 'D. check cardinal from', blocking_vertex.position.toString(), ' Dir:', nb_info.blocking.dirs[i], xp_vertex.g_cost, tentative_g.total);
            jump_point_added_cardinally = this.jump(blocking_vertex, nb_info.blocking.dirs[i])
            jump_point_added = jump_point_added || jump_point_added_cardinally;
            step.draw_path(blocking_vertex.position, xp_vertex.position, UIPath.TRACE);
            // goal reached?
            if (this.path_found === true)
              return true;
          } else {
            //don't bother checking
            console.log(xp_vertex.position, 'D. cheaper path alr exists at cardinal', blocking_vertex.position.toString(), xp_vertex.g_cost, tentative_g.total);
            this.update_g(xp_vertex, old_g);
            step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
          }
        }
        
        // Cardinal check added jumppoints
        if (jump_point_added === true && front_vertex !== null && front_vertex.obstacle === false) {
          // add the diagonal front
          this.update_g(front_vertex, this.find_g(xp_vertex, front_vertex));
          front_vertex.parent = xp_vertex;
          console.log(xp_vertex.position, 'D. add front at ', front_vertex.position.toString());
          this.list.add(start_dir, front_vertex, xp_vertex);
          step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
        }
      } else { // cardinal expansion
        if (front_vertex === null) {
          // --------------------- Check if Front Vertex is Outside for Cardinal -------------------
          console.log(xp_vertex.position, 'C. front_vertex outside, jump pts. no longer possible. Dir', start_dir);
          step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
          break;
        } else if (this.options.blocking === true && (front_vertex.obstacle === true)) {
          // --------------------- Check for Diagonal Blocking for Cardinal -------------------
          // for the CARDINAL case, where the front_vertex is an obstacle and diagonal blocking exists
          console.log(xp_vertex.position, 'C. front is obstacle, & diag. blk Dir', start_dir, 'Exit Search');
          step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
          // can't move forward either
          break;
        }
      }
      console.log('check fn')
      // Check for successors
      for (var i=0; i<2; i++) {
        empty_vertex = empty_vertices[i];
        obs_vertex = obs_vertices[i];
        // --------------------- Is the Blocking Vertex Accessible && Diagonal blocking ? ---------------------
        if (start_dir_is_ordinal === true && this.options.blocking === true) {
          blocking_vertex = blocking_vertices[i];
          if (blocking_vertex === null) {
            console.log(xp_vertex.position, 'D. blocking vertex outside map, Dir', nb_info.blocking.dirs[i]);
            continue;
          } else if (blocking_vertex.obstacle === true) {
            // for ordinal directions, jump points not traversable because of diagonal blocking, regardless of obstacle vertices
            console.log(xp_vertex.position, 'D. jump pt diagonally blocked, Dir', nb_info.blocking.dirs[i]);
            continue;
          }
          console.log('blk', empty_vertex.position.toString(), obs_vertex.position.toString());
        }
        // --------------- Are the Obstacle & Empty Vertices Outside the Map? ----------------
        if (obs_vertex === null) {// then empty_vertices[i] also null
          // console.log(xp_vertex.position, 'obstacle vertex outisde map, Dir', nb_info.obstacle.dirs[i])
          continue;
        } // if obs_vertex not null and empty_vertices null, front is also null (checked in front)
        // ------------------------------ Is there a Forced Neighbor ? -----------------------
        if (obs_vertex.obstacle === true && empty_vertex.obstacle === false) {
          old_g = xp_vertex.g;
          // Get the tentative cost from start to xp
          tentative_g = this.find_g(start_vertex, xp_vertex);
          this.update_g(xp_vertex, tentative_g);
          // Get the tentative cost
          tentative_g = this.find_g(xp_vertex, empty_vertex);
          // --------------- Is Forced Neighbor Cheaper to get to ? ----------------
          if (tentative_g.total < empty_vertex.g_cost) {
            // --- cheaper to get to ---
            // Add the current xp_vertex as jumppoint (just set it as parent for spawned jumppoints)
            // Find the cost from start to xp, if they are different
            if (xp_vertex.position.equals(start_vertex.position) === false) {
              xp_vertex.parent = start_vertex; // prevent looping
            }
            // find the cost from xp to empty
            empty_vertex.parent = xp_vertex;
            this.update_g(empty_vertex, tentative_g);
            // Add FN to open list
            console.log(xp_vertex.parent.position, xp_vertex.position.toString(), ' add fn at ', empty_vertex.position);
            this.list.add(nb_info.empty.dirs[i], empty_vertex, xp_vertex);
            step.draw_path(empty_vertex.position, xp_vertex.position, UIPath.TRACE);
            jump_point_added = true;
          } else {
            // --- cheaper path already exists ---
            // restore the g-cost and parent
            this.update_g(xp_vertex, old_g);
            console.log('cheaper path already exists at', empty_vertex.position);
            step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
          }
        }
      }
      // Add front to open list
      if (jump_point_added === true && front_vertex !== null && front_vertex.obstacle === false) {
        if (xp_vertex.position.equals(start_vertex.position) === false)
          xp_vertex.parent = start_vertex;
        console.log(xp_vertex.parent.position, xp_vertex.position.toString(),  ' add front at ', front_vertex.position);
        front_vertex.parent = xp_vertex;
        this.update_g(front_vertex, this.find_g(xp_vertex, front_vertex));
        this.list.add(start_dir, front_vertex, xp_vertex);
        step.draw_path(front_vertex.position, xp_vertex.position, UIPath.TRACE);
        step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
      }
      // --------------------- Is the Front Vertex an Obstacle? ---------------------
      if (front_vertex === null) {
        // for diagonal
        
        console.log(xp_vertex.position, 'D. front outside map, Dir:', start_dir);
        step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
        break;
      } else if (front_vertex.obstacle === true) {
        // stop the jumping
        
        console.log(xp_vertex.position, ' front blocked by obs, Dir', start_dir);
        step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
        break;
      }
      // diagonal blocking check for ordinal fronts
      if (start_dir_is_ordinal === true && blocking_vertices[0].obstacle === true && blocking_vertices[1].obstacle === true) {
        console.log(xp_vertex.position, ' front blocked by diagonal blocking, Dir', start_dir);
        step.draw_path(xp_vertex.position, start_vertex.position, UIPath.TRACE);
        break;
      }
      
      // move forward
      xp_vertex = front_vertex;
      xp_pos = xp_vertex.position;
      if (start_dir_is_ordinal === true)
        obs_vertices = blocking_vertices;
      else
        obs_vertices = empty_vertices;
    }
    return jump_point_added;
  }
  run() {
    var step;
    // -------------------------------------------- Init --------------------------------------------
    var node, xp_vertex, nb_vertex, xp_pos, nb_pos, nb_pos_str, xp_pos_str, nb_cost_str, xp_cost_str, 
      xp_dir, nb_vecs, nb_vec, nb_dirs, was_obs, break_state, break_result;
    // init options for the metric
    switch (this.options.metric) {
      case Dist.DIAGONAL:
        JPS.Cost = Cost_DIA;
        break;
      case Dist.MANHATTAN:
        JPS.Cost = Cost_MAN;
        break;
      case Dist.EUCLIDEAN:
        JPS.Cost = Cost_EUC;
        break;
    }
    // init the gh_weights
    [this.wg, this.wh] = this.options.gh_weights;
    // init the anticlockwise
    this.s = this.options.anticlockwise ? 1 : -1;
    // Graph
    this.graph = new JPS.Graph(this);
    // Open List
    this.list = new JPS.OpenList(this);
    this.path_found = false;
    // Special case for start
    nb_dirs = Dir.list_dirs(this.options.origin, this.options.anticlockwise, Dir.DIAGONAL);
    nb_vecs = nb_dirs.map(Dir.dir_to_vec);
    xp_vertex = this.graph.vertices(this.start_position);
    this.update_g(xp_vertex);
    for (var i=0; i<nb_dirs.length; i++) {
      nb_vertex = this.get_vertex(this.start_position, nb_vecs[i]);
      if (nb_vertex === null || nb_vertex.obstacle === true)
        continue;
      nb_vertex.parent = xp_vertex;
      this.update_g(nb_vertex, this.find_g(xp_vertex, nb_vertex));
      this.jump(nb_vertex, nb_dirs[i]);
    }
    // ------------------------------------ Retrieve Cheapest Vertex ------------------------------------
    while (this.list.is_populated() && this.path_found === false) {
      step = this.add_step(true);
      // retrieve cheapest vertex
      node = this.list.get_cheapest_node();
      xp_vertex = node.vertex;
      xp_pos = xp_vertex.position;
      // get the expanding direction
      xp_dir = node.direction;
      // ----------------------------------- Are Parents Identical? ---------------------------------------
      if (node.parent !== undefined && xp_vertex.parent.position.equals(node.parent.position) === false) {
        // parents are not identical (cheaper path was found), skip
        console.log('parents not the same ', xp_vertex.parent.position.toString(), node.parent.position.toString());
        continue;
      }
      this.jump(xp_vertex, xp_dir);
    } // end of while loop
    var i=0;
    if (this.path_found === true) {
      step = this.add_step(true);
      nb_vertex = this.graph.vertices(this.goal_position);
      while (true) {
        xp_vertex = nb_vertex.parent;
        // do whatever to update
        if (xp_vertex === undefined) {
          break;
        }
        step.draw_path(nb_vertex.position, xp_vertex.position, UIPath.PATH);
        console.log(nb_vertex.position.toString(), xp_vertex.position.toString());
        i++;
        if (i>1000)
          return;
        nb_vertex = xp_vertex;
      }
      console.log('PATH $', this.graph.vertices(this.goal_position).f.toString());
    } else {
      // no path found
      console.log('NO PATH FOUND')
    }
  }
}


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
JPS.Graph = class {
  constructor(planner) {
    this.num_i = planner.map.num_i;
    this.num_j = planner.map.num_j;
    this.v = Array(this.num_i);
    var row, cell;
    for (var i=0; i<this.num_i; i++) {
      row = Array(this.num_j);
      for (var j=0; j<this.num_j; j++) {
        cell = new JPS.Vertex(planner, i, j);
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
JPS.Vertex = class {
  constructor(planner, i, j) {    
    this.position = new Vec(i, j);
    this.g = new JPS.Cost(Infinity, Infinity, planner.g_weight);
    this.h = JPS.Cost.from_vecs(planner.goal_position, this.position, planner.wh);
    this.f = JPS.Cost.add(this.g, this.h);
    this.obstacle = planner.map.cells(this.position).is_obstacle();
    this.parent = undefined;
  }
  toString(vec_dp=0, cost_dp=2) {
    return this.position.toString(vec_dp).concat(' $', this.f.toString(cost_dp));
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
JPS.OpenNode = class {
  constructor(direction, vertex, parent_vertex) {
    this.vertex = vertex;
    this.parent = parent_vertex;
    this.direction = direction;
  }
  has_identical_parents() {
    // checks that the parent is still the same
    var p0 = this.vertex.parent.position;
    var p1 = this.parent.position;
    return p0.i === p1.i && p0.j === p1.j;
  }
}
JPS.OpenList = class {
  constructor(planner) {
    this.q = [];
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
  add(direction, vertex, parent_vertex) {
    var node = new JPS.OpenNode(direction, vertex, parent_vertex);
    console.log('OPENLIST: added ', vertex.position.toString(), vertex.f_cost, 'parent:', parent_vertex.position);
    for (var q=0; q<this.q.length; q++) {
      if (this.is_cheaper(vertex, this.q[q].vertex) === true) {
        this.q.splice(q, 0, node);
        return q;
      }
    }
    // not encountered, most expensive
    this.q.push(node);
    return this.q.length - 1;
  }
  get_cheapest_node() {
    console.log('OPENLIST: retrieved ', this.q[0].vertex.position.toString(), this.q[0].vertex.f_cost);
    return this.q.shift();
  }
  is_populated() {
    return this.q.length !== 0;
  }
}
new JPS();