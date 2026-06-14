import { execa } from "execa";
import { DOCKER_CONFIG } from "../config.js";
import {
	buildDockerClaudeCodeCommand,
	buildDockerOpencodeCommand,
	buildDockerShellCommand,
} from "./dockerArgs.js";
import { getGitHubToken } from "./githubToken.js";

function getClaudeOauthToken(): string {
	return process.env.CLAUDE_CODE_OAUTH_TOKEN || "";
}

export async function launchShell(): Promise<void> {
	console.log("🚀 Starting Docker shell...");
	console.log(`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`);
	console.log('Press Ctrl+D or type "exit" to leave');
	console.log();

	const githubToken = await getGitHubToken();
	const dockerArgs = buildDockerShellCommand(
		githubToken,
		getClaudeOauthToken(),
	);

	await execa("docker", dockerArgs, { stdio: "inherit", reject: false });

	console.log();
	console.log("✅ Exited shell");
}

export async function launchOpencode(prompt?: string): Promise<void> {
	console.log("🚀 Starting OpenCode...");
	console.log(`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`);
	if (prompt) console.log(`Prompt: ${prompt}`);
	console.log();

	const githubToken = await getGitHubToken();
	const dockerArgs = buildDockerOpencodeCommand(
		githubToken,
		prompt,
		getClaudeOauthToken(),
	);

	try {
		await execa("docker", dockerArgs, { stdio: "inherit" });
		console.log();
		console.log("✅ Exited OpenCode");
	} catch (error) {
		console.error(
			`❌ ${error instanceof Error ? error.message : "Failed to start OpenCode"}`,
		);
		process.exit(1);
	}
}

export async function launchClaude(prompt?: string): Promise<void> {
	console.log("🤖 Starting Claude Code...");
	console.log(`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`);
	if (prompt) console.log(`Prompt: ${prompt}`);
	console.log();

	const githubToken = await getGitHubToken();
	const dockerArgs = buildDockerClaudeCodeCommand(
		githubToken,
		prompt,
		getClaudeOauthToken(),
	);

	try {
		await execa("docker", dockerArgs, { stdio: "inherit" });
		console.log();
		console.log("✅ Exited Claude Code");
	} catch (error) {
		console.error(
			`❌ ${error instanceof Error ? error.message : "Failed to start Claude Code"}`,
		);
		process.exit(1);
	}
}
