import { Generator } from "./generator.js"

Hooks.on('ready', function() {
  // Set a setting for the API key
  game.settings.register("foundry-ai-assistant", "openaiApiKey", {
      name: "OpenAI API Key",
      hint: "The API key for the OpenAI GPT-3.5 API",
      scope: "world",
      config: true,
      type: String,
      default: ""
  });

  // Set a setting for the Stable Diffusion endpoint
  game.settings.register("foundry-ai-assistant", "stableDiffusionEndpoint", {
    name: "Stable Diffusion Endpoint",
    hint: "The endpoint for the Stable Diffusion API (IP:PORT)",
    scope: "world",
    config: true,
    type: String,
    default: "localhost:7860"
  })
})

// Load the Sidebar UI
Hooks.on('changeSidebarTab', (app, tab) => {
  if (app.options.id === 'settings') {
    console.log("SETTINGS")

    // Check if the AI Assistant button already exists
    if (app._element.find(`#aiAssistant`).length > 0) {
      return
    }

    let button = document.createElement('button');
    button.id = 'aiAssistant';
    button.classList.add('aiAssistant');
    button.innerHTML = `<i class="fas fa-robot"></i>AI Assistant`;
    button.addEventListener('click', openAIAssistant);

    //let aiAssistant = $(`<button onClick="openAIAssistant()" class="aiAssistant"><i class="fas fa-robot"></i>AI Assistant</button>`);
    app._element.find(`#settings-game`).append(button);
  }
})

export async function openAIAssistant() {
  console.log("Opening AI Assistant")
  await loadTemplates(["modules/foundry-ai-assistant/assistant_templates/assistant_menu.html"])

  // Open the AI Assistant
  const menuContent = await renderTemplate("modules/foundry-ai-assistant/assistant_templates/assistant_menu.html")
  let dialog = new Dialog({
    title: "AI Assistant",
    content: menuContent,
    buttons: {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: "Close",
        callback: () => console.log("Closing AI Assistant")
      }
    }
  })

  dialog.render(true)
}

// Open one of the assistant menus
export async function openAssistantMenu(title, templatePath) {
  await loadTemplates([templatePath])

  const menuContent = await renderTemplate(templatePath)
  let dialog = new Dialog({
    title,
    content: menuContent,
    buttons: {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: "Close",
        callback: () => console.log(`Closing ${title}`)
      }
    }
  })

  dialog.render(true)
}

