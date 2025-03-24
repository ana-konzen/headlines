// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let me;

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
  // Create the Check Leaderboard button
  select("#checkLeaderboard").mousePressed(() => {
    changeScene(scenes.results);
  });
}

export function enter() {
  // Show the game over screen
  select("#gameOver").style("display", "flex");

  // Save the score to the server
  fetch(`/api/setScore?score=${me.score}`);
}

export function exit() {
  // Hide the game over screen
  select("#gameOver").style("display", "none");
}

export function update() {
  // Nothing to update
}
