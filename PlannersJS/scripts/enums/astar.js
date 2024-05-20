"use strict";

const AStarAction = {
    F: SpriteAction.length,
    G: SpriteAction.length + 1,
    H: SpriteAction.length + 2,
    Status: SpriteAction.length + 3,
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