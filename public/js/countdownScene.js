import { changeScene, scenes } from "./main.js";

let countdownValue = 3;
let countdownInterval;

export function enter() {
  countdownValue = 3; 
  const countdownTimer = document.getElementById("countdown-timer");

  if (countdownTimer) {
    countdownTimer.innerText = countdownValue;
  }

  countdownInterval = setInterval(() => {
    countdownValue--;

    if (countdownTimer && countdownValue >= 0) {
      countdownTimer.innerText = countdownValue;

      countdownTimer.style.transform = "scale(1.1)"; 
      setTimeout(() => {
        countdownTimer.style.transform = "scale(1)";
      }, 100); 
    }

    if (countdownValue < 0) {
      clearInterval(countdownInterval);
      changeScene(scenes.play);
    }
  }, 1000);
}

export function exit() {
  clearInterval(countdownInterval);
}
