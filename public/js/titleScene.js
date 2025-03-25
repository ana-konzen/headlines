import { changeScene, scenes } from "./main.js";

export function setup() {
  // Global mode button
  select("#startGame").mousePressed(() => {
    // Set game mode to global
    localStorage.setItem("gameMode", "global");
    changeScene(scenes.countdown);
  });

  // How-to modal functionality
  select(".how-to img").mousePressed(() => {
    select("#how-to-modal").addClass("show");
  });

  select(".back-arrow img").mousePressed(() => {
    select("#how-to-modal").removeClass("show");
  });
}

export function enter() {
  select("#start").style("display", "block");
  fetch("/api/numPlayers").then((response) => {
    response.json().then((numPlayers) => {
      console.log("numPlayers:", numPlayers);
      select("#numPlayers").html(numPlayers);
    });
  });
}

export function exit() {
  select("#start").style("display", "none");
}
