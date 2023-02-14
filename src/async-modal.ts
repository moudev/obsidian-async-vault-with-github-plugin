import { App, Modal } from "obsidian"

import { executeGitCommand, isGitInstalled, isRemoteOriginAdded, existCommits } from "./git"

// https://github.com/liamcain/obsidian-calendar-plugin/blob/master/src/settings.ts#L7
// https://www.youtube.com/watch?v=0-8v7XkKiHc
// https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/#type-only-imports-exports
import type AsyncVaultPlugin from "./main"

// https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/1.8.12/src/dialogs/Prompt.ts#L18
class AsyncModal extends Modal {
	defaultCommitMessage: string
  plugin: AsyncVaultPlugin
  vault: string

  constructor(app: App, plugin: AsyncVaultPlugin) {
    super(app)
		this.defaultCommitMessage = `async from ${new Date()}`
    this.plugin = plugin
    this.vault = plugin.getVaultPath()
  }

  async onOpen() {
    const { contentEl } = this
    contentEl.createEl("h1", { text: "Async vault with GitHub" })

    const formContainer = contentEl.createDiv()
		const form = formContainer.createEl("form")

    const resultsContainer = contentEl.createDiv()
    resultsContainer.addClass("async-git-results")

    try {
			await isGitInstalled()
		} catch (error) {
			this.plugin.formatResult(error, resultsContainer)
			resultsContainer.createEl("h4", { text: "Error: Make sure that git is installed and configurated with your GitHub credentials." })
			resultsContainer.createEl("a", { text: "Install git" }).setAttr("href", "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git")
			resultsContainer.createEl("a", { text: "Create GitHub account" }).setAttr("href", "https://github.com")
			resultsContainer.createEl("a", { text: "Configurate git with GitHub credentials" }).setAttr("href", "https://docs.github.com/en/get-started/quickstart/set-up-git")
			return
		}

    try {
      if (!await isRemoteOriginAdded(this.vault)) {
        this.plugin.formatResult("", resultsContainer)
        resultsContainer.createEl("strong", { text: "Error: Make sure that GitHub repository is configured in plugin settings tab." })
        return
      }
  
      form.addClass("async-form")
      form.type = "submit"
      form.createEl("label").setText("Commit message:")
      form.onsubmit = async (e) => {
        try {
          e.preventDefault()
          const gitAdd = await executeGitCommand("add .", this.vault)
          const gitCommit = await executeGitCommand(`commit -m "${messageInput.value}"`, this.vault)
          const gitPush = await executeGitCommand("push origin main", this.vault)
          this.plugin.formatResult(`${gitAdd} ${gitCommit} ${gitPush}`, resultsContainer)
          this.plugin.formatResult(`${gitAdd} asdf`, resultsContainer)
        } catch (error) {
          this.plugin.formatResult(error.message, resultsContainer)
        }
      }
  
      const messageInput = form.createEl("input")
      messageInput.type = "text"
      messageInput.setAttr("name", "commit-message")
      messageInput.value = this.defaultCommitMessage
      messageInput.select()
  
      const lastCommitDatetime = await existCommits(this.vault)
        ? new Date(await executeGitCommand("log -1 --format=%cd", this.vault))
        : "No commits yet"
      const lastCommitDatetimeLabel = form.createEl("p")
      lastCommitDatetimeLabel.addClass("setting-item-description")
      lastCommitDatetimeLabel.setText(`Last async with GitHub: ${lastCommitDatetime}`)
  
      const formActions = form.createDiv()
      formActions.addClass("async-form-actions")
  
      const submitButton = formActions.createEl("button")
      submitButton.setText("Submit")
      submitButton.addClass("mod-cta")
  
      formActions.toggleClass("visible", true)
      form.toggleClass("visible", true)
    } catch (error) {
      this.plugin.formatResult(error.message, resultsContainer)
    }
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

export { AsyncModal } 