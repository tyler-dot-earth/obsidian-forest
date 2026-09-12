import { assert, describe, it } from '@effect/vitest'

import { GitWorktree } from '#src/worktrees-git-worktree-list'
import {
	worktreeAbsolutePathForVaultFile,
	worktreeCopiesForExistingPaths,
} from '#src/worktrees-list-copies'

describe('worktreeAbsolutePathForVaultFile', () => {
	it('joins vault-relative segments onto the worktree root', () => {
		assert.strictEqual(
			worktreeAbsolutePathForVaultFile('/tmp/worktree/feature', 'notes/alpha.md'),
			'/tmp/worktree/feature/notes/alpha.md',
		)
	})
})

describe('worktreeCopiesForExistingPaths', () => {
	it('keeps worktrees that have the file', () => {
		const worktree = GitWorktree.make({
			path: '/wt/a',
			head: 'abc',
			branch: 'a',
			bare: false,
		})

		const absolutePath = worktreeAbsolutePathForVaultFile('/wt/a', 'note.md')
		const copies = worktreeCopiesForExistingPaths([worktree], 'note.md', new Set([absolutePath]))

		assert.strictEqual(copies.length, 1)
		assert.strictEqual(copies[0]?.branch, 'a')
	})

	it('drops worktrees that lack the file', () => {
		const worktree = GitWorktree.make({
			path: '/wt/a',
			head: 'abc',
			branch: 'a',
			bare: false,
		})

		const copies = worktreeCopiesForExistingPaths([worktree], 'note.md', new Set())

		assert.strictEqual(copies.length, 0)
	})
})
