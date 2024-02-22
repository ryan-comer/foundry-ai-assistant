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
        If the challenge rating is specified, make sure to create an NPC that matches that challenge rating.

        ${challengeRating ? `The challenge rating for this NPC should be ${challengeRating}.` : ''}

        Remember, your top priority is to make the challenge rating accurate. If the challenge rating is specified, make sure to create an NPC that matches that challenge rating.

        Only respond with the JSON format, don't include any other text.

        If the user does not provide a prompt, create a completely random NPC.

        If the user specifies the name of the NPC, use that name in the response.
        This might even be a generic name like "Bandit Archer" or "Orc Warrior".

        Here is the prompt:
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

    // Generate a new Encounter
    async generateEncounter(userPrompt, challengeRating) {
        const systemPrompt =`
        You will be generating an Encounter for a fantasy world based on a prompt from the user.
        You will be creating a list of NPCs and monsters for the encounter.

        Give your response in the following JSON format:
        {
            "name": "ENCOUNTER_NAME",   // String
            "description": "ENCOUNTER_DESCRIPTION",    // String, A detailed description of the encounter
            "objective": "ENCOUNTER_OBJECTIVE",    // String, The objective of the encounter, this can be as simple as "defeat all the enemies" or have a complex set of objective""
            "challengeRating": "CHALLENGE_RATING",  // Integer, the challenge rating of the encounter
            // List of NPCs and monsters
            "npcs": [
                {
                    "name": "CREATURE_NAME",   // String
                    "description": "CREATURE_DESCRIPTION",    // String, A detailed description of the NPC, do NOT include the name of the NPC in the description
                    "challengeRating": "CHALLENGE_RATING",  // Integer, the challenge rating of the NPC in the encounter
                    "count": "COUNT_OF_CREATURE"  // Integer, the number of this creature in the encounter
                }
            ]
        }

        The challenge rating of the encounter should be based on the Dungeons & Dragons 5th Edition rules. The challenge rating determines the difficulty of the NPCs in combat. 
        For example, a challenge rating of 1 is suitable for a party of four 1st-level characters, while a challenge rating of 5 is suitable for a party of four 5th-level characters.
        Do everything you can to make the challenge rating accurate
        If the challenge rating is high, then the NPCs should be very hard to defeat in combat. If the challenge rating is low, then the NPC should be easy to defeat in combat.
        This should take precedence over what you think these type of characters would normally be like.
        Do everything you can to make the challenge rating accurate.

        The encounter challenge rating and the challenge rating of the NPCs are different
        The encounter challenge rating of the encounter is the how difficult the entire encounter is for the party
        The npc challenge rating is how difficult the individual NPCs are for the party
        If you take all the npc challenge ratings into account, the encounter challenge rating should be accurate

        ${challengeRating ? `The challenge rating for this encounter should be ${challengeRating}.` : ''}

        Only respond with the JSON format, don't include any other text.

        If the user does not provide a prompt, create a completely random encounter.

        Here is the prompt:
        `;

        const response = await this.textGenerator.generateText(systemPrompt, userPrompt);
        return response
    }

    // Generate a new quest
    async generateQuest(userPrompt) {
        const systemPrompt =`
        You will be generating an Quest for a fantasy world based on a prompt from the user.

        Give your response in the following JSON format:
        {
            "name": "QUEST_NAME",   // String
            // A detailed description of the quest
            // Be very detailed, make sure to include all of the characters, locations, and events that the party will encounter
            // Use HTML to format the text
            "description": "QUEST_DESCRIPTION",    // HTML string, A detailed description of the encounter, Use HTML to format the text
            // A description of the image that will be generated for the quest
            // This will be used in an image generator to create an image for the quest
            // Example: "A group of adventurers standing in front of a large, ancient tree in a dark forest"
            // Make the image description match the theme of the quest
            "questImageDescription": "QUEST_IMAGE_DESCRIPTION",
            "objectives": [
                // Strings
                // List of objectives, high level goals that the party needs to accomplish
                // These will be used to create a bullet point list in the journal entry
                // Make these objectives interesting and varied, and make sure they match the theme of the quest
                // These objectives can also point to side quests or other content in the world that the party must complete to finish the quest
            ],
            "rewards": [
                // Strings
                // List of rewards, items, gold, experience, etc. that the party will receive for completing the quest
                // These will be used to create a bullet point list in the journal entry
                // Make sure the rewards are tangible items that the players can use in the game
                // Make sure the rewards make sense for what the quest is
                // Make sure the rewards are balanced for the difficulty of the quest
            ],
        }

        Only respond with the JSON format, don't include any other text.

        If the user does not provide a prompt, create a completely random quest.

        Here is the prompt:
        `;

        const response = await this.textGenerator.generateText(systemPrompt, userPrompt);
        return response
    }

    // Background
    async generateBackgroundPrompt(userPrompt) {
        const systemPrompt = `
        You will be generating a prompt for an image generator to create a background for a fantasy world based on a prompt from the user.
        This will be used as a background for a Foundry VTT world.
        Make sure to include the fack that this is a background for a fantasy world in the prompt.

        Here are some examples of prompts:
        A battle map for a forest clearing, with a small stream running through the middle, and a large, ancient tree in the center, top down, 2D
        A battle map for a dark, underground cavern, with glowing mushrooms and a large, underground lake, top down, 2D
        A battle map for a large, open field, with a small village in the distance, top down, 2D

        These are just examples so don't copy them directly, make sure to create your own prompt
        You should however include the 'battle map' and 'top down, 2D' in the prompt

        Give your response in the following JSON format:
        {
            "name": "BACKGROUND_NAME",   // String, A name for the background
            "prompt": "IMAGE_GENERATION_PROMPT"   // String, A description of the background that you want to generate
        }

        Only respond with the JSON format, don't include any other text.

        If the user does not provide a prompt, create a completely random background.
        Here is the prompt:
        `

        const response = await this.textGenerator.generateText(systemPrompt, userPrompt);
        return response
    }

    async generateItem(userPrompt) {
        const systemPrompt = `
        You will be generating an item for a fantasy world based on a prompt from the user.

        Give your response in the following JSON format:
        {
            "name": "ITEM_NAME",   // String
            // A detailed description of the item
            // Be very detailed in the description, make it interesting and unique
            "description": "ITEM_DESCRIPTION",
            // The effect of the item
            // This will tell the user what the item actually does
            // For exampe, a basic sword might have the effect of: "Deals 1d8 slashing damage"
            // A healing potion might have the effect of: "Heals 2d4+2 hit points"
            // A ring of invisibility might have the effect of: "Grants the wearer invisibility for 1 hour"
            // If the item is armor, make sure to include the armor class and the armor type (e.g. light, medium, heavy)
            // It's okay if there is no effect for the item, only add one if it makes sense
            "effect": "ITEM_EFFECT",
            // String, A description of the image that will be generated for the item
            // This will be used in an image generator to create an image for the item
            // Example: "A glowing sword with a blue gem in the hilt"
            "imageGenerationPrompt": "IMAGE_GENERATION_PROMPT"
            "type": "ITEM_TYPE",    // ["weapon", "equipment", "consumable", "tool", "loot"] you must use one of these types
        }

        Only respond with the JSON format, don't include any other text.

        If the user does not provide a prompt, create a completely random item.
        Here is the prompt:
        `

        const response = await this.textGenerator.generateText(systemPrompt, userPrompt);
        return response
    }

    // Generate a puzzle
    async generatePuzzle(userPrompt) {
        const systemPrompt = `
        You will be generating a puzzle for a fantasy world based on a prompt from the user.

        Give your response in the following JSON format:
        {
            "name": "PUZZLE_NAME",   // String
            // A detailed description of the puzzle
            // Be very detailed in the description, make it interesting and unique
            "description": "PUZZLE_DESCRIPTION",
            // The solution to the puzzle
            // This will tell the user how to solve the puzzle
            // For example, a riddle might have the solution of: "A shadow"
            "solution": "PUZZLE_SOLUTION",
            // String, A description of the image that will be generated for the puzzle
            // This will be used in an image generator to create an image for the puzzle
            // Example: "A riddle written on a stone tablet"
            "imageGenerationPrompt": "IMAGE_GENERATION_PROMPT"
        }

        Only respond with the JSON format, don't include any other text.

        If the user does not provide a prompt, create a completely random puzzle.
        Here is the prompt:
        `

        const response = await this.textGenerator.generateText(systemPrompt, userPrompt);
        return response
    }

    generateLocation() {

    }

    generateDungeon() {

    }

    generateTrap() {

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