import { Effect, Option, Schema } from 'effect'
import { loadPluginSettings, type PluginDataStore } from 'effect-obsidian'

/** Where preview and diff open. */
export const ForestOpenTarget = Schema.Literals(['split', 'tab'])

export type ForestOpenTarget = typeof ForestOpenTarget.Type

/** Global Forest plugin settings. */
export const ForestPluginSettings = Schema.Struct({
	schemaVersion: Schema.optionalKey(Schema.Literal(1)),
	openTarget: ForestOpenTarget,
})

export interface ForestPluginSettings extends Schema.Schema.Type<typeof ForestPluginSettings> {}

export const defaultForestPluginSettings: ForestPluginSettings = ForestPluginSettings.make({
	openTarget: 'split',
})

/** Plugin surface the settings tab uses to persist Forest options. */
export interface ForestPluginSettingsHost {
	settings: ForestPluginSettings
	saveForestPluginSettings: () => Promise<void>
}

/** Reads an open target, defaulting to split. */
export const forestOpenTargetFromString = (value: string): ForestOpenTarget =>
	Option.getOrElse(Schema.decodeUnknownOption(ForestOpenTarget)(value), () => 'split' as const)

/** Loads Forest plugin settings, falling back when data.json is missing or invalid. */
export const loadForestPluginSettings: Effect.Effect<ForestPluginSettings, never, PluginDataStore> =
	loadPluginSettings({
		schema: ForestPluginSettings,
		fallback: defaultForestPluginSettings,
	}).pipe(
		Effect.tapError((error) => Effect.logWarning(`Forest: using default settings (${error._tag})`)),
		Effect.catchTags({
			PluginDataLoadError: () => Effect.succeed(defaultForestPluginSettings),
			PluginSettingsDecodeError: () => Effect.succeed(defaultForestPluginSettings),
		}),
	)
