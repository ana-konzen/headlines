// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let countdownInterval;

export function setup() {
  select(".back-button").mousePressed(() => {
    clearInterval(countdownInterval);
    changeScene(scenes.title);
  });
}

export function enter() {
  let countdownValue = 3;

  select(".countdown-number").html(countdownValue);

  // Start countdown
  countdownInterval = setInterval(() => {
    countdownValue--;
    select(".countdown-number").html(countdownValue);

    if (countdownValue <= 1) {
      clearInterval(countdownInterval);
      setTimeout(() => {
        changeScene(scenes.play);
      }, 500); // Short delay before transitioning to game
    }
  }, 500);
}

export function exit() {
  clearInterval(countdownInterval);
}
