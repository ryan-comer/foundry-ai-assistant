import { OpenAITextGenerator } from './textGenerator.js';
import { StableDiffusionImageGenerator } from './imageGenerator.js';
/*
Class for generating content for a Foundry VTT world
*/
export class Generator {

    constructor() {
        // Load the OpenAI GPT-3.5 API key from the Foundry VTT settings
        this.apiKey = game.settings.get("foundry-ai-assistant", "openaiApiKey");
        if(!this.apiKey) {
            console.error("OpenAI API key not found. Please enter your API key in the Foundry VTT settings.");
            return;
        }

        this.textGenerator = new OpenAITextGenerator(this.apiKey);
        this.stableDiffusionImageGenerator = new StableDiffusionImageGenerator();
    }

    // Generate a new NPC
    async generateNPC(userPrompt, challengeRating) {
        const systemPrompt = `
        You will be generating an NPC for a fantasy world based on a prompt from the user. You will be creating the character sheet for the NPC.

        Give your response in the following JSON format:
        {
            "name": "CHARACTER_NAME",   // String
            "appearance": "APPEARANCE_OF_CHARACTER",  // String
            "imageGenerationPrompt": "IMAGE_GENERATION _PROMPT",  // String (e.g. a troll that is gigantic and covered in thick, scaly hide, with glowing red eyes that pierce the darkness)
            "alignment": "ALIGNMENT_OF_CHARACTER",    // e.g. "Lawful Good", "Chaotic Evil", "Neutral", etc.
            "race": "RACE_OF_CHARACTER",    // e.g. "Human", "Elf", "Dwarf", "Orc", etc.
            "background": "BACKGROUND_OF_CHARACTER",    // e.g. "Entertainer", "Sailor", "Soldier", "Urchin", etc.
            "biography": "BIOGRAPHY_OF_CHARACTER",  // String
            "personalityTraits": "PERSONALITY_TRAITS_OF_CHARACTER",  // String
            "ideals": "IDEALS_OF_CHARACTER",    // String
            "bonds": "BONDS_OF_CHARACTER",  // String
            "flaws": "FLAWS_OF_CHARACTER",  // String
            "challengeRating": "CHALLENGE_RATING",  // Integer
            "size": "SIZE_OF_CHARACTER",    // ["tiny", "sm", "med", "lg", "huge", "grg"]
            "attributes": {
                "strength": "STRENGTH_VALUE",   // Integer
                "dexterity": "DEXTERITY_VALUE", // Integer
                "constitution": "CONSTITUTION_VALUE",   // Integer
                "intelligence": "INTELLIGENCE_VALUE",   // Integer
                "wisdom": "WISDOM_VALUE",   // Integer
                "charisma": "CHARISMA_VALUE"    // Integer
            },
            "armorClass": "ARMOR_CLASS",   // Integer
            "hitPoints": "HIT_POINTS",  // Integer
            "speed": "SPEED",  // Integer
            // Don't forget to include basic equipment, weapons, and abilities that can be used every round, as well as any special abilities that can be used once per day or once per encounter.
            // Make sure to specify when the abilities can be used and what they do.
            // Make the NPC's abilities and equipment match the challenge rating and the theme of the character
            // You must include at least one weapon, the NPC needs to have a set of basic attacks it can do every round
            "weapons": [
                {
                    "name": "WEAPON_NAME",   // String
                    "description": "WEAPON_DESCRIPTION"    // String
                    "effect": "WEAPON_EFFECT"    // String, description of what the item can do, include damage (e.g. 1d10), range, duration, etc.
                }
            ],
            "equipment": [
                {
                    "name": "ITEM_NAME",   // String
                    "description": "ITEM_DESCRIPTION",    // String
                    "effect": "ITEM_EFFECT"    // String, description of what the item does.
                }
            ],
            "abilities": [
                {
                    "name": "ABILITY_NAME",   // String
                    "description": "ABILITY_DESCRIPTION"    // String
                    "effect": "DESCRIPTION_OF_EFFECT"    // String, description of what the ability does, include duration, range, damage (e.g. 2d6 fire), etc.
                }
            ]
        }

        The challenge rating of the NPC should be based on the Dungeons & Dragons 5th Edition rules. The challenge rating determines the difficulty of the NPC in combat. 
        For example, a challenge rating of 1 is suitable for a party of four 1st-level characters, while a challenge rating of 5 is suitable for a party of four 5th-level characters.
        Do everything you can to make the challenge rating accurate
        If the challenge rating is high, then the NPC should be very hard to defeat in combat. If the challenge rating is low, then the NPC should be easy to defeat in combat.
        This should take precedence over what you think this type of character would normally be like.
        Do everything you can to make the challenge rating accurate.

        ${challengeRating ? `The challenge rating for this NPC should be ${challengeRating}.` : ''}

        Only respond with the JSON format, don't include any other text.

        If the user does not provide a prompt, create a completely random NPC.
        `;

        const response = await this.textGenerator.generateText(systemPrompt, userPrompt);
        return response

        /*
        return {
            name: "John Doe",
            appearance: "A random NPC in a fantasy world",
            imageGenerationPrompt: "Generate an image of a random NPC in a fantasy world",
            biography: "John Doe was born in a small village in the middle of nowhere. He has always been a simple man.",
            background: "Commoner",
            personalityTraits: "Kind, humble, and hardworking",
            ideals: "To help others in need",
            bonds: "His family",
            flaws: "He is too trusting of others",
            challengeRating: "2",
            alignment: "Lawful Good",
            race: "Human",
            attributes: {
                strength: 12,
                dexterity: 12,
                constitution: 12,
                intelligence: 12,
                wisdom: 12,
                charisma: 12
            },
            armorClass: 12,
            hitPoints: 20,
            speed: 35
        }
        */
    }

    generateItem() {

    }

    generateLocation() {

    }

    generateQuest() {

    }

    generateDungeon() {

    }

    generateEncounter() {

    }

    generateTrap() {

    }

    generatePuzzle() {

    }

    generateSprite() {

    }

    async generateImage(prompt) {
        const result = await this.stableDiffusionImageGenerator.generateImage(prompt);
        return result
    }

    // Helper function to remove the white background from an image
    async removeWhiteBackground(base64Image) {
        var image = new Image();
        image.src = 'data:image/png;base64,' + base64Image;

        await new Promise((resolve) => {
            image.onload = resolve;
        })

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0)

        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = imgData.data;

        var transparentColor = {r: 255, g: 255, b: 255, a: 0};

        // Iterate through pixels and modify white ones
        const whiteThreshold = 220;
        for(var i = 0; i < pixels.length; i += 4) {
            if(pixels[i] > whiteThreshold && pixels[i + 1] > whiteThreshold && pixels[i + 2] > whiteThreshold) {
                pixels[i] = transparentColor.r;
                pixels[i + 1] = transparentColor.g;
                pixels[i + 2] = transparentColor.b;
                pixels[i + 3] = transparentColor.a;
            }
        }

        // Return the modified image as a base64 string
        ctx.putImageData(imgData, 0, 0);
        let resultBase64 = canvas.toDataURL();

        // Remove the prefix from the base64 string
        const prefix = "data:image/png;base64,";
        resultBase64 = resultBase64.substring(prefix.length);

        // Remove the canvas from the DOM
        canvas.remove();

        return resultBase64;
    }

}