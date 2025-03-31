// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let countdownValue = 3;
let countdownInterval;

export function setup() {
  select(".back-button").mousePressed(() => {
    clearInterval(countdownInterval);
    changeScene(scenes.title);
  });
}

export function enter() {
  document.body.classList.add("countdown-active");

  // Reset countdown
  countdownValue = 3;
  select(".countdown-number").html(countdownValue);

  // Start countdown
  countdownInterval = setInterval(() => {
    countdownValue--;
    select(".countdown-number").html(countdownValue);

    if (countdownValue <= 1) {
      clearInterval(countdownInterval);
      setTimeout(() => {
        exit();
        changeScene(scenes.play);
      }, 500); // Short delay before transitioning to game
    }
  }, 500);
}

export function exit() {
  document.body.classList.remove("countdown-active");
  clearInterval(countdownInterval);
}
