import { App, Modal } from "obsidian"

import { executeGitCommand } from "./git"

// https://github.com/liamcain/obsidian-calendar-plugin/blob/master/src/settings.ts#L7
// https://www.youtube.com/watch?v=0-8v7XkKiHc
// https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/#type-only-imports-exports
import type AsyncVaultPlugin from "./main"

// https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/1.8.12/src/dialogs/Prompt.ts#L18
class AsyncModal extends Modal {
	defaultCommitMessage: string
  plugin: AsyncVaultPlugin

  constructor(app: App, plugin: AsyncVaultPlugin) {
    super(app)
		this.defaultCommitMessage = `async from ${new Date()}`
    this.plugin = plugin
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
      try {
        e.preventDefault()
        console.log("Submit", messageInput.value)
        const gitResult = await executeGitCommand("status", this.plugin.getVaultPath())
        this.plugin.formatResult(gitResult, resultsContainer)
      } catch (error) {
        this.plugin.formatResult(error, resultsContainer)
      }
    }
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

export { AsyncModal } 