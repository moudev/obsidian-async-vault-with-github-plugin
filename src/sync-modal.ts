import { App, Modal } from "obsidian"

import { executeGitCommand, isGitInstalled, isRemoteOriginAdded, existCommits } from "./git"
import { labels } from "./labels"

// https://github.com/liamcain/obsidian-calendar-plugin/blob/master/src/settings.ts#L7
// https://www.youtube.com/watch?v=0-8v7XkKiHc
// https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/#type-only-imports-exports
import type SyncVaultPlugin from "./main"

// https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/1.8.12/src/dialogs/Prompt.ts#L18
class SyncModal extends Modal {
	defaultCommitMessage: string
  plugin: SyncVaultPlugin
  vault: string

  constructor(app: App, plugin: SyncVaultPlugin) {
    super(app)
		this.defaultCommitMessage = labels.defaultCommit
    this.plugin = plugin
    this.vault = plugin.getVaultPath()
  }

  async onOpen() {
    const { contentEl } = this
    contentEl.createEl("h1", { text: labels.syncModalTitle })

    const formContainer = contentEl.createDiv()
		const form = formContainer.createEl("form")

    const resultsContainer = contentEl.createDiv()
    resultsContainer.addClass("sync-git-results")

    try {
			await isGitInstalled()
		} catch (error) {
			this.plugin.formatResult(error, resultsContainer)
			resultsContainer.createEl("h4", { text: labels.checkIfGitIsInstalledHint })
			resultsContainer.createEl("a", { text: labels.installGitHint }).setAttr("href", "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git")
			resultsContainer.createEl("a", { text: labels.createGitHubAccountHint }).setAttr("href", "https://github.com")
			resultsContainer.createEl("a", { text: labels.configureGitCredentialsHint }).setAttr("href", "https://docs.github.com/en/get-started/quickstart/set-up-git")
			return
		}

    try {
      if (!await isRemoteOriginAdded(this.vault)) {
        this.plugin.formatResult("", resultsContainer)
        resultsContainer.createEl("strong", { text: labels.originRepositoryNotAdded })
        return
      }
  
      form.addClass("sync-form")
      form.type = "submit"
      form.toggleClass("visible", true)
      form.createEl("label").setText(labels.syncModalInputLabel)
  
      const messageInput = form.createEl("input")
      messageInput.type = "text"
      messageInput.setAttr("name", "commit-message")
      messageInput.value = this.defaultCommitMessage
      messageInput.select()
  
      const lastCommitDatetime = await existCommits(this.vault)
        ? new Date(await executeGitCommand("log -1 --format=%cd", this.vault))
        : labels.noCommits
      const lastCommitDatetimeLabel = form.createEl("p")
      lastCommitDatetimeLabel.addClass("setting-item-description")
      lastCommitDatetimeLabel.setText(`${labels.lastSync} ${lastCommitDatetime}`)
  
      const formActions = form.createDiv()
      formActions.addClass("sync-form-actions")

      const formMessages = form.createDiv()
      formMessages.addClass("sync-form-messages")
      formMessages.createSpan().setText(labels.originRepositoryAddedSuccess)

      const submitButton = formActions.createEl("button")
      submitButton.setText(labels.syncModalSubmitButton)
      submitButton.addClass("mod-cta")

      const existModifiedOrNewFiles = await executeGitCommand("status", this.vault)
      if (existModifiedOrNewFiles.includes("md")) {
        this.plugin.formatResult(existModifiedOrNewFiles, resultsContainer, true)
        formActions.toggleClass("visible", true)
      } else {
        this.plugin.formatResult(labels.noChangesToSync, resultsContainer)
      }

      form.onsubmit = async (e) => {
        try {
          e.preventDefault()
          submitButton.setText(labels.processing)
          submitButton.setAttr("disabled", true)
          submitButton.toggleClass("disabled", true)

          const gitAdd = await executeGitCommand("add .", this.vault)
          const gitCommit = await executeGitCommand(`commit -m "${messageInput.value}"`, this.vault)
          const gitPush = await executeGitCommand("push -f origin main", this.vault)
          this.plugin.formatResult(`${gitAdd} ${gitCommit} ${gitPush}`, resultsContainer)

          formActions.toggleClass("visible", false)
          formMessages.toggleClass("visible", true)

          const newLastCommitDatetime = new Date(await executeGitCommand("log -1 --format=%cd", this.vault))
          lastCommitDatetimeLabel.setText(`${labels.lastSync} ${newLastCommitDatetime}`)
        } catch (error) {
          submitButton.setText(labels.syncModalSubmitButton)
          submitButton.setAttr("disabled", false)
          submitButton.toggleClass("disabled", false)
          this.plugin.formatResult(error.message, resultsContainer)
        }
      }
    } catch (error) {
      this.plugin.formatResult(error.message, resultsContainer)
    }
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}

export { SyncModal } 