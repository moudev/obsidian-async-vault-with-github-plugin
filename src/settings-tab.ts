import { App, PluginSettingTab, Setting } from "obsidian"

import { executeGitCommand, isGitInstalled } from "./git"

// https://github.com/liamcain/obsidian-calendar-plugin/blob/master/src/settings.ts#L7
// https://www.youtube.com/watch?v=0-8v7XkKiHc
// https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/#type-only-imports-exports
import type AsyncVaultPlugin from "./main"

class SettingsTab extends PluginSettingTab {
	plugin: AsyncVaultPlugin

	constructor(app: App, plugin: AsyncVaultPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	async display(): Promise<void> {
		const vault = this.plugin.getVaultPath()

		const { containerEl } = this
		containerEl.empty()
		containerEl.createEl("h1", { text: "Async vault with GitHub settings" })

		const inputsContainer = containerEl.createDiv()

		const actionsContainer = containerEl.createDiv()
		actionsContainer.addClass("async-git-config-actions")

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
					.setValue(this.plugin.settings.githubRepositoryURL)
					.onChange(async (value: string) => {
						this.plugin.settings.githubRepositoryURL = value
						this.plugin.settings.isRepositoryConfigured = false

						await this.plugin.saveSettings()
						actionsContainer.toggleClass("visible", true)
						resultsContainer.toggleClass("visible", false)
						infoContainer.toggleClass("visible", false)
					})
			)

			const submitButton = actionsContainer.createEl("button")
			submitButton.setText("Configurate repository")
			submitButton.addClass("mod-cta")
			submitButton.addEventListener("click", async () => {
				try {
					const repository = this.plugin.settings.githubRepositoryURL

					// if remote origin has been added then only update the URL
					const remoteOrigin = await executeGitCommand("remote -v", vault)
					const isRemoteOriginAdded = remoteOrigin.contains("origin")

					if (isRemoteOriginAdded){
						await executeGitCommand(`remote set-url origin ${repository}`, vault)
					} else {
						// for the first load of the plugin
						await executeGitCommand(`remote add origin ${repository}`, vault)
					}

					// change principal branch to "main"
					const branchGitResult = await executeGitCommand("branch --show-current", vault)
					if (branchGitResult.includes("master")) {
						await executeGitCommand("branch -M main", vault)
					}

					this.plugin.formatResult("The GitHub repository has been configured", resultsContainer)
					this.plugin.settings.isRepositoryConfigured = true
					this.plugin.settings.repositoryConfigurationDatetime = new Date()
					await this.plugin.saveSettings()
					actionsContainer.toggleClass("visible", false)
					infoContainer.toggleClass("visible", true)
					await this.getInfo(infoContainer, vault)
				} catch (error) {
					console.log("try")
					this.plugin.formatResult(error.message, resultsContainer)
				}
			})

			if (!this.plugin.settings.isRepositoryConfigured) {
				actionsContainer.toggleClass("visible", true)
			}

			if (this.plugin.settings.isRepositoryConfigured) {
				infoContainer.toggleClass("visible", true)
				await this.getInfo(infoContainer, vault)
			}
		} catch (error) {
			this.plugin.formatResult(error.message, resultsContainer)
			actionsContainer.toggleClass("visible", true)
			this.plugin.settings.isRepositoryConfigured = false
			await this.plugin.saveSettings()
			return
		}
	}

	async getInfo(infoContainer: HTMLDivElement, vault: string){
		infoContainer.innerHTML = ""
		const currentBranch = await executeGitCommand("branch --show-current", vault)
		const lastCommitDatetime = await executeGitCommand("log -1 --format=%cd", vault)
		const repositoryConfigurationDatetime = this.plugin.settings.repositoryConfigurationDatetime

		infoContainer.createEl("p").setText(`Current branch: *${currentBranch}`)
		infoContainer.createEl("p").setText(`Repository configured: ${new Date(repositoryConfigurationDatetime)}`)
		infoContainer.createEl("p").setText(`Last sync with GitHub: ${lastCommitDatetime}`)
	}
}

export { SettingsTab }