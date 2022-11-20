# Overview

A repository of offline javascript-powered tools for visualising 2D path planning on binary occupancy grids and LEGO-EV3 related activities. Hosted at [laiyankai.github.io](https://laiyankai.github.io/).

# UniformPlanners (2D Path Planning on Binary Occupancy Grids)
Link here: [laiyankai.github.io/UniformPlanners](https://laiyankai.github.io/UniformPlanners/index.html).

A learning tool to examine individual steps of A*, Dijkstra, Greedy Best First Search, Breadth First Search and Depth First Search.

Algorithms have customisable parameters that will affect their search pattern. For example, the open-list can be sorted by just the f-cost or by f and h-costs; cost metrics can be set to Manhattan, Octile or Euclidean; and stack-like or queue-like sorting. 

Algorithms run on Javascript for ease of display using web browsers. Since the focus is on visualisation and Javscript is not a compiled language, the time taken to solve path finding problems should not be used for benchmarking.

Created for the module EE4308 Autonomous Robot Systems in National University of singapore.

# QuinticTurn (EV3G)

Generates LEGO power profiles (speed percentages) for the two locomotive (medium or large) motors driving a two-wheel differential EV3 robot by fitting a quintic hermite spline on each wheel's power profile.

The parameters include angle to turn, as well as initial and final speeds for both motors.

The speed profiles are exported as an EV3 readable .RTF format.

The trajectory is also simulated.

# Calibrator (EV3G)

Plots a histogram of sensor readings and finds a best fit Gaussian curve over the histogram. 

The peaks correspond to black or white values, depending on the most commonly used context.

# FindColor (EV3G)

An interface to plot colour samples (RGB) with respect to time or degree from EV3 .RTF files with Javascript.

Can also be used to calculate and plot the corresponding RGB ratios.

Can be used for other situations to more flexibly plot and analyse data.
