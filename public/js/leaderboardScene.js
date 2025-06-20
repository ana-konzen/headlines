// deno-lint-ignore-file

import { changeScene, scenes } from "./main.js";

let me;

const maxPoints = 10;
let feedbackTimeout;
let backButtonHandler;
let feedbackButtonHandler;

export function preload() {
  me = partyLoadMyShared();
}

export function setup() {
  select("#scores").html(`
        ${Array.from(
          { length: maxPoints },
          (_, i) => `
          <div class="score-row">
            <div class="score-label">${i + 1}</div>
            <div class="score-bar">
              <div class="score-bar-fill score-${i + 1}">
                <span class="score-value">0</span>
              </div>
            </div>
          </div>
        `
        ).join("")}
  `);
}

export function enter() {
  select("#leaderboard").style("display", "block");

  const scoreText = me.score === 1 ? "correct answer" : "correct answers";
  select("#user-score-message").html(`Nice! You got ${me.score} ${scoreText}!`);

  fetch("/api/scores").then((response) => {
    response.json().then((scores) => {
      // Count occurrences of each score
      const scoreCounts = Array(maxPoints).fill(0);
      scores.forEach((score) => {
        if (score > 0 && score <= maxPoints) {
          scoreCounts[score - 1]++;
        }
      });

      // Update each bar
      scoreCounts.forEach((count, index) => {
        const scoreNum = index + 1;
        select(`.score-${scoreNum} .score-value`).html(count);

        // Calculate width as percentage of 50 (fixed maximum)
        const widthPercentage = Math.min((count / 50) * 100, 100);
        select(`.score-bar-fill.score-${scoreNum}`).style(
          "width",
          `${widthPercentage}%`
        );
      });

      // Highlight user's score bar in red
      select(`.score-bar-fill.score-${me.score}`).style(
        "background-color",
        "#e15656"
      );
    });
  });

  // Add back button click handler
  backButtonHandler = () => {
    changeScene(scenes.title);
  };
  document
    .querySelector("#leaderboard .back-arrow")
    .addEventListener("click", backButtonHandler);

  // Add feedback button click handler
  feedbackButtonHandler = () => {
    window.open(
      "https://forms.gle/sLp5xzVHczsnqHb3A",
      "_blank",
      "noopener,noreferrer"
    );
  };
  document
    .getElementById("feedback-button")
    .addEventListener("click", feedbackButtonHandler);

  // Show feedback popup after 3 seconds
  feedbackTimeout = setTimeout(() => {
    showFeedbackPopup();
  }, 3000);
}

function showFeedbackPopup() {
  const feedbackModal = document.getElementById("feedback-modal");
  feedbackModal.style.display = "block";
  feedbackModal.classList.add("show");

  // Add close button handler
  document
    .getElementById("close-feedback")
    .addEventListener("click", closeFeedbackPopup);

  // Close on background click
  feedbackModal.addEventListener("click", (e) => {
    if (e.target === feedbackModal) {
      closeFeedbackPopup();
    }
  });
}

function closeFeedbackPopup() {
  const feedbackModal = document.getElementById("feedback-modal");
  feedbackModal.classList.remove("show");
  setTimeout(() => {
    feedbackModal.style.display = "none";
  }, 300); // Wait for animation to complete
}

export function exit() {
  select("#leaderboard").style("display", "none");

  // Clear feedback timeout if still pending
  if (feedbackTimeout) {
    clearTimeout(feedbackTimeout);
    feedbackTimeout = null;
  }

  // Close feedback popup if open
  closeFeedbackPopup();

  // Remove back button click handler
  if (backButtonHandler) {
    document
      .querySelector("#leaderboard .back-arrow")
      .removeEventListener("click", backButtonHandler);
  }

  // Remove feedback button click handler
  if (feedbackButtonHandler) {
    document
      .getElementById("feedback-button")
      .removeEventListener("click", feedbackButtonHandler);
  }
}
