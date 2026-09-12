import { Effect } from 'effect'

import { WorktreesGitError } from '#src/worktrees-errors'
import { worktreesExecFile } from '#src/worktrees-exec-file'

/** Unified diff of the vault file against a worktree copy. Empty when they match. */
export const diffVaultFileAgainstWorktreeCopy: (input: {
	readonly vaultBasePath: string
	readonly vaultAbsolutePath: string
	readonly worktreeAbsolutePath: string
}) => Effect.Effect<string, WorktreesGitError> = Effect.fn('Worktrees.diffCopy')(function* (input) {
	const result = yield* worktreesExecFile({
		command: 'git',
		args: [
			'-C',
			input.vaultBasePath,
			'diff',
			'--no-index',
			'--',
			input.vaultAbsolutePath,
			input.worktreeAbsolutePath,
		],
		cwd: input.vaultBasePath,
	})

	return result.stdout
})
