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
    const newImagePrompt = `A 2D sprite of ${(imagePrompt !== '') ? imagePrompt : npc.imageGenerationPrompt}, white background, stylized`
    console.log(`Generating Image: ${newImagePrompt}`)
    const image64 = await generator.generateImage(newImagePrompt)

    console.log("Converting to white")
    const image64NoWhiteBackground = await generator.removeWhiteBackground(image64);
    console.log(image64NoWhiteBackground)

    // Create a file from the base64 encoded image
    const bytes = atob(image64NoWhiteBackground)
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