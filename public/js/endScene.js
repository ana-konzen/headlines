// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let me;

const maxPoints = 10;

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
  select("#end").html(`
    <div id="user-score-message"></div>
    <div id="leaderboard-container">
      <h1>LEADERBOARD</h1>
      <p class="subtitle">global answer distribution</p>
      <div id="scores">
        ${Array.from({length: maxPoints}, (_, i) => `
          <div class="score-row">
            <div class="score-label">${i + 1}</div>
            <div class="score-bar">
              <div class="score-bar-fill score-${i + 1}">
                <span class="score-value">0</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `);

  // Add back button functionality
  select("#end .back-button").mousePressed(() => {
    changeScene(scenes.title);
  });
}

export function enter() {
  document.body.classList.add("game-over");
  select("#end").style("display", "block");

  const scoreText = me.score === 1 ? "correct answer" : "correct answers";
  select("#user-score-message").html(`Nice! You got ${me.score} ${scoreText}!`);

  fetch("/api/scores").then((response) => {
    response.json().then((scores) => {
      // First find the maximum count
      const scoreCounts = Array(maxPoints).fill(0);
      scores.forEach(score => scoreCounts[score - 1]++);
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
  select(`.score-${me.score}`).style("background-color", "#e15656");
}

export function exit() {
  document.body.classList.remove("game-over");
  select("#end").style("display", "none");
}
