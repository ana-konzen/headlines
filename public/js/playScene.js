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
let userAnswers = []; // Array to store user's answers
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
  if (frameCount % 60 === 0) timer--;
  if (timer <= 0) {
    if (headlineIndex < articles.length) {
      userAnswers[headlineIndex] = chosenWord;
      localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
    }

    const gameMode = localStorage.getItem("gameMode");
    if (gameMode === "versus") {
      changeScene(scenes.versusLeaderboard);
    } else {
      changeScene(scenes.results);
    }
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

// Function to create progress indicator dots
function createProgressIndicator() {
  // First, remove any existing progress indicator
  if (select("#progressIndicator")) {
    select("#progressIndicator").remove();
  }

  // Create container for progress dots
  const progressContainer = createDiv();
  progressContainer.id("progressIndicator");

  // Find the optionsCont and next button elements
  const optionsContainer = select("#optionsCont");
  const nextButton = select("#next");

  // Insert the progressContainer between optionsCont and next button
  if (optionsContainer && nextButton && optionsContainer.elt && nextButton.elt) {
    // Insert the progress container after the options container
    const gameContainer = select("#game").elt;
    gameContainer.insertBefore(progressContainer.elt, nextButton.elt);
  } else {
    // Fallback: just add to the game container
    progressContainer.parent("#game");
  }

  // Create 10 dots
  for (let i = 0; i < numArticles; i++) {
    const dot = createDiv();
    dot.addClass("progress-dot");
    dot.id(`dot-${i}`);
    dot.parent(progressContainer);
  }

  // Initial update
  updateProgressIndicator();
}

// Function to update progress indicator dots
function updateProgressIndicator() {
  for (let i = 0; i < numArticles; i++) {
    const dot = select(`#dot-${i}`);

    // Clear previous classes
    dot.removeClass("completed");
    dot.removeClass("current");
    dot.removeClass("upcoming");

    // Set appropriate class based on progress
    if (i < headlineIndex) {
      dot.addClass("completed"); // Past questions (black)
    } else if (i === headlineIndex) {
      dot.addClass("current"); // Current question (red)
    } else {
      dot.addClass("upcoming"); // Future questions (white)
    }
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
  userAnswers = Array(numArticles).fill("____");

  // Clear options container
  select("#optionsCont").html("");
}

export function enter() {
  // Reset game state
  resetGameState();

  // Reset userAnswers array
  userAnswers = Array(numArticles).fill("____");

  // Reset score for non-versus mode
  if (localStorage.getItem("gameMode") !== "versus") {
    me.score = 0;
  }

  // Remove scoreSaved flag
  localStorage.removeItem("scoreSaved");

  // Add game-active class to body
  document.body.classList.add("game-active");

  // Fetch new headlines
  fetchHeadlines();

  // Create progress indicator
  createProgressIndicator();

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

      localStorage.setItem("articlesData", JSON.stringify(articles));

      select("#headline").html(
        `<div class="headline-text">${headline?.article || ""}</div>`
      );
    })
    .catch((error) => {
      console.error("Error fetching headlines:", error);
    });
}

function goToNextRound() {
  if (articles && articles.length > headlineIndex && articles[headlineIndex]) {
    // Store the user's chosen word in the userAnswers array
    userAnswers[headlineIndex] = chosenWord;

    // Save userAnswers to localStorage
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));

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
        changeScene(scenes.results); // Change to results scene instead of end
      }
      return;
    }
    headline = articles[headlineIndex];

    // Update progress indicator when going to next round
    updateProgressIndicator();
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
