import { changeScene, scenes, initializeParty } from "./main.js";

// p5.party variables
let shared;
let me;
let guests;
let isHost = false;
let playerListDiv;
let hostId = null;

export function preload() {
  // Make sure p5.party is initialized
  initializeParty();

  // Get the player name from localStorage
  const playerName = localStorage.getItem("playerName") || "Player";
  console.log("Player name in lobby:", playerName);

  // Load shared data for the room
  shared = partyLoadShared("globals", {
    gameStarted: false,
    hostId: null,
  });

  // Load the current player's shared object with the name
  me = partyLoadMyShared({
    name: playerName,
    score: 0,
  });

  // Load all connected players' shared objects
  guests = partyLoadGuestShareds();

  // Check if this client is the host (first player in the room)
  isHost = partyIsHost();
  console.log("Is host:", isHost);

  // If this client is the host, initialize shared data
  if (isHost) {
    console.log("This client is the host with name:", me.name);
    // Set the host ID in the shared data
    shared.hostId = me.id;
    hostId = me.id;
  } else if (shared.hostId) {
    // Get the host ID from shared data
    hostId = shared.hostId;
  }
}

export function setup() {
  // Set up back button functionality
  select("#versusLobby .back-button").mousePressed(() => {
    changeScene(scenes.versusEntry);
  });

  // Set up Start Game button
  select("#startGameButton").mousePressed(() => {
    console.log("Start Game button clicked");
    if (isHost) {
      // Set game started flag in shared data
      shared.gameStarted = true;
      console.log("Game started by host");
      // Host transitions to countdown scene
      changeScene(scenes.countdown);
    }
  });

  // Set up Invite Friends button (copies URL)
  select("#inviteFriendsButton").mousePressed(() => {
    // Copy the current URL to clipboard
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        // Show a temporary message that URL was copied
        const inviteButton = select("#inviteFriendsButton");
        const originalText = inviteButton.html();
        inviteButton.html("URL Copied!");
        setTimeout(() => {
          inviteButton.html(originalText);
        }, 2000);
      })
      .catch((err) => {
        console.error("Could not copy URL: ", err);
      });
  });

  // Get reference to player list container
  playerListDiv = select("#playerList");
}

export function enter() {
  // Update local shared record with the current player's name from localStorage
  const storedName = localStorage.getItem("playerName") || "Player";
  if (me && me.name !== storedName) {
    me.name = storedName;
    console.log("Updated my shared name to:", me.name);
  }

  // Check if this client is the host (first player in the room)
  isHost = partyIsHost();
  console.log("Is host:", isHost);

  // If this client is the host, initialize shared data
  if (isHost) {
    console.log("This client is the host with name:", me.name);
    // Set the host ID in the shared data
    shared.hostId = me.id;
    hostId = me.id;
  } else if (shared.hostId) {
    // Get the host ID from shared data
    hostId = shared.hostId;
  }

  // Show the versus lobby screen
  select("#versusLobby").style("display", "block");

  // Show/hide elements based on host status
  if (isHost) {
    select("#waitingMessage").style("display", "none");
    select("#startGameButton").style("display", "block");
  } else {
    select("#waitingMessage").style("display", "block");
    select("#startGameButton").style("display", "none");
  }

  // Update player list
  updatePlayerList();
}

export function exit() {
  // Hide the versus lobby screen
  select("#versusLobby").style("display", "none");
}

export function update() {
  // Update player list every frame to reflect changes
  updatePlayerList();

  // Update hostId if it changed
  if (shared.hostId !== hostId) {
    hostId = shared.hostId;
  }

  // Check if game has been started by host
  if (shared.gameStarted && !isHost) {
    console.log("Game started by host, joining game...");
    changeScene(scenes.countdown);
  }
}

// Function to update the player list
function updatePlayerList() {
  // Clear the player list
  playerListDiv.html("");

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

  // Iterate over combined players and update the list
  allPlayers.forEach((player) => {
    if (player) {
      const playerDiv = createDiv();
      playerDiv.addClass("player-item");
      const playerName = player.name || "Player";
      // Mark the host with special styling
      if (player.id === hostId) {
        playerDiv.addClass("host");
        playerDiv.html(`${playerName} (Host)`);
      } else {
        playerDiv.html(playerName);
      }
      playerDiv.parent(playerListDiv);
    }
  });
}
