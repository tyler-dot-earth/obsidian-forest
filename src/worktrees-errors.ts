import { Schema } from 'effect'

/** Git worktree list or git diff failed. */
export class WorktreesGitError extends Schema.TaggedError<WorktreesGitError>()(
	'WorktreesGitError',
	{
		message: Schema.String,
	},
) {}

/** Reading a worktree file from disk failed. */
export class WorktreesFileReadError extends Schema.TaggedError<WorktreesFileReadError>()(
	'WorktreesFileReadError',
	{
		message: Schema.String,
	},
) {}

/** The vault is not a local folder, so worktrees cannot be resolved. */
export class WorktreesVaultPathError extends Schema.TaggedError<WorktreesVaultPathError>()(
	'WorktreesVaultPathError',
	{
		message: Schema.String,
	},
) {}

/** Turns an unknown throw into a message for a tagged Worktrees error. */
export const worktreesErrorMessage = (cause: unknown): string =>
	cause instanceof Error ? cause.message : String(cause)
