import { App, PluginSettingTab, Setting } from "obsidian"

import { executeGitCommand, deleteRepository, isGitInstalled, isRemoteOriginAdded, existCommits } from "./git"

// https://github.com/liamcain/obsidian-calendar-plugin/blob/master/src/settings.ts#L7
// https://www.youtube.com/watch?v=0-8v7XkKiHc
// https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/#type-only-imports-exports
import type AsyncVaultPlugin from "./main"

class SettingsTab extends PluginSettingTab {
	plugin: AsyncVaultPlugin
	vault: string

	constructor(app: App, plugin: AsyncVaultPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.vault = plugin.getVaultPath()
	}

	async display(): Promise<void> {
		const { containerEl } = this
		containerEl.empty()
		containerEl.createEl("h1", { text: "Async vault with GitHub settings" })

		const inputsContainer = containerEl.createDiv()

		const actionsContainer = containerEl.createDiv()
		actionsContainer.addClass("async-git-config-actions")

		const messagesContainer = containerEl.createDiv()
		messagesContainer.addClass("async-git-config-messages")
		messagesContainer.createSpan().setText("Success. The vault has been configured with GitHub")

		const resultsContainer = containerEl.createDiv()
		resultsContainer.addClass("async-git-results")		

		const infoContainer = containerEl.createDiv()
		infoContainer.addClass("async-git-settings-info")
		infoContainer.addClass("setting-item-description")

		try {
			await isGitInstalled()
		} catch (error) {
			this.plugin.formatResult(error, resultsContainer)
			resultsContainer.createEl("h2", { text: "Error: Make sure that git is installed and configurated with your GitHub credentials." })
			resultsContainer.createEl("a", { text: "Install git" }).setAttr("href", "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git")
			resultsContainer.createEl("a", { text: "Create GitHub account" }).setAttr("href", "https://github.com")
			resultsContainer.createEl("a", { text: "Configurate git with GitHub credentials" }).setAttr("href", "https://docs.github.com/en/get-started/quickstart/set-up-git")
			return
		}

		try {
			new Setting(inputsContainer)
			.setName("GitHub repository URL")
			.setDesc("Public or private. You must to have permissions in this repository")
			.addText(
				text => text
					.setPlaceholder("Repository url")
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
			submitButton.setText("Configurate repository")
			submitButton.addClass("mod-cta")
			submitButton.addEventListener("click", async () => {
				try {
					submitButton.setText("processing...")
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
					submitButton.setText("Configurate repository")
          submitButton.removeAttribute("disabled")
          submitButton.toggleClass("disabled", false)

					await this.getRepositoryInfo(infoContainer)
				} catch (error) {
					submitButton.setText("Configurate repository")
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
			: "No commits yet"
		const repositoryConfigurationDatetime = this.plugin.settings.repositoryConfigurationDatetime
		const remoteOrigin = await executeGitCommand("config --get remote.origin.url", this.vault)

		infoContainer.createEl("p").setText(`Branch: *${currentBranch}`)		
		infoContainer.createEl("p").setText(`GitHub repository: ${remoteOrigin}`)
		infoContainer.createEl("p").setText(`Configuration date: ${new Date(repositoryConfigurationDatetime)}`)
		infoContainer.createEl("p").setText(`Last sync with GitHub: ${lastCommitDatetime}`)
	}
}

export { SettingsTab }