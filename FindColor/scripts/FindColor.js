var rtf;
var txt_js = null;
function floatRound(num, dp) {
  return parseFloat(num.toFixed(dp));
}
function notFloat(val) {
    var floatRegex = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
    if (!floatRegex.test(val))
        return true;

    val = parseFloat(val);
    if (isNaN(val))
        return true;
    return false;
}

function loadRTF() {
  var f = document.getElementById("load_rtf").files[0]; 
  if (f) {
    var r = new FileReader();
    r.onload = function(e) {
      var rtf = e.target.result.split(String.fromCharCode(13));
      rtf.pop();
      window.rtf = rtf;
    }
    r.readAsText(f);
    document.getElementById("load_rtf_name").innerHTML = f.name;
  } else { 
    alert("Failed to load file");
  }
}

function saveJS() {
  var blob = new Blob([window.code.getValue()], {type: 'application/javascript'});
  if (txt_js !== null) {
    window.URL.revokeObjectURL(txt_js);
  }
  txt_js = window.URL.createObjectURL(blob);
  var link = document.getElementById('txt_js');
  link.href = txt_js;
  var date = new Date();
  link.download = ("" + date.getFullYear()).slice(-2) + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2) + ("0" + date.getHours()).slice(-2) + ("0" + date.getMinutes()).slice(-2) + ".js";
  link.click();
}

function loadJS() {
  var f = document.getElementById("load_js").files[0]; 
  if (f) {
    var r = new FileReader();
    r.onload = function(e) {
      window.code.setValue(e.target.result);
      console.log(e.target.result);
    }
    r.readAsText(f);
  } else { 
    alert("Failed to load JS file");
  }
}

function RTF2NumArrays(arrays_to_write) {
  // writes the RTF file data into the arrays specified by arrays_to_write, and returns the length of the shortest array.
  // data validation
  if (Array.isArray(arrays_to_write)) {
    if (arrays_to_write.length < 1) {
      alert("[ERROR] RTF2NumArrays: the array 'arrays_to_write' should contain at least one empty array")
    }
    for (var i=0; i<arrays_to_write.length; i++) {
      if (!Array.isArray(arrays_to_write[i])) {
        alert("[ERROR] RTF2NumArrays: the array 'arrays_to_write' should contain an array of empty arrays");
        return;
      }
    }
  } else {
    alert("[ERROR] RTF2NumArrays: 'arrays_to_write' should contain an array of empty arrays");
    return;
  }
  var rtf = window.rtf;
  if (!Array.isArray(rtf)) {
    alert("[ERROR] RTF2NumArrays: RTF file should be loaded");
    return;
  }
  
  // write to arrays
  var i = 0, j, num_arrays=arrays_to_write.length, rtf_len = rtf.length, read_rtf = true;
  while (read_rtf) {
    for (j=0; j<num_arrays; j++) {
      while (i<rtf_len && notFloat(rtf[i])) {
        console.log("[WARNING] RTF2NumArrays: rtf file contains non-numbers at line " + (i+1));
        i++;
      }
      if (i >= rtf_len) {
        read_rtf = false;
        break;
      }
      arrays_to_write[j].push(parseFloat(rtf[i++]));
    }
  }
  
  // get the minimum length
  var min = Infinity;
  for (j=0; j<num_arrays; j++) {
    if (arrays_to_write[j].length < min) {
      min = arrays_to_write[j].length;
    }
  }
  return min;
}

function findColor() {
  var rtf = window.rtf, plot_info={};
  if (!Array.isArray(rtf)) {
    alert("[ERROR] RTF2NumArrays: RTF file should be loaded");
    return;
  }
  
  var code = window.code.getValue();
  try {
    eval(code);
  } catch (error) {
    console.log(error);
    alert('[ERROR] ' + error);
    return;
  }
  // Write to plots
  plot(plot_info);
}

function plot(plot_info) {
  var plots = [1, 2, 3, 4];
  var plot_id_prefix = 'plot', plot_title_id_prefix = 'plottitle';
  var plot_id, plot_title_id, info, plot_num;
  try {
    for (var p=0; p<plots.length; p++) {
      plot_num = plots[p];
      info = plot_info[plot_num];
      plot_id = plot_id_prefix + plot_num;
      plot_title_id = plot_title_id_prefix + plot_num;
      if (info && info.traces && info.layout) {
        Plotly.newPlot(plot_id, info.traces, info.layout);
        // Write title
        if (info.layout.title.text) {
          document.getElementById(plot_title_id).innerHTML = info.layout.title.text;
        } else {
          document.getElementById(plot_title_id).innerHTML = 'Plot ' + plot_num;
        }
      } else {
        document.getElementById(plot_id).innerHTML = '';
        document.getElementById(plot_title_id).innerHTML = 'Plot ' + plot_num;
      }
    }
  } catch(error) {
    console.error(error);
    alert('[ERROR] plot: Error using plot_info -- ' + error);
  }
}


