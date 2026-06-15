import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { WorkspaceConfig, WorkspaceRepo } from "../types.js";

export function getWorkspaceConfigPath(): string {
	const configPath = path.join(os.homedir(), ".sith", "workspace.json");
	try {
		if (fs.statSync(configPath).isDirectory()) {
			fs.rmSync(configPath, { recursive: true, force: true });
		}
	} catch {
		// doesn't exist yet
	}
	fs.mkdirSync(path.dirname(configPath), { recursive: true });
	try {
		fs.writeFileSync(configPath, JSON.stringify({ repos: [] }, null, 2), {
			flag: "ax",
		});
	} catch {
		// already exists
	}
	return configPath;
}

export function readWorkspaceConfig(): WorkspaceConfig {
	try {
		const raw = fs.readFileSync(getWorkspaceConfigPath(), "utf-8");
		const parsed = JSON.parse(raw);
		return { repos: Array.isArray(parsed?.repos) ? parsed.repos : [] };
	} catch {
		return { repos: [] };
	}
}

export function writeWorkspaceConfig(config: WorkspaceConfig): void {
	fs.writeFileSync(
		getWorkspaceConfigPath(),
		JSON.stringify(config, null, 2),
		"utf-8",
	);
}

export function resolveRepoName(repo: WorkspaceRepo): string {
	return repo.name ?? path.basename(repo.url).replace(/\.git$/, "");
}

export function addRepo(entry: WorkspaceRepo): void {
	const config = readWorkspaceConfig();
	const name = resolveRepoName(entry);
	if (config.repos.some((r) => resolveRepoName(r) === name)) {
		throw new Error(`Repo "${name}" already in workspace`);
	}
	config.repos.push(entry);
	writeWorkspaceConfig(config);
}

export function removeRepo(name: string): void {
	const config = readWorkspaceConfig();
	const before = config.repos.length;
	config.repos = config.repos.filter((r) => resolveRepoName(r) !== name);
	if (config.repos.length === before) {
		throw new Error(`Repo "${name}" not found in workspace`);
	}
	writeWorkspaceConfig(config);
}

export function listRepos(): WorkspaceRepo[] {
	return readWorkspaceConfig().repos;
}
