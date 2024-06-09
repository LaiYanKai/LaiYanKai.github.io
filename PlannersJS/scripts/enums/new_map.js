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
    length: 3,
};
Object.freeze(NewMapTemplate);