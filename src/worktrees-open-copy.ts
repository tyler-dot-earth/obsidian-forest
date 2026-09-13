import process from 'node:process'

import { Effect, Match } from 'effect'

import { WorktreesGitError } from '#/src/worktrees-errors'
import { worktreesExecFile } from '#/src/worktrees-exec-file'

/** Opens a worktree file with the OS default app. */
export const openWorktreeCopyInDefaultApp: (input: {
	readonly absolutePath: string
	readonly vaultBasePath: string
}) => Effect.Effect<void, WorktreesGitError> = Effect.fn('Worktrees.openCopy')(function* (input) {
	const command = Match.value(process.platform).pipe(
		Match.when('darwin', () => 'open'),
		Match.orElse(() => 'xdg-open'),
	)

	yield* worktreesExecFile({
		command,
		args: [input.absolutePath],
		cwd: input.vaultBasePath,
	})
})
