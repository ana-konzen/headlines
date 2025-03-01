#!/usr/bin/env python3
import sys
import json
import spacy

# Load English language model
# You'll need to install spaCy and download the model with:
# pip install spacy
# python -m spacy download en_core_web_sm
nlp = spacy.load("en_core_web_sm")

def extract_all_entities(headline):
    """
    Extract all entities from a headline using spaCy.
    Returns a dictionary with different types of entities found.
    """
    doc = nlp(headline)
    
    # Extract all named entities
    named_entities = {}
    for ent in doc.ents:
        # Group entities by their type
        if ent.label_ not in named_entities:
            named_entities[ent.label_] = []
        
        # Add entity text and its character span
        named_entities[ent.label_].append({
            "text": ent.text,
            "start": ent.start_char,
            "end": ent.end_char
        })
    
    # Extract all nouns (common and proper)
    nouns = []
    for token in doc:
        if token.pos_ in ("NOUN", "PROPN"):
            nouns.append({
                "text": token.text,
                "start": token.idx,
                "end": token.idx + len(token.text),
                "is_proper": token.pos_ == "PROPN"
            })
    
    # Extract other potentially useful parts of speech
    verbs = []
    adjectives = []
    numbers = []
    
    for token in doc:
        if token.pos_ == "VERB":
            verbs.append({
                "text": token.text,
                "start": token.idx,
                "end": token.idx + len(token.text)
            })
        elif token.pos_ == "ADJ":
            adjectives.append({
                "text": token.text,
                "start": token.idx,
                "end": token.idx + len(token.text)
            })
        elif token.pos_ == "NUM":
            numbers.append({
                "text": token.text,
                "start": token.idx,
                "end": token.idx + len(token.text)
            })
    
    # Create a dictionary with all extracted information
    return {
        "named_entities": named_entities,
        "nouns": nouns,
        "verbs": verbs,
        "adjectives": adjectives,
        "numbers": numbers
    }

def process_headline(headline):
    """
    Process a headline and extract all entities.
    """
    entities = extract_all_entities(headline)
    
    # Create a dictionary explaining entity types
    entity_types = {
        "PERSON": "People, including fictional",
        "NORP": "Nationalities, religious or political groups",
        "FAC": "Buildings, airports, highways, bridges, etc.",
        "ORG": "Companies, agencies, institutions, etc.",
        "GPE": "Countries, cities, states",
        "LOC": "Non-GPE locations, mountain ranges, bodies of water",
        "PRODUCT": "Objects, vehicles, foods, etc. (not services)",
        "EVENT": "Named hurricanes, battles, wars, sports events, etc.",
        "WORK_OF_ART": "Titles of books, songs, etc.",
        "LAW": "Named documents made into laws",
        "LANGUAGE": "Any named language",
        "DATE": "Absolute or relative dates or periods",
        "TIME": "Times smaller than a day",
        "PERCENT": "Percentage, including '%'",
        "MONEY": "Monetary values, including unit",
        "QUANTITY": "Measurements, as of weight or distance",
        "ORDINAL": "First, second, etc.",
        "CARDINAL": "Numerals that do not fall under another type"
    }
    
    return {
        "entities": entities,
        "entity_types": entity_types
    }

# Main function to process input from stdin
def main():
    try:
        # Read input from stdin (expects a JSON string with headlines)
        input_data = json.loads(sys.stdin.read())
        
        results = []
        for article in input_data:
            title = article.get("title", "")
            section = article.get("section", "")
            
            processed = process_headline(title)
            
            results.append({
                "og_article": title,
                "section": section,
                "spacy_analysis": processed
            })
        
        # Output the results as JSON
        print(json.dumps(results, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 