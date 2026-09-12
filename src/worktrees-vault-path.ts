import { FileSystemAdapter } from 'obsidian'
import type { App } from 'obsidian'

/** Absolute folder of the vault when it is a local disk folder. */
export const worktreesVaultBasePath = (app: App): string | null => {
	const adapter = app.vault.adapter

	if (adapter instanceof FileSystemAdapter) {
		return adapter.getBasePath()
	}

	return null
}

/** Absolute path of a vault file on disk. */
export const worktreesVaultAbsoluteFilePath = (
	app: App,
	vaultRelativePath: string,
): string | null => {
	const basePath = worktreesVaultBasePath(app)

	if (basePath === null) {
		return null
	}

	return `${basePath.replace(/\/$/, '')}/${vaultRelativePath}`
}
