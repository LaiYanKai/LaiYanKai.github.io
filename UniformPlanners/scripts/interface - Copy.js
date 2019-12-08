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
class UIPath {
  static get TRACE() {return 0};
  static get PATH() {return 1};
  static resize(ele, length) {
    ele.innerHTML = "<path fill='black' d='M 1.5 3 a 1.5 1.5, 0, 0, 0, 0 3 h ".concat(
      length-18, " v 3 l 6 -3 h 12 a 1.5 1.5, 0, 0, 0, 0 -3 h -12 l -6 -3 v 3 z'/>");
    ele.setAttribute('viewBox', "0 0 ".concat(length + 3, " 9"));
  }
  color(type) {
    this.type = type;
    var class_list;
    switch (type) {
      case 0: // trace
      case undefined:
        class_list = 'path_t';
        break;
      case 1: // path
        class_list = 'path_p';
        break;
      default:
        break;
    }
    this.ele.firstChild.classList = class_list;
  }
  constructor(start_pos, end_pos, type) {
    var ele = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // set path class
    ele.classList = 'path';
    this.ele = ele;
    
    //edit
    this.start_pos = new Vec(-1, -1);
    this.end_pos = new Vec(-1, -1);
    this.edit(start_pos, end_pos, type);
  }
  edit(start_pos, end_pos, type) {
    var ele = this.ele;
    if (!this.start_pos.equals(start_pos) || !this.end_pos.equals(end_pos)) {
      var yf = end_pos.y, xf = end_pos.x, yi = start_pos.y, xi = start_pos.x;
      // line_radius is the cap radius. used when box-sizing css is content-box, height is zero, and border is line_radius px
      var angle = Math.atan2(yf-yi, xf-xi);
      var length = Math.sqrt(Math.pow(xf-xi, 2) + Math.pow(yf-yi, 2));
      UIPath.resize(ele, length);
      ele.style.width = ''.concat(length + 3, 'px');
      ele.style.transform = 'rotate('.concat(angle * 180 / Math.PI, 'deg)');
      ele.style.top = ''.concat(yi+length*Math.sin(angle)/2 - 3.5, 'px');
      ele.style.left = ''.concat(xi-length*(1-Math.cos(angle))/2 - 1.5, 'px');
      this.start_pos = start_pos;
      this.end_pos = end_pos;
    }
    
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
  constructor() {
    this.actions = [];
  }
  // set_cell_rgb(i, j, r, g, b, bg=true, border=true) {
    // this.actions.push(['r', arguments]);
  // }
  // set_cell_hsl(i, j, h, s, l, bg=true, border=true) {
    // this.actions.push(['h', arguments]);
  // }
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
  
}
// UI Info, each info object is a an info pane with a specific type
class UIInfo {
  constructor() {
    
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
  equals(vec) {
    return vec instanceof Vec && vec.i === this.i && vec.j === this.j;
  }
  copy(round=false) {
    return new Vec(this.i, this.j, round);
  }
  get x() {return this.i;}
  get y() {return this.j;}
}
// Octal directions class
class Ord {
  static get N() {return 0}
  static get NW() {return 1}
  static get W() {return 2}
  static get SW() {return 3}
  static get S() {return 4}
  static get SE() {return 5}
  static get E() {return 6}
  static get NE() {return 7}
  static get list() {return [0,1,2,3,4,5,6,7]}
  static ord_to_vec(ord) {
    switch (ord) {
      case Ord.N:
        return new Vec(1, 0);
      case Ord.NW:
        return new Vec(1, 1);
      case Ord.W:
        return new Vec(0, 1);
      case Ord.SW:
        return new Vec(-1, 1);
      case Ord.S:
        return new Vec(-1, 0);
      case Ord.SE:
        return new Vec(-1, -1);
      case Ord.E:
        return new Vec(0, -1);
      case Ord.NE:
        return new Vec(1, -1);
      default:
        throw 'ord_to_vecs: Invalid ordinal "'.concat(ord, '"');
    }
  }
  static vecs_to_ord(arg0, arg1, arg2, arg3) {
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
        throw 'vecs_to_ord: there is no difference in vecs';
      di /= dj_a;
      dj /= dj_a;
    } else {
      if (di_a === 0)
        throw 'vecs_to_ord: there is no difference in vecs';
      di /= di_a;
      dj /= di_a;
    }
    // 
    if (di === -1) {
      if (dj === -1) {
        return Ord.SE
      } else if (dj === 0) {
        return Ord.S
      } else if (dj === 1) {
        return  Ord.SW
      }
    } else if (di === 0) {
      if (dj === -1) 
        return Ord.E
      else if (dj === 1)
        return Ord.W
    } else if (di === 1) {
      if (dj === -1) {
        return Ord.NE
      } else if (dj === 0) {
        return Ord.N
      } else if (dj === 1) {
        return Ord.NW
    }
    throw 'vecs_to_ord: inputs do not result in octal directions. Either the inputs are wrong, or there were floating point issues when dividing: '.concat(arg0, ', ', arg1, 
      arg2 === undefined ? '' : ', '.concat(
      arg3 === undefined ? ', '.concat(arg2) : ', '.concat(arg2, ',', arg3)));
    }
  }
  static is_diagonal(ord) {return ord % 2 === 1}
  static is_cardinal(ord) {return ord % 2 === 0}
  static rotate(ord, steps) {
    ord += steps;
    while (ord < 0)
      ord += 8;
    return ord % 8;
  }
}

class SavedMaps {
  static get HELLOWORLD_20_30() {
    return `20
30
1
1
12
27
000000000000000000000000000000000010000000000000000000000000001110111101101011111001111100011010000100101010001001010100010010000100011010001011010110000010000101111000001010010010010010000101001010001010000010011010000100001010001010000010001110000111111011111010000010000000000000000000001000000000000000000000000000001000000000011110111111111011111010001111010010000100001000000010001000010010000100001000001010001110010010000100001000001010001000000010000100000000111011011011010010000100001000001010001000010010000100001000001010001000011110000100001011111010001000000000000100000000000000000000`}
}

/* -------- UI methods -------- */
class UI {
  constructor() {
    this.instantiate();
    this.initialise_graphic_handlers();
    this.initialise_data_handlers();
    this.initialise_data();
    // Create map at startup
    // this.graphic_handlers.new_map(this, true);
    this.graphic_handlers.parse_loaded_map(SavedMaps.HELLOWORLD_20_30);
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
          save : document.getElementById('ui_save')
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
          algorithms: document.getElementById('ui_algorithms')
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
        title : document.getElementById('ui_info_title'),
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
      unique_map : 0
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
    this.planners = {}
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
    var graphic_handlers = self.graphic_handlers;
    var data_handlers = self.data_handlers;
    // Dialog
    function init_dialog() {
      var templates_ui = document.getElementById('ui_dialog_templates');
      var templates = templates_ui.childNodes;
      var dialog_templates = html_dialog.templates;
      var key, template;
      for (var t=0; t<templates.length; t++) {
        template = templates[t]
        if (template.nodeType == 1) {
          key = template.getAttribute('key');
          dialog_templates[key] = template;
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
        graphic_handlers.display_tooltip('pen');
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
      // Tooltips
      // Tooltips - Build
      html_tooltip_obj.tooltip.style.display = 'none';
      html_nav_obj.file.build.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('build');
      }, false);
      html_nav_obj.file.build.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Save
      html_nav_obj.file.save.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('save');
      }, false);
      html_nav_obj.file.save.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Load
      html_nav_obj.file.load.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('load');
      }, false);
      html_nav_obj.file.load.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Pen
      html_nav_obj.edit.pen.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('pen');
      }, false);
      html_nav_obj.edit.pen.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Exit
      html_nav_obj.run.exit.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('exit');
      }, false); 
      html_nav_obj.run.exit.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Initial
      html_nav_obj.run.initial.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('initial');
      }, false);    
      html_nav_obj.run.initial.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Prev
      html_nav_obj.run.prev.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('prev');
      }, false);      
      html_nav_obj.run.prev.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Play
      html_nav_obj.run.play.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('play');
      }, false); 
      html_nav_obj.run.play.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);
      // Tooltips - Next
      html_nav_obj.run.next.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('next');
      }, false);    
      html_nav_obj.run.next.addEventListener('mouseleave', function(e) {
          graphic_handlers.hide_tooltip();
        }, false);      
      // Tooltips - Final
      html_nav_obj.run.final.addEventListener('mouseenter', function(e) {
        graphic_handlers.display_tooltip('final');
      }, false);   
      html_nav_obj.run.final.addEventListener('mouseleave', function(e) {
        graphic_handlers.hide_tooltip();
      }, false);
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
      html_info_obj.title.addEventListener('click', function(e) {
        graphic_handlers.toggle_info(!state.info);
      }, false);
    }
    function init_steps() {
      // The user level method for adding a step of steps
      // step methods are located in UIStep
      self.steps.add_step = function() {
        var step = new UIStep();
        self.steps.steps.push(step);
        return step;
      }
    }
    
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
          state.dialog_handler = handlers.update_planner;
          title = 'Choose Planners';
          template = html_dialog_obj.templates[dialog_key];
        break;
      }
      
      // HTML operations
      html_dialog_obj.dialog.style.display = 'flex';
      html_dialog_obj.title.appendChild(document.createTextNode(title));
      html_dialog_obj.area.appendChild(template);
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
    handlers.display_tooltip = function(tooltip_key) {
      var box, ele, help;
      switch (tooltip_key) {
        case 'build':
          help = 'New map';
          ele = html_nav_obj.file.build;
          break;
        case 'save':
          help = 'Save the map';
          ele = html_nav_obj.file.save;
          break;
        case 'load':
          help = 'Load a map';
          ele = html_nav_obj.file.load;
          break;
        case 'pen':
          if (state.pen === Infinity)
            help = 'Switch to obstacle-clearing mode';
          else
            help = 'Switch to obstacle-drawing mode';
          ele = html_nav_obj.edit.pen;
          break;
        case 'exit':
          help = 'Switch to editing mode';
          ele = html_nav_obj.run.exit;
          break;
        case 'initial':
          help = 'Go back to the start';
          ele = html_nav_obj.run.initial;
          break;
        case 'prev':
          help = 'Step back';
          ele = html_nav_obj.run.prev
          break;
        case 'play':
          if (state.play == true)
            help = 'Pause'
          else
            help = 'Play'
          ele = html_nav_obj.run.play;
          break;
        case 'next':
          help = 'Step forward';
          ele = html_nav_obj.run.next;
          break;
        case 'final':
          help = 'Go to the end';
          ele = html_nav_obj.run.final;
          break;
      }
      box = ele.getBoundingClientRect();
      html_tooltip_obj.area.innerHTML = help;
      var tooltip = html_tooltip_obj.tooltip;
      tooltip.style.top = '' + (box.bottom + 5) + 'px';
      tooltip.style.display = 'block';
      tooltip.style.left = '' + (box.left + (box.width - tooltip.getBoundingClientRect().width) / 2) + 'px';
    }
    // Hide Tooltips
    handlers.hide_tooltip = function() {
      html_tooltip_obj.tooltip.style.display = 'none';
    }
    // Toggle Info bar 
    handlers.toggle_info = function(show) {
      if (show === false) {
        html_info_obj.info.style.width = '20px';
        html_info_obj.title.style.height = 'calc(100% - 10px)';
        var panes = html_info_obj.panes.childNodes;
        for (var i=0; i<panes.length; i++)
          if (panes[i].tagName === 'DIV')
            panes[i].style.display = 'none';
      } else {
        html_info_obj.info.style.width = '250px';
        html_info_obj.title.style.height = '10px';
        var panes = html_info_obj.panes.childNodes;
        for (var i=0; i<panes.length; i++)
          if (panes[i].tagName === 'DIV')
            panes[i].style.display = 'flex';
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
      handlers.display_tooltip('play');
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
        // Display elements
        html_nav_obj.file.file.style.display = 'flex';
        html_nav_obj.edit.edit.style.display = 'flex';
        // Delete paths and annotations
        handlers.reset_sim();
      }
      state.sim = sim;
    }
    // Reset the simulator area by erasing planner data
    handlers.reset_sim = function() {
      handlers.step_to_initial();
      handlers.remove_paths();
      self.steps.steps = [];
      self.steps.steps_compiled = [];
      self.info = {};
      // remove path
      html_info_obj.panes.innerHTML = '';
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
    // Create New Map
    handlers.new_map = function(input) {
      if (input == false)
        return true;// cancel map generation
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
        handlers.toggle_info_pane(!self.info[key_title[0]].show, key_title[0]);
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
    handlers.new_info_text_pane = function(key_title, value) {
      // key_title[0] is key for title; [1] is title string
      // value is initial value
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
        handlers.toggle_info_pane(!self.info[key_title[0]].show, key_title[0]);
      }, false);
      ele_pane.appendChild(ele_title);
      // build content
      var ele_content = document.createElement('DIV');
      ele_content.classList.add('info_content');
      // build the text
      var ele_value = document.createElement('DIV');
      ele_content.classList.add('info_text');
      ele_value.innerHTML = value;
      // append the nodes
      ele_content.appendChild(ele_value);
      ele_pane.appendChild(ele_content);
      // add to dictionary
      self.info[key_title[0]] = {
        show : true,
        title : ele_title, 
        content : ele_content, 
        value : ele_value
      };
      // add to html panes
      html_info_obj.panes.appendChild(ele_pane);
    }
    // Toggle info pane
    handlers.toggle_info_pane = function(show, key) {
      var info_pane = self.info[key];
      // key is the info pane key
      if (show === true)
        info_pane.content.style.display = 'flex';
      else
        info_pane.content.style.display = 'none';
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
      self.info[pane_key].value.innerHTML = value;
    }
    handlers.get_info_text = function(pane_key) {
      return self.info[pane_key].value.innerHTML;
    }
    // Draw a path
    handlers.draw_path = function(start_vec, end_vec, class_name) {
      var ui_map = self.ui_map;
      var start_pos = data_handlers.map_to_window_cells(start_vec, ui_map.num_i, ui_map.num_j);
      var end_pos = data_handlers.map_to_window_cells(end_vec, ui_map.num_i, ui_map.num_j);
      var ki = ui_map.flatten(start_vec);
      var kf = ui_map.flatten(end_vec);
      if (ui_map.paths[ki] === undefined) {
        // when starting vertex does not contain paths from it
        var path  = new UIPath(start_pos, end_pos, class_name);
        ui_map.paths[ki] = [];
        ui_map.paths[ki][kf] = path;
        html_map_obj.map.appendChild(path.ele);
      } else if (ui_map.paths[ki][kf] === undefined) {
        // path does not exist
        var path = new UIPath(start_pos, end_pos, class_name);
        ui_map.paths[ki][kf] = path;
        html_map_obj.map.appendChild(path.ele);
      } else {
        // some paths already exists, edit
        ui_map.paths[ki][kf].edit(start_pos, end_pos, class_name);
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
    handlers.set_cell_class = function(vec, class_name, remove=false) {
      if (remove === true)
        self.ui_map.cells(vec).ele.classList.remove(class_name)
      else
        self.ui_map.cells(vec).ele.classList.add(class_name)
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
    // Compile actions
    handlers.compile_steps = function() {
      // reset the steps;
      state.step = 0;
      var steps = steps_obj.steps;
      // compiled = [{fwd_handler, fwd_arguments, bck_handler, bck_arguments}]
      var compiled_action, compiled_step, actions, action, args;
      for (var s=0; s<steps.length; s++) {
        // for each step
        actions = steps[s].actions;
        compiled_step = [];
        // get the actions in the step
        for (var a=0; a<actions.length; a++) {
          action = actions[a];
          args = action[1];
          switch (action[0]) {
            // action is to color the cell
            case 'h': // set hsl
            case 'r': // set rgb
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
              break;
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
                var properties = [];
                var kfs = Object.keys(prev_paths);
                for (const kf of kfs) {
                  prev_path = prev_paths[kf];
                  properties.push([prev_path.start_pos, prev_path.end_pos, prev_path.type]);
                }
                var bck_handler = function(e) {
                  for (const p of properties) {
                    handlers.draw_path.apply(null, p);
                  }
                }
                compiled_action = {
                  fwd_handler : handlers.remove_paths,
                  fwd_args : args,
                  bck_handler : bck_handler,
                  bck_args : undefined
                }
              } else {
                // prev_paths is just a path
                compiled_action = {
                  fwd_handler : handlers.remove_paths,
                  fwd_args : args,
                  bck_handler : handlers.draw_path,
                  bck_args : [args[0], args[1], prev_paths.type]
                }
                // apply the forward step
                compiled_action.fwd_handler.apply(null, compiled_action.fwd_args);
              }
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
              compiled_action = {
                fwd_handler : handlers.set_cell_class,
                fwd_args : args,
                bck_handler : handlers.set_cell_class,
                bck_args : [args[0], args[1], !args[2]]
              }
              // apply the forward step
              compiled_action.fwd_handler.apply(null, compiled_action.fwd_args)
              break;
          }
          // append the compiled step to steps_compiled
          compiled_step.push(compiled_action);
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
      state.step++;
      var step = steps_obj.steps_compiled[state.step-1];
      var action;
      // iterate through every action in the step
      for (var a=0; a<step.length; a++) {
        action = step[a];
        // run the forward handler
        action.fwd_handler.apply(null, action.fwd_args);
      }
      // for the play part
      if (state.step === steps_obj.steps_compiled.length)
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
      var step = steps_obj.steps_compiled[state.step-1];
      var action;
      // iterate through every action in the step
      for (var a=step.length-1; a>=0; a--) {
        action = step[a];
        // run the forward handler
        action.bck_handler.apply(null, action.bck_args);
      }
      state.step--;
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
    handlers.add_planner = function(key, display_name) {
      var planner_dialog = html_dialog_obj.templates.planners;
      var ele_algorithms = html_options_obj.algorithms;
      // add the option to the dropdown in the dialog
      var ele_option = document.createElement('option');
      ele_option.setAttribute('value', key);
      ele_option.innerHTML = display_name;
      ele_option.setAttribute('selected', '');
      for (const c of ele_algorithms.childNodes)
        if (c.nodeType == 1)
          c.removeAttribute('selected');
      ele_algorithms.appendChild(ele_option);
      // set the chosen planner
      state.planner = key;
      // set the button to display display_name
      html_options_obj.planners.innerHTML = display_name;
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
  constructor(key, display_name) {
    this.ui = window.ui;
    this.ui.planners[key] = {display_name: display_name, planner: this};
    this.ui.graphic_handlers.add_planner(key, display_name);
    this.add_step = this.ui.steps.add_step;
    this.new_info_pair_pane = this.ui.graphic_handlers.new_info_pair_pane;
    this.new_info_text_pane = this.ui.graphic_handlers.new_info_text_pane;
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
    this.run();
    this.ui.graphic_handlers.compile_steps();
  }
}

// Dynamically load all other planners
file_names = [
  'Dijkstra',
  'Astar'
];
for (f of file_names) {
  var script = document.createElement("script");  // create a script DOM node
  script.src = 'scripts/planners/'.concat(f, '.js');  // set its src to the provided URL
  document.body.appendChild(script); 
}