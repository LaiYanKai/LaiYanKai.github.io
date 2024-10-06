"use strict";

const PRMAction = {
  G: SpriteActionNode.length,
  Status: SpriteActionNode.length + 1,
  length: 2,
};
Object.freeze(PRMAction);

const PRMNodeStatus = {
  Queued: 0,
  Expanding: 1,
  Visited: 2,
  Undiscovered: 3,
  Path: 4,
};
Object.freeze(PRMNodeStatus);
