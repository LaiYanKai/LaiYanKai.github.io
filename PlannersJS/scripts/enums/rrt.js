"use strict";

const RRTAction = {
  G: SpriteActionNode.length,
  Status: SpriteActionNode.length + 1,
  length: 2,
};
Object.freeze(RRTAction);

const RRTNodeStatus = {
  Queued: 0,
  Expanding: 1,
  Visited: 2,
  Undiscovered: 3,
  Path: 4,
};
Object.freeze(RRTNodeStatus);

/**
 * @readonly
 * @enum {number}
 */
const RRTActionCircle = {
  /** True to Display, false to style display to "none". {boolean} */
  Display: 0,
  /** z-index. Integer {number}. */
  ZIndex: 1,
  /**  {[number, number]} */
  Position: 2,
  /** {number} */
  Radius: 3,
  length: 4,
};
Object.freeze(RRTActionCircle);
