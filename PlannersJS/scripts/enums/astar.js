"use strict";

const AStarAction = {
    F: SpriteActionNode.length,
    G: SpriteActionNode.length + 1,
    H: SpriteActionNode.length + 2,
    Status: SpriteActionNode.length + 3,
    length: 4,
};
Object.freeze(AStarAction);

const AStarNodeStatus = {
    Queued: 0,
    Expanding: 1,
    Visited: 2,
    Undiscovered: 3,
    Path: 4,
};
Object.freeze(AStarNodeStatus);