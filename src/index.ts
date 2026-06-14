#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { Command } from "commander";
import updateNotifier from "update-notifier";
import { dockerCommand } from "./commands/docker.js";
import { nixCommand, runNixShell } from "./commands/nix.js";
import { skillsCommand } from "./commands/skills.js";
import { renderTerminalUI } from "./components/TerminalUI.js";
import { launchClaude, launchOpencode, launchShell } from "./utils/launcher.js";

// Import package.json for version and update checks
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
	readFileSync(join(__dirname, "../package.json"), "utf-8"),
);

const PROGRAM_NAME = "sith";
const PROGRAM_VERSION = pkg.version;
const PROGRAM_DESCRIPTION =
	"Turn your context to the dark side. Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.";

// Check for updates (automatic background check)
const notifier = updateNotifier({ pkg });
notifier.notify();

async function checkForUpdates() {
	console.log(chalk.cyan("Checking for updates..."));

	// Force update check by setting updateCheckInterval to 0
	const notifier = updateNotifier({
		pkg,
		updateCheckInterval: 0,
	});

	// Fetch the latest version
	await notifier.fetchInfo();

	const update = notifier.update;

	if (update && update.latest !== pkg.version) {
		console.log();
		console.log(
			chalk.green(
				`Update available: ${chalk.dim(pkg.version)} → ${chalk.bold(update.latest)}`,
			),
		);
		console.log(
			chalk.cyan(`Run ${chalk.bold(`npm install -g ${pkg.name}`)} to update`),
		);
		console.log();
	} else {
		console.log(chalk.green(`✓ You're on the latest version (${pkg.version})`));
	}
}

function createProgram(): Command {
	const program = new Command();

	program
		.name(PROGRAM_NAME)
		.description(PROGRAM_DESCRIPTION)
		.version(PROGRAM_VERSION)
		.option("--pull", "Pull prebuilt Docker image (recommended)")
		.option("--build", "Build the Docker image from scratch")
		.option("--it", "Launch interactive shell in Docker container")
		.option("--nix", "Use native Nix shell (no Docker)")
		.option("--nix-install", "Install Nix package manager locally")
		.option("--update", "Check for updates");

	// Default action - show terminal UI
	program.action(async (options) => {
		if (options.update) {
			await checkForUpdates();
		} else if (options.nix) {
			await runNixShell();
		} else if (options.nixInstall) {
			await nixCommand({ install: true });
		} else if (options.it) {
			await launchShell();
		} else if (options.pull || options.build) {
			await dockerCommand(options);
		} else {
			// Default: show new terminal UI
			renderTerminalUI();
		}
	});

	// Shell command - direct interactive shell (bypasses menu)
	program
		.command("shell")
		.description("Run interactive shell in Docker container")
		.action(async () => {
			await launchShell();
		});

	// Skills command - install/uninstall skills from catalog
	program
		.command("skills")
		.description("Manage skills (~/.sith/skills/)")
		.action(() => {
			skillsCommand();
		});

	// Nix command - native Nix environment
	program
		.command("nix")
		.description("Manage native Nix environment")
		.option("--install", "Install Nix package manager")
		.option("--shell", "Run Nix shell")
		.action(async (options) => {
			await nixCommand(options);
		});

	// OpenCode command - launch OpenCode in Docker
	program
		.command("opencode")
		.description("Launch OpenCode in Docker")
		.option("-p, --prompt <prompt>", "Prompt to pass to OpenCode")
		.action(async (options) => {
			await launchOpencode(options.prompt);
		});

	// Claude command - launch Claude Code in Docker
	program
		.command("claude")
		.description("Launch Claude Code in Docker")
		.option("-p, --prompt <prompt>", "Prompt to pass to Claude Code")
		.action(async (options) => {
			await launchClaude(options.prompt);
		});

	return program;
}

// Main execution
const program = createProgram();
program.parse();
