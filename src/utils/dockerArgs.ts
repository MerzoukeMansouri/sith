import { DOCKER_CONFIG } from "../config.js";
import { getOpenCodeConfigPath, getSkillsDir } from "./skills.js";

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
