import { Plugin, FileSystemAdapter } from "obsidian"

import { AsyncModal } from "./async-modal"
import { SettingsTab } from "./settings-tab"

interface PluginSettings {
	githubRepositoryURL: string;
	isRepositoryConfigured: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
	githubRepositoryURL: "",
	isRepositoryConfigured: false,
}

export default class AsyncVaultPlugin extends Plugin {
	settings: PluginSettings

	async onload() {
		await this.loadSettings()

		this.addRibbonIcon("refresh-cw", "Async vault with GitHub", async () => {
			new AsyncModal(this.app, this).open()
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
