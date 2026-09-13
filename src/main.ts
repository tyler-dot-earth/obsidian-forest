import { Effect, Layer, Logger, Match, type ManagedRuntime } from 'effect'
import {
	disposePluginRuntime,
	makePluginRuntime,
	type PluginDataStore,
	pluginDataStoreLayerFromHost,
	savePluginSettings,
} from 'effect-obsidian'
import { MarkdownView, Notice, Plugin, TFile } from 'obsidian'

import { WorktreesCopySuggestModal } from '#/src/worktrees-copy-suggest-modal'
import { WORKTREES_DIFF_VIEW_TYPE, WorktreesDiffView } from '#/src/worktrees-diff-view'
import type { WorktreeFileCopy } from '#/src/worktrees-list-copies'
import { listWorktreeCopiesForVaultFile } from '#/src/worktrees-list-copies-for-file'
import { openWorktreeCopyInDefaultApp } from '#/src/worktrees-open-copy'
import {
	defaultForestPluginSettings,
	ForestPluginSettings,
	type ForestPluginSettingsHost,
	loadForestPluginSettings,
} from '#/src/worktrees-plugin-settings'
import { WORKTREES_PREVIEW_VIEW_TYPE, WorktreesPreviewView } from '#/src/worktrees-preview-view'
import { ForestSettingTab } from '#/src/worktrees-setting-tab'
import {
	FOREST_SIDEBAR_VIEW_TYPE,
	type ForestSidebarActions,
	ForestSidebarView,
} from '#/src/worktrees-sidebar-view'
import { worktreesVaultBasePath } from '#/src/worktrees-vault-path'

export default class ForestPlugin extends Plugin implements ForestPluginSettingsHost {
	override settings = defaultForestPluginSettings
	private runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never> | undefined
	private statusBarItem: HTMLElement | undefined
	private readonly markdownViewsWithForestAction = new WeakSet<MarkdownView>()

