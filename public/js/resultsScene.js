// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let articles = [];
let me;
let userAnswers = [];

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
  // Set up the "Go to Leaderboard" button
  select("#goToLeaderboard").mousePressed(() => {
    changeScene(scenes.end);
  });
}

export function enter() {
  select("#results").style("display", "flex");

  select("#player-score").html(me.score);

  const articlesData = JSON.parse(localStorage.getItem("articlesData") || "[]");
  articles = articlesData;

  userAnswers = JSON.parse(localStorage.getItem("userAnswers") || "[]");

  const headlinesContainer = select("#headlines-results-container");
  headlinesContainer.html("");

  articles.forEach((article, index) => {
    const userAnswer = userAnswers[index] || "____";
    const isCorrect = userAnswer === article.word;

    const headlineItem = createDiv();
    headlineItem.addClass("headline-result-item");

    // Create controls (checkmark and READ button)
    const controls = createDiv();
    controls.addClass("headline-controls");

    // Create checkmark
    const checkMark = createDiv();
    checkMark.addClass("check-mark");
    checkMark.addClass(isCorrect ? "correct" : "incorrect");
    checkMark.html("✓");

    // Create READ button
    const readButton = createButton("READ ARTICLE");
    readButton.addClass("read-button");
    readButton.mousePressed(() => {
      window.open(article.url, "_blank");
    });

    // Add controls to the headline item
    controls.child(checkMark);
    controls.child(readButton);
    headlineItem.child(controls);

    // Add the headline text
    const headlineText = createDiv();
    headlineText.addClass("headline-text-result");

    // Display the headline with the user's answer and correct word
    let displayHeadline = article.og_article;

    // If user's answer is wrong, show their answer with strikethrough and the correct word
    if (!isCorrect) {
      // Find the position of the correct word in the original headline
      const wordPosition = article.og_article.indexOf(article.word);

      if (wordPosition >= 0) {
        // Create a version with both user's answer and correct word
        const beforeWord = article.og_article.substring(0, wordPosition);
        const afterWord = article.og_article.substring(wordPosition + article.word.length);

        displayHeadline = `${beforeWord}<strike class="wrong-answer">${userAnswer}</strike> <span class="answer">${article.word}</span>${afterWord}`;
      }
    } else {
      // If correct, just highlight the correct word
      displayHeadline = article.og_article.replace(
        article.word,
        `<span class="answer">${article.word}</span>`
      );
    }

    headlineText.html(displayHeadline);
    headlineItem.child(headlineText);
    headlinesContainer.child(headlineItem);
  });

  // Save the score to the server if not already saved
  if (!localStorage.getItem("scoreSaved")) {
    fetch(`/api/setScore?score=${me.score}`);
    localStorage.setItem("scoreSaved", "true");
  }
}

export function exit() {
  // Hide the results screen
  select("#results").style("display", "none");
}
