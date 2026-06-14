import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import chalk from "chalk";
import { DOCKER_CONFIG } from "../config.js";

async function confirm(question: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.toLowerCase() === "y");
		});
	});
}

export async function dockerCleanupCommand() {
	console.log(chalk.cyan("Cleaning up sith Docker images..."));

	const images = [DOCKER_CONFIG.imageName, DOCKER_CONFIG.prebuiltImage];
	let removed = 0;

	for (const image of images) {
		try {
			execSync(`docker image inspect ${image} 2>/dev/null`, {
				stdio: "ignore",
			});
			console.log(chalk.dim(`  Removing ${image}...`));
			execSync(`docker rmi ${image}`, { stdio: "inherit" });
			removed++;
		} catch {
			// image not present
		}
	}

	if (removed === 0) {
		console.log(chalk.yellow("No sith Docker images found."));
	} else {
		console.log(chalk.green(`✓ Removed ${removed} image(s).`));
	}
}

export async function nixCleanupCommand() {
	const nixDir = join(homedir(), ".sith", "nix");

	console.log(chalk.cyan("Cleaning up sith Nix files..."));

	if (existsSync(nixDir)) {
		rmSync(nixDir, { recursive: true, force: true });
		console.log(chalk.green(`✓ Removed ${nixDir}`));
	} else {
		console.log(chalk.yellow(`${nixDir} not found — nothing to remove.`));
	}

	console.log(chalk.cyan("Running nix-collect-garbage..."));
	try {
		execSync("nix-collect-garbage -d", { stdio: "inherit" });
		console.log(chalk.green("✓ Nix store garbage collected."));
	} catch {
		console.log(
			chalk.yellow("nix-collect-garbage failed — Nix may not be installed."),
		);
	}
}

export async function nixUninstallCommand() {
	console.log(chalk.yellow("This will fully remove Nix from your system:"));
	console.log(chalk.dim("  /nix/store, Nix daemon, shell profile entries"));
	console.log();

	const ok = await confirm(chalk.red("Continue? [y/N] "));
	if (!ok) {
		console.log(chalk.dim("Aborted."));
		return;
	}

	const platform = process.platform;

	if (platform === "darwin") {
		console.log(chalk.cyan("Uninstalling Nix (macOS multi-user)..."));
		try {
			// Official macOS uninstall sequence
			execSync(
				"sudo launchctl unload /Library/LaunchDaemons/org.nixos.nix-daemon.plist 2>/dev/null || true",
				{ stdio: "inherit" },
			);
			execSync("sudo rm -f /Library/LaunchDaemons/org.nixos.nix-daemon.plist", {
				stdio: "inherit",
			});
			execSync(
				"sudo diskutil apfs deleteVolume /nix 2>/dev/null || sudo rm -rf /nix",
				{ stdio: "inherit" },
			);
			execSync(
				"sudo rm -rf /etc/nix /etc/profile.d/nix.sh /etc/bashrc.d/nix.sh",
				{ stdio: "inherit" },
			);
			console.log(
				chalk.green(
					"✓ Nix removed. Remove nix lines from ~/.zshrc / ~/.bashrc manually if present.",
				),
			);
		} catch (_e) {
			console.log(
				chalk.red("Uninstall failed. Run with sudo or check errors above."),
			);
		}
	} else if (platform === "linux") {
		console.log(chalk.cyan("Uninstalling Nix (Linux)..."));
		try {
			execSync("sudo systemctl stop nix-daemon 2>/dev/null || true", {
				stdio: "inherit",
			});
			execSync("sudo systemctl disable nix-daemon 2>/dev/null || true", {
				stdio: "inherit",
			});
			execSync("sudo rm -rf /nix /etc/nix", { stdio: "inherit" });
			console.log(
				chalk.green(
					"✓ Nix removed. Remove nix lines from ~/.profile / ~/.bashrc manually if present.",
				),
			);
		} catch {
			console.log(
				chalk.red("Uninstall failed. Run with sudo or check errors above."),
			);
		}
	} else {
		console.log(
			chalk.red(`Unsupported platform: ${platform}. Uninstall manually.`),
		);
	}
}

export async function uninstallCommand() {
	const sithDir = join(homedir(), ".sith");

	console.log(chalk.yellow("This will delete:"));
	console.log(chalk.dim(`  ${sithDir}  (skills, config, nix files)`));
	console.log();

	const ok = await confirm(chalk.red("Continue? [y/N] "));
	if (!ok) {
		console.log(chalk.dim("Aborted."));
		return;
	}

	if (existsSync(sithDir)) {
		rmSync(sithDir, { recursive: true, force: true });
		console.log(chalk.green(`✓ Removed ${sithDir}`));
	} else {
		console.log(chalk.yellow(`${sithDir} not found — nothing to remove.`));
	}

	console.log();
	console.log(
		chalk.dim(`Run ${chalk.bold("npm uninstall -g sith")} to remove the CLI.`),
	);
}
