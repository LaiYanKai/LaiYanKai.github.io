// Number operations
function floatRound(num, dp) {
  return parseFloat(num.toFixed(dp));
}

/* Data structures */
// The map data structure}
// The map data structure containing html path and cells elements
class UIMap {
  constructor(ele_cells, num_i, num_j) {
    // ele_cells is the html element to append the cells to 
    var cell, eles_row;
    this._cells = Array(num_i);
    this.num_i = num_i;
    this.num_j = num_j;
    this.paths = [];
    // use css grid template
    var css = '', css_row, css_cell;
    for (var i=num_i-1; i>=0; i--) {
      eles_row = Array(num_j);
      css_row = '\'';
      for (var j=0; j<num_j; j++) {
        cell = new UICell(i, j);
        ele_cells.appendChild(cell.ele);
        eles_row[j] = cell;
        css_cell = 'c'.concat(i, '_', j);
        cell.ele.style.gridArea = css_cell;
        css_row = css_cell.concat(' ', css_row);
      }
      this._cells[i] = eles_row;
      css = css.concat('\'', css_row);
    }
    ele_cells.style.gridTemplateAreas = css;
  }
  // get from Vec or i and j
  cells(arg0, arg1) {
    var i, j;
    if (arg0 instanceof Vec) {// vec
      j = arg0.j;
      i = arg0.i;
    } else {// i, j
      i = arg0;
      j = arg1;
    }
    if (i < 0 || i >= this.num_i || j < 0 || j >= this.num_j) 
      return null;
    return this._cells[i][j];
  }
  flatten(arg0, arg1) {
    var i, j;
    if (arg0 instanceof Vec) {
      return arg0.i + arg0.j * this.num_i;
    } else {
      return arg0 + arg1 * this.num_i;
    }
  }
  unflatten(k) {
    // a is the first i row (=0) in the penultimate j column
    var i, j=-1, kk=0;
    while (kk <= k) {
      kk += this.num_i;
      j += 1;
    }
    i = k - kk + this.num_i;
    return new Vec(i, j);
  }
}
// The cell data structure contianing html element and methods
class UICell {
  constructor(i, j) {
    var ele = document.createElement('div');
    ele.classList.add('cell');
    ele.style.gridArea = 'c'.concat(i, '_', j);
    this.ele = ele;
    this.idx = new Vec(i, j, true);
    this.weight = 0;
  }
  get i() {
    return this.idx.i;
  }
  get j() {
    return this.idx.j;
  }
  is_obstacle() {
    return this.weight === Infinity;
  }
}
class UIMarkerArrow {
  static build() {
    
  }
  constructor(window_pos, pos, angle) {
    var ele = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ele.classList = 'marker';
    this.ele = ele;
    
    this.position = pos;
    this.edit(window_pos, pos, angle);
  }
  edit(window_pos, pos, angle=0) {
    var ele = this.ele;
    var y = window_pos.y, x = window_pos.x;
    // line_radius is the cap radius. used when box-sizing css is content-box, height is zero, and border is line_radius px
    UIMarkerArrow.build(ele, angle);
    ele.style.transform = 'rotate('.concat(angle, 'deg)');
    ele.style.top = ''.concat(yi+length*Math.sin(angle)/2 - 3.5, 'px');
    ele.style.left = ''.concat(xi-length*(1-Math.cos(angle))/2 - 1.5, 'px');
  
    this.display = true;
  }
  set display(show) {
    if (show === true) {
      this.ele.style.display = 'block';
    } else {
      this.ele.style.display = 'none';
    }
    this.show = show;
  }
}
class UIPath {
  static get TRACE() {return 0};
  static get TRACE2() {return 2};
  static get PATH() {return 1};
  static resize(ele, length) {
    ele.innerHTML = "<path fill='black' d='M 1.5 3 a 1.5 1.5, 0, 0, 0, 0 3 h ".concat(
      length-18, " v 3 l 6 -3 h 12 a 1.5 1.5, 0, 0, 0, 0 -3 h -12 l -6 -3 v 3 z'/>");
    ele.setAttribute('viewBox', "0 0 ".concat(length + 3, " 9"));
  }
  color(type) {
    this.type = type;
    var class_name;
    switch (type) {
      case 0: // trace
      case undefined:
        class_name = 'path_t';
        break;
      case 1: // path
        class_name = 'path_p';
        break;
      case 2: // trace2
        class_name = 'path_t2';
        break;
      default:
        break;
    }
    this.ele.classList = 'path '.concat(class_name);
  }
  constructor(window_start, window_end, start_vec, end_vec, type) {
    var ele = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // set path class
    ele.classList = 'path';
    this.ele = ele;
    
    //edit
    this.start_pos = new Vec(-1, -1);
    this.end_pos = new Vec(-1, -1);
    this.edit(window_start, window_end, start_vec, end_vec, type);
  }
  edit(window_start, window_end, start_vec, end_vec, type) {
    var ele = this.ele;
    var yf = window_end.y, xf = window_end.x, yi = window_start.y, xi = window_start.x;
    // line_radius is the cap radius. used when box-sizing css is content-box, height is zero, and border is line_radius px
    var angle = Math.atan2(yf-yi, xf-xi);
    var length = Math.sqrt(Math.pow(xf-xi, 2) + Math.pow(yf-yi, 2));
    UIPath.resize(ele, length);
    ele.style.width = ''.concat(length + 3, 'px');
    ele.style.transform = 'rotate('.concat(angle * 180 / Math.PI, 'deg)');
    ele.style.top = ''.concat(yi+length*Math.sin(angle)/2 - 3.5, 'px');
    ele.style.left = ''.concat(xi-length*(1-Math.cos(angle))/2 - 1.5, 'px');
    this.start_pos = start_vec;
    this.end_pos = end_vec;
  
    if (type !== undefined) {
      this.color(type)
    }
    this.display = true;
  }
  set display(show) {
    if (show === true) {
      this.ele.style.display = 'block';
    } else {
      this.ele.style.display = 'none';
    }
    this.show = show;
  }
}
// Contains a step of changes made to the UI
class UIStep {
  constructor(major=false, merge=false) {
    // merge are for steps that need to be merged with the next step. This is useful for initial steps.
    this.actions = [];
    this.major = major;
    this.merge = merge;
  }
  /*
  add_record(keys, value) {
    this.actions.push(['r', arguments]);
  }
  set_cell_rgb(i, j, r, g, b, bg=true, border=true) {
    this.actions.push(['cr', arguments]);
  }
  set_cell_hsl(i, j, h, s, l, bg=true, border=true) {
    this.actions.push(['ch', arguments]);
  }
  */
  set_cell_text(vec, txt) {
    this.actions.push(['t', arguments]);
  }
  draw_path(start_vertex, end_vertex, class_name) {
    this.actions.push(['p', arguments]);
  }
  display_path(start_vec, end_vec ,show) {
    this.actions.push(['dp', arguments]);
  }
  remove_paths(start_vec, end_vec) {
    this.actions.push(['rp', arguments])
  }
  set_info_pair(pane_key, pair_key, value, subtitle=undefined) {
    this.actions.push(['ip', arguments]);
  }
  set_info_text(pane_key, value) {
    this.actions.push(['it', arguments]);
  }
  set_cell_class(vec, class_name, remove=false) {
    this.actions.push(['cn', arguments]);
  }
  insert_list_item(pane_key, i, values) {
    this.actions.push(['ili', arguments]);
  }
  remove_list_item(pane_key, i) {
    this.actions.push(['ilr', arguments]);
  }
  set_list_description(pane_key, description) {
    this.actions.push(['ild', arguments]);
  }
  color_list_item(pane_key, i, highlight) {
    this.actions.push(['ilc', arguments]);
  }
  set_cell_focus(vec, focus) {
    this.actions.push(['cf', arguments]);
  }
  edit_list_item(pane_key, i, new_values) {
    this.actions.push(['ile', arguments]);
  }
}
// Use to store a snapshot of the global data, too simplistic to implement for current version
class UIRecord {
  constructor(data) {
    // data is a struct containing all relevant data to record
    this.dat = data;
    this.rec = [];
    this.rec_p = [];
    this.r = 0;
  }
  _modify_record(keys, value) {
    // modify the values
    var dat = this.data;
    // keys is an array of keys string
    for (var k=0; k<keys.length-1; k++)
      dat = dat[keys(k)];
    var key = keys(keys.length-1);
    dat[key] = value;
  }
  _peek_record(keys, value) {
    var dat = this.data;
    for (var key of keys)
      dat = dat[key];
    return dat;
  }
  add_record(keys, value) {
    // key_labels must be an array of key strings, even if there is only one key
    // peek at previous value and store it
    var old_value = this._peek_record(keys, value);
    this.rec_p.push(keys, old_value);
    // modify the data
    this._modify_record(keys, value);
    // record the change
    this.rec.push(arguments);
    this.r++;
  }
  next_record() {
    if (r < this.rec.length)
      this._modify_record.apply(this, this.rec[this.r++]);
  }
  prev_record() {
    if (r >= 0)
      this._modify_record.apply(this, this.rec_p[this.r--]);
  }
}
// UI Info, each info object is a an info pane with a specific type
class UIInfo {
  static get TEXT() {return 0};
  static get PAIR() {return 1};
  static get LIST() {return 2};
  constructor() {
    /* arguments
    type = UIInfo.TEXT or UIInfo.PAIR or UIInfo.LIST
    args of new_text_pane / new_pair_pane / new _list_pane
    */
    // inits
    this.display = true;
    this.eles = undefined;
    this.type = arguments[0];
    var args = [];
    for (var i=1; i<arguments.length; i++)
      args.push(arguments[i]);
    switch (this.type) {
      case UIInfo.TEXT:
        this.new_text_pane.apply(this, args);
        break;
      case UIInfo.PAIR:
        this.new_pair_pane.apply(this, args);
        break;
      case UIInfo.LIST:
        this.new_list_pane.apply(this, args);
        break;
    }
  }
  build_pane(title) {
    /*
    info_pane
      - info_pane_title
      - info_content
        - text OR pair OR 
      add
    */
    // build pane
    var ele_pane = document.createElement('DIV');
    ele_pane.classList.add('info_pane');
    
    // build pane title
    var ele_title = document.createElement('DIV');
    ele_title.classList.add('info_pane_title');
    ele_title.innerHTML = title;
    var self = this;
    ele_title.addEventListener('click', function(e) {
      self.toggle(self);
    }, false);
    ele_pane.appendChild(ele_title);
    
    // build content container
    var ele_content = document.createElement('DIV');
    ele_content.classList.add('info_content');
    ele_pane.appendChild(ele_content);
    this.ele_pane = ele_pane;
    this.ele_content = ele_content;
    this.ele_title = ele_title;
  }
  new_text_pane(title, value) {
    // build the new pane
    this.build_pane(title);
    
    // reconfigure the content
    this.ele_content.classList.add('info_text');
    this.ele_content.innerHTML = value;
  }
  set_text(innerHTML) {
    this.ele_content.innerHTML = innerHTML;
  }
  get_text() {
    return this.ele_content.innerHTML;
  }
  new_pair_pane(title, key_subtitle_values) {
    // build the new pane;
    this.build_pane(title);
    // build the pairs
    var ele_pair, ele_subtitle, ele_value;
    this.eles = {};
    for (var i=0; i<key_subtitle_values.length; i++) {
      // The pair
      ele_pair = document.createElement('DIV');
      ele_pair.classList.add('info_pair');
      // The subtitle
      ele_subtitle = document.createElement('DIV');
      ele_subtitle.classList.add('info_cell', 'title');
      ele_subtitle.innerHTML = key_subtitle_values[i][1];
      ele_pair.appendChild(ele_subtitle);
      // The value
      ele_value = document.createElement('DIV');
      ele_value.classList.add('info_cell');
      ele_value.innerHTML = key_subtitle_values[i][2];
      ele_pair.appendChild(ele_value);
      // add to dictionary
      this.eles[key_subtitle_values[i][0]] = {
        subtitle : ele_subtitle,
        value : ele_value
      }
      // append the element to the content
      this.ele_content.appendChild(ele_pair);
    }
  }
  new_list_pane(title, description, list_titles) {
    // list_titles must be a 2D array.
    //   first dim is the row; second dim is the column
    this.build_pane(title);
    
    // build the container's contents
    this.ele_content.classList.add('info_list');
    // build the descriptor
    var ele_desc = document.createElement('DIV');
    ele_desc.classList = 'description';
    this.ele_content.appendChild(ele_desc);
    this.ele_desc = ele_desc;
    this.set_list_description(description);
    
    // build the list
    var ele_list = document.createElement('DIV');
    ele_list.classList.add('list');
    // build the list titles
    if (list_titles !== undefined) {
      var tmp, ele_cell, ele_row;
      for (var r=0; r<list_titles.length; r++) {
        tmp = list_titles[r];
        ele_row = document.createElement('DIV');
        ele_row.classList = 'title';
        for (var c=0; c<tmp.length; c++) {
          ele_cell = document.createElement('DIV');
          ele_cell.innerHTML = tmp[c];
          ele_row.appendChild(ele_cell)
        }
        ele_list.appendChild(ele_row);
      }
    }
    this.ele_content.appendChild(ele_list);
    this.ele_list = ele_list;
    
    // init the holding list for list items
    this.eles = [];
  }
  color_list_item(i, highlight) {
    if (highlight === false)
      this.eles[i].ele_row.classList.remove('new');
    else 
      this.eles[i].ele_row.classList.add('new');
    this.eles[i].highlight = highlight;
  }
  get_list_item_color(i) {
    return this.eles[i].highlight;
  }
  edit_list_item(i, new_values) {
    var ele_cells = this.eles[i].ele_cells;
    var values = this.eles[i].values;
    for (var c=0; c<ele_cells.length; c++) {
      if (new_values[c] !== undefined) {
        ele_cells[c].innerHTML = new_values[c];
      } else {
        new_values[c] = values[c];
      }
    }
    this.eles[i].values = new_values;
  }
  insert_list_item(i, values) {
    // values is a 1D array, representing the row to add
    // generate the element
    var ele_row = document.createElement('DIV'), ele_cell, ele_cells = [];
    for (var c=0; c<values.length; c++) {
      ele_cell = document.createElement('DIV');
      ele_cell.innerHTML = values[c];
      ele_cells.push(ele_cell);
      ele_row.appendChild(ele_cell);
    }
    var list_ele = {
      ele_row : ele_row,
      ele_cells : ele_cells,
      values : values,
      highlight : false
    };
    if (this.eles.length === 0 || i === this.eles.length) {
      this.ele_list.appendChild(ele_row);
      this.eles.push(list_ele);
    } else if (i < this.eles.length) {
      this.ele_list.insertBefore(ele_row, this.eles[i].ele_row)
      this.eles.splice(i, 0, list_ele);
    } else {
      throw 'UIInfo, insert_list_item: cannot insert list item at index that is longer than list length';
    }
  }
  remove_list_item(i) {
    var list_ele = this.eles[i];
    this.ele_list.removeChild(list_ele.ele_row);
    this.eles.splice(i, 1);
  }
  get_list_item(i) {
    return this.eles[i];
  }
  set_list_description(html_string) {
    this.ele_desc.innerHTML = html_string;
  }
  get_list_description() {
    return this.ele_desc.innerHTML;
  }
  toggle(info_obj) {
    if (info_obj.display === true) {
      info_obj.ele_content.style.display = 'flex';
      info_obj.ele_title.classList.remove('closed');
    } else {
      info_obj.ele_content.style.display = 'none';
      info_obj.ele_title.classList.add('closed');
    }
    info_obj.display = !info_obj.display;
  }
}
// Vector class (2x1)
class Vec {
  constructor(i, j, round=false) {
    if (round === false) {
      this.i = i;
      this.j = j;
    } else {
      this.i = Math.round(i);
      this.j = Math.round(j);
    }
  }
  round() {
    return new Vec(this.i, this.j, true);
  }
  add(vec) {
    if (vec instanceof Vec)
      return new Vec(this.i + vec.i, this.j + vec.j);
    else
      throw 'Vec.add: vec is not a Vec class';
  }
  subtract(vec) {
    if (vec instanceof Vec) 
      return new Vec(this.i - vec.i, this.j - vec.j);
    else
      throw 'Vec.subtract: vec is not a Vec class';
  }
  equals(vec) {
    return vec instanceof Vec && vec.i === this.i && vec.j === this.j;
  }
  copy(round=false) {
    return new Vec(this.i, this.j, round);
  }
  get x() {return this.i;}
  get y() {return this.j;}
  string(dp=0) {
    return this.toString(dp);
  }
  toString(dp=0) {
    return '('.concat(this.i.toFixed(dp), ',', this.j.toFixed(dp), ')');
  }
  is_ordinal() {
    return Math.abs(this.i) === Math.abs(this.j);
  }
  is_cardinal() {
    return this.i === 0 || this.j === 0;
  }
}
// Distance class (metrics)
class Dist {
  static get DIAGONAL() {return 0}
  static get MANHATTAN() {return 1}
  static get EUCLIDEAN() {return 2}
  static vecs_separation(vec0, vec1, metric=Dist.DIAGONAL) {
    var di = Math.abs(vec1.i - vec0.i);
    var dj = Math.abs(vec1.j - vec0.j);
    switch (metric) {
      case Dist.DIAGONAL:
        // assume integers
        if (di > dj) {
          var dd = dj;
          var dc = di - dj;
        } else {
          var dd = di;
          var dc = dj - di;
        }
        return new Dist(dd, dc, metric);
      case Dist.MANHATTAN:
        return new Dist(di, dj, metric);
      case Dist.EUCLIDEAN:
        return new Dist(di, dj, metric);
    }
  }
  constructor(arg0, arg1, metric) {
    switch (metric) {
      case Dist.DIAGONAL:
        this.ordinals = arg0;
        this.cardinals = arg1;
        this.total = arg0 * Math.SQRT2 + arg1;
        break;
      case Dist.MANHATTAN:
        this.di = arg0;
        this.dj = arg1;
        this.total = arg0 + arg1;
        break;
      case Dist.EUCLIDEAN:
        this.di = arg0;
        this.dj = arg1;
        this.total = Math.sqrt(arg0*arg0 + arg1*arg1);
        break;
      default:
        throw('The distance metric is not valid: '.concat(metric));
    }
    this.metric = metric;
  }
  add(arg0, arg1) { // add to reflect correct change in total distance  
    if (this.metric === Dist.EUCLIDEAN) {
      if (arg0 instanceof Dist) {
        var d = new Dist(NaN, NaN, this.metric);
        d.total = arg0.total + this.total;
      } else {
        var d = new Dist(arg0, arg1, this.metric);
        d.total += this.total;
        d.di = NaN;
        d.dj = NaN;
      }
      return d;
    }
    if (arg0 instanceof Dist) { // assume same metric
      return new Dist(this.ax0 + arg0.ax0, this.ax1 + arg0.ax1, this.metric);
    } else {
      return new Dist(this.ax0 + arg0, this.ax1 + arg1, this.metric);
    }
  }
  get ax0() {
    switch (this.metric) {
      case Dist.DIAGONAL:
        return this.ordinals;
      case Dist.EUCLIDEAN:
      case Dist.MANHATTAN:
        return this.di;
      default:
        return undefined;
    }
  }
  get ax1() {
    switch (this.metric) {
      case Dist.DIAGONAL:
        return this.cardinals;
      case Dist.EUCLIDEAN:
      case Dist.MANHATTAN:
        return this.dj
      default:
        return undefined;
    }
  }
  string(dp=2) {
    return this.total.toFixed(dp);
  }
}
// directions class
class Dir {
  static get N() {return 0}
  static get NW() {return 1}
  static get W() {return 2}
  static get SW() {return 3}
  static get S() {return 4}
  static get SE() {return 5}
  static get E() {return 6}
  static get NE() {return 7}
  static get DIAGONAL() {return 0}
  static get CARDINAL() {return 1}
  static get ORDINAL() {return 2}
  static list_dirs(origin_dir=Dir.N, anticlockwise=true, which_dirs=Dir.DIAGONAL) {
    var num_dirs=4, d=origin_dir, arr = [];
    var step = anticlockwise === true ? 1 : -1;
    switch (which_dirs) {
      case Dir.DIAGONAL:
        num_dirs = 8;
        break;
      case Dir.CARDINAL:
        if (Dir.is_ordinal(d) === true) // rotate to cardinal 
          d = Dir.rotate(d, step);
        step *= 2;
        break;
      case Dir.ORDINAL:
        if (Dir.is_cardinal(d) === true) // rotate to ordinal 
          d = Dir.rotate(d, step);
        step *= 2;
        break;
      default:
        throw ('Dir: Invalid direction '.concat(which_dirs));
    }
    for (var n=0; n<num_dirs; n++) {
      arr.push(d);
      d = Dir.rotate(d, step);
    }
    return arr;
  }
  static list_vecs(origin_dir=Dir.N, anticlockwise=true, which_dirs=Dir.DIAGONAL) {
    var arr = Dir.list_dirs.apply(null, [origin_dir, anticlockwise, which_dirs]);
    for (var i=0; i<arr.length; i++)
      arr[i] = Dir.dir_to_vec(arr[i]);
    return arr;
  }
  static list_strings(origin_dir=Dir.N, anticlockwise=true, which_dirs=Dir.DIAGONAL) {
    var arr = Dir.list_dirs.apply(null, [origin_dir, anticlockwise, which_dirs]);
    for (var i=0; i<arr.length; i++)
      arr[i] = Dir.dir_to_string(arr[i]);
    return arr;
  }
  static dir_to_string(ord) {
    switch (ord) {
      case Dir.N:
        return 'N';
      case Dir.NW:
        return 'NW';
      case Dir.W:
        return 'W';
      case Dir.SW:
        return 'SW';
      case Dir.S:
        return 'S';
      case Dir.SE:
        return 'SE';
      case Dir.E:
        return 'E';
      case Dir.NE:
        return 'NE';
      default:
        throw 'dir_to_string: Invalid direction "'.concat(ord, '"');
    }
  }
  static dir_to_vec(ord) {
    switch (ord) {
      case Dir.N:
        return new Vec(1, 0);
      case Dir.NW:
        return new Vec(1, 1);
      case Dir.W:
        return new Vec(0, 1);
      case Dir.SW:
        return new Vec(-1, 1);
      case Dir.S:
        return new Vec(-1, 0);
      case Dir.SE:
        return new Vec(-1, -1);
      case Dir.E:
        return new Vec(0, -1);
      case Dir.NE:
        return new Vec(1, -1);
      default:
        throw 'dir_to_vecs: Invalid direction "'.concat(ord, '"');
    }
  }
  /*
  static vecs_to_dir(arg0, arg1, arg2, arg3) {
    var i0, j0, i1, j1, di, dj, di_a, dj_a;
    if (arg0 instanceof Vec) {
      i0 = arg0.i;
      j0 = arg0.j;
      if (arg1 instanceof Vec) {
        i1 = arg1.i;
        j1 = arg1.j;
      } else {
        i1 = arg1;
        j1 = arg2;
      }
    } else {
      i0 = arg0;
      j0 = arg1;
      if (arg2 instanceof Vec) {
        i1 = arg2.i;
        j1 = arg2.j;
      } else {
        i1 = arg2;
        i2 = arg3;
      }
    }
    di = i1 - i0;
    dj = j1 - j0;
    di_a = Math.abs(di);
    dj_a = Math.abs(dj);
    // Normalise the vectors
    if (di_a < dj_a) {
      if (dj_a === 0)
        throw 'vecs_to_dir: there is no difference in vecs';
      di /= dj_a;
      dj /= dj_a;
    } else {
      if (di_a === 0)
        throw 'vecs_to_dir: there is no difference in vecs';
      di /= di_a;
      dj /= di_a;
    }
    // 
    if (di === -1) {
      if (dj === -1) {
        return Dir.SE
      } else if (dj === 0) {
        return Dir.S
      } else if (dj === 1) {
        return  Dir.SW
      }
    } else if (di === 0) {
      if (dj === -1) 
        return Dir.E
      else if (dj === 1)
        return Dir.W
    } else if (di === 1) {
      if (dj === -1) {
        return Dir.NE
      } else if (dj === 0) {
        return Dir.N
      } else if (dj === 1) {
        return Dir.NW
    }
    throw 'vecs_to_dir: inputs do not result in 8 directions. Either the inputs are wrong, or there were floating point issues when dividing: '.concat(arg0, ', ', arg1, 
      arg2 === undefined ? '' : ', '.concat(
      arg3 === undefined ? ', '.concat(arg2) : ', '.concat(arg2, ',', arg3)));
    }
  }*/
  static is_ordinal(d) {return d % 2 === 1}
  static is_cardinal(d) {return d % 2 === 0}
  static rotate(d, steps) {
    d += steps;
    while (d < 0)
      d += 8;
    return d % 8;
  }
  static nearest(d, steps=1) {
    if (steps === 0)
      return [d];
    var dirs = [];
    d = Math.round(d);
    steps = Math.round(steps);
    var step = -steps;
    var s = Math.sign(steps);
    var final_step = steps * s;
    do {
      dirs.push(Dir.rotate(d, step));
      step += s;
    } while (step * s <= final_step)
    return dirs;
  }
}

