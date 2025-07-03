import { changeScene, scenes } from "./main.js";

export function setup() {
  // Back button functionality
  select("#instructions .back-button").mousePressed(() => {
    changeScene(scenes.title);
  });

  // Next button functionality
  select("#instructions #nextToCountdown").mousePressed(() => {
    changeScene(scenes.countdown);
  });
}

export function enter() {
  select("#instructions").style("display", "block");
}

export function exit() {
  select("#instructions").style("display", "none");
}
