import { Plugin } from "obsidian"

import { AsyncModal } from "./async-modal"
import { SettingsTab } from "./settings-tab"

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default"
}

export default class AsyncVaultPlugin extends Plugin {
	settings: MyPluginSettings

	async onload() {
		await this.loadSettings()

		this.addRibbonIcon("refresh-cw", "Async vault with GitHub", async () => {
			new AsyncModal(this.app).open()
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
}
