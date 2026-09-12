import { execFile as execFileCallback } from 'node:child_process'

import { Effect, Predicate } from 'effect'

import { WorktreesGitError, worktreesErrorMessage } from '#src/worktrees-errors'

/** Result of a git (or other) process. Exit code 1 is kept for `git diff --no-index`. */
export interface WorktreesExecResult {
	readonly stdout: string
	readonly exitCode: number
}

const worktreesExecResult = (stdout: string, exitCode: number): WorktreesExecResult => ({
	stdout,
	exitCode,
})

/** Runs an executable and captures stdout. */
export const worktreesExecFile: (input: {
	readonly command: string
	readonly args: readonly string[]
	readonly cwd: string
}) => Effect.Effect<WorktreesExecResult, WorktreesGitError> = Effect.fn('Worktrees.execFile')(
	function* (input) {
		return yield* Effect.tryPromise({
			try: () =>
				new Promise<WorktreesExecResult>((resolve, reject) => {
					execFileCallback(
						input.command,
						[...input.args],
						{ cwd: input.cwd, encoding: 'utf8' },
						(error, stdout) => {
							if (error !== null) {
								const exitCode = worktreesExecExitCode(error)

								if (exitCode === 1) {
									resolve(worktreesExecResult(stdout, 1))

									return
								}

								reject(error)

								return
							}

							resolve(worktreesExecResult(stdout, 0))
						},
					)
				}),
			catch: (cause) =>
				new WorktreesGitError({
					message: `Worktrees.execFile failed: ${worktreesErrorMessage(cause)}`,
				}),
		})
	},
)

const worktreesExecExitCode = (error: Error): number | null => {
	if (!('code' in error)) {
		return null
	}

	const code = error.code

	return Predicate.isNumber(code) ? code : null
}
