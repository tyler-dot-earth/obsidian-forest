import { join as joinPath } from 'node:path'

import { Array, Result, Schema } from 'effect'

import type { GitWorktree } from '#src/worktrees-git-worktree-list'

/** A file that exists in a worktree at the same vault-relative path. */
export const WorktreeFileCopy = Schema.Struct({
	worktreePath: Schema.String,
	head: Schema.String,
	branch: Schema.NullOr(Schema.String),
	absolutePath: Schema.String,
	vaultRelativePath: Schema.String,
})

export interface WorktreeFileCopy extends Schema.Schema.Type<typeof WorktreeFileCopy> {}

/** Joins a worktree root with a vault-relative path using the host path rules. */
export const worktreeAbsolutePathForVaultFile = (
	worktreePath: string,
	vaultRelativePath: string,
): string => joinPath(worktreePath, ...vaultRelativePath.split('/'))

/** Keeps worktrees whose copy of the vault file exists on disk. */
export const worktreeCopiesForExistingPaths = (
	worktrees: readonly GitWorktree[],
	vaultRelativePath: string,
	existingAbsolutePaths: ReadonlySet<string>,
): readonly WorktreeFileCopy[] =>
	Array.filterMap(worktrees, (worktree) => {
		const absolutePath = worktreeAbsolutePathForVaultFile(worktree.path, vaultRelativePath)

		if (!existingAbsolutePaths.has(absolutePath)) {
			return Result.failVoid
		}

		return Result.succeed(
			WorktreeFileCopy.make({
				worktreePath: worktree.path,
				head: worktree.head,
				branch: worktree.branch,
				absolutePath,
				vaultRelativePath,
			}),
		)
	})
