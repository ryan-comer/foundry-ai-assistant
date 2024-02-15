
// Load the Sidebar UI
Hooks.on('changeSidebarTab', (app, tab) => {
  if (app.options.id === 'settings') {
    console.log("SETTINGS")

    let button = document.createElement('button');
    button.classList.add('aiAssistant');
    button.innerHTML = `<i class="fas fa-robot"></i>AI Assistant`;
    button.addEventListener('click', openAIAssistant);

    //let aiAssistant = $(`<button onClick="openAIAssistant()" class="aiAssistant"><i class="fas fa-robot"></i>AI Assistant</button>`);
    app._element.find(`#settings-game`).append(button);
  }
})

async function openAIAssistant() {
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