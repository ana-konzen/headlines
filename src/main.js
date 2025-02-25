// HIIII!

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

import { createExitSignal, staticServer } from "./shared/server.ts";

import { getEnvVariable } from "./shared/util.ts";

const app = new Application();
const router = new Router();

router.get("/api/headline", async (ctx) => {
  console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
  console.log("ctx.request.method:", ctx.request.method);

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
  const randomArticle = sampleArray(articles.results);
  console.log(randomArticle);
  ctx.response.body = {
    title: randomArticle.title,
    topic: randomArticle.section,
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(staticServer);

console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });

function sampleArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
