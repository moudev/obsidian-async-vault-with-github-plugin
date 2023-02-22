import { Plugin, FileSystemAdapter } from "obsidian"

import { SyncModal } from "./sync-modal"
import { SettingsTab } from "./settings-tab"

interface PluginSettings {
	previousGithubRepository: string;
	githubRepositoryURL: string;
	repositoryConfigurationDatetime: Date;
}

const DEFAULT_SETTINGS: PluginSettings = {
	previousGithubRepository: "",
	githubRepositoryURL: "",
	repositoryConfigurationDatetime: new Date(),
}

export default class SyncVaultPlugin extends Plugin {
	settings: PluginSettings

	async onload() {
		await this.loadSettings()

		this.addRibbonIcon("refresh-cw", "Sync vault with GitHub", async () => {
			new SyncModal(this.app, this).open()
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this))
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	getVaultPath(): string {
		// https://forum.obsidian.md/t/how-to-get-vault-absolute-path/22965/6
		const adapter = this.app.vault.adapter
		if (adapter instanceof FileSystemAdapter) {
			return this.app.vault.adapter.getBasePath()
		}

		return ""
	}

	formatResult(result: string, container: HTMLElement, checkFilesStatus = false) {
    container.innerHTML = ""
  
    if (!result) {
      container.textContent = ""
    }

		container.toggleClass("visible", true)

    const chunks = result.split("\n")
    chunks.forEach(rawText => {
			const text = rawText.trim().toLowerCase()

      if (text && !text.includes("will be replaced by") && !text.includes("will have its original line endings")) {
				// only for show the files of git status
				if (checkFilesStatus) {
					if (text.startsWith("modified") || text.startsWith("deleted") || text.endsWith(".md")) {
						const line = container.createEl("p")
						line.setText(text)

						if (text.startsWith("deleted") ) {
							line.addClass("remove")
						}
						else if(text.startsWith("modified")) {
							line.addClass("add-or-change")
						}
						else if(text.endsWith(".md")) {
							line.addClass("new")
						}
					}
					return
				}

				// when it's not about git status; errors, etc
				const line = container.createEl("p")
				line.setText(text)
      }
    })
  }
}
