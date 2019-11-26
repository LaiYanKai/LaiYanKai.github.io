var txt_qv = null;
var txt_pv = null;
var txt_param = null;
var txt_o = null;
var txt_rtf = null;
function floatRound(num, dp) {
  return parseFloat(num.toFixed(dp));
}
function getMinMax(arr) {
  var min = arr[0], max = arr[0];
  for (var i=1; i<arr.length; i++) {
    if (arr[i] < min)
      min = arr[i];
    if (arr[i] > max)
      max = arr[i];
  }
  return {min : floatRound(min, 3), max : floatRound(max, 3)}
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
function validate(ele) {
  var val = ele.value, ele2;
  if (notFloat(val))
    return false;  
  
  val = parseFloat(val);
  switch (ele.id) {
    case 'dt':
      return val > 0;
    case 'Dt':
      ele2 = document.getElementById('dt');
      return validate(ele2) && val >= parseFloat(ele2.value);
    case 'qvi':
    case 'qvf':
    case 'pvi':
    case 'pvf':
      return val >= -100 && val <= 100;
    case 'W':
    case 'L':
      return val > 0;
  }
  return true;
}
function validateFormat(ele, good) {
  if (good)
    ele.className = ele.className.replace( /(?:^|\s)badinput(?!\S)/g , '' )
  else
    ele.className += " badinput";
}
function validateFormatOnInput(ele) {
  validateFormat(ele, validate(ele));
}
function quinticTurn() {
  var POWER_2_DEG = document.getElementById("powerunit15").checked ? 15.6 : 10.5;
  var DEG_2_POWER = 1 / POWER_2_DEG;
  var DEG_2_RAD = Math.PI / 180;
  var RAD_2_DEG = 180 / Math.PI;
  var POWER_2_RAD = POWER_2_DEG * DEG_2_RAD;
  var RAD_2_POWER = RAD_2_DEG * DEG_2_POWER;
  var M_2_MM = 1000;
  var MM_2_M = 0.001;
  
  // validate input
  var ele_names = ['dt', 'Dt', 'qvi', 'qvf', 'pvi', 'pvf', 'W', 'L', 'of'], ele;
  var validate_error = false;
  for (var i=0; i<ele_names.length; i++) {
    ele = document.getElementById(ele_names[i]);
    if (validate(ele)) { // problem with data
      validateFormat(ele, true);
    } else { // data is good
      validate_error = true;
      validateFormat(ele, false);
    }
  }
  
  if (validate_error)
    return;
    
  var Dt = parseFloat(document.getElementById("Dt").value);
  var dt = parseFloat(document.getElementById("dt").value);
  var qvi = parseFloat(document.getElementById("qvi").value);
  var qvf = parseFloat(document.getElementById("qvf").value);
  var pvi = parseFloat(document.getElementById("pvi").value);
  var pvf = parseFloat(document.getElementById("pvf").value);
  var W = parseFloat(document.getElementById("W").value) * MM_2_M;
  var L = parseFloat(document.getElementById("L").value) * MM_2_M;
  var K = W / 2 / L;
  var of = parseFloat(document.getElementById("of").value);
  var ct_full = document.getElementById("ct_full").checked ? 1 : 0;
  var hsf, lsf, psf, qsf, r;
  if (ct_full == 1) {
    hsf = parseFloat(document.getElementById("hsf").value) * DEG_2_POWER;
    lsf = hsf - Math.abs(of) / K * DEG_2_POWER;
    psf = of >= 0 ? hsf : lsf;
    qsf = of >= 0 ? lsf : hsf;
  } else {
    r = document.getElementById("hsf").value;
    psf = of * DEG_2_POWER * (2 * r * MM_2_M + L) / W; //hsf is now a radius, in mm
    qsf = of * DEG_2_POWER * (2 * r * MM_2_M - L) / W; //hsf is now a radius, in mm
    hsf = psf > qsf ? psf : qsf;
    lsf = psf > qsf ? qsf : psf;
  }
  var p_invert = document.getElementById("p_invert").checked ? -1 : 1;
  var q_invert = document.getElementById("q_invert").checked ? -1 : 1;
   
  
  var p1 = pvi;
  var p3 = (20*psf - (8*pvf + 12*pvi)*Dt)/2/(Dt**3);
  var p4 = (-30*psf + (14*pvf + 16*pvi)*Dt)/2/(Dt**4);
  var p5 = (12*psf - 6*(pvf + pvi)*Dt)/2/(Dt**5);
  var pv0 = p1;
  var pv2 = 3*p3;
  var pv3 = 4*p4;
  var pv4 = 5*p5;
  var pa1 = 2*pv2;
  var pa2 = 3*pv3;
  var pa3 = 4*pv4;
  var pd0 = pa1;
  var pd1 = 2*pa2;
  var pd2 = 3*pa3;
  var q1 = qvi;
  var q3 = (20*qsf - (8*qvf + 12*qvi)*Dt)/2/(Dt**3);
  var q4 = (-30*qsf + (14*qvf + 16*qvi)*Dt)/2/(Dt**4);
  var q5 = (12*qsf - 6*(qvf + qvi)*Dt)/2/(Dt**5);
  var qv0 = q1;
  var qv2 = 3*q3;
  var qv3 = 4*q4;
  var qv4 = 5*q5;
  var qa1 = 2*qv2;
  var qa2 = 3*qv3;
  var qa3 = 4*qv4;
  var qd0 = qa1;
  var qd1 = 2*qa2;
  var qd2 = 3*qa3;
  
  // convert p and q angles from power to degrees later for display purposes
  p1 *= POWER_2_DEG;
  p3 *= POWER_2_DEG;
  p4 *= POWER_2_DEG;
  p5 *= POWER_2_DEG;
  q1 *= POWER_2_DEG;
  q3 *= POWER_2_DEG;
  q4 *= POWER_2_DEG;
  q5 *= POWER_2_DEG;

  // calculate trapezoidal integration approximation for x and y (trajectory)
  var k, k2, k3, k4, k5, rt, i=0;
  var vx=[], vy=[], x=[], y=[], txy=[], t=[], tr=[], rtf=[];
  var pv, qv, ps, qs, pa, qa, v, o, qd=[], pd=[], r=[];
  var dk = 0.005;
  
  x.push(0);
  y.push(0);
  v = (qvi + pvi) * W * POWER_2_RAD / 4;
  vx.push(v);
  vy.push(0);
  txy.push("t=" + 0);
  tr.push(0);
  for (k=dk; ; k+=dk) {
    // get the current time k
    k = floatRound(k, 4); // JS precision issues
    if (k > Dt)
      break;
    // push current time to array txy
    txy.push("t=" + k);
    tr.push(k);
    // time powers
    k2 = k**2;
    k3 = k**3;
    k4 = k**4;
    k5 = k**5;
    // calculate current wheel angles
    qs = q1*k + q3*k3 + q4*k4 + q5*k5;
    ps = p1*k + p3*k3 + p4*k4 + p5*k5;
    // calculate current wheel angular velocities (power/s)
    qv = qv0 + qv2*k2 + qv3*k3 + qv4*k4;
    pv = pv0 + pv2*k2 + pv3*k3 + pv4*k4;
    // calculate total velocity of robot
    v = (qv + pv) * POWER_2_RAD * W / 4;
    o = (K * (ps - qs) * DEG_2_RAD);
    // calculate total velocity horizontal and vertical components
    vx.push(v * Math.cos(o));
    vy.push(v * Math.sin(o));
    // trapezoidal integration: calculate approximate x and y from their velocities
    x.push(((vx[i] + vx[i+1]) * dk * M_2_MM / 2) + x[i]); //mm
    y.push(((vy[i] + vy[i+1]) * dk * M_2_MM / 2) + y[i]); //mm
    i++;
    // calculate radius (mm)
    rt = pv - qv; 
    if (Math.abs(rt) < 0.0001) { // check limits
      if (r.length == 0) {
        rt = (rt > 0 ? 1 : -1) * Infinity;
      } else {
        rt = (r[r.length-1] > 0 ? 1 : -1) * Infinity; 
      }
    } else {
      rt = L * M_2_MM * (pv + qv) / rt / 2;
      if (r[r.length-1] == -Infinity && r[r.length-2] == -Infinity && rt > 0) {
        r[r.length-1] = Infinity;
      } else if (r[r.length-1] == Infinity && r[r.length-2] == Infinity && rt < 0) {
        r[r.length-1] = -Infinity;
      }
    }
    r.push(rt);
  }
  // round the values in x and y to 4 dp so the small errors do not produce erroenous trajectories
  for (i=0; i<x.length; i++) {
    x[i] = floatRound(x[i], 4);
    y[i] = floatRound(y[i], 4);
  }
  
  // calculate data points for every sampling interval
  qs=[]; ps=[]; qv=[]; pv=[]; qa=[], pa=[], qd=[], pd=[], o=[];
  i = 0;
  for (k=0; ; k+=dt) {
    // get current time and powers
    k = floatRound(k, 9); // rounding issues with js
    if (k > Dt)
      break;
    t.push(k);
    k2 = k**2;
    k3 = k**3;
    k4 = k**4;
    k5 = k**5;
    // calculate current wheel angles (deg)
    qs.push(q1*k + q3*k3 + q4*k4 + q5*k5);
    ps.push(p1*k + p3*k3 + p4*k4 + p5*k5);
    // calculate current wheel angular velocities (power/s)
    qv.push(qv0 + qv2*k2 + qv3*k3 + qv4*k4);
    pv.push(pv0 + pv2*k2 + pv3*k3 + pv4*k4);
    // calculate current wheel angular acceleration (power/s/s)
    qa.push(qa1*k + qa2*k2 + qa3*k3);
    pa.push(pa1*k + pa2*k2 + pa3*k3);
    // calculate derivative of angular acceleration (power/s/s/s)
    qd.push(qd0 + qd1*k + qd2*k2);
    pd.push(pd0 + pd1*k + pd2*k2);
    // calculate heading (deg)
    o.push(K * (ps[i] - qs[i]));
    // rtf
    rtf.push(qv[i]*q_invert, pv[i]*p_invert);
    i++;
  }
  
  // Calculate appropriate maximums and minimums
  var ps_max = getMinMax(ps), ps_min = ps_max.min; ps_max = ps_max.max;
  var qs_max = getMinMax(qs), qs_min = qs_max.min; qs_max = qs_max.max;
  var pv_max = getMinMax(pv), pv_min = pv_max.min; pv_max = pv_max.max;
  var qv_max = getMinMax(qv), qv_min = qv_max.min; qv_max = qv_max.max;
  var pa_max = getMinMax(pa), pa_min = pa_max.min; pa_max = pa_max.max;
  var qa_max = getMinMax(qa), qa_min = qa_max.min; qa_max = qa_max.max;
  var pd_max = getMinMax(pd), pd_min = pd_max.min; pd_max = pd_max.max;
  var qd_max = getMinMax(qd), qd_min = qd_max.min; qd_max = qd_max.max;
  var x_max = getMinMax(x), x_min = x_max.min; x_max = x_max.max;
  var y_max = getMinMax(y), y_min = y_max.min; y_max = y_max.max;
  var o_max = getMinMax(o), o_min = o_max.min; o_max = o_max.max;
  var r_max = getMinMax(r), r_min = r_max.min; r_max = r_max.max;
  
  document.getElementById("ps_min").innerHTML = ps_min;
  document.getElementById("ps_max").innerHTML = ps_max;
  document.getElementById("ps_f").innerHTML = floatRound(ps[ps.length-1], 3);
  document.getElementById("qs_min").innerHTML = qs_min;
  document.getElementById("qs_max").innerHTML = qs_max;
  document.getElementById("qs_f").innerHTML = floatRound(qs[qs.length-1], 3);
  document.getElementById("pv_min").innerHTML = pv_min;
  document.getElementById("pv_max").innerHTML = pv_max;
  document.getElementById("pv_f").innerHTML = floatRound(pv[pv.length-1], 3);
  document.getElementById("qv_min").innerHTML = qv_min;
  document.getElementById("qv_max").innerHTML = qv_max;
  document.getElementById("qv_f").innerHTML = floatRound(qv[qv.length-1], 3);
  document.getElementById("pa_min").innerHTML = pa_min;
  document.getElementById("pa_max").innerHTML = pa_max;
  document.getElementById("pa_f").innerHTML = floatRound(pa[pa.length-1], 3);
  document.getElementById("qa_min").innerHTML = qa_min;
  document.getElementById("qa_max").innerHTML = qa_max;
  document.getElementById("qa_f").innerHTML = floatRound(qa[qa.length-1], 3);
  document.getElementById("pd_min").innerHTML = pd_min;
  document.getElementById("pd_max").innerHTML = pd_max;
  document.getElementById("pd_f").innerHTML = floatRound(pd[pd.length-1], 3);
  document.getElementById("qd_min").innerHTML = qd_min;
  document.getElementById("qd_max").innerHTML = qd_max;
  document.getElementById("qd_f").innerHTML = floatRound(qd[qd.length-1], 3);
  document.getElementById("x_min").innerHTML = x_min;
  document.getElementById("x_max").innerHTML = x_max;
  document.getElementById("x_f").innerHTML = floatRound(x[x.length-1], 3);
  document.getElementById("y_min").innerHTML = y_min;
  document.getElementById("y_max").innerHTML = y_max;
  document.getElementById("y_f").innerHTML = floatRound(y[y.length-1], 3);
  document.getElementById("o_min").innerHTML = o_min;
  document.getElementById("o_max").innerHTML = o_max;
  document.getElementById("o_f").innerHTML = floatRound(o[o.length-1], 3);
  document.getElementById("r_min").innerHTML = r_min;
  document.getElementById("r_max").innerHTML = r_max;
  document.getElementById("r_f").innerHTML = floatRound(r[r.length-1], 3);
  
  // Fill Table of coefficients
  p1 = floatRound(p1, 4);
  p3 = floatRound(p3, 4);
  p4 = floatRound(p4, 4);
  p5 = floatRound(p5, 4);
  pv0 = floatRound(pv0, 4);
  pv2 = floatRound(pv2, 4);
  pv3 = floatRound(pv3, 4);
  pv4 = floatRound(pv4, 4);
  pa1 = floatRound(pa1, 4);
  pa2 = floatRound(pa2, 4);
  pa3 = floatRound(pa3, 4);
  q1 = floatRound(q1, 4);
  q3 = floatRound(q3, 4);
  q4 = floatRound(q4, 4);
  q5 = floatRound(q5, 4);
  qv0 = floatRound(qv0, 4);
  qv2 = floatRound(qv2, 4);
  qv3 = floatRound(qv3, 4);
  qv4 = floatRound(qv4, 4);
  qa1 = floatRound(qa1, 4);
  qa2 = floatRound(qa2, 4);
  qa3 = floatRound(qa3, 4);

  document.getElementById("p3o").innerHTML = p3 >= 0 ? "+" : "-";
  document.getElementById("p4o").innerHTML = p4 >= 0 ? "+" : "-";
  document.getElementById("p5o").innerHTML = p5 >= 0 ? "+" : "-";
  document.getElementById("pv2o").innerHTML = pv2 >= 0 ? "+" : "-";
  document.getElementById("pv3o").innerHTML = pv3 >= 0 ? "+" : "-";
  document.getElementById("pv4o").innerHTML = pv4 >= 0 ? "+" : "-";
  document.getElementById("pa2o").innerHTML = pa2 >= 0 ? "+" : "-";
  document.getElementById("pa3o").innerHTML = pa3 >= 0 ? "+" : "-";
  document.getElementById("q3o").innerHTML = q3 >= 0 ? "+" : "-";
  document.getElementById("q4o").innerHTML = q4 >= 0 ? "+" : "-";
  document.getElementById("q5o").innerHTML = q5 >= 0 ? "+" : "-";
  document.getElementById("qv2o").innerHTML = qv2 >= 0 ? "+" : "-";
  document.getElementById("qv3o").innerHTML = qv3 >= 0 ? "+" : "-";
  document.getElementById("qv4o").innerHTML = qv4 >= 0 ? "+" : "-";
  document.getElementById("qa2o").innerHTML = qa2 >= 0 ? "+" : "-";
  document.getElementById("qa3o").innerHTML = qa3 >= 0 ? "+" : "-";
 
  p1 = floatRound(p1, 4);
  p3 = floatRound(p3, 4);
  p4 = floatRound(p4, 4);
  p5 = floatRound(p5, 4);
  pv0 = floatRound(pv0, 4);
  pv2 = floatRound(pv2, 4);
  pv3 = floatRound(pv3, 4);
  pv4 = floatRound(pv4, 4);
  pa1 = floatRound(pa1, 4);
  pa2 = floatRound(pa2, 4);
  pa3 = floatRound(pa3, 4);
  q1 = floatRound(q1, 4);
  q3 = floatRound(q3, 4);
  q4 = floatRound(q4, 4);
  q5 = floatRound(q5, 4);
  qv0 = floatRound(qv0, 4);
  qv2 = floatRound(qv2, 4);
  qv3 = floatRound(qv3, 4);
  qv4 = floatRound(qv4, 4);
  qa1 = floatRound(qa1, 4);
  qa2 = floatRound(qa2, 4);
  qa3 = floatRound(qa3, 4);
  
  document.getElementById("p1").innerHTML = p1;
  document.getElementById("p3").innerHTML = Math.abs(p3);
  document.getElementById("p4").innerHTML = Math.abs(p4);
  document.getElementById("p5").innerHTML = Math.abs(p5);
  document.getElementById("pv0").innerHTML = pv0;
  document.getElementById("pv2").innerHTML = Math.abs(pv2);
  document.getElementById("pv3").innerHTML = Math.abs(pv3);
  document.getElementById("pv4").innerHTML = Math.abs(pv4);
  document.getElementById("pa1").innerHTML = pa1;
  document.getElementById("pa2").innerHTML = Math.abs(pa2);
  document.getElementById("pa3").innerHTML = Math.abs(pa3);
  document.getElementById("q1").innerHTML = q1;
  document.getElementById("q3").innerHTML = Math.abs(q3);
  document.getElementById("q4").innerHTML = Math.abs(q4);
  document.getElementById("q5").innerHTML = Math.abs(q5);
  document.getElementById("qv0").innerHTML = qv0;
  document.getElementById("qv2").innerHTML = Math.abs(qv2);
  document.getElementById("qv3").innerHTML = Math.abs(qv3);
  document.getElementById("qv4").innerHTML = Math.abs(qv4);
  document.getElementById("qa1").innerHTML = qa1;
  document.getElementById("qa2").innerHTML = Math.abs(qa2);
  document.getElementById("qa3").innerHTML = Math.abs(qa3);
  
  
  // LM / MM units update
  var ele = document.getElementsByClassName("uacc");
  for (k=0; k<ele.length; k++)
    ele[k].innerHTML = POWER_2_DEG + '&middot;deg&middot;s<sup>-2</sup>'
  ele = document.getElementsByClassName("uvel");
  for (k=0; k<ele.length; k++)
    ele[k].innerHTML = POWER_2_DEG + '&middot;deg&middot;s<sup>-1</sup>'
  ele = document.getElementsByClassName("uacd");
  for (k=0; k<ele.length; k++)
    ele[k].innerHTML = POWER_2_DEG + '&middot;deg&middot;s<sup>-3</sup>'
  
  // Plot 
  // Set plot titles to nothing
  ele = document.getElementsByClassName("plottitle");
  for (k=0; k<ele.length; k++)
    ele[k].style.display = "none";
  var xy_trace = { 
    x: y, y: x, mode: 'markers+lines', name: 'x', text: txy, type: 'scatter',
    line: {shape: 'linear', color: 'rgb(245, 255, 200)', opacity:1, width:2 },
    marker: {color: 'rgb(255, 0, 0)', size: 2, opacity:0.2 }
  };
  var r_trace = {
    x: tr, y: r, mode: 'lines', name: 'r', type: 'scatter', 
    line: {shape: 'spline', color: 'rgb(201, 150, 190)'}
  };
  var o_trace = {
    x: t, y: o, mode: 'lines', name: 'o', type: 'scatter', 
    line: {shape: 'spline', color: 'rgb(51, 250, 255)'}
  };
  var pa_trace = {
    x: t, y: pa, mode: 'lines', name: 'R', type: 'scatter',
    line: {shape: 'spline', color: 'rgb(219, 64, 82)'}
  };
  var pv_trace = {
    x: t, y: pv, mode: 'lines', name: 'R', type: 'scatter',
    line: {shape: 'spline', color: 'rgb(255, 217, 102)'}
  };
  var ps_trace = {
    x: t, y: ps, mode: 'lines', name: 'R', type: 'scatter',
    line: {shape: 'spline', color: 'rgb(55, 148, 211)'}
  };
  var qa_trace = {
    x: t, y: qa, mode: 'lines', name: 'L', type: 'scatter',
    line: {dash : 'dashdot', shape: 'spline', color: 'rgb(219, 64, 82)'}
  };
  var qv_trace = {
    x: t, y: qv, mode: 'lines', name: 'L', type: 'scatter',
    line: {dash : 'dashdot', shape: 'spline', color: 'rgb(255, 217, 102)'}
  };
  var qs_trace = {
    x: t, y: qs, mode: 'lines', name: 'L', type: 'scatter',
    line: {dash : 'dashdot', shape: 'spline', color: 'rgb(55, 148, 211)'}
  };
  var x_diff = x_max - x_min;
  var y_diff = y_max - y_min;
  var x_range = [x_min - 0.1*x_diff, x_min - 0.1*x_diff + 1.2*(x_diff < y_diff ? y_diff : x_diff)];
  var y_range = [y_min - 0.1*y_diff + 1.2*(x_diff < y_diff ? y_diff : x_diff), y_min - 0.1*y_diff];
  var xy_layout = {
    title: 'Trajectory', width: 260, height: 330,
    legend: {y: 0.5, traceorder: 'reversed', font: {size: 13}, yref: 'paper'},
    xaxis: {title: 'y (mm)', range: y_range},//autorange: 'reversed', 
    yaxis: {title: 'x (mm)', range: x_range},
    margin: {autoexpand: false, l: 40, r: 15, t: 40, b: 40}
  };
  var r_range = [-5*L*M_2_MM, 5*L*M_2_MM];
  r_range = [r_min > r_range[0] ? r_min - L*M_2_MM: r_range[0], r_max < r_range[1] ? r_max + L*M_2_MM: r_range[1]];
  var r_layout = {
    title: 'Turn Radius', width: 260, height: 300,
    legend: {y: 0.5, traceorder:'reversed', font: {size: 10}, yref: 'paper'},
    xaxis: {title: 't (s)'},
    yaxis: {title: 'r (mm)', range: r_range},
    margin: {autoexpand: false, l: 50, r: 15, t: 40, b: 40}
  };
  var o_layout = {
    title: 'Robot Orientation', width: 260, height: 300,
    legend: {y: 0.5, traceorder:'reversed', font: {size: 10}, yref: 'paper'},
    xaxis: {title: 't (s)'},
    yaxis: {title: '\u03B8 (deg)'},
    margin: {autoexpand: false, l: 50, r: 15, t: 40, b: 40}
  };
  var s_layout = {
    title: 'Motor Angle', width: 260, height: 300,
    legend: {y: 0.5, traceorder: 'reversed', font: {size: 10}, yref: 'paper'},
    xaxis: { title: 't (s)'},
    yaxis: {title: 'Angle (deg)'},
    margin: {autoexpand: false, l: 50, r: 15, t: 40, b: 40}
  };
  var v_layout = {
    title: 'Motor Angular Velocity', width: 260, height: 300,
    legend: {y: 0.5, traceorder: 'reversed', font: {size: 10}, yref: 'paper'},
    xaxis: {title: 't (s)'},
    yaxis: {title: 'Velocity ('+ POWER_2_DEG +'·deg·sˉ¹)'},
    margin: {autoexpand: false, l: 50, r: 15, t: 40, b: 40}
  };
  var a_layout = {
    title: 'Motor Angular Acceleration', width: 260, height: 300,
    legend: {y: 0.5, traceorder: 'reversed', font: {size: 10}, yref: 'paper'},
    xaxis: {title: 't (s)'},
    yaxis: {title: 'Acceleration ('+ POWER_2_DEG +'·deg·sˉ²)'},
    margin: {autoexpand: false, l: 50, r: 15, t: 40, b: 40}
  };

  Plotly.newPlot('plot_xy', [xy_trace], xy_layout);
  Plotly.newPlot('plot_o', [o_trace], o_layout);
  Plotly.newPlot('plot_r', [r_trace], r_layout);
  Plotly.newPlot('plot_s', [ps_trace, qs_trace], s_layout);
  Plotly.newPlot('plot_v', [pv_trace, qv_trace], v_layout);
  Plotly.newPlot('plot_a', [pa_trace, qa_trace], a_layout);
  
  // Get text file
  for (var i=0; i<rtf.length; i++) {
    // pv[i] = pv[i].toFixed(4) * p_invert;
    // qv[i] = qv[i].toFixed(4) * q_invert;
    rtf[i] = rtf[i].toFixed(4);
  }

  // var str_pv = pv.join(String.fromCharCode(13)).concat(String.fromCharCode(13), "999.0000", String.fromCharCode(13));
  // var str_qv = qv.join(String.fromCharCode(13)).concat(String.fromCharCode(13), "999.0000", String.fromCharCode(13));
  // var str_o = o.join(String.fromCharCode(13)).concat(String.fromCharCode(13), "999.0000", String.fromCharCode(13));
  var str_rtf = rtf.join(String.fromCharCode(13)).concat(String.fromCharCode(13), "999.0000", String.fromCharCode(13));
  var str_param = [ct_full, 
                   of, 
                   Dt, 
                   (ct_full == 1 ? hsf*POWER_2_DEG : r), 
                   qvi, 
                   qvf, 
                   pvi, 
                   pvf, 
                   W*M_2_MM, 
                   L*M_2_MM, 
                   dt, 
                   (q_invert < 0 ? 1 : 0), 
                   (p_invert < 0 ? 1 : 0), 
                   (POWER_2_DEG > 12 ? 1 : 0)
                   ].join('\n');
  
  // // Right Motor Text file
  // var data = new Blob([str_pv], {type: 'text/plain'});
  // if (txt_pv !== null) {
    // window.URL.revokeObjectURL(txt_pv);
  // }
  // txt_pv = window.URL.createObjectURL(data);
  // // Left Motor Text file
  // data = new Blob([str_qv], {type: 'text/plain'});
  // if (txt_qv !== null) {
    // window.URL.revokeObjectURL(txt_qv);
  // }
  // txt_qv = window.URL.createObjectURL(data);
  // // Orientation Text file
  // data = new Blob([str_o], {type: 'text/plain'});
  // if (txt_o !== null) {
    // window.URL.revokeObjectURL(txt_o);
  // }
  // txt_o = window.URL.createObjectURL(data);
  // Orientation Text file
  data = new Blob([str_rtf], {type: 'text/plain'});
  if (txt_rtf !== null) {
    window.URL.revokeObjectURL(txt_rtf);
  }
  txt_rtf = window.URL.createObjectURL(data);
  // Hyperlink textfiles
  // // Right Motor
  // var link = document.getElementById('txt_pv');
  // link.href = txt_pv;
  // link.download = "qR".concat(Math.round(of), "_", Math.round(Dt*10), "_", Math.round(pvi), '_', Math.round(pvf), ".rtf");
  // str_param = link.download + "\n" + str_param;
  // link.style.display = 'inline-block';
  // // Left Motor
  // link = document.getElementById('txt_qv');
  // link.href = txt_qv;
  // link.download = "qL".concat(Math.round(of), "_", Math.round(Dt*10), "_", Math.round(qvi), '_', Math.round(qvf), ".rtf");
  // str_param = link.download + "\n" + str_param;
  // link.style.display = 'inline-block';
  // // Heading
  // link = document.getElementById('txt_o');
  // link.href = txt_o;
  // link.download = "qO".concat(Math.round(of), "_", Math.round(Dt*10), "_", Math.round(qvi), '_', Math.round(qvf), ".rtf");
  // str_param = link.download + "\n" + str_param;
  // link.style.display = 'inline-block';
  // RTF
  link = document.getElementById('txt_rtf');
  link.href = txt_rtf;
  link.download = "q".concat(Math.round(of), "_", Math.round(Dt*10), "_", Math.round(qvi), '_', Math.round(qvf), ".rtf");
  str_param = link.download + "\n" + str_param;
  link.style.display = 'inline-block';
  // Param Text file
  data = new Blob([str_param], {type: 'text/plain'});
  if (txt_param !== null) {
    window.URL.revokeObjectURL(txt_param);
  }
  txt_param = window.URL.createObjectURL(data);
  // Param 
  link = document.getElementById('txt_param');
  link.href = txt_param;
  link.download = "qparam".concat(Math.round(of), "_", Math.round(Dt*10), "_", Math.round(hsf * POWER_2_DEG), ".txt");
  link.style.display = 'inline-block';

  
}
function calcTypeInterface(e) {
  var ele_str = ["qvi", "qvf", "pvi", "pvf"], ele;
  if (e) {
    ele = document.getElementById("hsf");
    if (e.id == "ct_pivot") {
      ele.value = (ele.value >= 0 ? 1 : -1) * document.getElementById("L").value / 2;
    } else if (e.id == "ct_spin") {
      document.getElementById("hsf").value = 0;
    }
  } else if (document.getElementById("ct_full").checked) {
    document.getElementById("ct_turns_divider").style.display = 'none';
    document.getElementById("ct_turns").style.display = 'none';
    for (var i=0; i<ele_str.length; i++) {
      ele = document.getElementById(ele_str[i]);
      ele.value = 70;
    }
    document.getElementById("hsf_sym").innerHTML = "H<sub>f</sub>";
    document.getElementById("hsf_unit").innerHTML = "deg";
    document.getElementById("hsf").value = 945;
    document.getElementById("hsf_tooltip").style.display = "block";
    document.getElementById("r_tooltip").style.display = "none";
  } else {
    document.getElementById("ct_turns_divider").style.display = 'table-row';
    document.getElementById("ct_turns").style.display = 'table-row';
    for (var i=0; i<ele_str.length; i++) {
      ele = document.getElementById(ele_str[i]);
      ele.value = 0;
    }
    document.getElementById("hsf_sym").innerHTML = "r";
    document.getElementById("hsf_unit").innerHTML = "mm";
    document.getElementById("hsf").value = document.getElementById("L").value / 2;
    document.getElementById("hsf_tooltip").style.display = "none";
    document.getElementById("r_tooltip").style.display = "block";
  }
}
function readSingleFile(ele) {
//Retrieve the first (and only!) File from the FileList object
var f = ele.files[0]; 
document.getElementById("fileinputname").innerHTML = f.name;
if (f) {
  var r = new FileReader();
  r.onload = function(e) { 
   var contents = e.target.result;
     contents = contents.split("\n");
     var i = 1;
     document.getElementById("ct_full").checked = (contents[i] == 1);
     document.getElementById("ct_turn").checked = (contents[i++] != 1);
     document.getElementById("of").value = contents[i++];
     document.getElementById("Dt").value = contents[i++];
     document.getElementById("hsf").value = contents[i++];
     document.getElementById("qvi").value = contents[i++];
     document.getElementById("qvf").value = contents[i++];
     document.getElementById("pvi").value = contents[i++];
     document.getElementById("pvf").value = contents[i++];
     document.getElementById("W").value = contents[i++];
     document.getElementById("L").value = contents[i++];
     document.getElementById("dt").value = contents[i++];
     document.getElementById("q_invert").checked = (contents[i++] == 1);
     document.getElementById("p_invert").checked = (contents[i++] == 1);
     document.getElementById("powerunit15").checked = (contents[i] == 1);
     document.getElementById("powerunit10").checked = (contents[i] != 1);
     calcTypeInterface();
     quinticTurn();
  }
  r.readAsText(f);
} else { 
  alert("Failed to load file");
}
}