// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let me;

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
  select("#goToLeaderboard").mousePressed(() => {
    changeScene(scenes.leaderboard);
  });
}

export function enter() {
  select("#results").style("display", "flex");

  select("#player-score").html(me.score);

  const articles = JSON.parse(localStorage.getItem("articlesData") || "[]");

  const userAnswers = JSON.parse(localStorage.getItem("userAnswers") || "[]");

  articles.forEach((article, index) => {
    createResultDiv(article, index, userAnswers);
  });

  select("#shareResults").mousePressed(() => {
    const score = me.score;
    const totalArticles = articles.length;
    const shareText = `I scored ${score} out of ${totalArticles} in the Headlines Game! Can you do better?`;

    navigator.clipboard.writeText(shareText).then(() => {
      select("#shareResults").html("Copied ✓").style("color", "white").style("background-color", "#4CAF50");
    });
  });

  if (!localStorage.getItem("scoreSaved")) {
    fetch(`/api/setScore?score=${me.score}`);
    localStorage.setItem("scoreSaved", "true");
  }
}

export function exit() {
  select("#results").style("display", "none");
}

function createResultDiv(article, index, userAnswers) {
  const userAnswer = userAnswers[index] || "____";
  const isCorrect = userAnswer === article.word;
  const controls = createDiv().addClass("headline-controls");

  // create checkmark
  createDiv("✓")
    .addClass("check-mark")
    .addClass(isCorrect ? "correct" : "incorrect")
    .parent(controls);

  //create read button
  createButton("read article")
    .addClass("read-button")
    .mousePressed(() => {
      window.open(article.url, "_blank");
    })
    .parent(controls);

  const displayHeadline = isCorrect
    ? getRightDisplayHeadline(article)
    : getWrongDisplayHeadline(article, userAnswer);

  const headlineItem = createDiv().addClass("headline-result-item");

  const headlineText = createDiv(displayHeadline).addClass("headline-text-result");

  headlineItem.child(controls).child(headlineText);
  select("#headlines-results-container").child(headlineItem);
}

function getWrongDisplayHeadline(article, userAnswer) {
  const wordPosition = article.og_article.indexOf(article.word);

  if (wordPosition >= 0) {
    const beforeWord = article.og_article.substring(0, wordPosition);
    const afterWord = article.og_article.substring(wordPosition + article.word.length);

    return `${beforeWord}<strike class="wrong-answer">${userAnswer}</strike> <span class="answer">${article.word}</span>${afterWord}`;
  }
  return article.og_article;
}

function getRightDisplayHeadline(article) {
  return article.og_article.replace(article.word, `<span class="answer">${article.word}</span>`);
}
