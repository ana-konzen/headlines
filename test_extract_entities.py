#!/usr/bin/env python3
import json
import subprocess
import pprint

# Test headlines
test_headlines = [
    {
        "title": "Before Ascending to Top Tier of F.B.I., Bongino Fueled Right-Wing Disbelief",
        "section": "us"
    },
    {
        "title": "Roberta Flack's 11 Essential Songs",
        "section": "arts"
    },
    {
        "title": "Hamas Official Expresses Reservations About Oct. 7 Attack on Israel",
        "section": "world"
    },
    {
        "title": "What Germany's Election Result Means for Its Economy",
        "section": "business"
    },
    {
        "title": "Clint Hill, Who Sprang to Kennedys' Side as Shots Were Fired, Dies at 93",
        "section": "us"
    }
]

def main():
    print("Testing extract_entities.py with sample headlines...")
    
    # Run the Python script with the test headlines
    process = subprocess.Popen(
        ["python3", "extract_entities.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Send the test headlines to the script
    stdout, stderr = process.communicate(input=json.dumps(test_headlines))
    
    # Check if there were any errors
    if process.returncode != 0:
        print(f"Error: {stderr}")
        return
    
    # Parse the results
    try:
        results = json.loads(stdout)
        
        # Print the results in a readable format
        print("\nResults:")
        print("========\n")
        
        for i, result in enumerate(results):
            print(f"Headline {i+1}: {result['og_article']}")
            print(f"Section: {result['section']}")
            
            # Print named entities
            print("\nNamed Entities:")
            for entity_type, entities in result['spacy_analysis']['entities']['named_entities'].items():
                print(f"  {entity_type} ({result['spacy_analysis']['entity_types'].get(entity_type, 'Unknown')}):")
                for entity in entities:
                    print(f"    - {entity['text']} (position: {entity['start']}-{entity['end']})")
            
            # Print nouns
            print("\nNouns:")
            for noun in result['spacy_analysis']['entities']['nouns']:
                noun_type = "Proper Noun" if noun['is_proper'] else "Common Noun"
                print(f"  - {noun['text']} ({noun_type}, position: {noun['start']}-{noun['end']})")
            
            # Print verbs
            if result['spacy_analysis']['entities']['verbs']:
                print("\nVerbs:")
                for verb in result['spacy_analysis']['entities']['verbs']:
                    print(f"  - {verb['text']} (position: {verb['start']}-{verb['end']})")
            
            # Print adjectives
            if result['spacy_analysis']['entities']['adjectives']:
                print("\nAdjectives:")
                for adj in result['spacy_analysis']['entities']['adjectives']:
                    print(f"  - {adj['text']} (position: {adj['start']}-{adj['end']})")
            
            print("\n" + "-" * 80 + "\n")
        
        # Save the results to a test file
        with open("test_spacy_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        print("Test completed successfully!")
        print(f"Results saved to test_spacy_results.json")
        
    except json.JSONDecodeError:
        print(f"Error parsing JSON output: {stdout}")

if __name__ == "__main__":
    main() 