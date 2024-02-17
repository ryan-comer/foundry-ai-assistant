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
export async function generateNPC(npcPrompt, includeImage=false, imagePrompt='') {
  const generator = new Generator()

  // Generate the NPC
  const npc = await generator.generateNPC(npcPrompt, includeImage, imagePrompt)

  // Check if the user has an Actors folder called 'AI Generated NPCs'
  let folder = game.folders.getName('AI Generated NPCs')
  if (!folder) {
    folder = await Folder.create({name: 'AI Generated NPCs', type: 'Actor'})
  }

  // Create the Actor
  const actor = await Actor.create({
    name: npc.name,
    type: 'character',
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
          value: npc.biography
        },
        bond: npc.bonds,
        trait: npc.personalityTraits,
        flaw: npc.flaws,
        ideal: npc.ideals,
        alignment: npc.alignment,
        race: npc.race
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


  return npc
}