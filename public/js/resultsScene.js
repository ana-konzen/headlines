// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let articles = [];
let me;
let userAnswers = [];

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
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

  articles.forEach((article, index) => {
    createResultDiv(article, index);
  });

  if (!localStorage.getItem("scoreSaved")) {
    fetch(`/api/setScore?score=${me.score}`);
    localStorage.setItem("scoreSaved", "true");
  }
}

export function exit() {
  select("#results").style("display", "none");
}

function createResultDiv(article, index) {
  const userAnswer = userAnswers[index] || "____";
  const isCorrect = userAnswer === article.word;

  const checkMark = createDiv("✓")
    .addClass("check-mark")
    .addClass(isCorrect ? "correct" : "incorrect");

  const readButton = createButton("READ ARTICLE")
    .addClass("read-button")
    .mousePressed(() => {
      window.open(article.url, "_blank");
    });

  const controls = createDiv().addClass("headline-controls").child(checkMark).child(readButton);

  let displayHeadline = article.og_article.replace(
    article.word,
    `<span class="answer">${article.word}</span>`
  );

  if (!isCorrect) {
    const wordPosition = article.og_article.indexOf(article.word);

    if (wordPosition >= 0) {
      const beforeWord = article.og_article.substring(0, wordPosition);
      const afterWord = article.og_article.substring(wordPosition + article.word.length);

      displayHeadline = `${beforeWord}<strike class="wrong-answer">${userAnswer}</strike> <span class="answer">${article.word}</span>${afterWord}`;
    }
  }
  const headlineItem = createDiv().addClass("headline-result-item");

  const headlineText = createDiv(displayHeadline).addClass("headline-text-result");

  headlineItem.child(controls).child(headlineText);
  select("#headlines-results-container").child(headlineItem);
}
