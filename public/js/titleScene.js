import { changeScene, scenes } from "./main.js";

export function setup() {
  select("#startGame").mousePressed(() => {
    changeScene(scenes.countdown);
  });
}

export function enter() {
  select("#start").style("display", "block");
}

export function exit() {
  select("#start").style("display", "none");
}
