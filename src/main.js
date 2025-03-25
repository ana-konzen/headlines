// Add this near the top of src/main.js after imports
console.log("Environment variables check:");
console.log("NYT_KEY:", getEnvVariable("NYT_KEY") ? "Found" : "Not found");
console.log("NYT_SECRET:", getEnvVariable("NYT_SECRET") ? "Found" : "Not found");
console.log("OPENAI_API_KEY:", getEnvVariable("OPENAI_API_KEY") ? "Found" : "Not found");

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

console.log("Current date for game data:", date);

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

// Initialize game data if it doesn't exist
async function initGameData() {
  try {
    console.log("Checking for existing game data...");
    const data = await kv.get(["gameData", date]);
    console.log("Data check result:", data?.value ? "Found" : "Not found");

    if (!data.value) {
      console.log("No game data found for today. Initializing...");
      try {
        console.log("Attempting to fetch articles...");
        const articles = await getArticles();
        console.log(`Successfully fetched ${articles.length} articles`);

        const gameData = {
          scores: [],
          date: date,
          numPlayers: 0,
          articles: articles,
          numArticles: numArticles,
        };

        console.log("Storing game data in KV database...");
        await kv.set(["gameData", date], gameData);
        console.log("Game data initialized successfully.");
      } catch (error) {
        console.error("Error fetching articles:", error);
        console.log("Creating fallback game data due to error...");
        const fallbackArticles = [];
        for (let i = 0; i < numArticles; i++) {
          fallbackArticles.push({
            og_article: `Fallback Headline ${i + 1}`,
            section: "fallback",
            article: `Fallback Headline ${i + 1} with ____ word`,
            word: "test",
          });
        }

        const fallbackData = {
          scores: [],
          date: date,
          numPlayers: 0,
          articles: fallbackArticles,
          numArticles: numArticles,
        };

        console.log("Storing fallback game data in KV database...");
        await kv.set(["gameData", date], fallbackData);
        console.log("Fallback game data created and stored.");
      }
    } else {
      console.log("Game data already exists for today.");
      console.log(`Found ${data.value.articles?.length || 0} articles in existing data.`);
      // Check if we have test data and real data is now available
      if (data.value.articles && data.value.articles[0]?.section === "fallback") {
        console.log("Existing data contains fallback articles. Attempting to fetch real articles...");
        try {
          const articles = await getArticles();
          console.log(`Successfully fetched ${articles.length} real articles to replace fallback data`);

          data.value.articles = articles;
          await kv.set(["gameData", date], data.value);
          console.log("Updated game data with real articles.");
        } catch (error) {
          console.error("Failed to replace fallback data with real articles:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error during game data initialization:", error);
  }
}

// Call the initialization function
await initGameData();

router.get("/api/numPlayers", async (ctx) => {
  try {
    const gameData = await getGameData();
    if (!gameData) {
      ctx.response.status = 500;
      ctx.response.body = { error: "No game data found" };
      return;
    }
    ctx.response.body = gameData.numPlayers;
  } catch (error) {
    console.error("Error in /api/numPlayers endpoint:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

router.get("/api/scores", async (ctx) => {
  try {
    const gameData = await getGameData();
    if (!gameData) {
      ctx.response.status = 500;
      ctx.response.body = { error: "No game data found" };
      return;
    }
    ctx.response.body = gameData.scores;
  } catch (error) {
    console.error("Error in /api/scores endpoint:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

router.get("/api/headline", async (ctx) => {
  try {
    const gameData = await getGameData();
    if (!gameData || !gameData.articles) {
      ctx.response.status = 500;
      ctx.response.body = { error: "No game data or articles found" };
      return;
    }
    ctx.response.body = gameData.articles;
  } catch (error) {
    console.error("Error in /api/headline endpoint:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

router.get("/api/setScore", async (ctx) => {
  try {
    const playerScore = ctx.request.url.searchParams.get("score");
    const gameData = await getGameData();
    if (!gameData) {
      ctx.response.status = 500;
      ctx.response.body = { error: "No game data found" };
      return;
    }
    gameData.scores.push(playerScore);
    gameData.numPlayers++;
    await kv.set(["gameData", date], gameData);
    ctx.response.body = { success: true };
  } catch (error) {
    console.error("Error in /api/setScore endpoint:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error.message };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.use(staticServer);

console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });

async function getGameData() {
  try {
    const data = await kv.get(["gameData", date]);
    if (!data.value) {
      return null;
    }
    return data.value;
  } catch (error) {
    console.error("Error retrieving game data:", error);
    return null;
  }
}

function sampleArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function getArticles() {
  try {
    console.log("Starting to fetch articles from NYT API...");
    const nytKey = getEnvVariable("NYT_KEY");
    console.log("NYT API Key:", nytKey ? "Found (length: " + nytKey.length + ")" : "Not found");

    /* possible sections: home, arts, automobiles, books/review, 
    business, fashion, food, health, insider, magazine, movies,
     nyregion, obituaries, opinion, politics, realestate, science, sports, 
    sundayreview, technology, theater, t-magazine, travel, upshot, us, and world. */

    const section = "home";
    console.log("Fetching from NYT section:", section);

    const nytResponse = await fetch(
      `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${nytKey}`
    );

    if (!nytResponse.ok) {
      console.error(`NYT API error: ${nytResponse.status} ${nytResponse.statusText}`);
      const errorText = await nytResponse.text();
      console.error("NYT API error details:", errorText);
      throw new Error(`NYT API returned status ${nytResponse.status}`);
    }

    const articles = await nytResponse.json();
    console.log(`Successfully fetched ${articles.results?.length || 0} articles from NYT API`);

    if (!articles.results || articles.results.length === 0) {
      console.error("No articles found in NYT API response");
      throw new Error("No articles found in NYT API response");
    }

    const randomArticles = [];

    console.log("Starting to process articles with OpenAI...");
    for (let i = 0; i < numArticles; i++) {
      console.log(`Processing article ${i + 1}/${numArticles}...`);
      let randomArticle = sampleArray(articles.results);

      while (randomArticles.some((article) => article.og_article === randomArticle.title)) {
        randomArticle = sampleArray(articles.results);
      }

      console.log(`Selected headline: "${randomArticle.title}"`);
      try {
        console.log("Calling OpenAI to identify important word...");
        const word = await promptGPT(
          `This is a headline from the New York Times: ${randomArticle.title}. Identify one word that you think is the most important in this headline (must be a noun, a proper noun if it's available). Only reply with the word, don't say anything else.`
        );
        console.log(`OpenAI identified word: "${word}"`);

        randomArticles.push({
          og_article: randomArticle.title,
          section: randomArticle.section,
          article: randomArticle.title.replace(word, "____"),
          word: word,
        });
      } catch (error) {
        console.error("Error with OpenAI API:", error);
        throw error;
      }
    }

    console.log(`Successfully processed ${randomArticles.length} articles`);
    return randomArticles;
  } catch (error) {
    console.error("Error in getArticles function:", error);
    throw error; // Re-throw to be handled by the caller
  }
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
