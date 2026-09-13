import { Effect } from 'effect'

import { WorktreesGitError } from '#/src/worktrees-errors'
import { worktreePathExists } from '#/src/worktrees-file-exists'
import {
	type WorktreeFileCopy,
	worktreeAbsolutePathForVaultFile,
	worktreeCopiesForExistingPaths,
} from '#/src/worktrees-list-copies'
import { listGitWorktreesOutsideVault } from '#/src/worktrees-list-git-worktrees'

/** Lists worktree copies of a vault-relative file that exist on disk. */
export const listWorktreeCopiesForVaultFile: (input: {
	readonly vaultBasePath: string
	readonly vaultRelativePath: string
}) => Effect.Effect<readonly WorktreeFileCopy[], WorktreesGitError> = Effect.fn(
	'Worktrees.listCopiesForFile',
)(function* (input) {
	const worktrees = yield* listGitWorktreesOutsideVault({
		vaultBasePath: input.vaultBasePath,
	})

	const existingAbsolutePaths = new Set<string>()

	for (const worktree of worktrees) {
		const absolutePath = worktreeAbsolutePathForVaultFile(worktree.path, input.vaultRelativePath)
		const exists = yield* worktreePathExists(absolutePath)

		if (exists) {
			existingAbsolutePaths.add(absolutePath)
		}
	}

	return worktreeCopiesForExistingPaths(worktrees, input.vaultRelativePath, existingAbsolutePaths)
})
