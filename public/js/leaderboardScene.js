// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let me;

const maxPoints = 10;

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
  select("#scores").html(`
        ${Array.from(
          { length: maxPoints },
          (_, i) => `
          <div class="score-row">
            <div class="score-label">${i + 1}</div>
            <div class="score-bar">
              <div class="score-bar-fill score-${i + 1}">
                <span class="score-value">0</span>
              </div>
            </div>
          </div>
        `
        ).join("")}
  `);
}

export function enter() {
  select("#leaderboard").style("display", "block");

  const scoreText = me.score === 1 ? "correct answer" : "correct answers";
  select("#user-score-message").html(`Nice! You got ${me.score} ${scoreText}!`);

  fetch("/api/scores").then((response) => {
    response.json().then((scores) => {
      // First find the maximum count
      const scoreCounts = Array(maxPoints).fill(0);
      scores.forEach((score) => scoreCounts[score - 1]++);
      const maxCount = Math.max(...scoreCounts);

      // Then update each bar with proportional width
      scores.forEach((score) => {
        const scoreDiv = select(`.score-${score} .score-value`);
        const currentCount = parseInt(scoreDiv.html()) + 1;
        scoreDiv.html(currentCount);

        // Calculate width as percentage of max count
        const widthPercentage = (currentCount / maxCount) * 100;
        select(`.score-${score}`).style("width", `${widthPercentage}%`);
      });
    });
  });
  select("#leaderboard .back-button").mousePressed(() => {
    changeScene(scenes.title);
  });
  select(`.score-${me.score}`).style("background-color", "#e15656");
}

export function exit() {
  select("#leaderboard").style("display", "none");
}
