import { changeScene, scenes } from "./main.js";

// p5.party variables
let shared;
let me;
let guests;

export function preload() {
  // Load shared data
  shared = partyLoadShared("globals");
  me = partyLoadMyShared();
  guests = partyLoadGuestShareds();
}

export function setup() {
  // Add back button functionality
  select("#versusLeaderboard .back-button").mousePressed(() => {
    changeScene(scenes.title);
  });
}

export function enter() {
  // Show the versus leaderboard screen
  select("#versusLeaderboard").style("display", "block");

  // Clear previous leaderboard
  const leaderboardDiv = select("#versusScores");
  leaderboardDiv.html("");

  // Combine current player (me) and guests into one array
  let allPlayers = [];
  if (me) {
    allPlayers.push(me);
  }
  if (guests && guests.length > 0) {
    guests.forEach((guest) => {
      // Avoid duplicate of me if present in guests
      if (!allPlayers.find((player) => player.id === guest.id)) {
        allPlayers.push(guest);
      }
    });
  }

  // Sort players by score (highest first)
  allPlayers.sort((a, b) => b.score - a.score);

  // Display each player's score
  allPlayers.forEach((player) => {
    if (player) {
      const playerDiv = createDiv();
      playerDiv.addClass("player-score-item");

      // Highlight the current player
      if (player.id === me.id) {
        playerDiv.addClass("current-player");
      }

      const playerName = player.name || "Player";
      const correctText = player.score === 1 ? "CORRECT" : "CORRECT";
      playerDiv.html(`${playerName}: ${player.score} ${correctText}`);

      playerDiv.parent(leaderboardDiv);
    }
  });
}

export function exit() {
  // Hide the versus leaderboard screen
  select("#versusLeaderboard").style("display", "none");
}

export function update() {
  // Any per-frame updates if needed
}
