import { changeScene, scenes } from "./main.js";

export function setup() {
  select("#startGame").mousePressed(() => {
    // Manually trigger Plausible event
    if (window.plausible) {
      window.plausible("start-game");
    }
    changeScene(scenes.instructions);
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

  const today = new Date();
  const options = { month: "long", day: "numeric", year: "numeric" };
  const dateString = today.toLocaleDateString("en-US", options);
  select(".date").html(dateString);

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