// Generate a new NPC
export async function generateNPC(npcPrompt, challengeRating, includeImage=false, imagePrompt='') {
  const generator = new Generator()

  // Generate the NPC
  const npc = await generator.generateNPC(npcPrompt, challengeRating)

  // Check if the user has an Actors folder called 'AI Generated NPCs'
  let folder = game.folders.getName('AI Generated NPCs')
  if (!folder) {
    folder = await Folder.create({name: 'AI Generated NPCs', type: 'Actor'})
  }

  // Create the Actor
  const actor = await Actor.create({
    name: npc.name,
    type: 'npc',
    folder: folder.id,
    data: {
      attributes: {
        hp: {
          value: npc.hitPoints,
          max: npc.hitPoints
        },
        ac: {
          value: npc.armorClass
        },
        movement: {
          walk: npc.speed
        }
      },
      abilities: {
        str: {
          value: npc.attributes.strength
        },
        dex: {
          value: npc.attributes.dexterity
        },
        con: {
          value: npc.attributes.constitution
        },
        int: {
          value: npc.attributes.intelligence
        },
        wis: {
          value: npc.attributes.wisdom
        },
        cha: {
          value: npc.attributes.charisma
        }
      },
      details: {
        appearance: npc.appearance,
        background: npc.background,
        biography: {
          value: `
          <h2>Biography</h2>
          ${npc.biography}
          <h2>Appearance</h2>
          ${npc.appearance}
          <h2>Personality Traits</h2>
          ${npc.personalityTraits}
          <h2>Bonds</h2>
          ${npc.bonds}
          <h2>Ideals</h2>
          ${npc.ideals}
          <h2>Flaws</h2>
          ${npc.flaws}
          `
        },
        cr: npc.challengeRating,
        bond: npc.bonds,
        trait: npc.personalityTraits,
        flaw: npc.flaws,
        ideal: npc.ideals,
        alignment: npc.alignment,
        race: npc.race
      },
      traits: {
        size: npc.size
      }
    } 
  })

  // Generate the image
  if (includeImage) {
    const newImagePrompt = `A character sprite of ${(imagePrompt !== '') ? imagePrompt : npc.imageGenerationPrompt}, 2D, stylized, white background, clear outline`
    console.log(`Generating Image: ${newImagePrompt}`)
    const image64 = await generator.generateImage(newImagePrompt, true)

    /*
    console.log("Converting to white")
    const image64NoWhiteBackground = await generator.removeWhiteBackground(image64);
    console.log(image64NoWhiteBackground)
    */

    // Create a file from the base64 encoded image
    //const bytes = atob(image64NoWhiteBackground)
    const bytes = atob(image64)
    const buffer = new ArrayBuffer(bytes.length)
    const bufferView = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      bufferView[i] = bytes.charCodeAt(i)
    }
    const blob = new Blob([buffer], {type: 'image/png'})
    const file = new File([blob], `${actor.id}.png`, {type: 'image/png'})

    // Upload the file to the server
    FilePicker.upload('data', `modules/foundry-ai-assistant/images`, file).then((path) => {
      console.log(`Image uploaded to ${path}`)
    })

    // Update the Actor with the image
    await actor.update({
      img: `modules/foundry-ai-assistant/images/${file.name}`,
      token: {
        img: `modules/foundry-ai-assistant/images/${file.name}`
      }
    })
  }

  // Check for an Items folder for AI Generated NPCs
  let parentFolder = game.folders.getName('AI Generated NPCs Items')
  if (!parentFolder) {
    parentFolder = await Folder.create({name: 'AI Generated NPCs Items', type: 'Item'})
  }

  // Check for Items folder for that NPC inside the parent folder
  let itemFolder = game.folders.getName(`${npc.name} Items`)
  if (!itemFolder) {
    itemFolder = await Folder.create({name: `${npc.name} Items`, type: 'Item', parent: parentFolder.id})
  }

  // Create the weapons
  for (let weapon of npc.weapons) {
    const newWeapon = await Item.create({
      name: weapon.name,
      type: 'weapon',
      folder: itemFolder.id,
      data: {
        description: {
          value: `<h3>Description</h3>${weapon.description}<br><br><h3>Effect</h3>${weapon.effect}`
        }
      }
    })

    // Add the weapon to the Actor
    await actor.createEmbeddedDocuments('Item', [{
      name: weapon.name,
      type: 'weapon',
      data: {
        description: {
          value: `<h2>Description</h2>${weapon.description}<br><br><h2>Effect</h2>${weapon.effect}`
        }
      }
    }])
  }

  // Create the Equipment
  for (let equipment of npc.equipment) {
    const newEquipment = await Item.create({
      name: equipment.name,
      type: 'equipment',
      folder: itemFolder.id,
      data: {
        description: {
          value: `<h2>Description</h2>${equipment.description}<br><br><h2>Effect</h2>${equipment.effect}`
        }
      }
    })

    // Add the equipment to the Actor
    await actor.createEmbeddedDocuments('Item', [{
      name: equipment.name,
      type: 'equipment',
      data: {
        description: {
          value: `<h2>Description</h2>${equipment.description}<br><br><h2>Effect</h2>${equipment.effect}`
        }
      }
    }])
  }

  // Create the Abilities
  for (let ability of npc.abilities) {
    const newAbility = await Item.create({
      name: ability.name,
      type: 'feat',
      folder: itemFolder.id,
      data: {
        description: {
          value: `<h2>Description</h2>${ability.description}<br><br><h2>Effect</h2>${ability.effect}`
        }
      }
    })

    // Add the ability to the Actor
    await actor.createEmbeddedDocuments('Item', [{
      name: ability.name,
      type: 'feat',
      data: {
        description: {
          value: `<h2>Description</h2>${ability.description}<br><br><h2>Effect</h2>${ability.effect}`
        }
      }
    }])
  }

  return actor
}

