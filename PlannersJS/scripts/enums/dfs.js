"use strict";

const DFSAction = {
    Status: SpriteActionNode.length,
    length: 1
};
Object.freeze(DFSAction);

const DFSNodeStatus = {
    Queued: 0,
    Expanding: 1,
    Visited: 2,
    Undiscovered: 3,
    Path: 4,
};
Object.freeze(DFSNodeStatus);