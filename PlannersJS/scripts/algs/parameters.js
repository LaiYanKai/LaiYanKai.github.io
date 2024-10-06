"use strict";

Algs.Parameters = class {
  algorithm = null;
  node_type = null;
  node_connectivity = null;
  /** uses DirIndex */
  first_neighbor = null;
  next_neighbor = null;
  fh = null;
  time_ordering = null;
  /** uses Metric */
  distance_metric = null;
  g_nb = null;
  g_weight = null;
  h_weight = null;
  static = null;
  costmap_type = null;
  lethal = null;
  static = null;
  checkerboard = null;

  validate() {
    if (!Utils.isEnum(this.algorithm, AlgAlgorithm))
      throw new Error(`"algorithm" must be null or a value from AlgAlgorithm`);
    if (!Utils.isEnum(this.node_type, AlgNodeType))
      throw new Error(`"node_type" must be null or a value from AlgNodeType`);
    if (!Utils.isEnum(this.node_connectivity, AlgNodeConnectivity))
      throw new Error(
        `"node_connectivity" must be null or a value from AlgNodeConnectivity`
      );
    if (!Utils.isEnum(this.first_neighbor, DirIndex))
      throw new Error(`"first_neighbor" must be null or a value from DirIndex`);
    if (!Utils.isEnum(this.next_neighbor, AlgNextNeighbor))
      throw new Error(
        `"next_neighbor" must be null or a value from AlgNextNeighbor`
      );
    if (!Utils.isEnum(this.fh, AlgFH))
      throw new Error(`"fh" must be null or a value from AlgFH`);
    if (!Utils.isEnum(this.time_ordering, AlgTimeOrdering))
      throw new Error(
        `"time_ordering" must be null or a value from AlgTimeOrdering`
      );
    if (!Utils.isEnum(this.distance_metric, Metric))
      throw new Error(`"distance_metric" must be null or a value from Metric`);
    if (!Utils.isEnum(this.g_nb, AlgGNb))
      throw new Error(`"g_nb" must be null or a value from AlgGNb`);
    if (!Number.isNaN(this.g_weight) && typeof this.g_weight !== "number")
      throw new Error(`"g_weight" must be null or a number.`);
    if (!Number.isNaN(this.h_weight) && typeof this.h_weight !== "number")
      throw new Error(`"h_weight" must be null or a number.`);
    if (!Utils.isEnum(this.costmap_type, AlgCostmapType))
      throw new Error(
        `"costmap_type" must be null or a value from AlgCostmapType`
      );
    if (!Number.isNaN(this.lethal) && !Utils.isNonNegative(this.lethal))
      throw new Error(`"lethal" must be NaN or a non-negative number.`);
    if (!Utils.isEnum(this.checkerboard, AlgCheckerboard))
      throw new Error(
        `"checkerboard" must be null or a value from AlgCheckerboard`
      );
  }
};
