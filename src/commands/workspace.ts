import chalk from "chalk";
import {
	addRepo,
	listRepos,
	removeRepo,
	resolveRepoName,
} from "../utils/workspace.js";
import type { WorkspaceRepo } from "../types.js";

export function workspaceAddCommand(
	url: string,
	opts: { branch?: string; name?: string },
): void {
	const entry: WorkspaceRepo = { url, ...opts };
	try {
		addRepo(entry);
		const name = resolveRepoName(entry);
		console.log(chalk.green(`✓ Added "${name}" to workspace`));
		console.log(chalk.dim(`  url: ${url}`));
		if (opts.branch) console.log(chalk.dim(`  branch: ${opts.branch}`));
	} catch (error) {
		console.error(
			chalk.red(
				`✗ ${error instanceof Error ? error.message : "Failed to add repo"}`,
			),
		);
		process.exit(1);
	}
}

export function workspaceListCommand(): void {
	const repos = listRepos();
	if (repos.length === 0) {
		console.log(chalk.dim("No repositories configured."));
		console.log(chalk.dim("Run: sith workspace add <url>"));
		return;
	}
	console.log(chalk.bold(`Workspace repositories (${repos.length}):`));
	console.log();
	for (const repo of repos) {
		const name = resolveRepoName(repo);
		console.log(`  ${chalk.cyan(name)}`);
		console.log(chalk.dim(`    ${repo.url}${repo.branch ? ` @ ${repo.branch}` : ""}`));
	}
}

export function workspaceRemoveCommand(name: string): void {
	try {
		removeRepo(name);
		console.log(chalk.green(`✓ Removed "${name}" from workspace`));
	} catch (error) {
		console.error(
			chalk.red(
				`✗ ${error instanceof Error ? error.message : "Failed to remove repo"}`,
			),
		);
		process.exit(1);
	}
}
