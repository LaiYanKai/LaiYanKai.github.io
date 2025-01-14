"use strict";

const SpriteActionClass = {
  Blue: "blu",
  Orange: "orn",
  Cyan: "cya",
  Red: "red",
  Transparent: "trn",
  Gray: "gray",
};
Object.freeze(SpriteActionClass);

const SpriteActionOutline = {
  None: "0",
  Red: "o-red",
  Dotted: "Dotted",
};
Object.freeze(SpriteActionOutline);

const SpriteActionNode = {
  Position: 0,
  Size: 1,
  Display: 2,
  Class: 3,
  ZIndex: 4,
  Outline: 5,
  length: 6,
};
Object.freeze(SpriteActionNode);

const SpriteActionArrow = {
  Position: 0,
  Size: 1,
  Display: 2,
  Class: 3,
  ZIndex: 4,
  length: 5,
};
const SpriteActionLine = {
  Position: 0,
  Size: 1,
  Display: 2,
  Class: 3,
  ZIndex: 4,
  Outline: 5,
  length: 6,
};
const SpriteActionCircle = {
  Position: 0,
  Size: 1,
  Display: 2,
  Class: 3,
  ZIndex: 4,
  length: 5,
};
