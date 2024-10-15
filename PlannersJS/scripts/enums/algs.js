"use strict";

const AlgAlgorithm = {
    DFS: 0,
    BFS: 1,
    GBFS: 2,
    Dijkstra: 3,
    AStar: 4,
    ThetaStar: 5,
    Anya: 6,
    RRT: 7,
    PRM: 8,
    R2P: 9,
    length: 10,
};
Object.freeze(AlgAlgorithm);

const AlgNodeType = {
    Cell: 0,
    Vertex: 1,
    length: 2,
};
Object.freeze(AlgNodeType);

const AlgNodeConnectivity = {
    FourConnected: 0,
    EightConnected: 1,
    length: 2,
};
Object.freeze(AlgNodeConnectivity);

const AlgNextNeighbor = {
    AntiClockwise: 0,
    Clockwise: 1,
    length: 2,
};
Object.freeze(AlgNextNeighbor);

const AlgFH = {
    FOnly: 0,
    FThenH: 1,
    length: 2,
};
Object.freeze(AlgFH);

const AlgTimeOrdering = {
    FIFO: 0,
    LIFO: 1,
    length: 2,
};
Object.freeze(AlgTimeOrdering);

const AlgNeighborSelectionMethod = {
    KNN: 0,
    Radius: 1,
    length: 2,
};
Object.freeze(AlgNeighborSelectionMethod);

const AlgNearbyNodesSelectionMethod = {
    Nearest: 0,
    Radius: 1,
    length: 2,
};
Object.freeze(AlgNearbyNodesSelectionMethod);


const AlgRewiringOfTree = {
    Enable: 0,
    Disable: 1,
    length: 2,
};
Object.freeze(AlgRewiringOfTree);

const AlgGrowTreeTillPathFound = {
    Enable: 0,
    Disable: 1,
    length: 2,
};
Object.freeze(AlgGrowTreeTillPathFound);
const AlgGNb = {
    Average: 0,
    Expanded: 1, // only for cells
    Neighbor: 2, // only for cells
    Min: 3,
    Max: 4,
    length: 5,
};
Object.freeze(AlgGNb);

const AlgCostmapType = {
    MultiCost: 0,
    MultiCostWithLethal: 1,
    Binary: 2,
    length: 3,
};
Object.freeze(AlgCostmapType);

const AlgCheckerboard = {
    Allow: 0,
    Blocked: 1,
    length: 2,
}
Object.freeze(AlgCheckerboard);

const AlgPresetCustom = 0;

const AlgPresetDFS = {
    Custom: AlgPresetCustom,
    Cell: 1,
    Vertex: 2,
    length: 3,
};
Object.freeze(AlgPresetDFS);

const AlgPresetBFS = {
    Custom: AlgPresetCustom,
    Cell: 1,
    Vertex: 2,
    length: 3,
};
Object.freeze(AlgPresetBFS);

const AlgPresetGBFS = {
    Custom: AlgPresetCustom,
    Cell: 1,
    Vertex: 2,
    length: 3,
};
Object.freeze(AlgPresetGBFS);

const AlgPresetDijkstra = {
    Custom: AlgPresetCustom,
    Cell: 1,
    Vertex: 2,
    EE3305: 3,
    length: 4,
};
Object.freeze(AlgPresetDijkstra);

const AlgPresetAStar = {
    Custom: AlgPresetCustom,
    Cell: 1,
    Vertex: 2,
    EE3305: 3,
    length: 4,
};
Object.freeze(AlgPresetAStar);

const AlgPresetThetaStar = {
    Custom: AlgPresetCustom,
    Cell: 1,
    Vertex: 2,
    length: 3,
};
Object.freeze(AlgPresetThetaStar);

const AlgPresetAnya = {
    Custom: AlgPresetCustom,
    Cell: 1,
    Vertex: 2,
    length: 3,
};
Object.freeze(AlgPresetAnya);

const AlgPresetR2P = {
    Custom: AlgPresetCustom,
    Default: 1,
    length: 2,
};
Object.freeze(AlgPresetAnya);

const AlgPresetPRM = {
    Custom: AlgPresetCustom,
    Default: 1,
    Star: 2,
    DefaultGrowUntilPath: 3,
    StarGrowUntilPath: 4,
    length: 5,
};
Object.freeze(AlgPresetPRM);

const AlgPresetRRT = {
    Custom: AlgPresetCustom,
    Default: 1,
    Star: 2,
    DefaultGrowUntilPath: 3,
    StarGrowUntilPath: 4,
    length: 5,
};
Object.freeze(AlgPresetRRT);
