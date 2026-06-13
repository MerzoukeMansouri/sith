import fs from "node:fs";
import { DOCKER_CONFIG } from "../config.js";
import {
	getClaudeConfigDir,
	getClaudeMdPath,
	getOpenCodeConfigPath,
	getSkillsDir,
} from "./skills.js";

export function buildDockerShellCommand(githubToken: string): string[] {
	return [
		"run",
		"--rm",
		"-it",
		"-v",
		`${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
		"-v",
		`${getSkillsDir()}:${DOCKER_CONFIG.skillsMount}`,
		"-v",
		`${getOpenCodeConfigPath()}:${DOCKER_CONFIG.opencodeConfigMount}`,
		"-e",
		`GITHUB_TOKEN=${githubToken}`,
		"--entrypoint",
		"nix-shell",
		DOCKER_CONFIG.imageName,
		DOCKER_CONFIG.shellEntrypoint,
	];
}

export function buildDockerOpencodeCommand(
	githubToken: string,
	prompt?: string,
): string[] {
	const args = [
		"run",
		"--rm",
		"-it",
		"-v",
		`${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
		"-v",
		`${getSkillsDir()}:${DOCKER_CONFIG.skillsMount}`,
		"-v",
		`${getOpenCodeConfigPath()}:${DOCKER_CONFIG.opencodeConfigMount}`,
		"-e",
		`GITHUB_TOKEN=${githubToken}`,
		"--entrypoint",
		"bash",
		DOCKER_CONFIG.imageName,
		"-c",
	];

	let opencodeCommand =
		"source /opt/sith/nix/nix-scripts/setup.sh && cd /workspace && opencode -m github-copilot/claude-sonnet-4.6";

	if (prompt) {
		const escapedPrompt = prompt.replace(/'/g, "'\\''");
		opencodeCommand += ` --prompt '${escapedPrompt}'`;
	}

	args.push(opencodeCommand);
	return args;
}

export function buildDockerClaudeCodeCommand(
	githubToken: string,
	prompt?: string,
): string[] {
	const claudeConfigDir = getClaudeConfigDir();
	const claudeMdPath = getClaudeMdPath();

	const args = [
		"run",
		"--rm",
		"-it",
		"-v",
		`${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
		"-e",
		`GITHUB_TOKEN=${githubToken}`,
	];

	// Mount ~/.claude first so subsequent mounts can shadow entries within it
	if (fs.existsSync(claudeConfigDir)) {
		args.push("-v", `${claudeConfigDir}:${DOCKER_CONFIG.claudeConfigMount}`);
	}

	// Skills dir overrides /root/.claude/skills inside the container
	args.push("-v", `${getSkillsDir()}:${DOCKER_CONFIG.claudeSkillsMount}`);
	// Generated CLAUDE.md (with skill @imports) overrides any CLAUDE.md from ~/.claude
	args.push(
		"-v",
		`${claudeMdPath}:${DOCKER_CONFIG.claudeConfigMount}/CLAUDE.md`,
	);

	args.push("--entrypoint", "bash", DOCKER_CONFIG.imageName, "-c");

	let claudeCommand =
		"source /opt/sith/nix/nix-scripts/setup.sh && cd /workspace && /root/.npm-global/bin/claude";

	if (prompt) {
		const escapedPrompt = prompt.replace(/'/g, "'\\''");
		claudeCommand += ` -p '${escapedPrompt}'`;
	}

	args.push(claudeCommand);
	return args;
}