var templates = {
  0: `/* █ (1) Write RTF to Arrays containing numbers */
// Define your arrays
var D=[], R=[], G=[], B=[], C=[];
// Get the length of shortest array after writing RTF to arrays
var num_groups = RTF2NumArrays([D, R, G, B, C]);

/* █ (2) Perform Calculations */
var RG=[], GR=[], RB=[], BR=[], GB=[], BG=[];
var RGB=[], CC=[], CCYK=[];
var calc;
for (var i=0; i<num_groups; i++) {
  // calculate R/G
  calc = R[i] / G[i];
  // limit ratio to 10 if ratio exceeds 10. 
  // Append (push) to RG array for plotting later.
  RG.push(calc > 10 ? 10 : calc);
  // for G/R
  calc = G[i] / R[i];
  GR.push(calc > 10 ? 10 : calc);
  // for R/B
  calc = R[i] / B[i];
  RB.push(calc > 10 ? 10 : calc);
  // for B/R
  calc = B[i] / R[i];
  BR.push(calc > 10 ? 10 : calc);
  // for G/B
  calc = G[i] / B[i];
  GB.push(calc > 10 ? 10 : calc);
  // for B/G
  calc = B[i] / G[i];
  BG.push(calc > 10 ? 10 : calc);
  // for R+G+B
  calc = R[i] + G[i] + B[i];
  RGB.push(calc);
  // for color that you calculated
  CC.push(color(R[i], G[i], B[i]));
  // for YK's color algorithm
  CCYK.push(ykcolor(R[i], G[i], B[i]));
}

/* █ (3) Plot arrays */
var plot_info = {};

// ▐ for plot 1 (rgb and sum):
// R, G, B and R+G+B vs D
plot_info[1] = {
  // the lines on the plot
  traces : [ 
    {  
      x: D, y: R, mode: 'lines+markers', 
      name: 'R', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(255, 50, 50)',
        width: 1
      },
      marker: {
        size: 3
      }
    }, {
      x: D, y: G, mode: 'lines+markers', 
      name: 'G', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(50, 255, 50)',
        width: 1
      },
      marker: {
        size: 3
      }
    }, {
      x: D, y: B, mode: 'lines+markers', 
      name: 'B', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(50, 50, 255)',
        width: 1
      },
      marker: {
        size: 3
      }
    }, {
      x: D, y: RGB, mode: 'lines+markers', 
      name: 'R+G+B', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(150, 150, 150)',
        width: 1, dash: 'dot'
      },
      marker: {
        size: 3
      } 
    }
  ],
  // the plot information
  layout : { 
    title: 'RGB Samples', width: 440, height: 325,
    legend: {
      traceorder: 'reversed', 
      font: {size: 10}, yref: 'paper'
    },
    xaxis: {title: 'Deg'},
    yaxis: {title: 'Color'},
    margin: {autoexpand: false, l: 40, r: 15, t: 40, b: 40}
  }
};

// ▐ for plot 2 (ratios): 
// R/G, G/R, R/B, B/R, G/B, B/G vs D
plot_info[2] = {
  // the lines on the plot
  traces : [ 
    { 
      x: D, y: RG, mode: 'lines+markers', 
      name: 'R/G', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(255, 255, 50)', 
        width: 1, dash: 'solid'
      },
      marker: {
        size: 3
      }
    }, {
      x: D, y: GR, mode: 'lines+markers', 
      name: 'G/R', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(200, 200, 50)', 
        width: 1, dash: 'dot'
      },
      marker: {
        size: 3
      }
    }, {
      x: D, y: RB, mode: 'lines+markers', 
      name: 'R/B', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(255, 50, 255)', 
        width: 1, dash: 'solid'
      },
      marker: {
        size: 3
      }
    }, {
      x: D, y: BR, mode: 'lines+markers', 
      name: 'B/R', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(200, 50, 200)',
        width: 1, dash: 'dot'
      },
      marker: {
        size: 3
      }
    }, {
      x: D, y: GB, mode: 'lines+markers', 
      name: 'G/B', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(50, 255, 255)', 
        width: 1, dash: 'solid'
      },
      marker: {
        size: 3
      }
    }, { 
      x: D, y: BG, mode: 'lines+markers', 
      name: 'B/G', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(50, 200, 200)',
        width: 1, dash: 'dot'
      },
      marker: {
        size: 3
      }
    }
  ],
  // the plot information
  layout : { 
    title: 'Ratios', width: 440, height: 325,
    legend: {
      traceorder: 'reversed', 
      font: {size: 10}, yref: 'paper'
    },
    xaxis: {title: 'Deg'},
    yaxis: {title: 'Ratios'},
    margin: {autoexpand: false, l: 40, r: 15, t: 40, b: 40}
  }
}

// ▐ for plot 3 (color, from RTF and function u write here): 
// plot C, CC vs D
plot_info[3] = {
  // the lines on the plot
  traces : [ 
    { 
      x: D, y: C, mode: 'lines+markers', 
      name: 'Color (RTF)', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(80, 80, 80)', 
        width: 2, dash: 'solid'
      },
      marker: {
        size: 4
      }
    }, { 
      x: D, y: CC, mode: 'lines+markers', 
      name: 'Color (Algo)', type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(80, 80, 80)', 
        width: 2, dash: 'dot'
      },
      marker: {
        size: 4
      }
    }
  ],
  // the plot information
  layout : { 
    title: 'Color', width: 440, height: 325,
    legend: {
      traceorder: 'reversed', 
      font: {size: 10}, yref: 'paper'
    },
    xaxis: {title: 'Deg'},
    yaxis: {title: 'Colors'},
    margin: {autoexpand: false, l: 40, r: 15, t: 40, b: 40}
  }
}

// ▐ for plot 4 (color, calculated from function color):
// plot CCYK vs D
plot_info[4] = {
  // the lines on the plot
  traces : [ 
    { 
      x: D, y: CCYK, mode: 'lines+markers', 
      name: "YK's Color", type: 'scatter',
      line: {
        shape: 'linear', color: 'rgb(200, 120, 200)', 
        width: 2, dash: 'solid'
      },
      marker: {
        size: 4
      }
    }
  ],
  // the plot information
  layout : { 
    title: "YK's Color", width: 440, height: 325,
    legend: {
      traceorder: 'reversed', 
      font: {size: 10}, yref: 'paper'
    },
    xaxis: {title: 'Deg'},
    yaxis: {title: "YK's color"},
    margin: {autoexpand: false, l: 40, r: 15, t: 40, b: 40}
  }
}

/* █ (4) Color Algorithms */
// ▐ Your color algorithm
function color(r, g, b) {
  return NaN;
}

// ▐ YK's color algorithm
function ykcolor(r, g, b) {
  var c = 0 // null;
  if (r >= 40) {
    if (r >= 2*b) {
      if (r >= 3*g) {
        c = 5; // red
      } else {
        c = 4; // yellow
      } 
    } else {
      c = 6; // white
    }
  } else {
    if (b >= 45) {
      c = 2; // blue
    } else {
      if (b >= 1.3*g) {
        // do nothing, color is null
      } else {
        if ((b+g) / r >= 3.4) {
          c = 3; // green
        } else {
          c = 1; // black
        }
      }
    }
  }
  return c;
}
`
}
var code = CodeMirror(document.getElementById('code'), {
  value: templates[0],
  mode:  "javascript",
  tabSize: 2,
  lineNumbers: true,
  lineWrapping: true,
});

document.getElementsByClassName('CodeMirror')[0].style.height = '100%';

document.onkeydown = function(e){
  if (e.ctrlKey && e.keyCode == 'S'.charCodeAt(0)){
    e.preventDefault();
    saveJS();
  } else if (e.ctrlKey && e.shiftKey && e.keyCode == 'O'.charCodeAt(0)){
    e.preventDefault();
    document.getElementById('load_js').click();
  } else if (e.ctrlKey && e.keyCode == 'O'.charCodeAt(0)){
    e.preventDefault();
    document.getElementById('load_rtf').click();
  } else if (e.ctrlKey && e.keyCode == 'R'.charCodeAt(0)){
    e.preventDefault();
    findColor();
  }
}

window.onload = function() {window.code.refresh()};