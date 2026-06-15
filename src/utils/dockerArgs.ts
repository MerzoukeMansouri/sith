import fs from "node:fs";
import { DOCKER_CONFIG } from "../config.js";
import type { WorkspaceRepo } from "../types.js";
import {
	getClaudeMdPath,
	getOpenCodeConfigPath,
	getSkillsDir,
	syncClaudeMd,
} from "./skills.js";
import {
	getWorkspaceConfigPath,
	readWorkspaceConfig,
	resolveRepoName,
} from "./workspace.js";

function applyWorkspaceMounts(
	args: string[],
	repos: WorkspaceRepo[],
	configPath: string,
): void {
	const cloneRepos = repos.filter((r) => (r.mode ?? "clone") === "clone");
	const mountRepos = repos.filter((r) => r.mode === "mount" && r.localPath);

	if (cloneRepos.length > 0) {
		args.push(
			"-v", `${DOCKER_CONFIG.workspaceVolumeName}:${DOCKER_CONFIG.workspaceReposMount}`,
			"-v", `${configPath}:${DOCKER_CONFIG.workspaceConfigMount}:ro`,
		);
	}
	for (const repo of mountRepos) {
		const name = resolveRepoName(repo);
		args.push("-v", `${repo.localPath}:${DOCKER_CONFIG.workspaceReposMount}/${name}`);
	}
}

export function buildDockerShellCommand(
	githubToken: string,
	claudeOauthToken?: string,
): string[] {
	syncClaudeMd();
	const wsCfg = readWorkspaceConfig();
	const args = [
		"run",
		"--rm",
		"-it",
		"-v",
		`${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
		"-v",
		`${getSkillsDir()}:${DOCKER_CONFIG.skillsMount}`,
		"-v",
		`${getSkillsDir()}:${DOCKER_CONFIG.claudeSkillsMount}`,
		"-v",
		`${getClaudeMdPath()}:${DOCKER_CONFIG.claudeConfigMount}/CLAUDE.md`,
		"-v",
		`${getOpenCodeConfigPath()}:${DOCKER_CONFIG.opencodeConfigMount}`,
		"-e",
		`GITHUB_TOKEN=${githubToken}`,
	];
	if (wsCfg.repos.length > 0) {
		applyWorkspaceMounts(args, wsCfg.repos, getWorkspaceConfigPath());
	}
	if (claudeOauthToken) {
		args.push("-e", `CLAUDE_CODE_OAUTH_TOKEN=${claudeOauthToken}`);
	}
	args.push(
		"--entrypoint",
		"nix-shell",
		DOCKER_CONFIG.imageName,
		DOCKER_CONFIG.shellEntrypoint,
	);
	return args;
}

export function buildDockerOpencodeCommand(
	githubToken: string,
	prompt?: string,
	claudeOauthToken?: string,
): string[] {
	const wsCfg = readWorkspaceConfig();
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
	];
	if (wsCfg.repos.length > 0) {
		applyWorkspaceMounts(args, wsCfg.repos, getWorkspaceConfigPath());
	}
	if (claudeOauthToken) {
		args.push("-e", `CLAUDE_CODE_OAUTH_TOKEN=${claudeOauthToken}`);
	}
	args.push("--entrypoint", "bash", DOCKER_CONFIG.imageName, "-c");

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
	claudeOauthToken?: string,
): string[] {
	syncClaudeMd();
	const claudeMdPath = getClaudeMdPath();
	const wsCfg = readWorkspaceConfig();

	const args = [
		"run",
		"--rm",
		"-it",
		"-v",
		`${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
		"-e",
		`GITHUB_TOKEN=${githubToken}`,
	];
	if (wsCfg.repos.length > 0) {
		applyWorkspaceMounts(args, wsCfg.repos, getWorkspaceConfigPath());
	}
	if (claudeOauthToken) {
		args.push("-e", `CLAUDE_CODE_OAUTH_TOKEN=${claudeOauthToken}`);
	}

	// Mount only ~/.sith/ contents — never expose ~/.claude to the container
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
		claudeCommand += ` '${escapedPrompt}'`;
	}

	args.push(claudeCommand);
	return args;
}
