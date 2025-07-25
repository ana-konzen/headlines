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
let autoAdvance = false;
let isTransitioning = false; // Flag to prevent overlapping fades

export function preload() {
  // partyConnect("wss://demoserver.p5party.org", "headlines-game");

  me = partyLoadMyShared({
    id: makeId(), // a unique string id
    score: 0,
  });
}

export function setup() {
  // Next button is now hidden - auto-advance on answer selection
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
    // Only animate typewriter when user selects an answer
    if (chosenWord !== lastChosenWord && chosenWord !== "____") {
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

          // Auto-advance after animation completes with 1000ms delay
          if (autoAdvance && !isTransitioning) {
            isTransitioning = true;
            setTimeout(() => {
              fadeToNextRound();
            }, 1000);
          }
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

  if (
    optionsContainer &&
    nextButton &&
    optionsContainer.elt &&
    nextButton.elt
  ) {
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

function fadeToNextRound() {
  if (!isTransitioning) return;

  // Fade out current headline
  select("#headline").style("opacity", "0");
  select("#headline").style("transition", "opacity 0.3s ease");

  setTimeout(() => {
    goToNextRound();

    // Fade in new headline after content is set
    setTimeout(() => {
      select("#headline").style("opacity", "1");
      isTransitioning = false;
    }, 50);
  }, 300);
}

function fadeInHeadline() {
  if (isTransitioning) return;

  select("#headline").style("opacity", "0");
  select("#headline").style("transition", "opacity 0.5s ease");

  setTimeout(() => {
    select("#headline").style("opacity", "1");
  }, 50);
}

function resetGameState() {
  headlineIndex = 0;
  chosenWord = "____";
  articles = [];
  headline = null;
  timer = roundTime;
  userAnswers = Array(numArticles).fill("____");
  autoAdvance = false;
  isTransitioning = false;

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

      // Set initial headline with blank and fade it in
      select("#headline").html(
        `<div class="headline-text">${headline?.article || ""}</div>`
      );

      fadeInHeadline();
    })
    .catch((error) => {
      console.error("Error fetching headlines:", error);
    });
}

function goToNextRound() {
  if (articles && articles.length > headlineIndex && articles[headlineIndex]) {
    // Don't reset disabled options - they should stay disabled once selected

    // Reset for next round
    chosenWord = "____";
    lastChosenWord = "____";
    autoAdvance = false;
    headlineIndex++;

    if (headlineIndex >= numArticles) {
      console.log("end");

      // Track game completion
      if (window.plausible) {
        window.plausible("game-completed", {
          props: {
            score: me.score,
            totalQuestions: numArticles,
          },
        });
      }

      changeScene(scenes.results);

      return;
    }
    headline = articles[headlineIndex];

    // Set new headline with blank (no animation yet)
    select("#headline").html(
      `<div class="headline-text">${headline?.article || ""}</div>`
    );

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

  // Immediately save the answer and set up auto-advance
  chosenWord = responseObj.word;

  // Save answer for current headline
  if (headlineIndex < articles.length) {
    userAnswers[headlineIndex] = chosenWord;
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
  }

  // Update score if correct
  if (chosenWord === articles[headlineIndex].word) {
    me.score++;
  }

  // Visual feedback - mark selected option as disabled (red)
  // Don't remove disabled class from other buttons - they should stay disabled
  option.addClass("disabled");

  // Enable auto-advance after animation
  autoAdvance = true;
}
