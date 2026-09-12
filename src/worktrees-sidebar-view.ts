import { Effect, type ManagedRuntime } from 'effect'
import type { PluginDataStore } from 'effect-obsidian'
import { ItemView, TFile } from 'obsidian'
import type { WorkspaceLeaf } from 'obsidian'

import type { WorktreeFileCopy } from '#src/worktrees-list-copies'
import {
	listWorktreeCopyListingsForVaultFile,
	type WorktreeCopyListing,
} from '#src/worktrees-list-copy-listings'
import { type ForestOpenTarget, forestOpenTargetFromString } from '#src/worktrees-plugin-settings'
import { worktreesVaultAbsoluteFilePath, worktreesVaultBasePath } from '#src/worktrees-vault-path'

/** ItemView type id for the Forest sidebar list. */
export const FOREST_SIDEBAR_VIEW_TYPE = 'forest'

/** Preview, diff, or open a worktree copy from the sidebar. */
export interface ForestSidebarActions {
	readonly previewWorktreeCopy: (copy: WorktreeFileCopy) => void
	readonly diffWorktreeCopy: (copy: WorktreeFileCopy) => void
	readonly openWorktreeCopy: (copy: WorktreeFileCopy) => void
	readonly openWorktreeDirectory: (copy: WorktreeFileCopy) => void
	readonly getOpenTarget: () => ForestOpenTarget
	readonly setOpenTarget: (openTarget: ForestOpenTarget) => void
}

/** Right sidebar list of worktree copies of the active note. */
export class ForestSidebarView extends ItemView {
	private readonly runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>
	private readonly actions: ForestSidebarActions
	private listGeneration = 0
	private listedFilePath: string | null = null

	constructor(
		leaf: WorkspaceLeaf,
		runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>,
		actions: ForestSidebarActions,
	) {
		super(leaf)
		this.runtime = runtime
		this.actions = actions
	}

	override getViewType(): string {
		return FOREST_SIDEBAR_VIEW_TYPE
	}

	override getDisplayText(): string {
		return 'Forest'
	}

	override getIcon(): string {
		return 'trees'
	}

	protected override onOpen(): Promise<void> {
		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				this.refreshForestSidebar()
			}),
		)
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.refreshForestSidebarIfFileChanged()
			}),
		)
		this.refreshForestSidebar()

		return Promise.resolve()
	}

	private refreshForestSidebarIfFileChanged(): void {
		const file = this.app.workspace.getActiveFile()
		const path = file instanceof TFile ? file.path : null

		if (path === this.listedFilePath) {
			return
		}

		this.refreshForestSidebar()
	}

	private refreshForestSidebar(): void {
		const file = this.app.workspace.getActiveFile()
		const vaultBasePath = worktreesVaultBasePath(this.app)
		const filePath = file instanceof TFile ? file.path : null

		const vaultAbsolutePath =
			filePath === null ? null : worktreesVaultAbsoluteFilePath(this.app, filePath)

		this.listedFilePath = filePath
		this.listGeneration += 1
		const generation = this.listGeneration

		if (filePath === null || vaultBasePath === null || vaultAbsolutePath === null) {
			this.renderForestSidebarMessage('Open a file in a local vault.')

			return
		}

		this.renderForestSidebarMessage('Looking for copies…')
		this.runtime.runFork(
			listWorktreeCopyListingsForVaultFile({
				vaultBasePath,
				vaultAbsolutePath,
				vaultRelativePath: filePath,
			}).pipe(
				Effect.tap((listings) =>
					Effect.sync(() => {
						if (generation !== this.listGeneration) {
							return
						}

						this.renderForestSidebarCopies(filePath, listings)
					}),
				),
				Effect.tapError((error) =>
					Effect.sync(() => {
						if (generation !== this.listGeneration) {
							return
						}

						this.renderForestSidebarMessage(error.message)
					}),
				),
			),
		)
	}

	private resetForestSidebar(): void {
		this.contentEl.empty()
		this.contentEl.addClass('worktrees-sidebar')
		this.renderForestSidebarOpenTarget()
	}

	private renderForestSidebarOpenTarget(): void {
		const optionsEl = this.contentEl.createDiv({ cls: 'worktrees-sidebar-options' })
		optionsEl.createEl('span', {
			cls: 'worktrees-sidebar-options-label',
			text: 'Open preview and diff',
		})

		const selectEl = optionsEl.createEl('select', { cls: 'dropdown' })

		selectEl.createEl('option', { text: 'Split', attr: { value: 'split' } })
		selectEl.createEl('option', { text: 'New tab', attr: { value: 'tab' } })
		selectEl.value = this.actions.getOpenTarget()
		selectEl.addEventListener('change', () => {
			this.actions.setOpenTarget(forestOpenTargetFromString(selectEl.value))
		})
	}

	private renderForestSidebarMessage(text: string): void {
		this.resetForestSidebar()
		this.contentEl.createDiv({ cls: 'worktrees-sidebar-empty', text })
	}

	private renderForestSidebarCopies(
		filePath: string,
		listings: readonly WorktreeCopyListing[],
	): void {
		this.resetForestSidebar()
		this.contentEl.createDiv({ cls: 'worktrees-sidebar-file', text: filePath })

		if (listings.length === 0) {
			this.contentEl.createDiv({
				cls: 'worktrees-sidebar-empty',
				text: 'No copies in other worktrees.',
			})

			return
		}

		for (const listing of listings) {
			this.renderForestSidebarCopy(listing)
		}
	}

	private renderForestSidebarCopy(listing: WorktreeCopyListing): void {
		const copy = listing.copy
		const rowEl = this.contentEl.createDiv({ cls: 'worktrees-sidebar-copy' })
		const titleEl = rowEl.createDiv({ cls: 'worktrees-sidebar-copy-title' })

		titleEl.createSpan({ text: copy.branch ?? 'detached' })

		if (listing.differs) {
			titleEl.createSpan({
				cls: 'worktrees-sidebar-copy-differs',
				text: 'Differs',
			})
		}

		rowEl.createDiv({
			cls: 'worktrees-sidebar-copy-path',
			text: copy.worktreePath,
		})

		const actionsEl = rowEl.createDiv({ cls: 'worktrees-sidebar-copy-actions' })

		this.addForestSidebarAction(actionsEl, 'Preview', () => {
			this.actions.previewWorktreeCopy(copy)
		})
		this.addForestSidebarAction(actionsEl, 'Diff', () => {
			this.actions.diffWorktreeCopy(copy)
		})
		this.addForestSidebarAction(actionsEl, 'Open file', () => {
			this.actions.openWorktreeCopy(copy)
		})
		this.addForestSidebarAction(actionsEl, 'Open folder', () => {
			this.actions.openWorktreeDirectory(copy)
		})
	}

	private addForestSidebarAction(actionsEl: HTMLElement, label: string, onClick: () => void): void {
		const buttonEl = actionsEl.createEl('button', { text: label })

		buttonEl.addEventListener('click', (event: MouseEvent) => {
			event.preventDefault()
			onClick()
		})
	}
}