// Generate a new Encouter
export async function generateEncounter(encounterPrompt, challengeRating, includeImage=false) {
  const generator = new Generator()

  // Generate the Encounter
  const encounter = await generator.generateEncounter(encounterPrompt, challengeRating)

  // Check if the user has an Actors folder called 'AI Generated NPCs'
  let parentFolder = game.folders.getName('AI Generated NPCs')
  if (!parentFolder) {
    parentFolder = await Folder.create({name: 'AI Generated NPCs', type: 'Actor'})
  }

  // Create the Actor folder for the encounter
  let folder = await Folder.create({name: `Encounter - ${encounter.name}`, type: 'Actor', parent: parentFolder.id})

  // Create the Actors
  for (let npc of encounter.npcs) {
    const actor = await generateNPC(`
      Name of the NPC, this should be the name of the NPC: ${npc.name}
      Description of the NPC: ${npc.description}
      `, npc.challengeRating, includeImage)
    await actor.update({folder: folder.id})
  }

  // Create the Journal Entry for the encounter
  // Check for the parent folder
  parentFolder = game.folders.getName('AI Generated Encounter Journal Entries')
  if (!parentFolder) {
    parentFolder = await Folder.create({name: 'AI Generated Encounter Journal Entries', type: 'JournalEntry'})
  }

  // Check for the Journal Entry folder for the encounter
  let journalFolder = await Folder.create({name: `Encounter - ${encounter.name}`, type: 'JournalEntry', parent: parentFolder.id})

  // Create the Journal Entry
  const journalEntry = await JournalEntry.create({
    name: encounter.name,
    folder: journalFolder.id,
    content: `
    <h2>Encounter</h2>
    <p>${encounter.description}</p>
    <p>Challenge Rating: ${encounter.challengeRating}</p>
    <h2>Objective</h2>
    <p>${encounter.objective}</p>
    <h2>Enemies</h2>
    <ul>
      ${encounter.npcs.map(npc => `<li>${npc.name} x${npc.count}</li>`).join('')}
    </ul>
    `
  })

  return folder
}

// Generate a new Quest
export async function generateQuest(questPrompt, includeImage=false, useQuestLog=false) {
  const generator = new Generator()

  // Generate the Quest
  const quest = await generator.generateQuest(questPrompt)

  // Generate the Quest image
  let imagePath = ''
  if(includeImage) {
    const newImagePrompt = quest.questImageDescription
    console.log(`Generating Image: ${newImagePrompt}`)
    const image64 = await generator.generateImage(newImagePrompt)

    // Create a file from the base64 encoded image
    const bytes = atob(image64)
    const buffer = new ArrayBuffer(bytes.length)
    const bufferView = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      bufferView[i] = bytes.charCodeAt(i)
    }
    // Generate a random file name
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const blob = new Blob([buffer], {type: 'image/png'})
    const file = new File([blob], `${randomString}.png`, {type: 'image/png'})

    // Upload the file to the server
    FilePicker.upload('data', `modules/foundry-ai-assistant/images`, file).then((path) => {
      console.log(`Image uploaded to ${path}`)
    })

    imagePath = `modules/foundry-ai-assistant/images/${file.name}`
  }

  let journalEntry = null
  if (useQuestLog) {
    const QuestDBShimModule = await import('/modules/forien-quest-log/src/control/public/QuestDBShim.js')
    const QuestDBShim = QuestDBShimModule.default

    // Create a quest for Forien's Quest Log
    let imageData = {}
    if(includeImage) {
      imageData = {
        image: imagePath,
        giver: "abstract",
        giverData: {
          hasTokenImg: false,
          img: imagePath,
          name: "Custom Source"
        }
      }
    }
    const questData = {
      ...imageData,
      name: quest.name,
      description: quest.description,
      rewards: quest.rewards.map(reward => {
        return {
          data: {
            name: reward
          },
          type: 'abstract'
        }
      }),
      tasks: quest.objectives.map(objective => {
        return {
          name: objective,
        }
      })
    }

    journalEntry = await QuestDBShim.createQuest({
      data: questData
    })
  } else {
    // Make a normal Journal entry
    // Check for the parent folder
    let parentFolder = game.folders.getName('AI Generated Quests')
    if (!parentFolder) {
      parentFolder = await Folder.create({name: 'AI Generated Quests', type: 'JournalEntry'})
    }

    // Create the Journal Entry
    journalEntry = await JournalEntry.create({
      name: quest.name,
      folder: parentFolder.id,
      img: imagePath,
      content: `
      <h2>Quest</h2>
      <p>${quest.description}</p>
      <h2>Objectives</h2>
      <ul>
        ${quest.objectives.map(objective => `<li>${objective}</li>`).join('')}
      </ul>
      <h2>Rewards</h2>
      <ul>
        ${quest.rewards.map(reward => `<li>${reward}</li>`).join('')}
      </ul>
      `
    })
  }

  return journalEntry  
}

