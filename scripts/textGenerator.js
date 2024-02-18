// Base class for text generation
class TextGenerator {

}

// Client for the OpenAI GPT-3.5 API
export class OpenAITextGenerator extends TextGenerator {

    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.endpointUrl = 'https://api.openai.com/v1/chat/completions';
    }

    // Generate text using the OpenAI GPT-3.5 API
    async generateText(systemPrompt, userPrompt) {

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        }

        const data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": systemPrompt
                },
                {
                    "role": "user",
                    "content": userPrompt
                }
            ]
        }

        const response = await fetch(this.endpointUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        })

        if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const content = json.choices[0].message.content;
        return JSON.parse(content);

        /*
        return {
            "name": "Thaldrin Fireheart",
            "appearance": "Thaldrin is a tall and imposing figure with fiery red hair and bright golden eyes that seem to flicker like flames. He wears ornate armor adorned with intricate designs of dragons and carries a blade that glows with inner heat.",
            "imageGenerationPrompt": "A warrior with fire-related elements in appearance, wielding a weapon that emits light and heat",
            "alignment": "Chaotic Good",
            "race": "Half-Elf",
            "background": "Knight",
            "biography": "Thaldrin Fireheart is a seasoned knight who hails from a noble elven family. He earned his title through acts of heroism and valor on the battlefield. Thaldrin is known for his fiery passion for justice and his unwavering dedication to protecting the innocent.",
            "personalityTraits": "Passionate, courageous, loyal",
            "ideals": "Justice and protecting the weak",
            "bonds": "His ancestral sword, the honor of his family",
            "flaws": "Quick to anger when faced with injustice, reckless in battle",
            "challengeRating": 5,
            "attributes": {
                "strength": 16,
                "dexterity": 14,
                "constitution": 15,
                "intelligence": 12,
                "wisdom": 10,
                "charisma": 14
            },
            "armorClass": 18,
            "hitPoints": 65,
            "speed": 30
        }
        */
    }

}