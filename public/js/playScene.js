// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";
import * as player from "./player.js";
import * as host from "./host.js";

const numArticles = 10;

let me;
let guests;
let shared;

let headlineIndex = 0;
let chosenWord = "____";
let articles = [];
let headline;

export function preload() {
  partyConnect("wss://demoserver.p5party.org", "headlines-game-testt");

  host.preload();
  player.preload();

  shared = partyLoadShared("shared");
  guests = partyLoadGuestShareds();
  me = partyLoadMyShared();
}

export function setup() {
  if (partyIsHost()) host.setup();
  player.setup();
  select("#next").mousePressed(() => {
    if (chosenWord === "____") {
      return;
    }

    if (chosenWord === articles[headlineIndex].word) {
      me.score++;
    }
    chosenWord = "____";
    headlineIndex++;
    if (headlineIndex >= numArticles) {
      console.log("end");
      changeScene(scenes.end);
      return;
    }
    headline = articles[headlineIndex];
  });
}
export function update() {
  if (headlineIndex < numArticles) {
    select("#headline").html(`<div class="headline-text">${headline?.article?.replace("____", `<span class="answer">${chosenWord}</span>`)}</div>`);
  }
}

export function enter() {
  document.body.classList.add('game-active');
  fetchHeadlines();
  select("#game").style("display", "block");
}

export function exit() {
  document.body.classList.remove('game-active');
  select("#game").style("display", "none");
}

function fetchHeadlines() {
  fetch("/api/headline")
    .then((response) => response.json())
    .then((responseArr) => {
      console.log(responseArr);
      responseArr.forEach((responseObj) => {
        const newButton = createButton(responseObj.word);
        newButton.mousePressed(() => {
          chosenWord = responseObj.word;
          console.log(chosenWord);
        });
        newButton.parent("#optionsCont");
      });
      articles = shuffle(responseArr);
      headline = articles[headlineIndex];
    });
}
