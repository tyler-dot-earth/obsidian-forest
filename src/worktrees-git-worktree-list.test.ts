import { assert, describe, it } from '@effect/vitest'

import {
	gitWorktreesOutsideVault,
	parseGitWorktreeListPorcelain,
} from '#/src/worktrees-git-worktree-list'

const samplePorcelain = `worktree /tmp/vault
HEAD abc123
branch refs/heads/main

worktree /tmp/worktree/feature
HEAD def456
branch refs/heads/feature

worktree /tmp/detached
HEAD 999aaa
detached
`

describe('parseGitWorktreeListPorcelain', () => {
	it('parses main, linked, and detached worktrees', () => {
		const worktrees = parseGitWorktreeListPorcelain(samplePorcelain)

		assert.strictEqual(worktrees.length, 3)
		assert.strictEqual(worktrees[0]?.path, '/tmp/vault')
		assert.strictEqual(worktrees[0]?.branch, 'main')
		assert.strictEqual(worktrees[1]?.path, '/tmp/worktree/feature')
		assert.strictEqual(worktrees[1]?.branch, 'feature')
		assert.strictEqual(worktrees[2]?.branch, null)
		assert.strictEqual(worktrees[2]?.head, '999aaa')
	})
})

describe('gitWorktreesOutsideVault', () => {
	it('drops the vault checkout', () => {
		const worktrees = gitWorktreesOutsideVault(
			parseGitWorktreeListPorcelain(samplePorcelain),
			'/tmp/vault/',
		)

		assert.deepStrictEqual(
			worktrees.map((worktree) => worktree.path),
			['/tmp/worktree/feature', '/tmp/detached'],
		)
	})
})
