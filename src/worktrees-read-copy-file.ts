import { readFile } from 'node:fs/promises'

import { Effect } from 'effect'

import { WorktreesFileReadError, worktreesErrorMessage } from '#/src/worktrees-errors'

/** Reads a worktree file as UTF-8 text. */
export const readWorktreeCopyFile: (
	absolutePath: string,
) => Effect.Effect<string, WorktreesFileReadError> = Effect.fn('Worktrees.readCopyFile')(
	function* (absolutePath) {
		return yield* Effect.tryPromise({
			try: () => readFile(absolutePath, 'utf8'),
			catch: (cause) =>
				new WorktreesFileReadError({
					message: `Worktrees.readCopyFile failed: ${worktreesErrorMessage(cause)}`,
				}),
		})
	},
)
