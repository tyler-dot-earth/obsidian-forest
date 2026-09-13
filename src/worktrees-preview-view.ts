import { Effect, type ManagedRuntime, Option, Schema } from 'effect'
import type { PluginDataStore } from 'effect-obsidian'
import { ItemView, MarkdownRenderer } from 'obsidian'
import type { ViewStateResult, WorkspaceLeaf } from 'obsidian'

import { WorktreeFileCopy } from '#/src/worktrees-list-copies'
import { readWorktreeCopyFile } from '#/src/worktrees-read-copy-file'
import { worktreesReadableLineLengthEnabled } from '#/src/worktrees-readable-line-length'

/** ItemView type id for a rendered worktree copy. */
export const WORKTREES_PREVIEW_VIEW_TYPE = 'forest-preview'

/** Read-only markdown preview of a file that lives outside the vault. */
export class WorktreesPreviewView extends ItemView {
	private readonly runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>
	private copy: WorktreeFileCopy | null = null

	constructor(leaf: WorkspaceLeaf, runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>) {
		super(leaf)
		this.runtime = runtime
	}

	override getViewType(): string {
		return WORKTREES_PREVIEW_VIEW_TYPE
	}

	override getDisplayText(): string {
		if (this.copy === null) {
			return 'Forest preview'
		}

		return `Worktree: ${this.copy.branch ?? 'detached'}`
	}

	override getIcon(): string {
		return 'files'
	}

	override async setState(state: unknown, result: ViewStateResult): Promise<void> {
		await super.setState(state, result)
		this.copy = Option.getOrNull(Schema.decodeUnknownOption(WorktreeFileCopy)(state))
		this.renderPreview()
	}

	override getState(): Record<string, unknown> {
		if (this.copy === null) {
			return {}
		}

		return Schema.encodeSync(WorktreeFileCopy)(this.copy)
	}

	private renderPreview(): void {
		this.contentEl.empty()
		this.contentEl.addClass('worktrees-preview-root')
		const readableLineLength = worktreesReadableLineLengthEnabled(this.app)
		this.contentEl.toggleClass('is-readable-line-width', readableLineLength)

		const copy = this.copy

		if (copy === null) {
			this.contentEl.createDiv({
				cls: 'worktrees-preview-meta',
				text: 'Pick a worktree copy from a Forest command.',
			})

			return
		}

		this.contentEl.createDiv({
			cls: 'worktrees-preview-meta',
			text: `${copy.branch ?? 'detached'} · ${copy.absolutePath}`,
		})

		const previewEl = this.contentEl.createDiv({
			cls: 'worktrees-preview markdown-preview-view markdown-rendered',
		})

		previewEl.toggleClass('is-readable-line-width', readableLineLength)

		const markdownEl = previewEl.createDiv({ cls: 'markdown-preview-sizer' })

		this.runtime.runFork(
			readWorktreeCopyFile(copy.absolutePath).pipe(
				Effect.tap((markdown) =>
					Effect.promise(() =>
						MarkdownRenderer.render(this.app, markdown, markdownEl, copy.vaultRelativePath, this),
					),
				),
				Effect.tapError((error) =>
					Effect.sync(() => {
						markdownEl.setText(error.message)
					}),
				),
			),
		)
	}
}
