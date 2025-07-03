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
  select("body").addClass("countdown-active");
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
      }, 1500); // Short delay before transitioning to game
    }
  }, 1500); // Changed from 1000 to 1500 for 1.5 second intervals
}

export function exit() {
  select("body").removeClass("countdown-active");
  clearInterval(countdownInterval);
}
