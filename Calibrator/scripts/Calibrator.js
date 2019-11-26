
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

sensors_data = [null, null, null, null];

function readSingleFile() {
  //Retrieve the first (and only!) File from the FileList object
  var f = document.getElementById("fileinput").files[0]; 
  if (f) {
    document.getElementById("fileinputname").innerHTML = f.name;
    var r = new FileReader();
    r.onload = function(e) { 
      var contents = e.target.result;
      var num_sensors = document.getElementById("num_sensors").value;
      if (notFloat(num_sensors) || num_sensors != parseInt(num_sensors) || num_sensors < 1 || num_sensors > 4) {
        alert('The number of sensors should be an integer between 1 and 4');
        return;
      }
      num_sensors = parseInt(num_sensors);
      var sd = document.getElementById("sd").value;
      if (notFloat(sd)) {
        alert('The standard deviation should be more than 0.5');
        return;
      }
      if (sd <= 0.5) {
        sd = 0.5;
        sd = document.getElementById("sd").value = sd;
      }
      contents = contents.split(String.fromCharCode(13));
      var r, sensor, data={}, traces=[];
      // init data of dictionaries
      for (sensor=0; sensor<num_sensors; sensor++) {
        data[sensor] = {};
      }
      // sort values to their ports and count their occurences
      for (r=0; r<contents.length-1; ) {
        for (sensor=0; sensor<num_sensors; sensor++) {
          if (r >= contents.length-1) {
            break;
          } else if (data[sensor][contents[r]] == undefined) {
            data[sensor][contents[r]] = 1;
          } else {
            data[sensor][contents[r]]++
          }
          r++;
        }
      }
      calibrator(data, sd, num_sensors);
    }
    r.readAsText(f);
  } else { 
    alert("Failed to load file");
  }
}

function calibrator(data, sd, num_sensors) {
  var x, xx, y, yy, keys, key, k, names = ['1\u02E2\u1D57 Sensor', '2\u207F\u1D48 Sensor', '3\u02B3\u1D48 Sensor', '4\u1D57\u02B0 Sensor'];
  var v, v_min, v_max, w, i_max, i, weight, numer, denom, color, layout, displays;
  var w = weightedGaussian(sd);
  for (sensor=0; sensor<4; sensor++) {
    if (sensor >= num_sensors) {
      sensors_data[sensor] = null;
      continue;
    }
    keys = Object.keys(data[sensor]);
    x=[], y=[], xx=[], yy=[];
    // Extract data
    
    for (k=1; k<keys.length; k++) {
      key = parseInt(keys[k]);
      x.push(key);
      y.push(data[sensor][key]);
      key_prev = key;
    }
    
    // Smooth Data
    xi=x[0]; i_max=x.length-1; ys=[];
    for (i=0; i<=i_max; i++) {
      xi = x[i];
      xi_min = xi - w.radius;
      xi_max = xi + w.radius;
      // compute expression for centre
      denom = w.weights[w.radius];
      numer = y[i] * denom;
      // compute expression for left tail, by searching leftwards from centre
      ii = i;
      while (true) {
        ii--;
        if (ii < 0) {
          break; // exit if outside array range
        }
        xii = x[ii];
        if (xii < xi_min) {
          break; // exit if values are outside of window
        }
        weight = w.weights[xii - xi + w.radius];
        numer += y[ii] * weight;
        denom += weight;
      }
      // compute expression for right tail, by searching rightwards from centre
      ii = i;
      while (true) {
        ii++;
        if (ii > i_max) {
          break; // exit if outside array range
        }
        xii = x[ii];
        if (xii > xi_max) {
          break; // exit if values are outside of window
        }
        weight = w.weights[xii - xi + w.radius];
        numer += y[ii] * weight;
        denom += weight;
      }
      ys.push(numer / denom);
    }
    
    // Write to global data
    var min = Math.min(...x);
    var max = Math.max(...x);
    var diff = max - min;
    sensors_data[sensor] = {min: min, max: max, diff: diff, x: x, y: y, ys: ys};
  }
   
   // Write to plots and ranges
  for (sensor=0; sensor<4; sensor++) {
    if (sensor >= num_sensors) {
      // delete the plot and ranges
      document.getElementById('plot'.concat(sensor)).innerHTML = '';
      displayRange(sensor, false);
      continue;
    }
    color = 'rgb('.concat(hsv2rgb(1.0 * (sensor + 0.2) / num_sensors, 1, 0.9), ')');
    
    x = sensors_data[sensor].x;
    y = sensors_data[sensor].y;
    ys = sensors_data[sensor].ys;
    traces = [
      {
        x: x, y: y, mode: 'lines', name: 'Raw', type: 'scatter',
        line: {width: 0.3, dash: 'solid', shape: 'linear', color: color }
      }, {
        x: x, y: ys, mode: 'lines', name: 'Smooth', type: 'scatter',
        line: {shape: 'linear', color: color }
      }
    ];
    
    layout = {
      title: names[sensor], width: 300, height: 300,
      legend: {x: 0.2, y: 1, traceorder: 'reversed', font: {size: 13}, yref: 'paper'},
      xaxis: {title: 'Sensor Value'},
      yaxis: {title: 'Count'},
      margin: {autoexpand: false, l: 40, r: 15, t: 40, b: 40}
    };
    
    Plotly.newPlot('plot'.concat(sensor), traces, layout);
    
    displayRange(sensor, true);
    updateHandles(sensor);
    updateRangeMaximums(sensor);
  }
  
}

