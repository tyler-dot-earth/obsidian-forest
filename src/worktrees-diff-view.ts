import { Effect, type ManagedRuntime, Option, Schema } from 'effect'
import type { PluginDataStore } from 'effect-obsidian'
import { ItemView } from 'obsidian'
import type { ViewStateResult, WorkspaceLeaf } from 'obsidian'

import { diffVaultFileAgainstWorktreeCopy } from '#/src/worktrees-diff-copy'
import { WorktreeFileCopy } from '#/src/worktrees-list-copies'
import { worktreesVaultAbsoluteFilePath, worktreesVaultBasePath } from '#/src/worktrees-vault-path'

/** ItemView type id for a git diff of a worktree copy. */
export const WORKTREES_DIFF_VIEW_TYPE = 'forest-diff'

/** Unified diff of the vault file against a worktree copy. */
export class WorktreesDiffView extends ItemView {
	private readonly runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>
	private copy: WorktreeFileCopy | null = null

	constructor(leaf: WorkspaceLeaf, runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>) {
		super(leaf)
		this.runtime = runtime
	}

	override getViewType(): string {
		return WORKTREES_DIFF_VIEW_TYPE
	}

	override getDisplayText(): string {
		if (this.copy === null) {
			return 'Forest diff'
		}

		return `Diff: ${this.copy.branch ?? 'detached'}`
	}

	override getIcon(): string {
		return 'git-compare'
	}

	override async setState(state: unknown, result: ViewStateResult): Promise<void> {
		await super.setState(state, result)
		this.copy = Option.getOrNull(Schema.decodeUnknownOption(WorktreeFileCopy)(state))
		this.renderDiff()
	}

	override getState(): Record<string, unknown> {
		if (this.copy === null) {
			return {}
		}

		return Schema.encodeSync(WorktreeFileCopy)(this.copy)
	}

	private renderDiff(): void {
		this.contentEl.empty()
		const copy = this.copy

		if (copy === null) {
			this.contentEl.createDiv({
				cls: 'worktrees-diff-meta',
				text: 'Pick a worktree copy from a Forest command.',
			})

			return
		}

		const vaultAbsolutePath = worktreesVaultAbsoluteFilePath(this.app, copy.vaultRelativePath)
		const vaultBasePath = worktreesVaultBasePath(this.app)

		this.contentEl.createDiv({
			cls: 'worktrees-diff-meta',
			text: `${copy.branch ?? 'detached'} · ${copy.absolutePath}`,
		})
		const preEl = this.contentEl.createEl('pre', { cls: 'worktrees-diff-text' })

		if (vaultAbsolutePath === null || vaultBasePath === null) {
			preEl.setText('Forest: vault is not a local folder.')

			return
		}

		this.runtime.runFork(
			diffVaultFileAgainstWorktreeCopy({
				vaultBasePath,
				vaultAbsolutePath,
				worktreeAbsolutePath: copy.absolutePath,
			}).pipe(
				Effect.tap((diffText) =>
					Effect.sync(() => {
						preEl.setText(diffText === '' ? 'No difference.' : diffText)
					}),
				),
				Effect.tapError((error) =>
					Effect.sync(() => {
						preEl.setText(error.message)
					}),
				),
			),
		)
	}
}
