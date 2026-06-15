export type SlashCommandType =
	| "shell"
	| "config"
	| "help"
	| "skills"
	| "repos"
	| "opencode"
	| "claude";

export interface SlashCommand {
	type: SlashCommandType;
	raw: string;
}

export function parseSlashCommand(input: string): SlashCommand | null {
	const trimmed = input.trim();

	if (!trimmed.startsWith("/")) {
		return null;
	}

	const command = trimmed.slice(1).toLowerCase();

	switch (command) {
		case "shell":
			return { type: "shell", raw: trimmed };
		case "config":
			return { type: "config", raw: trimmed };
		case "help":
			return { type: "help", raw: trimmed };
		case "skills":
			return { type: "skills", raw: trimmed };
		case "repos":
		case "repositories":
			return { type: "repos", raw: trimmed };
		case "opencode":
			return { type: "opencode", raw: trimmed };
		case "claude":
			return { type: "claude", raw: trimmed };
		default:
			return null;
	}
}

export function getAvailableCommands(): Array<{
	command: string;
	description: string;
}> {
	return [
		{ command: "/opencode", description: "Switch to OpenCode" },
		{ command: "/claude", description: "Switch to Claude Code" },
		{ command: "/shell", description: "Start Docker shell" },
		{ command: "/skills", description: "Install/uninstall skills" },
		{ command: "/repos", description: "Manage workspace repositories" },
		{ command: "/config", description: "Open configuration menu" },
		{ command: "/help", description: "Show available commands" },
	];
}
