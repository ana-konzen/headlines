// deno-lint-ignore-file

/**
 * main.js
 *
 * This is the entry point for the game. It doesn't do much itself, but rather
 * loads the other modules, sets things up, and coordinates the main game
 * scenes.
 *
 * A major organizing prinicple of this code is that it is organized into
 * "scenes". See scene.template.js for more info.
 *
 * main.js exports a function changeScene() that scenes can use to switch to
 * other scenes.
 *
 */

import * as titleScene from "./titleScene.js";
import * as playScene from "./playScene.js";
import * as endScene from "./endScene.js";
import * as gameOverScene from "./gameOverScene.js";

let currentScene; // the scene being displayed

// all the available scenes
export const scenes = {
  title: titleScene,
  play: playScene,
  end: endScene,
  gameOver: gameOverScene,
};

// p5.js auto detects your setup() and draw() before "installing" itself but
// since this code is a module the functions aren't global. We define them
// on the window object so p5.js can find them.

window.preload = function () {
  Object.values(scenes).forEach((scene) => scene.preload?.());
};

window.setup = function () {
  //   noCanvas();
  createCanvas(960, 540);

  Object.values(scenes).forEach((scene) => scene.setup?.());
  changeScene(scenes.title);
};

window.draw = function () {
  // call update() and draw() on the current scene
  // (if the scene exists and has those functions)
  currentScene?.update?.();
  currentScene?.draw?.();
};

/// forward event handlers to the current scene, if they handle them
const p5Events = [
  // keyboard
  "keyPressed",
  "keyReleased",
  "keyTyped",

  // mouse
  "doubleClicked",
  "mouseDragged",
  "mouseReleased",
  "mouseWheel",
  "mouseMoved",
  "mouseClicked",
  "mousePressed",

  // touch
  "touchMoved",
  "touchStarted",
  "touchEnded",
];

for (const event of p5Events) {
  window[event] = () => currentScene?.[event]?.();
}

/// changeScene
// call this to tell the game to switch to a different scene
export function changeScene(newScene) {
  if (!newScene) {
    console.error("newScene not provided");
    return;
  }
  if (newScene === currentScene) {
    console.error("newScene is already currentScene");
    return;
  }
  currentScene?.exit?.();
  currentScene = newScene;
  currentScene.enter?.();
}
