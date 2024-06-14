"use strict";

const GBFSAction = {
    H: SpriteActionNode.length,
    Status: SpriteActionNode.length + 1,
    length: 2,
};
Object.freeze(GBFSAction);

const GBFSNodeStatus = {
    Queued: 0,
    Expanding: 1,
    Visited: 2,
    Undiscovered: 3,
    Path: 4,
};
Object.freeze(GBFSNodeStatus);