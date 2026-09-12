import { FuzzySuggestModal } from 'obsidian'
import type { App } from 'obsidian'

import type { WorktreeFileCopy } from '#src/worktrees-list-copies'

/** Picks one worktree copy of the active note. */
export class WorktreesCopySuggestModal extends FuzzySuggestModal<WorktreeFileCopy> {
	private readonly copies: readonly WorktreeFileCopy[]
	private readonly onPick: (copy: WorktreeFileCopy) => void

	constructor(
		app: App,
		copies: readonly WorktreeFileCopy[],
		onPick: (copy: WorktreeFileCopy) => void,
	) {
		super(app)
		this.copies = copies
		this.onPick = onPick
		this.setPlaceholder('Worktree copy')
	}

	override getItems(): WorktreeFileCopy[] {
		return [...this.copies]
	}

	override getItemText(copy: WorktreeFileCopy): string {
		const branch = copy.branch ?? 'detached'

		return `${branch}  ${copy.worktreePath}`
	}

	override onChooseItem(copy: WorktreeFileCopy): void {
		this.onPick(copy)
	}
}
