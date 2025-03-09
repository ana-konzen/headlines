import { changeScene, scenes, initializeParty } from "./main.js";

// Variable to store the player's name
let playerName = "";
let enterLobbyButton;

export function preload() {
  // p5.party is initialized in main.js
}

export function setup() {
  // Set up back button functionality
  select("#versusEntry .back-button").mousePressed(() => {
    changeScene(scenes.title);
  });

  // Set up name input field
  const nameInput = select("#playerNameInput");
  if (nameInput) {
    nameInput.input(() => {
      playerName = nameInput.value();

      // Enable/disable the Enter Lobby button based on input
      if (playerName.trim() !== "") {
        enterLobbyButton.removeAttribute("disabled");
      } else {
        enterLobbyButton.attribute("disabled", "");
      }
    });
  }

  // Set up Enter Lobby button
  enterLobbyButton = select("#enterLobbyButton");
  if (enterLobbyButton) {
    enterLobbyButton.attribute("disabled", ""); // Disabled by default
    enterLobbyButton.mousePressed(() => {
      if (playerName.trim() !== "") {
        // Store the player name for later use
        const trimmedName = playerName.trim();
        localStorage.setItem("playerName", trimmedName);
        console.log("Player name saved:", trimmedName);

        // Make sure p5.party is initialized
        initializeParty();

        // Navigate to the lobby
        changeScene(scenes.versusLobby);
      }
    });
  }
}

export function enter() {
  // Check if there's a previously entered name
  const savedName = localStorage.getItem("playerName");
  const nameInput = select("#playerNameInput");

  if (savedName) {
    nameInput.value(savedName);
    playerName = savedName;
    enterLobbyButton.removeAttribute("disabled");
  } else {
    // Reset the input field and button state
    nameInput.value("");
    playerName = "";
    enterLobbyButton.attribute("disabled", "");
  }

  // Show the versus entry screen
  select("#versusEntry").style("display", "block");
}

export function exit() {
  // Hide the versus entry screen
  select("#versusEntry").style("display", "none");
}