/* -------- UI methods -------- */
class UI {
  constructor() {
    this.instantiate();
    this.initialise_graphic_handlers();
    this.initialise_data_handlers();
    this.initialise_data();
    // Create map at startup
    this.graphic_handlers.parse_loaded_map(this.saved_maps.CHEVRONS_12_12.map);
    this.state.saved = true;
  }
  instantiate() {
    // Constants
    this.CELL = 30;
    this.SG = 20;
    this.LINE_RADIUS_X = 2;
    this.LINE_RADIUS_Y = 2;
    this.TIME_STEP = 30;
    /* The static HTML elements */
    this.html = {
      /* Navigation bar */
      nav : {
        file : {
          file : document.getElementById('ui_file'),
          build : document.getElementById('ui_build'),
          build_i : document.getElementById('ui_build_i'),
          build_j : document.getElementById('ui_build_j'),
          load : document.getElementById('ui_load'),
          save : document.getElementById('ui_save'),
          saved_maps : document.getElementById('ui_saved_maps')
        }, 
        edit : {
          edit : document.getElementById('ui_edit'),
          pen : document.getElementById('ui_pen')
        },
        run : {
          run : document.getElementById('ui_run'),
          play : document.getElementById('ui_play'),
          play_img: document.getElementById('ui_play_img'),
          exit : document.getElementById('ui_exit'),
          initial: document.getElementById('ui_initial'),
          final : document.getElementById('ui_final'),
          next : document.getElementById('ui_next'),
          prev : document.getElementById('ui_prev'),
        },
        options: {
          options : document.getElementById('ui_options'),
          planners : document.getElementById('ui_planners'),
          algorithms: document.getElementById('ui_algorithms'),
          big_steps : document.getElementById('ui_big_steps')
        }
      },
      dialog : {
        dialog : document.getElementById('ui_dialog'),
        area: document.getElementById('ui_dialog_area'),
        title: document.getElementById('ui_dialog_title'),
        templates : {},
        yes : document.getElementById('ui_yes'),
        no : document.getElementById('ui_no')
      },
      /* The simulator area */
      sim : {
        sim : document.getElementById('ui_sim'),
        rulers : {
          top : document.getElementById('ui_ruler_top'),
          bottom : document.getElementById('ui_ruler_bottom'),
          left : document.getElementById('ui_ruler_left'),
          right : document.getElementById('ui_ruler_right')
        },
        map : {
          map : document.getElementById('ui_map'),
          start : document.getElementById('ui_start'),
          goal : document.getElementById('ui_goal'),
          cells : document.getElementById('ui_cells')
        }
      },
      tooltip : {
        tooltip : document.getElementById('ui_tooltip'),
        area : document.getElementById('ui_tooltip_area')
      },
      info : {
        info : document.getElementById('ui_info'),
        toggler: document.getElementById('ui_info_toggler'),
        panes : document.getElementById('ui_info_panes')
      }
    }
    /* The program data */
    this.state = {
      sim : false,
      dialog : false,
      saved : true,
      pen : Infinity,
      pen2 : 0,
      play : false,
      play_handler_id : undefined,
      step : 0,
      x_min : 0,
      x_max : 0,
      y_min : 0,
      y_max : 0,
      mse_obs : false,
      mse_start : false,
      mse_goal : false,
      mse_btn : true,
      mse_dx : 0,
      mse_dy : 0,
      info : true,
      dialog_handler : undefined,
      planner : undefined,
      blob : null,
      unique_map : 0,
      big_steps : false
    };
    this.graphic_handlers = {};
    this.data_handlers = {};
    this.steps = {
      steps : [],
      add_step : undefined,
      steps_compiled : []
    };
    /* Contains non-static html cell and path elements */
    this.ui_map = undefined;
    /* Contains non-static html info elements */
    this.info = {};
    /* Contains all plannes */
    this.planners = {};
    // The global planner options
    this.options = {};
    // saved maps
    this.saved_maps = {
  HELLOWORLD_20_30 : {
    map: `20
30
1
1
12
27
000000000000000000000000000000000010000000000000000000000000001110111101101011111001111100011010000100101010001001010100010010000100011010001011010110000010000101111000001010010010010010000101001010001010000010011010000100001010001010000010001110000111111011111010000010000000000000000000001000000000000000000000000000001000000000011110111111111011111010001111010010000100001000000010001000010010000100001000001010001110010010000100001000001010001000000010000100000000111011011011010010000100001000001010001000010010000100001000001010001000011110000100001011111010001000000000000100000000000000000000`,
    name: 'HelloWorld (20, 30)'
  },
  CHEVRONS_12_12 : {
    map: `12
12
0
1
11
11
000000000000000000000000000001000000000001010000000001010100001111010100000000010100000111110100000000000100000011111100000000000000000000000000`,
    name: 'Chevrons (12, 12)'
  },
  DENSEA_21_21 : {
    map: `21
21
0
5
10
10
000000100011001000100011101110000000010111010101000011111011101010100001000001001101011001011111100010100001010010000011001100100110011011101000001001010110010001010101000100101000100100101000010011001010100101001100010101000101100001001010111010101000100011000001000100101010011001100101000001000001100001000101001011000110011000101001010100001100100110000011100111000000100110010011100010000001010000000000110100110001010000000001101100000`,
    name: 'Dense-A (21, 21)'
  }
}
  }
  initialise_data() {
    var self = this;
    var state = self.state;
    var html_info_obj = self.html.info;
    var html_sim_obj = self.html.sim;
    var html_map_obj = html_sim_obj.map;
    var html_nav_obj = self.html.nav;
    var html_tooltip_obj = self.html.tooltip;
    var html_dialog = self.html.dialog;
    var html_options_obj = html_nav_obj.options;
    var graphic_handlers = self.graphic_handlers;
    var data_handlers = self.data_handlers;
    var options_obj = self.options;
    // Options
    function init_options() {
      function template(title) {
        var ele = document.createElement('TR');
        var ele_title = document.createElement('TD');
        ele_title.classList = 'title';
        ele_title.innerHTML = title.concat('</br>');
        var ele_desc = document.createElement('TD');
        ele_desc.classList = 'description';
        var ele_select = document.createElement('SELECT');
        ele_title.appendChild(ele_select);
        ele.appendChild(ele_title);
        ele.appendChild(ele_desc);
        return [ele, ele_title, ele_desc, ele_select];
      };
      function gen_origin_dirs() {
        switch(options_obj.directions.choice) {
          case Dir.DIAGONAL:
            return '<option value="0">N</option><option value="1">NW</option><option value="2">W</option><option value="3">SW</option><option value="4">S</option><option value="5">SE</option><option value="6">E</option><option value="7">NE</option>';
          case Dir.CARDINAL:
            return '<option value="0" selected>N</option><option value="2">W</option><option value="4">S</option><option value="6">E</option>';
        }
      };
      function gen_directions() {
        var [ele, ele_title, ele_desc, ele_select] = template('Neighbor Connections');
        ele_desc.innerHTML = '<em>8-connected</em> when all 8 neighbors surrounding the each cell are searched.<br/><em>4-connected</em> when 4 neighbors in N,W,S,E (cardinal) directions are searched.<br/>'
        ele_select.innerHTML = '<option value ="0" selected>8-connected</option><option value="1">4-connected</option>';
        ele_select.onchange = function(e) {
          switch (e.target.selectedOptions[0].value) {
            case '0':
              options_obj.directions.choice = Dir.DIAGONAL;
              options_obj.metric.ele_select.selectedIndex = 0;
              options_obj.blocking.ele.style.display = 'revert';
              break;
            case '1':
              options_obj.directions.choice = Dir.CARDINAL;
              options_obj.metric.ele_select.selectedIndex = 1;
              options_obj.blocking.ele.style.display = 'none';
              break;
          }
          options_obj.origin.ele_select.innerHTML = gen_origin_dirs();
        }
        // inits
        self.options.directions = {
          choice : Dir.DIAGONAL,
          ele_select: ele_select,
          ele : ele
        }
      };
      function gen_blocking() {
        var [ele, ele_title, ele_desc, ele_select] = template('Diagonal Blocking');
        ele_desc.innerHTML = '<em>Block</em> connection to an ordinal neighbor (e.g. NW) if there are obstacles in its applicable cardinal directions (e.g. N, W). <br/><em>Unblock</em> to ignore this constraint'
        ele_select.innerHTML = '<option value ="1" selected>Block</option><option value="0">Unblock</option>';
        ele_select.onchange = function(e) {
          options_obj.blocking.choice = e.target.selectedOptions[0].value !== '0';
        };
        // inits
        self.options.blocking = {
          choice : true,
          ele_select: ele_select,
          ele : ele
        }
      };
      function gen_origin() {
        var [ele, ele_title, ele_desc, ele_select] = template('First Neighbor');
        ele_desc.innerHTML = 'The first direction to begin neighbour searching. Can be used for breaking ties. <br/><em>N</em> is upwards (+i/+x/-row). <em>W</em> is leftwards (+j/+y/-column).'
        ele_select.innerHTML = gen_origin_dirs();
        ele_select.onchange = function(e) {
          options_obj.origin.choice = parseInt(e.target.selectedOptions[0].value);
        };
        // inits
        self.options.origin = {
          choice : Dir.N,
          ele_select: ele_select,
          ele : ele
        }
      };
      function gen_anticlockwise() {
        var [ele, ele_title, ele_desc, ele_select] = template('Search Direction');
        ele_desc.innerHTML = 'The rotating direction to search neighbors. Can be used for breaking ties.<br/><em>Anticlockwise</em> means the rotation from N to W. <br/><em>Clockwise</em> for the opposite rotation'
        ele_select.innerHTML = '<option value ="1" selected>Anticlockwise</option><option value="0">Clockwise</option>';
        ele_select.onchange = function(e) {
          options_obj.anticlockwise.choice = e.target.selectedOptions[0].value !== '0';
        };
        // inits
        self.options.anticlockwise = {
          choice : true,
          ele_select: ele_select,
          ele : ele
        }
      };
      function gen_metric() {
        var [ele, ele_title, ele_desc, ele_select] = template('Distance Metric');
        ele_desc.innerHTML = 'The metrics used for calculating distances.<br/><em>Diagonal</em> is commonly used for grids which allow movement in 8 directions. It sums the maximum number of diagonal movements, with the residual cardinal movements.<br/><em>Manhattan</em> is used for grids which allow movement in 4 cardinal directions. It sums the absolute number of rows and columns (all cardinal) between two cells.<br/><em>Euclidean</em> takes the L2-norm between two cells, which is the real-world distance between two points. This is commonly used for any angle paths.'
        ele_select.innerHTML = '<option value ="0" selected>Diagonal</option><option value="1">Manhattan</option><option value="2">Euclidean</option>';
        ele_select.onchange = function(e) {
          switch(e.target.selectedOptions[0].value) {
            case '0':
              options_obj.metric.choice = Dist.DIAGONAL;
              return;
            case '1':
              options_obj.metric.choice = Dist.MANHATTAN;
              return;
            case '2':
              options_obj.metric.choice = Dist.EUCLIDEAN;
              return;
          }
        };
        // inits
        self.options.metric = {
          choice : Dist.DIAGONAL,
          ele_select: ele_select,
          ele : ele
        }
      };
      function gen_fh_optimisation() {
        var [ele, ele_title, ele_desc, ele_select] = template('F-H-cost optimisation');
        ele_desc.innerHTML = 'For algorithms like A* and Jump Point Search, F-cost = G-cost + H-cost. This has priority over the time-ordering option.<br/>If <em>Optimise</em> is selected, when retrieving the cheapest vertex from the open list, the vertex with the lowest H-cost among the lowest F-cost vertices will be chosen. This has the effect of doing a Depth-First-Search on equal F-cost paths, which can be faster.<br/>Select <em>Vanilla</em> to use their original implementations.'
        ele_select.innerHTML = '<option value ="0" selected>Optimise</option><option value="1">Vanilla</option>';
        ele_select.onchange = function(e) {
          switch(e.target.selectedOptions[0].value) {
            case '0':
              options_obj.fh_optimisation.choice = true;
              return;
            case '1':
              options_obj.fh_optimisation.choice = false;
              return;
          }
        };
        // inits
        self.options.fh_optimisation = {
          choice : true,
          ele_select: ele_select,
          ele : ele
        }
      };
      function gen_time_ordering() {
        var [ele, ele_title, ele_desc, ele_select] = template('Time Ordering');
        ele_desc.innerHTML = 'When sorting a vertex into the open-list or unvisited-list and it has identical cost* to earlier entries, select: <br/><em>FIFO</em> to place the new vertex behind the earlier ones, so it comes out <i>after</i> them.<br/><em>LIFO</em> to place the new vertex in front of the earlier ones, so it comes out <i>before</i> them.<br/>* cost refers to F-cost & H-cost, if F-H-Cost Optimisation is set to "Optimise", otherwise it is the F-cost for A*, G-cost for Dijkstra and H-cost for GreedyBestFirst)'
        ele_select.innerHTML = '<option value="FIFO" selected>FIFO</option><option value="LIFO">LIFO</option>';
        ele_select.onchange = function(e) {
         options_obj.time_ordering.choice = e.target.selectedOptions[0].value;
        }
        // inits
        options_obj.time_ordering = {
          choice: "FIFO",
          ele_select : ele_select,
          ele: ele
        }
      };
      function gen_gh_weights() {
        // generate the layout
        var ele = document.createElement('TR');
        var ele_title = document.createElement('TD');
        ele_title.classList = 'title';
        ele_title.innerHTML = 'G-H Weights';
        ele.appendChild(ele_title);
        var ele_table = document.createElement('DIV');
        ele_table.innerHTML = '<div><div><em>g</em></div><div><input type="number" step="any" value="1" placeholder="G"></input></div></div><div><div><em>h</em></div><div><input type="number" step="any" value="1" placeholder="H"></input></div></div>';
        ele_title.appendChild(ele_table);
        var ele_g_weight = ele_table.firstElementChild.lastElementChild.firstElementChild;
        var ele_h_weight = ele_table.lastElementChild.lastElementChild.firstElementChild;
        var ele_desc = document.createElement('TD');
        ele_desc.classList = 'description';
        ele.appendChild(ele_desc);
        
        // description
        ele_desc.innerHTML = "Conventionally, F-cost = G-cost + H-cost. Let the G weight be <em>g</em>, and H weight be <em>h</em>. Let's modify the cost calculation so that<br/><center>H-cost &larr; <em>h</em> &times; H-cost</br>G-cost &larr; <em>g</em> &times; G-cost</center>A* approaches Dijkstra if <em>g</em> > <em>h</em>, and GreedyBestFirst if <em>g</em> < <em>h</em>"
        ele_g_weight.oninput = function(e) {
          var result = self.graphic_handlers.validate_float(ele_g_weight);
          if (result === true) // is float
            options_obj.gh_weights.choice[0] = parseFloat(ele_g_weight.value);
        } 
        ele_g_weight.onchange = function(e) {
          ele_g_weight.value = options_obj.gh_weights.choice[0];
        }
        ele_h_weight.oninput = function(e) {
          var result = self.graphic_handlers.validate_float(ele_h_weight);
          if (result === true) // is float
            options_obj.gh_weights.choice[1] = parseFloat(ele_h_weight.value);
        } 
        ele_h_weight.onchange = function(e) {
          ele_h_weight.value = options_obj.gh_weights.choice[1];
        }
        // inits
        options_obj.gh_weights = {
          choice: [1, 1],
          ele: ele
        }
      }
      html_options_obj.algorithms.onchange = graphic_handlers.change_planner_options;
      // need to sort according to alphabetical order
      gen_anticlockwise();
      gen_blocking();
      gen_directions();
      gen_fh_optimisation();
      gen_gh_weights();
      gen_metric();
      gen_origin();
      gen_time_ordering();
    };
    // Dialog
    function init_dialog() {
      var templates_ui = document.getElementById('ui_dialog_templates');
      var templates = templates_ui.childNodes;
      var dialog_templates = html_dialog.templates;
      var key, template;
      for (var t=0; t<templates.length; t++) {
        template = templates[t];
        if (template.nodeType === 1) {
          key = template.getAttribute('key');
          dialog_templates[key] = template;
          // for planners, append the options
          switch(key) {
            case 'build':
              var ele_select = document.getElementById('ui_saved_maps');
              var ele_option;
              ele_option = document.createElement('OPTION');
              ele_option.setAttribute('value', 'new');
              ele_option.innerHTML = 'Create New...'
              ele_select.appendChild(ele_option);
              for (const k of Object.keys(self.saved_maps)) {
                ele_option = document.createElement('OPTION');
                ele_option.setAttribute('value', k);
                ele_option.innerHTML = self.saved_maps[k].name;
                ele_select.appendChild(ele_option);
              }
              ele_select.selectedIndex = 0;
              ele_select.onchange = function(e) {
                var ele = e.target.parentNode.parentNode.nextElementSibling;
                while (ele !== null) {
                  if (e.target.selectedIndex !== 0)
                    ele.style.display = 'none';
                  else
                    ele.style.display = 'revert';
                  ele = ele.nextElementSibling;
                }
              }
              break;
            case 'planners':
              // table, tbody, tr
              var opts_parent = template.firstElementChild.firstElementChild;
              var opt = opts_parent.firstElementChild.nextElementSibling;
              var opts = [];
              // iterate over the options
              while (opt !== null) {
                if (opt.hasAttribute('key')) {
                  opts_parent.insertBefore(self.options[opt.getAttribute('key')].ele, opt);
                  opts.push(opt);
                }
                opt = opt.nextElementSibling;
              }
              for(const opt of opts)
                opts_parent.removeChild(opt);
              break;
          }
        }
      }
      templates_ui.parentNode.removeChild(templates_ui);
      html_dialog.yes.addEventListener('click', function(e) {
        graphic_handlers.close_dialog(true);
      }, false);
      html_dialog.no.addEventListener('click', function(e) {
        graphic_handlers.close_dialog(false);
      }, false);
      html_dialog.dialog.style.display = 'none';
    }
    // Nav bar
    function init_nav() {
      // Click build - pull up new map dialog
      html_nav_obj.file.build.addEventListener('click', function(e) {
        graphic_handlers.display_dialog('build');
      }, false);
      // Click save
      html_nav_obj.file.save.addEventListener('click', function(e) {
        graphic_handlers.save_map();
      }, false);
      // Click load
      html_nav_obj.file.load.addEventListener('click', function(e) {
        graphic_handlers.load_map();
      }, false);
      // Click play - switch to sim mode or pause sim.
      html_nav_obj.run.play.addEventListener('click', function(e) {
        graphic_handlers.play_pause(!state.play);
      }, false);
      // Click exit - switch to edit mode
      html_nav_obj.run.exit.addEventListener('click', function(e) {
        graphic_handlers.switch_mode(false);
      }, false);
      // Click pen - switch pen modes
      html_nav_obj.edit.pen.addEventListener('click', function(e) {
        graphic_handlers.set_pens( 
          state.pen === 0 ? Infinity : 0,
          state.pen2 === 0 ? Infinity : 0
        );
        // update tooltip
        graphic_handlers.update_tooltip('pen');
      }, false);
      // Click initial - step to initial
      html_nav_obj.run.initial.addEventListener('click', function(e) {
        graphic_handlers.step_to_initial();
      }, false);
      // Click next - step fwd
      html_nav_obj.run.next.addEventListener('click', function(e) {
        graphic_handlers.step_forward();
      }, false);
      // Click prev - step back
      html_nav_obj.run.prev.addEventListener('click', function(e) {
        graphic_handlers.step_backward();
      }, false);
      // Click final - step to end
      html_nav_obj.run.final.addEventListener('click', function(e) {
        graphic_handlers.step_to_final();
      }, false);
      // Input build_i - validate data and update state
      html_nav_obj.file.build_i.addEventListener('input', function(e) {
        graphic_handlers.validate_map_size(e.target);
      }, false)
      // Input build_j - validate data and update state
      html_nav_obj.file.build_j.addEventListener('input', function(e) {
        graphic_handlers.validate_map_size(e.target);
      }, false)
      // Change big steps
      html_options_obj.big_steps.addEventListener('click', function(e) {
        graphic_handlers.set_big_steps(!state.big_steps);
      }, false);
      // Tooltips
      for (const k of ['build', 'save', 'load', 'pen', 'exit', 'initial', 'prev', 'play', 'next', 'final', 'planners', 'big_steps'])
        graphic_handlers.update_tooltip(k);
      html_nav_obj.options.planners.addEventListener('click', function(e) {
        graphic_handlers.display_dialog('planners');
      }, false);
      // Hide the elements in Edit mode
      graphic_handlers.switch_mode(false);
      // Turn on the pen
      graphic_handlers.set_pens(Infinity, 0);
    }
    function init_sim() {
      var cells = html_sim_obj.map.cells;
      var start = html_sim_obj.map.start;
      var goal = html_sim_obj.map.goal;
      // Disable ContextMenu on map
      html_map_obj.map.addEventListener("contextmenu", function(e) {
        // prevent right click menu from appearing
        e.preventDefault();
      }, false);
      // Mousedown Cells - Begin Drawing
      cells.addEventListener("mousedown", function(e) { // required for drawing obstacles / empty cells
        if (state.sim === true) return;
        graphic_handlers.update_cells_box();
        if (window.event.which == 1 && window.event.button == 0)
          //left click
          state.mse_btn = true;
        else if (window.event.which == 3 && window.event.button == 2)
          //right click
          state.mse_btn = false;
        state.mse_pen = true;
        state.saved = false;
      }, false);
      // Touchstart Cells - Begin drawing
      cells.addEventListener("touchstart", function(e) {
        if (state.sim === true) return;
        if (e.touches.length > 1)
          return;
        e.preventDefault();
        e.stopImmediatePropagation();
        graphic_handlers.update_cells_box();
        state.mse_btn = true;
        state.mse_pen = true;
        state.saved = false;
      }, false);
      // Mouseup Cells - Stop Drawing
      cells.addEventListener("mouseup", function(e) { // required for drawing obstacles / empty cells
        state.mse_pen = false;
      }, false);
      // Mouseout Cells - Same as Mouseup
      cells.addEventListener("mouseleave", function(e) { // required for drawing obstacles / empty cells
        state.mse_pen = false;
      }, false);
      html_map_obj.map.addEventListener("touchend", function(e) {
        state.mse_pen = false;
        state.mse_start = false;
        state.mse_goal = false;
      }, false);
      // Touchmove Cells - Draw depending on mode
      html_map_obj.map.addEventListener("touchmove", function(e) {
        if (state.mse_pen === true) {
          var m_x = e.touches[0].clientX;
          var m_y = e.touches[0].clientY;
          var x_min = state.x_min;
          var y_min = state.y_min;
          var map = self.ui_map; // transient
          var i, j;
          // check if within cell area
          if (m_x > x_min && m_y > y_min && m_x < state.x_max && m_y < state.y_max) {
            [i, j] = data_handlers.window_to_map(m_x, m_y, x_min, y_min, map.num_i, map.num_j)
            i = Math.round(i);
            j = Math.round(j);
            // check pen mode
            if (state.mse_btn === true)
              graphic_handlers.set_cell_obstacle(i, j, state.pen);
            else
              graphic_handlers.set_cell_obstacle(i, j, state.pen2);
          }
        } else if (state.mse_start === true) {
          var x_min = state.x_min;
          var y_min = state.y_min;
          var x = state.mse_dx + e.touches[0].clientX - x_min;
          var y = e.touches[0].clientY + state.mse_dy - y_min;
          if (x > 0 && x < state.x_max - x_min && y > 0 && y < state.y_max - y_min) {
            start.style.top = y + 'px';
            start.style.left = x + 'px';
          }
        } else if (state.mse_goal === true) {
          var x_min = state.x_min;
          var y_min = state.y_min;
          var x = state.mse_dx + e.touches[0].clientX - x_min;
          var y = e.touches[0].clientY + state.mse_dy - y_min;
          if (x > 0 && x < state.x_max - x_min && y > 0 && y < state.y_max - y_min) {
            goal.style.top = y + 'px';
            goal.style.left = x + 'px';
          }
        }
      }, false);
      // Mouseover Cells - Draw depending on mode
      html_map_obj.map.addEventListener("mousemove", function(e) { // required for drawing obstacles / empty cells
        if (state.mse_pen === true) {
          var m_x = e.clientX;
          var m_y = e.clientY;
          var x_min = state.x_min;
          var y_min = state.y_min;
          var map = self.ui_map; // transient
          var i, j;
          // check if within cell area
          if (m_x > x_min && m_y > y_min && m_x < state.x_max && m_y < state.y_max) {
            [i, j] = data_handlers.window_to_map(m_x, m_y, x_min, y_min, map.num_i, map.num_j)
            i = Math.round(i);
            j = Math.round(j);
            // check pen mode
            if (state.mse_btn === true)
              graphic_handlers.set_cell_obstacle(i, j, state.pen);
            else
              graphic_handlers.set_cell_obstacle(i, j, state.pen2);
          }
        } else if (state.mse_start === true) {
          var x_min = state.x_min;
          var y_min = state.y_min;
          var x = state.mse_dx + e.clientX - x_min;
          var y = e.clientY + state.mse_dy - y_min;
          if (x > 0 && x < state.x_max - x_min && y > 0 && y < state.y_max - y_min) {
            start.style.top = y + 'px';
            start.style.left = x + 'px';
          }
        } else if (state.mse_goal === true) {
          var x_min = state.x_min;
          var y_min = state.y_min;
          var x = state.mse_dx + e.clientX - x_min;
          var y = e.clientY + state.mse_dy - y_min;
          if (x > 0 && x < state.x_max - x_min && y > 0 && y < state.y_max - y_min) {
            goal.style.top = y + 'px';
            goal.style.left = x + 'px';
          }
        }
      }, false);
      // Mousedown Start - Begin Moving Start
      start.addEventListener("mousedown", function(e) {
        if (state.sim === true) return;
        graphic_handlers.update_cells_box();
        var rect = start.getBoundingClientRect();
        state.mse_dy = rect.top + self.SG / 2 - e.clientY;
        state.mse_dx = rect.left + self.SG / 2 - e.clientX;
        state.mse_start = true;
      }, false);
      // Mousedown Start - Stop Moving Start
      start.addEventListener("mouseup", function(e) {
        state.mse_start = false;
      }, false);
      // Touchstart Start - Begin Moving Start
      start.addEventListener("touchstart", function(e) {
        if (state.sim === true) return;
        if (e.touches.length > 1) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        graphic_handlers.update_cells_box();
        var rect = start.getBoundingClientRect();
        state.mse_dy = rect.top + self.SG / 2 - e.touches[0].clientY;
        state.mse_dx = rect.left + self.SG / 2 - e.touches[0].clientX;
        state.mse_start = true;
      }, false);
      // Mousedown Goal - Begin Moving Goal
      goal.addEventListener("mousedown", function(e) {
        if (state.sim === true) return;
        graphic_handlers.update_cells_box();
        var rect = goal.getBoundingClientRect();
        state.mse_dy = rect.top + self.SG / 2 - e.clientY;
        state.mse_dx = rect.left + self.SG / 2 - e.clientX;
        state.mse_goal = true;
      }, false);
      // Mousedown Goal - Stop Moving Goal
      goal.addEventListener("mouseup", function(e) {
        state.mse_goal = false;
      }, false);
      // Touchstart Goal - Begin Moving Goal
      goal.addEventListener("touchstart", function(e) {
        if (state.sim === true) return;
        if (e.touches.length > 1) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        graphic_handlers.update_cells_box();
        var rect = goal.getBoundingClientRect();
        state.mse_dy = rect.top + self.SG / 2 - e.touches[0].clientY;
        state.mse_dx = rect.left + self.SG / 2 - e.touches[0].clientX;
        state.mse_goal = true;
      }, false);
    }
    function init_info() {
      html_info_obj.toggler.addEventListener('click', function(e) {
        graphic_handlers.toggle_info(!state.info);
      }, false);
    }
    function init_steps() {
      // The user level method for adding a step of steps
      // step methods are located in UIStep
      self.steps.add_step = function(major, merge) {
        var step = new UIStep(major, merge);
        self.steps.steps.push(step);
        return step;
      }
    }
    init_options();
    init_dialog();
    init_nav();
    init_sim();
    init_info();
    init_steps();
  }
  initialise_graphic_handlers() {
    var handlers = this.graphic_handlers;
    var data_handlers = this.data_handlers;
    var self = this;
    var state = self.state;
    var html_info_obj = self.html.info;
    var html_sim_obj = self.html.sim;
    var html_map_obj = html_sim_obj.map;
    var html_cells = html_map_obj.cells;
    var html_nav_obj = self.html.nav;
    var html_dialog_obj = self.html.dialog;
    var html_tooltip_obj = self.html.tooltip;
    var html_options_obj = html_nav_obj.options;
    var steps_obj = self.steps;
    var options_obj = self.options;
    // Display Dialog
    handlers.display_dialog = function(dialog_key) {
      state.dialog = true;
      var title, template;
      switch (dialog_key) {
        case 'build':
          state.dialog_handler = handlers.new_map;
          title = 'Create New Map';
          template = html_dialog_obj.templates[dialog_key];
          // Validate data
          var nav_file = html_nav_obj.file;
          handlers.validate_map_size(nav_file.build_i);
          handlers.validate_map_size(nav_file.build_j);
          break;
        case 'planners':
          var opt;
          state.dialog_handler = handlers.update_planner;
          title = 'Choose Planners';
          template = html_dialog_obj.templates[dialog_key];
        break;
      }
      
      // HTML operations
      html_dialog_obj.dialog.style.display = 'flex';
      html_dialog_obj.title.appendChild(document.createTextNode(title));
      html_dialog_obj.area.appendChild(template);
      
      if (dialog_key === 'planners')
        handlers.change_planner_options();
    };
    // Close Dialog
    handlers.close_dialog = function(input) {
      var success = true;
      if (state.dialog_handler)
        success = state.dialog_handler(input);
      // HTML
      if (success) {
        html_dialog_obj.dialog.style.display = 'none';
        html_dialog_obj.title.removeChild(html_dialog_obj.title.firstChild);
        html_dialog_obj.area.removeChild(html_dialog_obj.area.firstChild);
        state.dialog = false;        
        state.dialog_handler = undefined;
      }
    };
    // Display Tooltips
    handlers.update_tooltip = function(tooltip_key) {
      var box, ele, help;
      switch (tooltip_key) {
        case 'build':
          html_nav_obj.file.build.setAttribute('alt', 'New map');
          return;
        case 'save':
          html_nav_obj.file.save.setAttribute('alt', 'Save map');
          return;
        case 'load':
          html_nav_obj.file.load.setAttribute('alt', 'Load map');
          return;
        case 'pen':
          if (state.pen === Infinity)
            html_nav_obj.edit.pen.setAttribute('alt', 'Switch to obstacle-clearing mode');
          else
            html_nav_obj.edit.pen.setAttribute('alt', 'Switch to obstacle-drawing mode');
          return;
        case 'exit':
          html_nav_obj.run.exit.setAttribute('alt', 'Switch to editing mode');
          return;
        case 'initial':
          html_nav_obj.run.initial.setAttribute('alt', 'Go to start');
          return;
        case 'prev':
          html_nav_obj.run.prev.setAttribute('alt', 'Step back');
          return;
        case 'play':
          if (state.play === true)
            html_nav_obj.run.play.setAttribute('alt', 'Pause');
          else
            html_nav_obj.run.play.setAttribute('alt', 'Play');
          return;
        case 'next':
          html_nav_obj.run.next.setAttribute('alt', 'Step forward');
          return;
        case 'final':
          html_nav_obj.run.final.setAttribute('alt', 'Go to end');
          return;
        case 'big_steps':
          if (state.big_steps === true)
            html_nav_obj.options.big_steps.setAttribute('alt', 'Switch to a more detailed sim');
          else 
            html_nav_obj.options.big_steps.setAttribute('alt', 'Switch to a less detailed sim');
          return;
        case 'planners':
          html_nav_obj.options.planners.setAttribute('alt', 'Choose the algorithm to sim');
      }
    }
    // Toggle Info bar 
    handlers.toggle_info = function(show) {
      if (show === false) {
        var panes = html_info_obj.panes;
        panes.style.display = 'none';
      } else {
        var panes = html_info_obj.panes;
        panes.style.display = 'flex';
      }
      state.info = show;
    }
    // Handler for play button
    handlers.play_pause = function(play, recompile) {
      // Adjust state variables
      // Switch mode if in edit mode and need to play in sim mode
      if ((state.sim === false || recompile === true) && play === true) {
        handlers.switch_mode(true); 
        self.planners[state.planner].planner.compile();
      }
      state.play = play;
      // Play or pause
      if (play === false) {
        // Pause
        // update image
        html_nav_obj.run.play_img.setAttribute('src', 'img/play.svg');
        html_nav_obj.run.play.classList.remove('nav_btn_on');
        handlers.pause();
      } else if (state.step < steps_obj.steps_compiled.length) {
        // Play
        // update image
        html_nav_obj.run.play_img.setAttribute('src', 'img/pause.svg');
        html_nav_obj.run.play.classList.add('nav_btn_on');
        handlers.play();
      } else {
        // go to start, play is true, and at final step
        handlers.step_to_initial();
        html_nav_obj.run.play_img.setAttribute('src', 'img/pause.svg');
        html_nav_obj.run.play.classList.add('nav_btn_on');
        handlers.play();
      }
      // update tooltip
      handlers.update_tooltip('play');
    }
    // Switch modes between sim and edit
    handlers.switch_mode = function(sim) {
      if (sim === true) {
        // Hide elements
        html_nav_obj.file.file.style.display = 'none';
        html_nav_obj.edit.edit.style.display = 'none';
        // Display elements
        var nav_run = html_nav_obj.run;
        nav_run.exit.style.display = 'flex';
        nav_run.initial.style.display = 'flex';
        nav_run.prev.style.display = 'flex';
        nav_run.next.style.display = 'flex';
        nav_run.final.style.display = 'flex';
        html_info_obj.info.style.display = 'flex';
        html_nav_obj.options.big_steps.style.display = 'flex';
      } else {
        // Update play button
        handlers.play_pause(false);
        // Hide elements
        var nav_run = html_nav_obj.run;
        nav_run.exit.style.display = 'none';
        nav_run.initial.style.display = 'none';
        nav_run.prev.style.display = 'none';
        nav_run.next.style.display = 'none';
        nav_run.final.style.display = 'none';
        html_info_obj.info.style.display = 'none';
        html_nav_obj.options.big_steps.style.display = 'none';
        // Display elements
        html_nav_obj.file.file.style.display = 'flex';
        html_nav_obj.edit.edit.style.display = 'flex';
        // Delete paths and annotations
      }
      handlers.reset_sim();
      state.sim = sim;
    }
    // Reset the simulator area by erasing planner data
    handlers.reset_sim = function() {
      handlers.step_to_initial();
      handlers.remove_paths();
      self.steps.steps = [];
      self.steps.steps_compiled = [];
      self.info = {};
      for (const k of Object.keys(self.planners))
        self.planners[k].planner.reset();
      // remove info objects
      html_info_obj.panes.innerHTML = '';
    }
    // Toggle big steps
    handlers.set_big_steps = function(big_steps) {
      if (big_steps === true) {
        html_options_obj.big_steps.classList.add('nav_btn_on');
      } else {
        html_options_obj.big_steps.classList.remove('nav_btn_on');
      }
      state.big_steps = big_steps;
      handlers.update_tooltip('big_steps');
    }
    // Switch pen modes
    handlers.set_pens = function(pen, pen2) {
      if (pen === 0) {
        // switch to clear obstacles mode
        html_nav_obj.edit.pen.classList.remove('nav_btn_on');
      } else if (pen === Infinity) {
        // switch to draw obstacles mode
        html_nav_obj.edit.pen.classList.add('nav_btn_on');
      }
      state.pen = pen;
      state.pen2 = pen2;
    }
    // Validate Map Size
    handlers.validate_map_size = function(ele) {
      var nav_file = html_nav_obj.file;
      if (data_handlers.validate_map_size(ele.value) === true) {
        ele.classList.remove('bad');
      } else {
        ele.classList.add('bad');
      }
    }
    // Validate a text input to see if it is a number
    handlers.validate_float = function(ele) {
      if (data_handlers.is_float(ele.value) === true) {
        ele.classList.remove('bad');
        return true;
      } else {
        ele.classList.add('bad');
        return false;
      }
    }
    // Create New Map
    handlers.new_map = function(input) {
      if (input == false)
        return true;// cancel map generation
      var k = html_nav_obj.file.saved_maps.selectedOptions[0].value;
      if (k !== 'new') {
        handlers.parse_loaded_map(self.saved_maps[k].map);
        return true;
      }
      var ele_i = html_nav_obj.file.build_i;
      var ele_j = html_nav_obj.file.build_j;
      // Data validation check
      var data_validator = handlers.validate_map_size;
      if (data_validator(ele_i) === false || data_validator(ele_j) === false) {
        window.alert('Map size must be between 2 and 50 inclusive for both dimensions');
        return false;
      };
      var num_i = parseInt(ele_i.value);
      var num_j = parseInt(ele_j.value);
      // ----- Save check -----
      if (state.saved === false)
        if (window.confirm('You have not saved the map, do you want to continue?') === false)
          return true;
      
      return handlers.build_map(num_i, num_j);
    }
    handlers.build_map = function(num_i, num_j) {
      state.saved = false;
      // Clear steps
      steps_obj.steps = [];
      steps_obj.steps_compiled = [];
      state.step = 0;
      // --=- Create HTML elements ----
      var rulers = html_sim_obj.rulers;
      // Recreate rulers
      rulers.top.innerHTML = '';
      create_ruler(rulers.top, num_j, false);
      rulers.bottom.innerHTML = '';
      create_ruler(rulers.bottom, num_j, false);
      rulers.left.innerHTML = '';
      create_ruler(rulers.left, num_i, false);
      rulers.right.innerHTML = '';
      create_ruler(rulers.right, num_i, false);
      // Recreate map
      html_cells.innerHTML = '';
      self.ui_map = new UIMap(html_cells, num_i, num_j)
      
      // put the start and goal
      handlers.set_start_position(new Vec(0,0));
      handlers.set_goal_position(new Vec(num_i-1, num_j-1));
      
      return true;
      function create_ruler(ele_ruler, length, ascending=true) {
        if (ascending) {
          for (var i=0; i<length; i++) {
            var ele = document.createElement('div');
            ele.innerHTML = i;
            ele.classList.add('rule');
            ele_ruler.appendChild(ele);
          }
        } else {
          for (var i=length-1; i>=0; i--) {
            var ele = document.createElement('div');
            ele.innerHTML = i;
            ele.classList.add('rule');
            ele_ruler.appendChild(ele);
          }
        }
      };
    }
    // Update the bounding box of the cells
    handlers.update_cells_box = function() {
      var cells_box = html_cells.getBoundingClientRect();
      // avoid floating point problems
      state.y_min = cells_box.top + 1;
      state.y_max = cells_box.bottom - 1;
      state.x_min = cells_box.left + 1;
      state.x_max = cells_box.right - 1;
    }
    // Add new info pair pane 
    handlers.new_info_pair_pane = function(key_title, key_subtitle_values) {
      // key_title[0] is key for title; [1] is title string
      // key_subtitle_values[0] is key for pair; [1] is subtitle string, [2] is initial value
      // Check if info pane with key already exists
      if (self.info.hasOwnProperty(key_title[0]))
        throw 'An Info pane with the key "'.concat(key_title[0], '" already exists');
      // build pane
      var ele_pane = document.createElement('DIV');
      ele_pane.classList.add('info_pane');
      // build pane title
      var ele_title = document.createElement('DIV');
      ele_title.classList.add('info_pane_title');
      ele_title.innerHTML = key_title[1];
      ele_title.addEventListener('click', function(e) {
        handlers.toggle_info_pane(this, !self.info[key_title[0]].show, key_title[0]);
      }, false);
      ele_pane.appendChild(ele_title);
      var ele_content = document.createElement('DIV');
      ele_content.classList.add('info_content');
      // build pairs
      var ele_pair, ele_subtitle, ele_value, pairs = {};
      for (var i=0; i<key_subtitle_values.length; i++) {
        // The pair
        ele_pair = document.createElement('DIV');
        ele_pair.classList.add('info_pair');
        // The subtitle
        ele_subtitle = document.createElement('DIV');
        ele_subtitle.classList.add('info_cell', 'title');
        ele_subtitle.innerHTML = key_subtitle_values[i][1];
        ele_pair.appendChild(ele_subtitle);
        // The value
        ele_value = document.createElement('DIV');
        ele_value.classList.add('info_cell');
        ele_value.innerHTML = key_subtitle_values[i][2];
        ele_pair.appendChild(ele_value);
        // add to dictionary
        pairs[key_subtitle_values[i][0]] = {
          subtitle : ele_subtitle,
          value : ele_value
        }
        // add to html pane
        ele_content.appendChild(ele_pair);
      }
      ele_pane.appendChild(ele_content);
      // add to dictionary
      self.info[key_title[0]] = {
        show : true,
        title : ele_title, 
        content : ele_content, 
        pairs : pairs
      };
      // add to html panes
      html_info_obj.panes.appendChild(ele_pane);
    }
    // Add new info text pane 
    handlers.new_info_text_pane = function(key, title, value) {
      if (self.info.hasOwnProperty(key))
        throw 'An Info pane with the key "'.concat(key, '" already exists');
      var info_obj = new UIInfo(UIInfo.TEXT, title, value);
      html_info_obj.panes.appendChild(info_obj.ele_pane);
      self.info[key] = info_obj;
    }
    // Add new info list pane
    handlers.new_info_list_pane = function(key, title, description, list_titles) {
      if (self.info.hasOwnProperty(key))
        throw 'An Info pane with the key "'.concat(key, '" already exists');
      var info_obj = new UIInfo(UIInfo.LIST, title, description, list_titles);
      html_info_obj.panes.appendChild(info_obj.ele_pane);
      self.info[key] = info_obj;
    }
    // Toggle info pane
    handlers.toggle_info_pane = function(ele_title, show, key) {
      var info_pane = self.info[key];
      // key is the info pane key
      if (show === true) {
        info_pane.content.style.display = 'flex';
        ele_title.classList.remove('closed');
      } else {
        info_pane.content.style.display = 'none';
        ele_title.classList.add('closed');
      }
      self.info[key].show = show;
    }
    // Change info pair data
    handlers.set_info_pair = function(pane_key, pair_key, value, subtitle=undefined) {
      // the following will raise an error if wrong keys
      var pair = self.info[pane_key].pairs[pair_key];
      if (subtitle !== undefined)
        pair.subtitle.innerHTML = subtitle;
      pair.value.innerHTML = value;
    }
    handlers.get_info_pair = function(pane_key, pair_key) {
      var pair = self.info[pane_key].pairs[pair_key];
      return {value: pair.value.innerHTML, subtitle: pair.subtitle.innerHTML}
    }
    // Change info text data
    handlers.set_info_text = function(pane_key, value) {
      self.info[pane_key].set_text(value);
    }
    handlers.get_info_text = function(pane_key) {
      return self.info[pane_key].get_text();
    }
    // Change info list
    handlers.insert_list_item = function(pane_key, i, values) {
      self.info[pane_key].insert_list_item(i, values);
    }
    handlers.remove_list_item = function(pane_key, i) {
      self.info[pane_key].remove_list_item(i);
    }
    handlers.get_list_item = function(pane_key, i) {
      return self.info[pane_key].get_list_item(i);
    }
    handlers.set_list_description = function(pane_key, description) {
      self.info[pane_key].set_list_description(description);
    }
    handlers.color_list_item =function(pane_key, i, highlight) {
      self.info[pane_key].color_list_item(i, highlight);
    }
    handlers.get_list_item_color = function(pane_key, i) {
      return self.info[pane_key].get_list_item_color(i);
    }
    handlers.get_list_description = function(pane_key) {
      return self.info[pane_key].get_list_description();
    }
    handlers.edit_list_item = function(pane_key, i, new_values) {
      self.info[pane_key].edit_list_item(i, new_values);
    }
    // Draw a path
    handlers.draw_path = function(start_vec, end_vec, class_name) {
      var ui_map = self.ui_map;
      var window_start = data_handlers.map_to_window_cells(start_vec, ui_map.num_i, ui_map.num_j);
      var window_end = data_handlers.map_to_window_cells(end_vec, ui_map.num_i, ui_map.num_j);
      var ki = ui_map.flatten(start_vec);
      var kf = ui_map.flatten(end_vec);
      if (ui_map.paths[ki] === undefined) {
        // when starting vertex does not contain paths from it
        var path  = new UIPath(window_start, window_end, start_vec, end_vec, class_name);
        ui_map.paths[ki] = [];
        ui_map.paths[ki][kf] = path;
        html_map_obj.map.appendChild(path.ele);
      } else if (ui_map.paths[ki][kf] === undefined) {
        // path does not exist
        var path = new UIPath(window_start, window_end, start_vec, end_vec, class_name);
        ui_map.paths[ki][kf] = path;
        html_map_obj.map.appendChild(path.ele);
      } else {
        // some paths already exists, edit
        ui_map.paths[ki][kf].edit(window_start, window_end, start_vec, end_vec, class_name);
      }
    }
    // Hide a path
    handlers.display_path = function(start_vec, end_vec, show) { // add support for multiple start_vec paths
      var ui_map = self.ui_map; 
      var paths = ui_map.paths;
      var ki = ui_map.flatten(start_vec);
      var kf = ui_map.flatten(end_vec)
      if (paths[ki] === undefined || paths[ki][kf] === undefined)
        return;
      if (show === true)
        paths[ki][kf].display = true;
      else
        paths[ki][kf].display = false;
    }
    handlers.remove_paths = function(start_vec, end_vec){
      if (self.ui_map === undefined)
        return;
      var paths = self.ui_map.paths;
      var parent_ele = html_map_obj.map;
      var node;
      if (start_vec !== undefined && end_vec !== undefined) {
        var ki = self.ui_map.flatten(start_vec);
        var kf = self.ui_map.flatten(end_vec);
        // remove just this 
        if (paths[ki] === undefined || paths[ki][kf] === undefined)
          return;
        node = paths[ki][kf];
        parent_ele.removeChild(node.ele);
        delete paths[ki][kf];
      } else if (start_vec !== undefined && end_vec === undefined) {
        var ki = self.ui_map.flatten(start_vec);
        if (paths[ki] === undefined)
          return
        if (start_vec.i == 19 && start_vec.j == 29)
          var b = 'a';
        for (kf of Object.keys(paths[ki])) {
          node = paths[ki][kf];
          parent_ele.removeChild(node.ele);
          delete paths[ki][kf];
        }
      } else {
        // delete all
        for (ki of Object.keys(paths)) {
          for (kf of Object.keys(paths[ki])) {
            node = paths[ki][kf];
            parent_ele.removeChild(node.ele);
            delete paths[ki][kf];
          }
        }
      }
    }
    // for compiling
    handlers.get_paths = function(start_vec, end_vec) {
      var ki = self.ui_map.flatten(start_vec);
      var paths = self.ui_map.paths;
      var tmp = paths[ki];
      if (tmp === undefined) 
        return undefined;
      if (end_vec === undefined)        
        return tmp;
      var kf = self.ui_map.flatten(end_vec)
      tmp = tmp[kf];
      if (tmp === undefined)
        return undefined;
      return tmp;
    }
    /*
    // Colour cell
    handlers.set_cell_hsl = function(i, j, h, s, l, bg=true) {
      // all from 0 to 1
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      handlers.set_cell_color(i, j, 'hsl('.concat(h, ',', s, '%,', l, '%)'), bg);
    }
    handlers.set_cell_rgb = function(i, j, r, g, b, bg=true) {
      // all from 0 to 1
      r = Math.round(r * 255);
      g = Math.round(g * 255);
      b = Math.round(b * 255);
      handlers.set_cell_color(i, j, 'rgb('.concat(r, ',', g, ',', b, ')'), bg);
    }
    handlers.set_cell_color = function(i, j, css_string, bg=true)  {
      if (bg === true)
        self.ui_map.cells(i, j).ele.style.backgroundColor = css_string;
      // if (border === true)
        // self.ui_map.cells(i, j).ele.style.borderColor = css_string;
    }
    handlers.get_cell_color_css = function(i, j) {
      return getComputedStyle(self.ui_map.cells(i,j).ele)['background-color'];
    }
    */
    handlers.set_cell_class = function(vec, class_name, remove=false) {
      if (remove === true)
        self.ui_map.cells(vec).ele.classList.remove(class_name)
      else
        self.ui_map.cells(vec).ele.classList.add(class_name)
    }
    handlers.contains_cell_class = function(vec, class_name) {
      return self.ui_map.cells(vec).ele.classList.contains(class_name);
    }
    // Write cell
    handlers.set_cell_text = function(vec, txt) {
      self.ui_map.cells(vec).ele.innerHTML = txt;
    }
    // Set obstacle
    handlers.set_cell_obstacle = function(i, j, cost) {
      var cell = self.ui_map.cells(i, j);
      if (cost === Infinity) {
        cell.ele.classList.add('cell_obs');
        cell.weight = Infinity;
      } else {
        cell.ele.classList.remove('cell_obs');
        cell.weight = 0;
      }
    }
    handlers.set_cell_focus = function(vec, focus) {
      var cell = self.ui_map.cells(vec);
      if (cell === null)
        return; // cell does not exist
      if (focus === false)
        cell.ele.classList.remove('focus');
      else // true or undefined
        cell.ele.classList.add('focus');
    }
    // Compile actions
    handlers.compile_steps = function() {
      // reset the steps;
      state.step = 0;
      var steps = steps_obj.steps;
      var compiled_action, compiled_step, actions, action, args;
      for (var s=0; s<steps.length; s++) {
        // for each step
        actions = steps[s].actions;
        compiled_step = {
          actions: [],
          major: steps[s].major,
          merge: steps[s].merge
        };
        // get the actions in the step
        for (var a=0; a<actions.length; a++) {
          action = actions[a];
          args = action[1];
          switch (action[0]) {
            /*
            case 'r':
              records.add_record(args);
              compiled_action = {
                fwd_handler : records.next_record,
                fwd_args : null,
                bck_handler : records.prev_record,
                bck_args : null
              }*/
            /* // action is to color the cell
            case 'ch': // set hsl
            case 'cr': // set rgb
              // compile the backward arguments
              var i=args[0], j=args[1], bg=args[5], border=args[6];
              // get the current color
              var bck_args = [i, j, handlers.get_cell_color_css(i, j)];
              if (bg !== undefined && bg !== false) {
                bck_args.push(bg);
                if (border !== undefined && border !== false)
                  bck_args.push(border);
              }
              // compile the step
              compiled_action = {
                fwd_handler : action[0] === 'h' ? handlers.set_cell_hsl : handlers.set_cell_rgb,
                fwd_args : args,
                bck_handler : handlers.set_cell_color,
                bck_args : bck_args
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break; */
            // action is to set the text of the cell
            case 't': // set text
              compiled_action = {
                fwd_handler : handlers.set_cell_text,
                fwd_args : args,
                bck_handler : handlers.set_cell_text,
                bck_args: [args[0], self.ui_map.cells(args[0]).ele.innerHTML]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'p': // draw path
              var prev_path = handlers.get_paths(args[0], args[1]);
              if (prev_path === undefined) {
                // path does not exist before
                compiled_action = {
                  fwd_handler : handlers.draw_path,
                  fwd_args : args,
                  bck_handler : handlers.remove_paths,
                  bck_args : [args[0], args[1]]
                }
              } else if (prev_path.type !== args[2]) {// type is different
                compiled_action = {
                  fwd_handler : handlers.draw_path,
                  fwd_args : args,
                  bck_handler : handlers.draw_path,
                  bck_args : [args[0], args[1], prev_path.type]
                }
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args);
              break;
            case 'rp': // remove path
              var prev_paths = handlers.get_paths(args[0], args[1]);
              if (prev_paths === undefined )
                continue // path does not exist, nth to delete
              if (args[1] === undefined) {// multiple paths need to be removed
                // prev_paths is an array of paths
                // get all path properties
                var h_args = [];
                var kfs = Object.keys(prev_paths);
                for (const kf of kfs) {
                  prev_path = prev_paths[kf];
                  h_args.push([prev_path.start_pos, prev_path.end_pos, prev_path.type]);
                }
                var h = function(h_args) {
                  for (var i=0; i<h_args.length; i ++) {
                    handlers.draw_path.apply(null, h_args[i]);
                  }
                }
                compiled_action = {
                  fwd_handler : handlers.remove_paths,
                  fwd_args : args,
                  bck_handler : h,
                  bck_args : [h_args]
                }
              } else {
                // prev_paths is just a path
                compiled_action = {
                  fwd_handler : handlers.remove_paths,
                  fwd_args : args,
                  bck_handler : handlers.draw_path,
                  bck_args : [args[0], args[1], prev_paths.type]
                }
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args);
              break;
            case 'dp': // display path
              var prev_path = handlers.get_paths(args[0], args[1]);
              if (prev_path === undefined && args[2] === false)
                continue;
              var prev_show = prev_path.show;
              if (prev_show === args[2])
                continue;
              compiled_action = {
                fwd_handler : handlers.display_path,
                fwd_args : args, // get the show
                bck_handler : handlers.display_path,
                bck_args : [args[0], args[1], prev_show],
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'ip': // set info pair
              // pane_key, pair_key, value, subtitle=undefined
              var prev_info = handlers.get_info_pair(args[0], args[1]);
              var bck_args = [args[0], args[1], prev_info.value]
              if (args[3] !== undefined)
                bck_args.push(prev_info.subtitle);
              // compile the step
              compiled_action = {
                fwd_handler : handlers.set_info_pair,
                fwd_args : args,
                bck_handler : handlers.set_info_pair,
                bck_args : bck_args
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'it': // set info text
              // pane_key, value
              var prev_value = handlers.get_info_text(args[0]);
              // compile the step
              compiled_action = {
                fwd_handler : handlers.set_info_text,
                fwd_args : args,
                bck_handler : handlers.set_info_text,
                bck_args : [args[0], prev_value]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'cn': // set class
              var remove = args[2] === true; // args[2] is an optional parameter
              if (handlers.contains_cell_class(args[0], args[1]) === true && remove === false)
                continue; // adding the cell class will have no effect
              if (handlers.contains_cell_class(args[0], args[1]) === false && remove === true)
                continue; // adding the cell class will have no effect
              compiled_action = {
                fwd_handler : handlers.set_cell_class,
                fwd_args : [args[0], args[1], remove],
                bck_handler : handlers.set_cell_class,
                bck_args : [args[0], args[1], !remove]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'ili': // info: insert list item
              // console.log('insertlist:', args[0], args[1], args[2]);
              compiled_action = {
                fwd_handler : handlers.insert_list_item,
                fwd_args : args,
                bck_handler : handlers.remove_list_item,
                bck_args : [args[0], args[1]]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              // console.log('insertListEles', Object.keys(self.info[args[0]].eles));
              break;
            case 'ilr': // info: remove list item
              var values = handlers.get_list_item(args[0], args[1]).values;
              // console.log('remlist:', args[0], args[1], values);
              // console.log(self.info[args[0]].eles[args[1]].values);
              compiled_action = {
                fwd_handler : handlers.remove_list_item,
                fwd_args : args,
                bck_handler : handlers.insert_list_item,
                bck_args : [args[0], args[1], values]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              // console.log('removeListEles', Object.keys(self.info[args[0]].eles));
              break;
            case 'ild': // info: set list description
              var desc = handlers.get_list_description(args[0]);
              compiled_action = {
                fwd_handler : handlers.set_list_description,
                fwd_args : args,
                bck_handler : handlers.set_list_description,
                bck_args : [args[0], desc]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'ilc':
              var prev_highlight = handlers.get_list_item_color(args[0], args[1]);
              if (args[2] === prev_highlight)
                continue // skip this step since this won't change the color
              compiled_action = {
                fwd_handler : handlers.color_list_item,
                fwd_args : args,
                bck_handler : handlers.color_list_item,
                bck_args : [args[0], args[1], prev_highlight]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'ile':
              var values = handlers.get_list_item(args[0], args[1]).values;
              compiled_action = {
                fwd_handler : handlers.edit_list_item,
                fwd_args : args,
                bck_handler : handlers.edit_list_item,
                bck_args : [args[0], args[1], values]
              }
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
            case 'cf':
              compiled_action = {
                fwd_handler : handlers.set_cell_focus,
                fwd_args : args,
                bck_handler : handlers.set_cell_focus,
                bck_args : [args[0], !args[1]]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
          }
          // append the compiled step to steps_compiled
          compiled_step.actions.push(compiled_action);
        }
        // compile the step
        steps_obj.steps_compiled.push(compiled_step);
        state.step++;
      }
      handlers.step_to_initial();
    }
    // Next step
    handlers.step_forward = function() {
      if (state.step === steps_obj.steps_compiled.length)
        return false; // return if at the last state
      // state.step is always at the current step, first step is 1
      var step, action, actions;
      var steps = steps_obj.steps_compiled;
      while (state.step < steps.length) {
        step = steps[state.step++];
        actions = step.actions;
        // iterate through every action in the step
        for (var a=0; a<actions.length; a++) {
          action = actions[a];
          // run the forward handler
          action.fwd_handler.apply(null, action.fwd_args);
        }
        if (step.merge === true) {
          continue;
        }
        if (state.big_steps === false || 
          state.step !== steps.length && 
          steps[state.step].major === true) {
          break;
        }
      }
      // for the play part
      if (state.step === steps.length)
        if (state.play_handler_id !== undefined){
          handlers.play_pause(false);
        }
      return true;
    }
    // Previous step
    handlers.step_backward = function() {
      if (state.step === 0)
        return false; // return if at the first state
      // state.step is always at the current sttep, first step is 1
      var action, step, actions, steps;
      steps = steps_obj.steps_compiled;
      while (state.step > 0) {
        step = steps[--state.step];
        actions = step.actions;
        // iterate through every action in the step
        for (var a=actions.length-1; a>=0; a--) {
          action = actions[a];
          // run the forward handler
          action.bck_handler.apply(null, action.bck_args);
        }
        if (state.step !== 0 && steps[state.step-1].merge === true) {
          continue;
        }
        if (state.big_steps === false || step.major === true) {
          break;
        }
      }
      return true;
    }
    // Step to end
    handlers.step_to_final = function() {
      while (handlers.step_forward() === true) {}
    }
    // Step to start
    handlers.step_to_initial = function() {
      while (handlers.step_backward() === true) {}
    }
    // Play
    handlers.play = function(time_step=self.TIME_STEP) {
      state.play_handler_id = setInterval(handlers.step_forward, time_step);
    }
    // Pause
    handlers.pause = function() {
      clearInterval(state.play_handler_id);
      state.play_handler_id = undefined;
    }
    handlers.get_start_position = function() {
      var box = html_map_obj.start.getBoundingClientRect();
      var x = (box.right + box.left) / 2;
      var y = (box.top + box.bottom) / 2;
      var i, j;
      [i, j] = data_handlers.window_to_map(x, y, state.x_min, state.y_min, self.ui_map.num_i, self.ui_map.num_j)
      i = Math.round(i);
      j = Math.round(j);
      return {i: i, j: j};
    }
    handlers.get_goal_position = function() {
      var box = html_map_obj.goal.getBoundingClientRect();
      var x = (box.right + box.left) / 2;
      var y = (box.top + box.bottom) / 2;
      var i, j;
      [i, j] = data_handlers.window_to_map(x, y, state.x_min, state.y_min, self.ui_map.num_i, self.ui_map.num_j)
      i = Math.round(i);
      j = Math.round(j);
      return {i: i, j: j};
    }
    handlers.set_start_position = function(vec) {
      var xy = data_handlers.map_to_window_cells(vec, self.ui_map.num_i, self.ui_map.num_j);
      html_map_obj.start.style.top = xy.y + 'px';
      html_map_obj.start.style.left = xy.x + 'px';
    }
    handlers.set_goal_position = function(vec) {
      var xy = data_handlers.map_to_window_cells(vec, self.ui_map.num_i, self.ui_map.num_j);
      html_map_obj.goal.style.top = xy.y + 'px';
      html_map_obj.goal.style.left = xy.x + 'px';
    }
    handlers.add_planner = function(planner_obj, key, display_name, options) {
      state.planner = key;
      options.sort();
      self.planners[key] = {
        display_name: display_name,
        planner: planner_obj,
        options: options
      }
      var planner_dialog = html_dialog_obj.templates.planners;
      var ele_algorithms = html_options_obj.algorithms;
      var found = false, ele_opt;
      for (ele_opt of ele_algorithms) {
        if (ele_opt.innerHTML > display_name) {
          found = true;
          break;
        }
      }
      if (found === true) { // not the last one
        ele_algorithms.insertBefore(new Option(display_name, key), ele_opt);
      } else {
        ele_algorithms.appendChild(new Option(display_name, key, false, true));
        html_options_obj.planners.innerHTML = display_name;
      }
    }
    handlers.change_planner_options = function() {
      var key = html_options_obj.algorithms.selectedOptions[0].value;
      var p_opts = self.planners[key].options;
      var opts = Object.keys(self.options);
      var p_opt, opt;
      var p=0, o=0;
      while (p < p_opts.length && o < opts.length) {
        p_opt = p_opts[p];
        opt = opts[o];
        if (p_opt === opt) {// same key
          self.options[opt].ele.style.display = 'revert';
          o++; p++;
        } else if (p_opt < opt) { // invalid key
          p++;
        } else { // not the same key (p_opt > opt)
          self.options[opt].ele.style.display = 'none';
          o++;
        }
      }
      while (o < opts.length) {
        opt = opts[o];
        self.options[opt].ele.style.display = 'none';
        o++;
      }
    }
    handlers.update_planner = function(input) {
      if (input === false) {
        return true; // cancel
      }
      // get the dropdown / select
      if (state.sim === true) {
        handlers.play_pause(false);
        handlers.reset_sim();
      }
      // get the algo key
      var ele_algorithms = html_options_obj.algorithms
      var key = ele_algorithms.options[ele_algorithms.selectedIndex].value;
      html_options_obj.planners.innerHTML = self.planners[key].display_name;
      state.planner = key;
      if (state.sim === true) {
        handlers.play_pause(true, true);
      }
      return true;
    }
    handlers.parse_loaded_map = function(string) {
      var c = 0;
      var contents = string.split('\n');
      // validate the length
      var num_i = contents[c++];
      var num_j = contents[c++];
      if (data_handlers.validate_map_size(num_i) === false || data_handlers.validate_map_size(num_j) === false) {
        alert('Map size indicated in the file is wrong, or it is not a map file. Try loading another file?').
        return;
      }
      num_i = parseInt(num_i);
      num_j = parseInt(num_j);
      
      // get start position and validate
      var i = contents[c++];
      var j = contents[c++];
      var start_vec;
      if (i < -0.5 || i >= num_i - 0.5 || j < -0.5 || j >= num_j - 0.5) {
        alert('The start coordinate is invalid, setting to (0, 0)');
        start_vec = new Vec(0, 0);
      } else {
        start_vec = new Vec(i, j);
      }
      
      // get goal position and validate
      i = contents[c++];
      j = contents[c++];
      var goal_vec;
      if (i < -0.5 || i >= num_i - 0.5 || j < -0.5 || j >= num_j - 0.5) {
        alert('The goal coordinate is invalid, setting to ('.concat(num_i-1, ', ', num_j-1, ')'));
        goal_vec = new Vec(num_i-1, num_j-1);
      } else {
        goal_vec = new Vec(i, j);
      }
      
      // build the map
      contents = contents[c++];
      handlers.build_map(num_i, num_j);
      var map = self.ui_map;
      var k = 0;
      for (var i=0; i<num_i; i++) {
        for (var j=0; j<num_j; j++) {
          if (contents.charAt(k++) === '1') {
            handlers.set_cell_obstacle(i, j, Infinity);
          }
        }
      }
      
      // set the goal and start positions
      handlers.set_start_position(start_vec);
      handlers.set_goal_position(goal_vec);
      
      // set save
      state.saved = true;
    }
    handlers.load_map = function() {
      // ----- Save check -----
      if (state.saved === false)
        if (window.confirm('You have not saved the map, do you want to continue? \nIf you choose "Cancel", you need to manually click the save button to save. After that, you would have to manually click the load file button to try loading again. This is because it is impossible for Javascript to know if you have saved the map, due to security reasons.') === false) {
          return;
        }
      
      // load file and parse contents
      var ele = document.createElement('input');
      ele.setAttribute('type', 'file');
      ele.setAttribute('accept', '.YourMap');
      ele.onchange = function(e) {
        var f = ele.files[0]; 
        if (f) {
          var r = new FileReader();
          r.onload = function(e) { 
            handlers.parse_loaded_map(e.target.result);
          }
          r.readAsText(f);
        } else { 
          alert("Failed to load file!");
          return;
        }
        
        
      }
      ele.click();
    }
    handlers.save_map = function() {
      var map = self.ui_map;
      // map length information
      var map_str = ''.concat(map.num_i, '\n', map.num_j, '\n');
      var tmp = handlers.get_start_position();
      map_str = map_str.concat(tmp.i, '\n', tmp.j, '\n');
      tmp = handlers.get_goal_position();
      map_str = map_str.concat(tmp.i, '\n', tmp.j, '\n');
      // just use binary string
      for (var i=0; i<map.num_i; i++) {
        for (var j=0; j<map.num_j; j++) {
          tmp = map.cells(i, j).is_obstacle() ? 1 : 0;
          map_str = map_str.concat(tmp);
        }
      }
      // Blob generation
      var save_ele = document.createElement('a');
      var data = new Blob([map_str], {type: 'text/plain'});
      if (state.blob !== null) {
        window.URL.revokeObjectURL(state.blob);
      }
      state.blob = window.URL.createObjectURL(data);
      save_ele.href = state.blob;
      save_ele.download = "map_".concat(map.num_i, "_", map.num_j, "_", self.state.unique_map, ".YourMap");
      save_ele.click();
      self.state.unique_map++;
      state.saved = true;
    }
    
  }
  initialise_data_handlers() {
    var handlers = this.data_handlers;
    var self = this;
    // Data validation for floats
    handlers.is_float = function(val) {
      var floatRegex = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
      if (!floatRegex.test(val))
          return false;
      val = parseFloat(val);
      if (isNaN(val))
          return false;
      return true;
    }
    // Data validation for ints
    handlers.is_int = function(val) {
      var intRegex = /^[-+]?[0-9]*([eE][-+]?[0-9]+)?$/;
      if (!intRegex.test(val))
        return false;
      val = parseInt(val)
      if (isNaN(val))
        return false;
      return true;
    }
    // Data validation for map size
    handlers.validate_map_size = function(val) {
      if (self.data_handlers.is_int(val) === false)
        return false;
      val = parseInt(val);
      return val >= 2 && val <= 50;
    }
    // Convert window x,y to map [i,j]
    handlers.window_to_map = function(x, y, x_min, y_min, num_i, num_j, cell_size=self.CELL) {
      return [num_i - (y-y_min) / cell_size - 0.5, num_j - (x-x_min) / cell_size - 0.5]
    }
    // Convert map i, j to window [x,y]
    handlers.map_to_window_cells = function(vec, num_i, num_j, cell_size=self.CELL) {
      return new Vec(cell_size * (num_j - vec.j - 0.5), cell_size * (num_i - vec.i - 0.5))
    }
  }
}
/* Initialise the UI */
ui = new UI();

/* ----------------- Path Planners ------------------- */
class Planner {
  constructor(key, display_name, options) {
    this.ui = window.ui;
    var ui = this.ui;
    this.ui.graphic_handlers.add_planner(this, key, display_name, options);
    // this.add_step = this.ui.steps.add_step;
    this.new_info_pair_pane = this.ui.graphic_handlers.new_info_pair_pane;
    this.new_info_text_pane = this.ui.graphic_handlers.new_info_text_pane;
    this.new_info_list_pane = this.ui.graphic_handlers.new_info_list_pane;
    this.reset_positions();
  }
  get map() {
    return this.ui.ui_map;
  }
  reset_positions() {
    this.ui.graphic_handlers.update_cells_box();
    var vec = this.ui.graphic_handlers.get_goal_position();
    this.goal_position = new Vec(vec.i, vec.j);
    vec = this.ui.graphic_handlers.get_start_position();
    this.start_position = new Vec(vec.i, vec.j);
  }
  compile() {
    this.reset_positions();
    var opts = this.ui.options;
    this.options = {};
    for (const key of Object.keys(opts))
      this.options[key] = opts[key].choice;
    this.run();
    this.ui.graphic_handlers.compile_steps();
  }
  add_step(major=false, merge=false) {
    this.step = this.ui.steps.add_step(major, merge);
    return this.step;
  }
}

// Dynamically load all other planners
file_names = [
  'FloodFill',
  'DepthFirst',
  'GreedyBestFirst',
  'Dijkstra',
  'AStar',
//   'JumpPointHC'
];
for (f of file_names) {
  var script = document.createElement("script");  // create a script DOM node
  script.src = 'scripts/planners/'.concat(f, '.js');  // set its src to the provided URL
  document.body.appendChild(script); 
//   console.log("Loaded", f);
}

/*var h = Math.round(Math.random()*360);
var s = 80;
var l = 70;
document.body.style.background = 'hsl('.concat(h,',', s, '%,', l, '%)');
*/
document.getElementById('ui_load_overlay').parentNode.removeChild(document.getElementById('ui_load_overlay'));

// select A*
{
  var tmp = this.ui.html.nav.options.algorithms;
  for(var i = 0; i < tmp.options.length;i++) {
    if(tmp.options[i].value == "astar" ) {
      tmp.options[i].selected = true;
    }
  }
}
this.ui.graphic_handlers.change_planner_options(); // just in case
this.ui.graphic_handlers.update_planner(true);
