import type { App, Vault } from 'obsidian'

/** Vault.getConfig is what MarkdownView uses for readable line length. Not in the public typings. */
interface VaultWithReadableLineLengthConfig extends Vault {
	readonly getConfig: (key: 'readableLineLength') => boolean
}

const vaultHasReadableLineLengthConfig = (
	vault: Vault,
): vault is VaultWithReadableLineLengthConfig => 'getConfig' in vault

/** Whether Editor → Readable line length is on. Defaults to true, matching Obsidian's own default. */
export const worktreesReadableLineLengthEnabled = (app: App): boolean => {
	if (!vaultHasReadableLineLengthConfig(app.vault)) {
		return true
	}

	return app.vault.getConfig('readableLineLength')
}