// Generate a background
export async function generateBackground(backgroundPrompt) {
  const generator = new Generator()

  // Generate the prompt for the background
  const newBackgroundPrompt = await generator.generateBackgroundPrompt(backgroundPrompt)

  // Generate the image
  const image64 = await generator.generateImage(`A top-down 2D battlemap of ${newBackgroundPrompt.prompt}, (top-down), (2D)`)
  
  // Create a file from the base64 encoded image
  const bytes = atob(image64)
  const buffer = new ArrayBuffer(bytes.length)
  const bufferView = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i++) {
    bufferView[i] = bytes.charCodeAt(i)
  }
  const blob = new Blob([buffer], {type: 'image/png'})
  const randomNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  const file = new File([blob], `${randomNumber}.png`, {type: 'image/png'})

  // Upload the file to the server
  FilePicker.upload('data', `modules/foundry-ai-assistant/images`, file).then((path) => {
    console.log(`Image uploaded to ${path}`)
  })

  const imagePath = `modules/foundry-ai-assistant/images/${file.name}`

  // Check for the parent folder
  let parentFolder = game.folders.getName('AI Generated Backgrounds')
  if (!parentFolder) {
    parentFolder = await Folder.create({name: 'AI Generated Backgrounds', type: 'Scene'})
  }

  // Create a new scene
  const scene = await Scene.create({
    name: newBackgroundPrompt.name,
    img: imagePath,
    folder: parentFolder.id
  })

  return scene
}

// Generate an item
export async function generateItem(itemPrompt, includeImage, imagePrompt) {
  const generator = new Generator()

  // Generate the item
  const item = await generator.generateItem(itemPrompt)

  // Generate the image
  let imagePath = ''
  if (includeImage) {
    const newImagePrompt = `A 2D sprite of ${(imagePrompt !== '') ? imagePrompt : item.imageGenerationPrompt}, 2D, stylized, white background, clear outline`
    console.log(`Generating Image: ${newImagePrompt}`)
    const image64 = await generator.generateImage(newImagePrompt, true)

    /*
    console.log("Converting to white")
    const image64NoWhiteBackground = await generator.removeWhiteBackground(image64);
    console.log(image64NoWhiteBackground)
    */

    // Create a file from the base64 encoded image
    //const bytes = atob(image64NoWhiteBackground)
    const bytes = atob(image64)
    const buffer = new ArrayBuffer(bytes.length)
    const bufferView = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      bufferView[i] = bytes.charCodeAt(i)
    }
    // Generate a random number
    const randomNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const blob = new Blob([buffer], {type: 'image/png'})
    const file = new File([blob], `${randomNumber}.png`, {type: 'image/png'})

    // Upload the file to the server
    FilePicker.upload('data', `modules/foundry-ai-assistant/images`, file).then((path) => {
      console.log(`Image uploaded to ${path}`)
    })

    imagePath = `modules/foundry-ai-assistant/images/${file.name}`
  }

  // Check for the parent folder
  let parentFolder = game.folders.getName('AI Generated Items')
  if (!parentFolder) {
    parentFolder = await Folder.create({name: 'AI Generated Items', type: 'Item'})
  }

  // Create the Item
  const newItem = await Item.create({
    name: item.name,
    folder: parentFolder.id,
    type: item.type,
    img: imagePath,
    data: {
      description: {
        value: `<h2>Description</h2>${item.description}` + ((item.effect !== '') ? `<br><br><h2>Effect</h2>${item.effect}` : '')
      }
    }
  })

  return newItem
}

