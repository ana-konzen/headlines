# Headlines Game

A web application that fetches headlines from the New York Times, extracts important entities, and creates a fill-in-the-blank game.

## Setup

### Prerequisites

1. Install [Deno](https://deno.land/#installation)
2. Install [Python 3](https://www.python.org/downloads/)
3. Install spaCy and the English language model:
   ```bash
   pip install spacy
   python -m spacy download en_core_web_sm
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NYT_KEY=your_nyt_api_key
NYT_SECRET=your_nyt_secret
```

You can get these keys by registering at the [New York Times Developer Portal](https://developer.nytimes.com/).

## Running the Application

1. Start the server:

   ```bash
   deno task start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## How It Works

1. The application fetches headlines from the New York Times API
2. It uses spaCy (a Python NLP library) to extract all entities from each headline:
   - Named entities (PERSON, ORG, GPE, DATE, etc.)
   - Nouns (both common and proper)
   - Verbs
   - Adjectives
   - Numbers
3. The full analysis is stored in `articles_spacy.json`
4. A simplified version is created in `articles.json` for backward compatibility, where one entity is selected to be replaced with blanks

## API Endpoints

- `/api/headline`: Returns the simplified version with one entity blanked out (for backward compatibility)
- `/api/spacy-analysis`: Returns the full spaCy analysis with all detected entities

## Implementation Details

- `src/main.js`: Main server code that handles API requests and serves static files
- `extract_entities.py`: Python script that uses spaCy to extract all entities from headlines
- `public/`: Contains the frontend code (HTML, CSS, JavaScript)

## Entity Types

The spaCy analysis identifies the following types of named entities:

- `PERSON`: People, including fictional characters
- `NORP`: Nationalities, religious or political groups
- `FAC`: Buildings, airports, highways, bridges, etc.
- `ORG`: Companies, agencies, institutions, etc.
- `GPE`: Countries, cities, states
- `LOC`: Non-GPE locations, mountain ranges, bodies of water
- `PRODUCT`: Objects, vehicles, foods, etc.
- `EVENT`: Named hurricanes, battles, wars, sports events, etc.
- `WORK_OF_ART`: Titles of books, songs, etc.
- `LAW`: Named documents made into laws
- `LANGUAGE`: Any named language
- `DATE`: Absolute or relative dates or periods
- `TIME`: Times smaller than a day
- `PERCENT`: Percentage, including '%'
- `MONEY`: Monetary values, including unit
- `QUANTITY`: Measurements, as of weight or distance
- `ORDINAL`: First, second, etc.
- `CARDINAL`: Numerals that do not fall under another type

## Testing

You can test the entity extraction with the included test script:

```bash
python3 test_extract_entities.py
```

This will process sample headlines and show the extracted entities, saving the results to `test_spacy_results.json`.

## Fallback Mechanism

If the Python script fails for any reason, the application will fall back to using the OpenAI API for entity extraction. This requires an OpenAI API key to be set in the environment variables:

```
OPENAI_API_KEY=your_openai_api_key
```
