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
    Maze00: 0,
    Maze01: 1,
    Maze02: 2,
    Maze03: 3,
    Maze04: 4,
    Test01: 5,
    Test02: 6,
    Test03: 7,
    length: 8,
};
Object.freeze(NewMapTemplate);