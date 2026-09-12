import { assert, describe, it } from '@effect/vitest'
import { Effect } from 'effect'
import { memoryPluginDataStoreLayer } from 'effect-obsidian'

import {
	defaultForestPluginSettings,
	forestOpenTargetFromString,
	loadForestPluginSettings,
} from '#src/worktrees-plugin-settings'

describe('ForestPluginSettings', () => {
	it.effect('defaults to split when plugin data is missing', () =>
		Effect.gen(function* () {
			const settings = yield* loadForestPluginSettings

			assert.deepStrictEqual(settings, defaultForestPluginSettings)
			assert.strictEqual(settings.openTarget, 'split')
		}).pipe(Effect.provide(memoryPluginDataStoreLayer())),
	)

	it.effect('decodes a saved tab target', () =>
		Effect.gen(function* () {
			const settings = yield* loadForestPluginSettings

			assert.strictEqual(settings.openTarget, 'tab')
		}).pipe(Effect.provide(memoryPluginDataStoreLayer({ openTarget: 'tab' }))),
	)

	it.effect('falls back when plugin data does not match the schema', () =>
		Effect.gen(function* () {
			const settings = yield* loadForestPluginSettings

			assert.deepStrictEqual(settings, defaultForestPluginSettings)
		}).pipe(Effect.provide(memoryPluginDataStoreLayer({ openTarget: 'window' }))),
	)

	it('reads split from strings that are not a target', () => {
		assert.strictEqual(forestOpenTargetFromString('nope'), 'split')
		assert.strictEqual(forestOpenTargetFromString('tab'), 'tab')
	})
})
