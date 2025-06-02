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
    const shareText = `I scored ${score} out of ${totalArticles} in Headlines! Can you do better? https://play-headlines.deno.dev/`;

    navigator.clipboard.writeText(shareText).then(() => {
      select("#shareResults")
        .html("Copied ✓")
        .style("background-color", "#4CAF50");
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

  const headlineItem = createDiv().addClass("headline-result-item");

  // create checkmark and headline group
  const checkmark = createDiv("✓")
    .addClass("check-mark")
    .addClass(isCorrect ? "correct" : "incorrect");

  const displayHeadline = isCorrect
    ? getRightDisplayHeadline(article)
    : getWrongDisplayHeadline(article, userAnswer);

  const headlineText = createDiv(displayHeadline).addClass(
    "headline-text-result"
  );

  //create read button
  const readButton = createButton("View Article")
    .addClass("read-button")
    .mousePressed(() => {
      window.open(article.url, "_blank");
    });

  checkmark.parent(headlineItem);
  headlineText.parent(headlineItem);
  readButton.parent(headlineItem);

  select("#headlines-results-container").child(headlineItem);
}

function getWrongDisplayHeadline(article, userAnswer) {
  const wordPosition = article.og_article.indexOf(article.word);

  if (wordPosition >= 0) {
    const beforeWord = article.og_article.substring(0, wordPosition);
    const afterWord = article.og_article.substring(
      wordPosition + article.word.length
    );

    return `${beforeWord}<strike class="wrong-answer">${userAnswer}</strike> <span class="answer">${article.word}</span>${afterWord}`;
  }
  return article.og_article;
}

function getRightDisplayHeadline(article) {
  return article.og_article.replace(
    article.word,
    `<span class="answer">${article.word}</span>`
  );
}
