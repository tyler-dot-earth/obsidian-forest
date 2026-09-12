import { type App, Plugin, PluginSettingTab, Setting } from 'obsidian'

import {
	ForestPluginSettings,
	type ForestPluginSettingsHost,
	forestOpenTargetFromString,
} from '#src/worktrees-plugin-settings'

/** Plugin settings tab for how Forest opens preview and diff. */
export class ForestSettingTab extends PluginSettingTab {
	private readonly settingsHost: ForestPluginSettingsHost

	constructor(app: App, plugin: Plugin, settingsHost: ForestPluginSettingsHost) {
		super(app, plugin)
		this.settingsHost = settingsHost
	}

	override display(): void {
		const { containerEl } = this

		containerEl.empty()
		new Setting(containerEl)
			.setName('Open preview and diff')
			.setDesc('Split puts the copy beside the note. New tab opens it in the main area.')
			.addDropdown((dropdown) => {
				dropdown.addOption('split', 'Split')
				dropdown.addOption('tab', 'New tab')
				dropdown.setValue(this.settingsHost.settings.openTarget)
				dropdown.onChange((value) => {
					this.settingsHost.settings = ForestPluginSettings.make({
						schemaVersion: 1,
						openTarget: forestOpenTargetFromString(value),
					})
					void this.settingsHost.saveForestPluginSettings()
				})
			})
	}
}
