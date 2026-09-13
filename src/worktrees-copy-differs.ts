import { Effect } from 'effect'

import { WorktreesGitError } from '#/src/worktrees-errors'
import { worktreesExecFile } from '#/src/worktrees-exec-file'

/** True when the worktree file is not identical to the vault file. */
export const worktreeCopyDiffersFromVault: (input: {
	readonly vaultBasePath: string
	readonly vaultAbsolutePath: string
	readonly worktreeAbsolutePath: string
}) => Effect.Effect<boolean, WorktreesGitError> = Effect.fn('Worktrees.copyDiffers')(
	function* (input) {
		const result = yield* worktreesExecFile({
			command: 'git',
			args: [
				'-C',
				input.vaultBasePath,
				'diff',
				'--no-index',
				'--quiet',
				'--',
				input.vaultAbsolutePath,
				input.worktreeAbsolutePath,
			],
			cwd: input.vaultBasePath,
		})

		return result.exitCode !== 0
	},
)