function weightedGaussian(sd) {
  var two_sig_sq = 2.0 * sd * sd;
  var coeff = 1 / Math.sqrt(two_sig_sq * Math.PI);
  var coeff_exp = -1.0 / two_sig_sq;
  
  var weights_R = [], weights_L = [];
  var i=0, p, sum=0;
  // construct right tail
  while (true) {
    p = coeff * Math.exp(coeff_exp * i * i);
    p = Math.round(100000 * p) / 100000;
    if (p == 0) {
      break;
    } else {
      weights_R.push(p);
    }
    i++;
    sum += p;
  }
  var window_radius = weights_R.length - 1;
  for (i=window_radius; i>0; i--) {
    weights_L.push(weights_R[i]);
    sum += weights_R[i];
  }
  return {weights : weights_L.concat(weights_R), radius : window_radius, sum_weights : sum};
}

function hsv2rgb(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ].join(",");
}

function dragElement(ele) {
  var x;
  var p = ele.parentNode;
  var txt = ele.firstChild;
  var sensor = parseInt(p.id.substr(-1));
  ele.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    if (sensorDoesNotExist())
      return;
    // get the mouse cursor position at startup:
    x_c = e.clientX;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
    ele.style.opacity = 1;
    ele.style.zIndex = 99;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    var x_c = e.clientX - 4;
    var p_dim = p.getBoundingClientRect();
    var lo = sensors_data[sensor].min;
    var diff = sensors_data[sensor].diff;
    
    if (x_c < p_dim.left) {
      x = 0;
    } else if (x_c > p_dim.left + p_dim.width) {
      x = diff;
    } else {
      x = Math.round((x_c - p_dim.left) * diff / p_dim.width);
    }
    
    // set the element's new position:
    ele.style.left =  (x * 100.0) / diff + "%";
    txt.innerHTML = x + lo;
  }
  
  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    ele.style.opacity = null;
    ele.style.zIndex = null;
    updateRangeMaximums(sensor);
  }
  
  function sensorDoesNotExist() {
    if (!sensors_data[sensor]) {
      return true;
    }
    return false;
  }
}

function displayRange(sensor, display=true) {
  var rows = document.getElementsByClassName('s' + sensor);
  display = display ? 'table-row' : 'none';
  for (var r=0; r<rows.length; r++) {
    rows[r].style.display = display;
  }
}
function updateHandles(sensor) {
  var sensor_data = sensors_data[sensor], percent, handle;
  for (var h=0; h<3; h++) {
    handle = document.getElementById('h' + sensor + h);
    percent = parseFloat(handle.style.left);
    handle.firstChild.innerHTML = Math.round(sensors_data[sensor].diff * percent / 100) + sensor_data.min;
  }
}
function updateRangeMaximums(sensor) {
  var sensor_data = sensors_data[sensor];
  var handles, boundaries = [];
  for (var h=0; h<3; h++) {
    handle = document.getElementById('h' + sensor + h);
    boundaries.push(parseInt(handle.firstChild.innerHTML));
  }
  boundaries.push(sensor_data.max);
  boundaries.sort(function(a, b) {
    return a - b;
  });
  var ys = sensor_data.ys;
  var x = sensor_data.x;
  var b = 0, i = 0;
  var b_max = boundaries[b];
  var ys_max = ys[0];
  var i_max = 0;
  while (i < x.length) {
    if (x[i] < b_max) {
      if (ys[i] > ys_max) {
        ys_max = ys[i];
        i_max = i;
      }
      i++;
    } else if (i == x.length-1) {
      document.getElementById('o' + sensor + b).innerHTML = x[i_max];
      break;
    } else {
      document.getElementById('o' + sensor + b).innerHTML = x[i_max];
      b++;
      b_max = boundaries[b];
      ys_max = ys[i];
      i_max = i;
    }
  }
}

for (var s=0; s<4; s++) {
  for (var h=0; h<3; h++) {
    dragElement(document.getElementById('h' + s + h));
  }
}


document.onkeydown = function(e){
  if (e.ctrlKey && e.keyCode == 'O'.charCodeAt(0)){
    e.preventDefault();
    document.getElementById('fileinput').click();
  } else if (e.ctrlKey && e.keyCode == 'R'.charCodeAt(0)){
    e.preventDefault();
    readSingleFile();
  }
}