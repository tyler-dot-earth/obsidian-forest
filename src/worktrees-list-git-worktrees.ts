import { Effect } from 'effect'

import { WorktreesGitError } from '#src/worktrees-errors'
import { worktreesExecFile } from '#src/worktrees-exec-file'
import {
	type GitWorktree,
	gitWorktreesOutsideVault,
	parseGitWorktreeListPorcelain,
} from '#src/worktrees-git-worktree-list'

/** Runs `git worktree list --porcelain` in the vault and drops the vault checkout. */
export const listGitWorktreesOutsideVault: (input: {
	readonly vaultBasePath: string
}) => Effect.Effect<readonly GitWorktree[], WorktreesGitError> = Effect.fn(
	'Worktrees.listGitWorktrees',
)(function* (input) {
	const result = yield* worktreesExecFile({
		command: 'git',
		args: ['-C', input.vaultBasePath, 'worktree', 'list', '--porcelain'],
		cwd: input.vaultBasePath,
	})

	return gitWorktreesOutsideVault(parseGitWorktreeListPorcelain(result.stdout), input.vaultBasePath)
})
