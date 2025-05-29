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
      }, 1000); // Short delay before transitioning to game
    }
  }, 1000);
}

export function exit() {
  select("body").removeClass("countdown-active");
  clearInterval(countdownInterval);
}
