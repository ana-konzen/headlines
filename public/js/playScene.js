// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";
import { makeId } from "./utilities.js";

const numArticles = 10;
const roundTime = 60;

let me;

let headlineIndex = 0;
let chosenWord = "____";
let articles = [];
let headline;
let timer = roundTime;
let userAnswers = [];
let lastChosenWord = "____";
let currentLetterIndex = 0;
let typewriterInterval;

export function preload() {
  // partyConnect("wss://demoserver.p5party.org", "headlines-game");

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
  if (frameCount % 60 === 0) {
    timer--;
    const timerElement = select("#timer");
    if (timer <= 10) {
      timerElement.addClass("warning");
    } else {
      timerElement.removeClass("warning");
    }
  }
  if (timer <= 0) {
    if (headlineIndex < articles.length) {
      userAnswers[headlineIndex] = chosenWord;
      localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
    }

    changeScene(scenes.results);

    return;
  }
  select("#timer").html(timer);
  if (headlineIndex < numArticles) {
    if (chosenWord !== lastChosenWord) {
      currentLetterIndex = 0;
      clearInterval(typewriterInterval);

      typewriterInterval = setInterval(() => {
        if (currentLetterIndex <= chosenWord.length) {
          const currentWord = chosenWord.slice(0, currentLetterIndex);
          select("#headline").html(
            `<div class="headline-text">${headline?.article?.replace(
              "____",
              `<span class="answer">${currentWord}</span>`
            )}</div>`
          );
          currentLetterIndex++;
        } else {
          clearInterval(typewriterInterval);
        }
      }, 100);

      lastChosenWord = chosenWord;
    }

    updateProgressIndicator();
  }
}

function createProgressIndicator() {
  if (select("#progressIndicator")) {
    select("#progressIndicator").remove();
  }

  const progressContainer = createDiv();
  progressContainer.id("progressIndicator");

  const turnsText = createDiv("Turns Remaining:");
  turnsText.addClass("turns-remaining");
  turnsText.parent(progressContainer);

  const optionsContainer = select("#optionsCont");
  const nextButton = select("#next");

  if (optionsContainer && nextButton && optionsContainer.elt && nextButton.elt) {
    const gameContainer = select("#game").elt;
    gameContainer.insertBefore(progressContainer.elt, nextButton.elt);
  } else {
    progressContainer.parent("#game");
  }

  for (let i = 0; i < numArticles; i++) {
    const dot = createDiv();
    dot.addClass("progress-dot");
    dot.id(`dot-${i}`);
    dot.parent(progressContainer);
  }

  updateProgressIndicator();
}

function updateProgressIndicator() {
  for (let i = 0; i < numArticles; i++) {
    const dot = select(`#dot-${i}`);

    dot.removeClass("completed");
    dot.removeClass("current");
    dot.removeClass("upcoming");

    if (i < headlineIndex) {
      dot.addClass("completed");
    } else if (i === headlineIndex) {
      dot.addClass("current");
    } else {
      dot.addClass("upcoming");
    }
  }
}

function resetGameState() {
  headlineIndex = 0;
  chosenWord = "____";
  articles = [];
  headline = null;
  timer = roundTime;
  userAnswers = Array(numArticles).fill("____");

  select("#optionsCont").html("");
}

export function enter() {
  resetGameState();

  userAnswers = Array(numArticles).fill("____");

  me.score = 0;

  localStorage.removeItem("scoreSaved");

  fetchHeadlines();

  createProgressIndicator();

  select("#game").style("display", "block");
}

export function exit() {
  select("#game").style("display", "none");

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

      localStorage.setItem("articlesData", JSON.stringify(articles));

      select("#headline").html(`<div class="headline-text">${headline?.article || ""}</div>`);
    })
    .catch((error) => {
      console.error("Error fetching headlines:", error);
    });
}

function goToNextRound() {
  if (articles && articles.length > headlineIndex && articles[headlineIndex]) {
    userAnswers[headlineIndex] = chosenWord;

    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));

    if (chosenWord === articles[headlineIndex].word) {
      me.score++;
    }
    select(".possible-option.disabled").removeClass("possible-option");
    select("#next").removeClass("active");

    chosenWord = "____";
    headlineIndex++;
    if (headlineIndex >= numArticles) {
      console.log("end");

      changeScene(scenes.results);

      return;
    }
    headline = articles[headlineIndex];

    updateProgressIndicator();
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
  select("#next").addClass("active");
}
