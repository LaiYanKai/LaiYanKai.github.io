"use strict";

const ThetaStarAction = {
    F: SpriteActionNode.length,
    G: SpriteActionNode.length + 1,
    H: SpriteActionNode.length + 2,
    Status: SpriteActionNode.length + 3,
    length: 4,
};
Object.freeze(ThetaStarAction);

const ThetaStarNodeStatus = {
    Queued: 0,
    Expanding: 1,
    Visited: 2,
    Undiscovered: 3,
    Path: 4,
};
Object.freeze(ThetaStarNodeStatus);