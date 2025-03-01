// deno-lint-ignore-file

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

import { createExitSignal, staticServer } from "./shared/server.ts";

import { getEnvVariable } from "./shared/util.ts";

import { promptGPT } from "./shared/openai.ts";

const app = new Application();
const router = new Router();

router.get("/api/headline", async (ctx) => {
  console.log("ctx.request.url.pathname:", ctx.request.url.pathname);
  console.log("ctx.request.method:", ctx.request.method);

  // Try to read the spaCy analysis first
  try {
    const articles = await Deno.readTextFile("articles_spacy.json");
    const parsedArticles = JSON.parse(articles);
    ctx.response.body = parsedArticles;
  } catch (error) {
    // If spaCy analysis doesn't exist, fall back to the original articles.json
    try {
      const articles = await Deno.readTextFile("articles.json");
      const parsedArticles = JSON.parse(articles);
      ctx.response.body = parsedArticles;
    } catch (fallbackError) {
      // If neither file exists, return an empty array
      ctx.response.body = [];
    }
  }
});

// Add a new endpoint to get the full spaCy analysis
router.get("/api/spacy-analysis", async (ctx) => {
  try {
    const articles = await Deno.readTextFile("articles_spacy.json");
    const parsedArticles = JSON.parse(articles);
    ctx.response.body = parsedArticles;
  } catch (error) {
    ctx.response.body = { error: "No spaCy analysis available" };
  }
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
  const numArticles = 5;

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

  // Create an array of random articles to process
  const articlesToProcess = [];
  for (let i = 0; i < numArticles; i++) {
    const randomArticle = sampleArray(articles.results);
    articlesToProcess.push({
      title: randomArticle.title,
      section: randomArticle.section,
      // Include additional metadata from the NYT API
      url: randomArticle.url,
      byline: randomArticle.byline,
      published_date: randomArticle.published_date,
      abstract: randomArticle.abstract,
      multimedia: randomArticle.multimedia,
    });
  }

  // NEW CODE: Use Python script with spaCy to extract all entities
  try {
    // Create a process to run the Python script
    const pythonProcess = Deno.run({
      cmd: ["python3", "extract_entities.py"],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });

    // Send the articles to the Python script
    const encoder = new TextEncoder();
    await pythonProcess.stdin.write(
      encoder.encode(JSON.stringify(articlesToProcess))
    );
    pythonProcess.stdin.close();

    // Get the results from the Python script
    const outputBytes = await pythonProcess.output();
    const errorBytes = await pythonProcess.stderrOutput();
    const status = await pythonProcess.status();

    // Check if the Python script ran successfully
    if (!status.success) {
      const errorString = new TextDecoder().decode(errorBytes);
      console.error("Python script error:", errorString);
      throw new Error("Failed to process articles with Python script");
    }

    // Parse the results
    const outputString = new TextDecoder().decode(outputBytes);
    const spacyResults = JSON.parse(outputString);

    // Write the full spaCy analysis to articles_spacy.json
    await Deno.writeTextFile(
      "articles_spacy.json",
      JSON.stringify(spacyResults, null, 2)
    );

    // Also create a simplified version for the original format
    const simplifiedResults = spacyResults.map((article) => {
      // Try to find a suitable entity to blank out (prioritize PERSON, ORG, GPE)
      let wordToBlank = "";
      let entityTypes = ["PERSON", "ORG", "GPE"];

      // Look through named entities for priority types
      for (const type of entityTypes) {
        if (
          article.spacy_analysis.entities.named_entities[type] &&
          article.spacy_analysis.entities.named_entities[type].length > 0
        ) {
          wordToBlank =
            article.spacy_analysis.entities.named_entities[type][0].text;
          break;
        }
      }

      // If no priority named entities found, try any named entity
      if (!wordToBlank) {
        for (const type in article.spacy_analysis.entities.named_entities) {
          if (article.spacy_analysis.entities.named_entities[type].length > 0) {
            wordToBlank =
              article.spacy_analysis.entities.named_entities[type][0].text;
            break;
          }
        }
      }

      // If still no entity found, try a proper noun
      if (!wordToBlank && article.spacy_analysis.entities.nouns.length > 0) {
        const properNouns = article.spacy_analysis.entities.nouns.filter(
          (n) => n.is_proper
        );
        if (properNouns.length > 0) {
          wordToBlank = properNouns[0].text;
        } else {
          // Otherwise use any noun
          wordToBlank = article.spacy_analysis.entities.nouns[0].text;
        }
      }

      return {
        og_article: article.og_article,
        section: article.section,
        article: wordToBlank
          ? article.og_article.replace(wordToBlank, "____")
          : article.og_article,
        word: wordToBlank,
      };
    });

    // Write the simplified results to articles.json for backward compatibility
    await Deno.writeTextFile(
      "articles.json",
      JSON.stringify(simplifiedResults, null, 2)
    );

    return spacyResults;
  } catch (error) {
    console.error("Error using Python script:", error);

    // ORIGINAL CODE: Fallback to OpenAI if Python script fails
    console.log("Falling back to OpenAI for entity extraction");
    const randomArticles = [];

    for (let i = 0; i < articlesToProcess.length; i++) {
      const randomArticle = articlesToProcess[i];

      // Original OpenAI implementation
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

    await Deno.writeTextFile(
      "articles.json",
      JSON.stringify(randomArticles, null, 2)
    );
    return randomArticles;
  }

  // COMMENTED OUT ORIGINAL CODE:
  /*
  const randomArticles = [];

  for (let i = 0; i < numArticles; i++) {
    const randomArticle = sampleArray(articles.results);

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
  */
}
