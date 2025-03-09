// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";
import { makeId } from "./utilities.js";

const numArticles = 10;
const roundTime = 60;

let me;
let guests;
let shared;

let headlineIndex = 0;
let chosenWord = "____";
let articles = [];
let headline;

let timer = roundTime;

export function preload() {
  partyConnect("wss://demoserver.p5party.org", "headlines-game");

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
    goToNextRound();
  });
}
export function update() {
  if (frameCount % 60 === 0) timer--;
  if (timer <= 0) {
    goToNextRound();
  }
  select("#timer").html(timer);
  if (headlineIndex < numArticles) {
    select("#headline").html(
      `<div class="headline-text">${headline?.article?.replace(
        "____",
        `<span class="answer">${chosenWord}</span>`
      )}</div>`
    );
  }
}

export function enter() {
  document.body.classList.add("game-active");
  fetchHeadlines();
  select("#game").style("display", "block");
}

export function exit() {
  fetch(`/api/setScore?score=${me.score}`);
  document.body.classList.remove("game-active");
  select("#game").style("display", "none");
}

function fetchHeadlines() {
  fetch("/api/headline")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((responseArr) => {
      responseArr.forEach((responseObj) => {
        createOption(responseObj);
      });
      articles = shuffle(responseArr);
      headline = articles[headlineIndex];
    })
    .catch((error) => {
      console.error("Error fetching headlines:", error);
      // Add fallback behavior or user notification
    });
}

function goToNextRound() {
  if (articles && articles.length > headlineIndex && articles[headlineIndex]) {
    if (chosenWord === articles[headlineIndex].word) {
      me.score++;
    }
    select(".possible-option.disabled").removeClass("possible-option");

    chosenWord = "____";
    headlineIndex++;
    timer = roundTime;
    if (headlineIndex >= numArticles) {
      console.log("end");
      changeScene(scenes.end);
      return;
    }
    headline = articles[headlineIndex];
  } else {
    console.error("Articles data is not available");
    // Handle the error case
  }
}

function createOption(responseObj) {
  const newOption = createButton(responseObj.word);
  newOption.parent("#optionsCont");
  newOption.addClass("possible-option option-button");
  newOption.mousePressed(() => {
    handleOptionPress(newOption, responseObj);
  });
}

function handleOptionPress(option, responseObj) {
  if (option.hasClass("disabled")) return;
  chosenWord = responseObj.word;
  selectAll(".possible-option").forEach((button) => {
    button.removeClass("disabled");
  });
  option.addClass("disabled");
}
