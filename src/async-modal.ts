import { App, Modal, FileSystemAdapter } from "obsidian"

import { executeGitCommand } from "./git"

// https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/1.8.12/src/dialogs/Prompt.ts#L18
class AsyncModal extends Modal {
	defaultCommitMessage: string
  constructor(app: App) {
    super(app)
		this.defaultCommitMessage = `async from ${new Date()}`
  }

  onOpen() {
    const { contentEl } = this

    contentEl.createEl("h1", { text: "Async vault with GitHub" })

		const div = contentEl.createDiv()

		const form = div.createEl("form")
    form.addClass("async-form")
    form.type = "submit"
    
		form.createEl("label").setText("Commit message:")
    const messageInput = form.createEl("input")
    messageInput.type = "text"
		messageInput.setAttr("name", "commit-message")
		messageInput.value = this.defaultCommitMessage
    messageInput.select()		

		const formActions = form.createDiv()
		formActions.addClass("async-form-actions")

		const submitButton = formActions.createEl("button")
		submitButton.setText("Submit")
    submitButton.addClass("mod-cta")

    const resultsContainer = contentEl.createDiv()
    resultsContainer.addClass("async-git-results")
    
    form.onsubmit = async (e) => {
      e.preventDefault()
			console.log("Submit", messageInput.value)
      // https://forum.obsidian.md/t/how-to-get-vault-absolute-path/22965/6
			const adapter = this.app.vault.adapter
			if (adapter instanceof FileSystemAdapter) {
				const vaultPath = this.app.vault.adapter.getBasePath()
        const gitResult = await executeGitCommand("status", vaultPath)
        this.formatResult(gitResult, resultsContainer)
			}
    }
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }

  formatResult(result: string, container: HTMLElement) {
    container.innerHTML = ""
  
    if (!result) {
      container.textContent = ""
    }

    const chunks = result.split("\n")
    console.log(chunks)
    container.toggleClass("visible", true)
    chunks.forEach(text => {
      if (text) {
        container.createEl("p").setText(text)
      }
    })
  }
}

export { AsyncModal } 