// deno-lint-ignore-file

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

import { createExitSignal, staticServer } from "./shared/server.ts";

import { getEnvVariable } from "./shared/util.ts";

import { promptGPT } from "./shared/openai.ts";

const app = new Application();
const router = new Router();

Deno.cron("Run every day at 1am", "7 17 * * *", () => {
  console.log("Getting new articles...");
  getArticles();
});

router.get("/api/headline", async (ctx) => {
  console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
  console.log("ctx.request.method:", ctx.request.method);

  const articles = await Deno.readTextFile("articles.json");
  const parsedArticles = JSON.parse(articles);
  ctx.response.body = parsedArticles;
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
  const numArticles = 10;

  const nytKey = getEnvVariable("NYT_KEY");
  console.log("nytKey:", nytKey);

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
  await Deno.writeTextFile("articles.json", JSON.stringify(randomArticles, null, 2));

  return randomArticles;
}
