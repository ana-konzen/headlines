// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let guests;
let shared;

const maxPoints = 10;

export function preload() {
  shared = partyLoadShared("shared");
  guests = partyLoadGuestShareds();
}

export function setup() {
  for (let i = 0; i < maxPoints; i++) {
    createDiv()
      .addClass(`score-${i + 1}`)
      .parent("#scores")
      .html(`${i + 1}: <div>0</div>`);
  }
}

export function enter() {
  document.body.classList.add("game-over");
  select("#end").style("display", "block");
  fetch("/api/scores").then((response) => {
    response.json().then((scores) => {
      console.log("scores:", scores);
      scores.forEach((score) => {
        const scoreDiv = select(`.score-${score} div`);
        scoreDiv.html(parseInt(scoreDiv.html()) + 1 + " people");
      });
    });
  });
  // guests.forEach((guest, index) => {
  //   const guestDiv = createDiv(`Player ${index + 1}: <span class=${guest.id}>${guest.score}</span>`);
  //   guestDiv.parent("#scores");
  // });
}

export function update() {
  guests.forEach((guest) => {
    select(`.${guest.id}`).html(guest.score);
  });
}

export function exit() {
  document.body.classList.remove("game-over");
  select("#end").style("display", "none");
}
