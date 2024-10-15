"use strict";

/**
 * @enum {NewMapSource}
 * @readonly
 */
const NewMapSource = {
    Manual: 0,
    Template: 1,
    length: 2,
};
Object.freeze(NewMapSource);

/**
 * @enum {NewMapSource}
 * @readonly
 */
const NewMapKeep = {
    Keep: 0,
    Discard: 1,
    length: 2,
};
Object.freeze(NewMapKeep);

/**
 * @enum {NewMapSource}
 * @readonly
 */
const NewMapTemplate = {
    EE3305A: 0,
    EE3305B: 1,
    Maze00: 2,
    Maze01: 3,
    Maze02: 4,
    Maze03: 5,
    Maze04: 6,
    Test01: 7,
    Test02: 8,
    Test03: 9,
    length: 10,
};
Object.freeze(NewMapTemplate);