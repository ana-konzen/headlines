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
  // partyConnect("wss://demoserver.p5party.org", "headlines-game");

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
    // Check if we're in versus mode
    const gameMode = localStorage.getItem("gameMode");
    if (gameMode === "versus") {
      changeScene(scenes.versusLeaderboard);
    } else {
      changeScene(scenes.gameOver);
    }
    return;
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

// Function to reset the game state
function resetGameState() {
  // Reset game state variables
  headlineIndex = 0;
  chosenWord = "____";
  articles = [];
  headline = null;
  timer = roundTime;

  // Clear options container
  select("#optionsCont").html("");
}

export function enter() {
  // Reset game state
  resetGameState();

  // Reset score for non-versus mode
  if (localStorage.getItem("gameMode") !== "versus") {
    me.score = 0;
  }

  // Add game-active class to body
  document.body.classList.add("game-active");

  // Fetch new headlines
  fetchHeadlines();

  // Show game screen
  select("#game").style("display", "block");
}

export function exit() {
  // Remove game-active class from body
  document.body.classList.remove("game-active");

  // Hide game screen
  select("#game").style("display", "none");

  // Reset game state
  resetGameState();
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
    if (headlineIndex >= numArticles) {
      console.log("end");
      // Check if we're in versus mode
      const gameMode = localStorage.getItem("gameMode");
      if (gameMode === "versus") {
        changeScene(scenes.versusLeaderboard);
      } else {
        changeScene(scenes.end);
      }
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

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue, randomIndex;

  // While there remain elements to shuffle
  while (currentIndex !== 0) {
    // Pick a remaining element
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // Swap it with the current element
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
