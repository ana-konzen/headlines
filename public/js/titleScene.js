import { changeScene, scenes } from "./main.js";

export function setup() {
  select("#startGame").mousePressed(() => {
    changeScene(scenes.play);
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
