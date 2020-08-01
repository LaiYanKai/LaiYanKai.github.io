# Overview

A repository of offline javascript-powered tools for path planning and LEGO-EV3 related activities.

# UniformPlanners

A learning tool to examine individual steps of A*, Dijkstra, Greedy Best First Search, Breadth First Search and Depth First Search. Also includes a customised variant of Jump Point Search. 
Algorithms are also customisable. For example, it can be used to show the difference between an open-list sorted by f-costs and another by f-costs and then h-costs. Different distance metrics can also be used (Manhattan, Octile, Euclidean)
Currently a work in progress, created for the module EE4308 Autonomous Robot Systems in National University of singapore.

# QuinticTurn

Generates LEGO power profiles (speed percentages) for the two locomotive (medium or large) motors driving a two-wheel differential EV3 robot by fitting a quintic hermite spline on each wheel's power profile.
The parameters include angle to turn, as well as initial and final speeds for both motors.
The speed profiles are exported as an EV3 readable .RTF format.
The trajectory is also simulated.

# Calibrator

Plots a histogram of sensor readings and finds a best fit Gaussian curve over the histogram. 
The peaks correspond to black or white values, depending on the most commonly used context.

# FindColor

An interface to plot colour samples (RGB) with respect to time or degree from EV3 .RTF files with Javascript.
Can also be used to calculate and plot the corresponding RGB ratios.
Can be used for other situations to more flexibly plot and analyse data.
