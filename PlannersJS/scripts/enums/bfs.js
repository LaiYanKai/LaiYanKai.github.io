"use strict";

const BFSAction = {
    Status: SpriteActionNode.length,
    length: 1
};
Object.freeze(BFSAction);

const BFSNodeStatus = {
    Queued: 0,
    Expanding: 1,
    Visited: 2,
    Undiscovered: 3,
    Path: 4,
};
Object.freeze(BFSNodeStatus);