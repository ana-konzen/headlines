// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let me;

const maxPoints = 10;

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
  // Create a container for the user's score message
  createDiv().id("user-score-message").parent("#end").style("display", "none");

  for (let i = 0; i < maxPoints; i++) {
    createDiv()
      .addClass(`score-${i + 1}`)
      .parent("#scores")
      .html(`${i + 1}: <div>0</div>`);
  }

  // Add back button functionality
  select("#end .back-button").mousePressed(() => {
    changeScene(scenes.title);
  });
}

export function enter() {
  document.body.classList.add("game-over");
  select("#end").style("display", "block");

  // Display user score message
  const userScoreMessage = select("#user-score-message");
  const scoreText = me.score === 1 ? "correct answer" : "correct answers";
  userScoreMessage.html(`Nice! You got ${me.score} ${scoreText}!`);
  userScoreMessage.style("display", "block");

  fetch("/api/scores").then((response) => {
    response.json().then((scores) => {
      scores.forEach((score) => {
        const scoreDiv = select(`.score-${score} div`);
        scoreDiv.html(parseInt(scoreDiv.html()) + 1 + " people");
      });
    });
  });
  select(`.score-${me.score}`).style("background-color", "#e15656");
}

export function exit() {
  document.body.classList.remove("game-over");
  select("#end").style("display", "none");
  select("#user-score-message").style("display", "none");
}
