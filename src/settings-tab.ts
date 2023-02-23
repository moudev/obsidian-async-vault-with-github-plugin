import { App, PluginSettingTab, Setting } from "obsidian"

import { executeGitCommand, deleteRepository, isGitInstalled, isRemoteOriginAdded, existCommits } from "./git"
import { labels } from "./labels"

// https://github.com/liamcain/obsidian-calendar-plugin/blob/master/src/settings.ts#L7
// https://www.youtube.com/watch?v=0-8v7XkKiHc
// https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/#type-only-imports-exports
import type SyncVaultPlugin from "./main"

class SettingsTab extends PluginSettingTab {
	plugin: SyncVaultPlugin
	vault: string

	constructor(app: App, plugin: SyncVaultPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.vault = plugin.getVaultPath()
	}

	async display(): Promise<void> {
		const { containerEl } = this
		containerEl.empty()
		containerEl.createEl("h1", { text: labels.settingsTitle })

		const inputsContainer = containerEl.createDiv()

		const actionsContainer = containerEl.createDiv()
		actionsContainer.addClass("sync-git-config-actions")

		const messagesContainer = containerEl.createDiv()
		messagesContainer.addClass("sync-git-config-messages")
		messagesContainer.createSpan().setText(labels.originRepositoryAddedSuccess)

		const resultsContainer = containerEl.createDiv()
		resultsContainer.addClass("sync-git-results")		

		const infoContainer = containerEl.createDiv()
		infoContainer.addClass("sync-git-settings-info")
		infoContainer.addClass("setting-item-description")

		try {
			await isGitInstalled()
		} catch (error) {
			this.plugin.formatResult(error, resultsContainer)
			resultsContainer.createEl("h2", { text: labels.checkIfGitIsInstalledHint })
			resultsContainer.createEl("a", { text: labels.installGitHint }).setAttr("href", "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git")
			resultsContainer.createEl("a", { text: labels.createGitHubAccountHint }).setAttr("href", "https://github.com")
			resultsContainer.createEl("a", { text: labels.configureGitCredentialsHint }).setAttr("href", "https://docs.github.com/en/get-started/quickstart/set-up-git")
			return
		}

		try {
			new Setting(inputsContainer)
			.setName(labels.settingsInputLabel)
			.setDesc(labels.settingsInputDescription)
			.addText(
				text => text
					.setPlaceholder(labels.settingsInputPlaceholder)
					.setValue(this.plugin.settings.previousGithubRepository)
					.onChange(async (value: string) => {
						messagesContainer.toggleClass("visible", false)

						this.plugin.settings.githubRepositoryURL = value

						await this.plugin.saveSettings()

						if (this.plugin.settings.githubRepositoryURL != this.plugin.settings.previousGithubRepository) {
							actionsContainer.toggleClass("visible", true)
							infoContainer.toggleClass("visible", false)
						} else {
							actionsContainer.toggleClass("visible", false)
							infoContainer.toggleClass("visible", true)
						}

						resultsContainer.toggleClass("visible", false)
					})
			)

			const submitButton = actionsContainer.createEl("button")
			submitButton.setText(labels.settingsSubmitButton)
			submitButton.addClass("mod-cta")
			submitButton.addEventListener("click", async () => {
				try {
					submitButton.setText(labels.processing)
					submitButton.setAttr("disabled", true)
					submitButton.toggleClass("disabled", true)

					await deleteRepository(this.vault)

					const repository = this.plugin.settings.githubRepositoryURL

					await executeGitCommand(`remote add origin ${repository}`, this.vault)
					await executeGitCommand("branch -M main", this.vault)

					this.plugin.settings.repositoryConfigurationDatetime = new Date()
					this.plugin.settings.previousGithubRepository = repository
					await this.plugin.saveSettings()

					actionsContainer.toggleClass("visible", false)
					infoContainer.toggleClass("visible", true)
					messagesContainer.toggleClass("visible", true)
					submitButton.setText(labels.settingsSubmitButton)
          submitButton.removeAttribute("disabled")
          submitButton.toggleClass("disabled", false)

					await this.getRepositoryInfo(infoContainer)
				} catch (error) {
					submitButton.setText(labels.settingsSubmitButton)
          submitButton.removeAttribute("disabled")
          submitButton.toggleClass("disabled", false)
					this.plugin.formatResult(error.message, resultsContainer)
				}
			})

			if (await isRemoteOriginAdded(this.vault)) {
				infoContainer.toggleClass("visible", true)
				await this.getRepositoryInfo(infoContainer)
			} else {
				actionsContainer.toggleClass("visible", true)
			}
		} catch (error) {
			actionsContainer.toggleClass("visible", true)
			await this.plugin.saveSettings()
			this.plugin.formatResult(error.message, resultsContainer)
		}
	}

	async getRepositoryInfo(infoContainer: HTMLDivElement){
		infoContainer.innerHTML = ""
		infoContainer.toggleClass("visible", true)

		const currentBranch = await executeGitCommand("branch --show-current", this.vault)
		const lastCommitDatetime = await existCommits(this.vault)
			? await executeGitCommand("log -1 --format=%cd", this.vault)
			: labels.noCommits
		const repositoryConfigurationDatetime = this.plugin.settings.repositoryConfigurationDatetime
		const remoteOrigin = await executeGitCommand("config --get remote.origin.url", this.vault)

		infoContainer.createEl("p").setText(`${labels.infoRepositoryBranch} *${currentBranch}`)		
		infoContainer.createEl("p").setText(`${labels.infoRepositoryGitHubLink} ${remoteOrigin}`)
		infoContainer.createEl("p").setText(`${labels.infoRepositoryConfigurationDatetime} ${new Date(repositoryConfigurationDatetime)}`)
		infoContainer.createEl("p").setText(`${labels.lastSync} ${lastCommitDatetime}`)
	}
}

export { SettingsTab }