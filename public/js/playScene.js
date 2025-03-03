// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";
import { makeId } from "./utilities.js";

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

  shared = partyLoadShared("shared");
  guests = partyLoadGuestShareds();
  me = partyLoadMyShared({
    id: makeId(), // a unique string id
    score: 0,
  });
}

export function setup() {
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
    select("#headline").html(headline?.article?.replace("____", `<span class="answer">${chosenWord}</span>`));
  }
}

export function enter() {
  fetchHeadlines();
  select("#game").style("display", "block");
}

export function exit() {
  select("#game").style("display", "none");
}

function fetchHeadlines() {
  fetch("/api/headline")
    .then((response) => response.json())
    .then((responseArr) => {
      responseArr.forEach((responseObj) => {
        const newButton = createButton(responseObj.word);
        newButton.mousePressed(() => {
          chosenWord = responseObj.word;
        });
        newButton.parent("#optionsCont");
      });
      articles = shuffle(responseArr);
      headline = articles[headlineIndex];
    });
}