// Generate a puzzle
export async function generatePuzzle(puzzlePrompt, includeImage, imagePrompt){
  const generator = new Generator()

  // Generate the puzzle
  const puzzle = await generator.generatePuzzle(puzzlePrompt)

  // Generate the image
  let imagePath = ''
  if (includeImage) {
    const image64 = await generator.generateImage(puzzle.imageGenerationPrompt)

    // Create a file from the base64 encoded image
    const bytes = atob(image64)
    const buffer = new ArrayBuffer(bytes.length)
    const bufferView = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      bufferView[i] = bytes.charCodeAt(i)
    }
    // Generate a random number
    const randomNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const blob = new Blob([buffer], {type: 'image/png'})
    const file = new File([blob], `${randomNumber}.png`, {type: 'image/png'})

    // Upload the file to the server
    FilePicker.upload('data', `modules/foundry-ai-assistant/images`, file).then((path) => {
      console.log(`Image uploaded to ${path}`)
    })

    imagePath = `modules/foundry-ai-assistant/images/${file.name}`
  }

  // Check for the parent folder
  let parentFolder = game.folders.getName('AI Generated Puzzles')
  if (!parentFolder) {
    parentFolder = await Folder.create({name: 'AI Generated Puzzles', type: 'JournalEntry'})
  }

  // Create the Journal Entry
  const journalEntry = await JournalEntry.create({
    name: puzzle.name,
    folder: parentFolder.id,
    img: imagePath,
    content: `
    <h2>Puzzle</h2>
    <p>${puzzle.description}</p>
    <h2>Solution</h2>
    <p>${puzzle.solution}</p>
    `
  })

  return journalEntry
}

// Generate a tile (inanimate object)
export async function generateTile(tilePrompt, includeImage, imagePrompt) {
  const generator = new Generator()

  // Generate the tile
  const tile = await generator.generateTile(tilePrompt)

  // Generate the image
  let imagePath = ''
  if (includeImage) {
    const newImagePrompt = `A 2D sprite of ${(imagePrompt !== '') ? imagePrompt : tile.imageGenerationPrompt}, vtt, dnd, top-down, stylized, solid background, clear outline`
    console.log(`Generating Image: ${newImagePrompt}`)
    const image64 = await generator.generateImage(newImagePrompt, true)

    // Create a file from the base64 encoded image
    const bytes = atob(image64)
    const buffer = new ArrayBuffer(bytes.length)
    const bufferView = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) {
      bufferView[i] = bytes.charCodeAt(i)
    }
    // Generate a random number
    const randomNumber = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const blob = new Blob([buffer], {type: 'image/png'})
    const file = new File([blob], `${randomNumber}.png`, {type: 'image/png'})

    // Upload the file to the server
    FilePicker.upload('data', `modules/foundry-ai-assistant/images`, file).then((path) => {
      console.log(`Image uploaded to ${path}`)
    })

    imagePath = `modules/foundry-ai-assistant/images/${file.name}`
  }

  // Get the tile coordinates of the mouse
  const tileSize = canvas.grid.size
  const x = Math.floor((canvas.app.renderer.plugins.interaction.mouse.global.x - canvas.stage.x) / tileSize) * tileSize
  const y = Math.floor((canvas.app.renderer.plugins.interaction.mouse.global.y - canvas.stage.y) / tileSize) * tileSize

  // Create the Tile
  const newTile = await canvas.scene.createEmbeddedDocuments("Tile", [{
    img: imagePath,
    width: tile.width,
    height: tile.height,
    x: 0,
    y: 0,
    z: 100,
    rotation: 0,
    hidden: false
  }])

  return newTile
}