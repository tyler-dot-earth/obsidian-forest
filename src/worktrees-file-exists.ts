import { access } from 'node:fs/promises'

import { Effect } from 'effect'

/** True when the absolute path exists on disk. */
export const worktreePathExists: (absolutePath: string) => Effect.Effect<boolean> = Effect.fn(
	'Worktrees.pathExists',
)(function* (absolutePath) {
	return yield* Effect.tryPromise({
		try: () => access(absolutePath).then(() => true),
		catch: () => new Error('Worktrees.pathExists: missing'),
	}).pipe(Effect.orElseSucceed(() => false))
})
