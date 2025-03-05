// deno-lint-ignore-file

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

import { createExitSignal, staticServer } from "./shared/server.ts";

import { getEnvVariable } from "./shared/util.ts";

import { promptGPT } from "./shared/openai.ts";

const app = new Application();
const router = new Router();

const kv = await Deno.openKv();
const date = checkTime(1) ? getDate(true) : getDate();
const numArticles = 10;

Deno.cron("Get new articles", "50 0 * * *", async () => {
  console.log("Getting new articles...");
  const articles = await getArticles();
  await kv.set(["gameData", date], {
    scores: [],
    date: date,
    numPlayers: 0,
    articles: articles,
    numArticles: numArticles,
  });
});

router.get("/api/setScore", async (ctx) => {
  const playerScore = ctx.request.url.searchParams.get("score");
  const todayData = await kv.get(["gameData", date]);
  todayData.scores.push(playerScore);
  todayData.numPlayers++;
  kv.set(["gameData", date], todayData);
});

router.get("/api/headline", async (ctx) => {
  console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
  console.log("ctx.request.method:", ctx.request.method);

  const gameData = await kv.get(["gameData", date]);

  console.log(gameData);

  ctx.response.body = gameData.value.articles;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(staticServer);

console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });

function sampleArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function getArticles() {
  const nytKey = getEnvVariable("NYT_KEY");

  /* possible sections: home, arts, automobiles, books/review, 
  business, fashion, food, health, insider, magazine, movies,
   nyregion, obituaries, opinion, politics, realestate, science, sports, 
  sundayreview, technology, theater, t-magazine, travel, upshot, us, and world. */

  const section = "home";

  const nytResponse = await fetch(
    `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${nytKey}`
  );
  const articles = await nytResponse.json();

  const randomArticles = [];

  for (let i = 0; i < numArticles; i++) {
    let randomArticle = sampleArray(articles.results);

    while (randomArticles.some((article) => article.og_article === randomArticle.title)) {
      randomArticle = sampleArray(articles.results);
    }

    const word = await promptGPT(
      `This is a headline from the New York Times: ${randomArticle.title}. Identify one word that you think is the most important in this headline (must be a noun, a proper noun if it's available). Only reply with the word, don't say anything else.`
    );

    randomArticles.push({
      og_article: randomArticle.title,
      section: randomArticle.section,
      article: randomArticle.title.replace(word, "____"),
      word: word,
    });
  }

  return randomArticles;
}

function getDate(yesterday = false) {
  const today = new Date();
  if (yesterday) today.setDate(today.getDate() - 1);

  return `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(
    2,
    "0"
  )}-${today.getFullYear()}`;
}

function checkTime(time, dateToCheck = new Date()) {
  const now = new Date();

  const dateToCheckMidnight = new Date(
    dateToCheck.getFullYear(),
    dateToCheck.getMonth(),
    dateToCheck.getDate()
  );
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateToCheckMidnight < nowMidnight) {
    return true;
  }

  if (dateToCheck.getHours() < time) {
    return true;
  }

  return false;
}
