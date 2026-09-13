import { Effect } from 'effect'

import { worktreeCopyDiffersFromVault } from '#/src/worktrees-copy-differs'
import { WorktreesGitError } from '#/src/worktrees-errors'
import type { WorktreeFileCopy } from '#/src/worktrees-list-copies'
import { listWorktreeCopiesForVaultFile } from '#/src/worktrees-list-copies-for-file'

/** A worktree copy plus whether it differs from the vault file. */
export interface WorktreeCopyListing {
	readonly copy: WorktreeFileCopy
	readonly differs: boolean
}

/** Lists copies of a vault file and whether each copy differs. */
export const listWorktreeCopyListingsForVaultFile: (input: {
	readonly vaultBasePath: string
	readonly vaultAbsolutePath: string
	readonly vaultRelativePath: string
}) => Effect.Effect<readonly WorktreeCopyListing[], WorktreesGitError> = Effect.fn(
	'Worktrees.listCopyListingsForFile',
)(function* (input) {
	const copies = yield* listWorktreeCopiesForVaultFile({
		vaultBasePath: input.vaultBasePath,
		vaultRelativePath: input.vaultRelativePath,
	})

	const listings: WorktreeCopyListing[] = []

	for (const copy of copies) {
		const differs = yield* worktreeCopyDiffersFromVault({
			vaultBasePath: input.vaultBasePath,
			vaultAbsolutePath: input.vaultAbsolutePath,
			worktreeAbsolutePath: copy.absolutePath,
		}).pipe(Effect.orElseSucceed(() => false))

		listings.push({ copy, differs })
	}

	return listings
})
