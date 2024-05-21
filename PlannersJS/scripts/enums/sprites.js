"use strict";

const SpriteAction = {
    Position: 0,
    Size: 1,
    Display: 2,
    Class: 3,
    ZIndex: 4,
    Outline: 5,
    length: 6,
};
Object.freeze(SpriteAction);

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
}
Object.freeze(SpriteActionOutline);