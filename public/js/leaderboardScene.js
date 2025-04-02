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
      // First count occurrences of each score
      const scoreCounts = Array(maxPoints).fill(0);
      scores.forEach((score) => scoreCounts[score - 1]++);

      // Update each bar with width based on fixed maximum of 50
      scores.forEach((score) => {
        const scoreDiv = select(`.score-${score} .score-value`);
        const currentCount = parseInt(scoreDiv.html()) + 1;
        scoreDiv.html(currentCount);

        // Calculate width as percentage of 50 (fixed maximum)
        const widthPercentage = (currentCount / 50) * 100;
        select(`.score-bar-fill.score-${score}`).style("width", `${widthPercentage}%`);
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