	override async onload(): Promise<void> {
		const runtime = makePluginRuntime(
			Layer.mergeAll(
				pluginDataStoreLayerFromHost({
					loadData: () => this.loadData(),
					saveData: (data) => this.saveData(data),
				}),
				Logger.layer([Logger.consoleJson]),
			),
		)

		this.runtime = runtime
		this.settings = await runtime.runPromise(loadForestPluginSettings)
		this.addSettingTab(new ForestSettingTab(this.app, this, this))
		this.registerWorktreesViews(runtime)
		this.addWorktreesCommands()
		this.statusBarItem = this.addStatusBarItem()
		this.statusBarItem.addClass('mod-clickable')
		this.statusBarItem.addEventListener('click', () => {
			void this.showForestSidebar()
		})
		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				this.refreshWorktreesStatusBar()
			}),
		)
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.addForestActionToMarkdownViews()
			}),
		)
		this.addForestActionToMarkdownViews()
		this.refreshWorktreesStatusBar()
	}

	private registerWorktreesViews(
		runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>,
	): void {
		this.registerView(FOREST_SIDEBAR_VIEW_TYPE, (leaf) => {
			return new ForestSidebarView(leaf, runtime, this.forestSidebarActions())
		})
		this.registerView(
			WORKTREES_PREVIEW_VIEW_TYPE,
			(leaf) => new WorktreesPreviewView(leaf, runtime),
		)
		this.registerView(WORKTREES_DIFF_VIEW_TYPE, (leaf) => new WorktreesDiffView(leaf, runtime))
	}

	private forestSidebarActions(): ForestSidebarActions {
		return {
			previewWorktreeCopy: (copy) => {
				void this.openWorktreesLeaf(WORKTREES_PREVIEW_VIEW_TYPE, copy)
			},
			diffWorktreeCopy: (copy) => {
				void this.openWorktreesLeaf(WORKTREES_DIFF_VIEW_TYPE, copy)
			},
			openWorktreeCopy: (copy) => {
				this.openWorktreeCopyInApp(copy)
			},
			openWorktreeDirectory: (copy) => {
				this.openWorktreeDirectory(copy.worktreePath)
			},
			getOpenTarget: () => this.settings.openTarget,
			setOpenTarget: (openTarget) => {
				this.settings = ForestPluginSettings.make({
					schemaVersion: 1,
					openTarget,
				})
				void this.saveForestPluginSettings()
			},
		}
	}

	private addWorktreesCommands(): void {
		this.addCommand({
			id: 'show',
			name: 'Show Forest',
			callback: (): void => {
				void this.showForestSidebar()
			},
		})
		this.addCommand({
			id: 'preview',
			name: 'Preview worktree copy',
			callback: (): void => {
				this.pickWorktreeCopy('preview')
			},
		})
		this.addCommand({
			id: 'diff',
			name: 'Diff worktree copy',
			callback: (): void => {
				this.pickWorktreeCopy('diff')
			},
		})
		this.addCommand({
			id: 'open',
			name: 'Open worktree copy in default app',
			callback: (): void => {
				this.pickWorktreeCopy('open')
			},
		})
		this.addCommand({
			id: 'open-folder',
			name: 'Open worktree folder',
			callback: (): void => {
				this.pickWorktreeCopy('folder')
			},
		})
	}

	private addForestActionToMarkdownViews(): void {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.isDeferred) {
				return
			}

			const view = leaf.view

			if (!(view instanceof MarkdownView) || this.markdownViewsWithForestAction.has(view)) {
				return
			}

			this.markdownViewsWithForestAction.add(view)
			view.addAction('trees', 'Forest', () => {
				void this.showForestSidebar()
			})
		})
	}

	private async showForestSidebar(): Promise<void> {
		const leaf = await this.app.workspace.ensureSideLeaf(FOREST_SIDEBAR_VIEW_TYPE, 'right', {
			reveal: true,
		})

		void this.app.workspace.revealLeaf(leaf)
	}

	private pickWorktreeCopy(action: 'preview' | 'diff' | 'open' | 'folder'): void {
		const runtime = this.runtime
		const file = this.app.workspace.getActiveFile()
		const vaultBasePath = worktreesVaultBasePath(this.app)

		if (runtime === undefined) {
			return
		}

		if (!(file instanceof TFile) || vaultBasePath === null) {
			new Notice('Forest: open a file in a local vault.')

			return
		}

		runtime.runFork(
			listWorktreeCopiesForVaultFile({
				vaultBasePath,
				vaultRelativePath: file.path,
			}).pipe(
				Effect.tap((copies) =>
					Effect.sync(() => {
						this.onWorktreeCopiesReady(copies, action, vaultBasePath)
					}),
				),
				Effect.tapError((error) =>
					Effect.sync(() => {
						new Notice(error.message)
					}),
				),
			),
		)
	}

	private onWorktreeCopiesReady(
		copies: readonly WorktreeFileCopy[],
		action: 'preview' | 'diff' | 'open' | 'folder',
		vaultBasePath: string,
	): void {
		if (copies.length === 0) {
			new Notice('Forest: no copies of this file in other worktrees.')

			return
		}

		new WorktreesCopySuggestModal(this.app, copies, (copy) => {
			this.runWorktreeCopyAction(copy, action, vaultBasePath)
		}).open()
	}

	private runWorktreeCopyAction(
		copy: WorktreeFileCopy,
		action: 'preview' | 'diff' | 'open' | 'folder',
		vaultBasePath: string,
	): void {
		if (action === 'preview') {
			this.previewWorktreeCopy(copy)

			return
		}

		if (action === 'diff') {
			void this.openWorktreesLeaf(WORKTREES_DIFF_VIEW_TYPE, copy)

			return
		}

		if (action === 'folder') {
			this.openWorktreeDirectory(copy.worktreePath)

			return
		}

		this.openWorktreeCopyInApp(copy, vaultBasePath)
	}

	previewWorktreeCopy(copy: WorktreeFileCopy): void {
		void this.openWorktreesLeaf(WORKTREES_PREVIEW_VIEW_TYPE, copy)
	}

	openWorktreeDirectory(absolutePath: string): void {
		const runtime = this.runtime
		const vaultBasePath = worktreesVaultBasePath(this.app)

		if (runtime === undefined || vaultBasePath === null) {
			return
		}

		runtime.runFork(
			openWorktreeCopyInDefaultApp({
				absolutePath,
				vaultBasePath,
			}).pipe(
				Effect.tapError((error) =>
					Effect.sync(() => {
						new Notice(error.message)
					}),
				),
			),
		)
	}

	async listCopiesForFile(vaultRelativePath: string): Promise<readonly WorktreeFileCopy[]> {
		const runtime = this.runtime
		const vaultBasePath = worktreesVaultBasePath(this.app)

		if (runtime === undefined || vaultBasePath === null) {
			return []
		}

		return runtime.runPromise(
			listWorktreeCopiesForVaultFile({
				vaultBasePath,
				vaultRelativePath,
			}).pipe(Effect.catchCause(() => Effect.succeed([]))),
		)
	}

	private openWorktreeCopyInApp(copy: WorktreeFileCopy, vaultBasePath?: string): void {
		const runtime = this.runtime
		const basePath = vaultBasePath ?? worktreesVaultBasePath(this.app)

		if (runtime === undefined || basePath === null) {
			return
		}

		runtime.runFork(
			openWorktreeCopyInDefaultApp({
				absolutePath: copy.absolutePath,
				vaultBasePath: basePath,
			}).pipe(
				Effect.tapError((error) =>
					Effect.sync(() => {
						new Notice(error.message)
					}),
				),
			),
		)
	}

	async saveForestPluginSettings(): Promise<void> {
		const runtime = this.runtime

		if (runtime === undefined) {
			return
		}

		await runtime.runPromise(
			savePluginSettings({
				schema: ForestPluginSettings,
				value: this.settings,
			}),
		)
	}

	private async openWorktreesLeaf(viewType: string, copy: WorktreeFileCopy): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(viewType)[0]

		const leaf =
			existing ??
			Match.value(this.settings.openTarget).pipe(
				Match.when('split', () => this.app.workspace.getLeaf('split', 'vertical')),
				Match.when('tab', () => this.app.workspace.getLeaf('tab')),
				Match.exhaustive,
			)

		await leaf.setViewState({
			type: viewType,
			active: true,
			state: copy,
		})
		void this.app.workspace.revealLeaf(leaf)
	}

	private refreshWorktreesStatusBar(): void {
		const runtime = this.runtime
		const item = this.statusBarItem
		const file = this.app.workspace.getActiveFile()
		const vaultBasePath = worktreesVaultBasePath(this.app)

		if (runtime === undefined || item === undefined) {
			return
		}

		if (!(file instanceof TFile) || vaultBasePath === null) {
			item.setText('')

			return
		}

		runtime.runFork(
			listWorktreeCopiesForVaultFile({
				vaultBasePath,
				vaultRelativePath: file.path,
			}).pipe(
				Effect.tap((copies) =>
					Effect.sync(() => {
						item.setText(copies.length === 0 ? '' : `${String(copies.length)} worktrees`)
					}),
				),
				Effect.catchCause(() =>
					Effect.sync(() => {
						item.setText('')
					}),
				),
			),
		)
	}

	override onunload(): void {
		void disposePluginRuntime(this.runtime)
		this.runtime = undefined
	}
}
