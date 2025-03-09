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
import * as countdownScene from "./countdownScene.js";
import * as versusEntryScene from "./versusEntryScene.js";
import * as versusLobbyScene from "./versusLobbyScene.js";
import * as versusLeaderboardScene from "./versusLeaderboardScene.js";

let currentScene; // the scene being displayed
let partyInitialized = false;

// all the available scenes
export const scenes = {
  title: titleScene,
  countdown: countdownScene,
  play: playScene,
  end: endScene,
  gameOver: gameOverScene,
  versusEntry: versusEntryScene,
  versusLobby: versusLobbyScene,
  versusLeaderboard: versusLeaderboardScene,
};

// Initialize p5.party
export function initializeParty() {
  if (!partyInitialized) {
    try {
      // Only connect if not already connected
      if (!window.partyIsConnected?.()) {
        partyConnect("wss://demoserver.p5party.org", "headlines_versus_mode");
        console.log("p5.party initialized");
      } else {
        console.log("p5.party already connected");
      }
      partyInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing p5.party:", error);
      return false;
    }
  }
  return true;
}

// p5.js auto detects your setup() and draw() before "installing" itself but
// since this code is a module the functions aren't global. We define them
// on the window object so p5.js can find them.

window.preload = function () {
  // Initialize p5.party first
  initializeParty();

  // Then preload all scenes
  Object.values(scenes).forEach((scene) => {
    if (scene.preload) {
      try {
        scene.preload();
      } catch (error) {
        console.error("Error in preload for scene:", error);
      }
    }
  });
};

window.setup = function () {
  //   noCanvas();
  createCanvas(960, 540);

  Object.values(scenes).forEach((scene) => {
    if (scene.setup) {
      try {
        scene.setup();
      } catch (error) {
        console.error("Error in setup for scene:", error);
      }
    }
  });
  changeScene(scenes.title);
};

window.draw = function () {
  // call update() and draw() on the current scene
  // (if the scene exists and has those functions)
  try {
    currentScene?.update?.();
    currentScene?.draw?.();
  } catch (error) {
    console.error("Error in update or draw:", error);
  }
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
  window[event] = () => {
    try {
      return currentScene?.[event]?.();
    } catch (error) {
      console.error(`Error in ${event}:`, error);
    }
  };
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
  try {
    currentScene?.exit?.();
    currentScene = newScene;
    currentScene.enter?.();
  } catch (error) {
    console.error("Error changing scene:", error);
  }
}
