import { Array, Schema } from 'effect'

/** One checkout from `git worktree list --porcelain`. */
export const GitWorktree = Schema.Struct({
	path: Schema.String,
	head: Schema.String,
	branch: Schema.NullOr(Schema.String),
	bare: Schema.Boolean,
})

export interface GitWorktree extends Schema.Schema.Type<typeof GitWorktree> {}

type GitWorktreeDraft = {
	path: string
	head: string
	branch: string | null
	bare: boolean
}

const emptyWorktreeDraft = (): GitWorktreeDraft => ({
	path: '',
	head: '',
	branch: null,
	bare: false,
})

const finishWorktreeDraft = (draft: GitWorktreeDraft): GitWorktree | null => {
	if (draft.path === '') {
		return null
	}

	return GitWorktree.make({
		path: draft.path,
		head: draft.head,
		branch: draft.branch,
		bare: draft.bare,
	})
}

/** Parses `git worktree list --porcelain` into worktree records. */
export const parseGitWorktreeListPorcelain = (stdout: string): readonly GitWorktree[] => {
	const worktrees: GitWorktree[] = []
	let draft = emptyWorktreeDraft()

	for (const rawLine of stdout.split('\n')) {
		const line = rawLine.trimEnd()

		if (line === '') {
			const finished = finishWorktreeDraft(draft)

			if (finished !== null) {
				worktrees.push(finished)
			}

			draft = emptyWorktreeDraft()
			continue
		}

		applyGitWorktreePorcelainLine(draft, line)
	}

	const trailing = finishWorktreeDraft(draft)

	if (trailing !== null) {
		worktrees.push(trailing)
	}

	return worktrees
}

const applyGitWorktreePorcelainLine = (draft: GitWorktreeDraft, line: string): void => {
	if (line.startsWith('worktree ')) {
		draft.path = line.slice('worktree '.length)

		return
	}

	if (line.startsWith('HEAD ')) {
		draft.head = line.slice('HEAD '.length)

		return
	}

	if (line.startsWith('branch ')) {
		draft.branch = stripGitBranchRef(line.slice('branch '.length))

		return
	}

	if (line === 'bare') {
		draft.bare = true
	}
}

const stripGitBranchRef = (ref: string): string => {
	if (ref.startsWith('refs/heads/')) {
		return ref.slice('refs/heads/'.length)
	}

	return ref
}

/** Drops the checkout that is the current vault, and any bare worktrees. */
export const gitWorktreesOutsideVault = (
	worktrees: readonly GitWorktree[],
	vaultBasePath: string,
): readonly GitWorktree[] =>
	Array.filter(
		worktrees,
		(worktree) => !worktree.bare && !pathsAreTheSameFolder(worktree.path, vaultBasePath),
	)

const pathsAreTheSameFolder = (left: string, right: string): boolean =>
	normalizeFolderPath(left) === normalizeFolderPath(right)

const normalizeFolderPath = (folderPath: string): string => {
	if (folderPath.length > 1 && folderPath.endsWith('/')) {
		return folderPath.slice(0, -1)
	}

	return folderPath
}
