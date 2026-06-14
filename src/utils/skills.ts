import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execa } from "execa";
import { DOCKER_CONFIG } from "../config.js";
import type { SkillEntry } from "../types.js";

interface OpenCodeConfig {
	instructions: string[];
	[key: string]: unknown;
}

const OPENCODE_SCHEMA = "https://opencode.ai/config.json";

const DEFAULT_MODEL = "github-copilot/claude-sonnet-4.6";

function defaultConfig(): OpenCodeConfig {
	return { $schema: OPENCODE_SCHEMA, model: DEFAULT_MODEL, instructions: [] };
}

export function getSkillsDir(): string {
	const dir = path.join(os.homedir(), ".sith", "skills");
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

export function getClaudeConfigDir(): string {
	return path.join(os.homedir(), ".claude");
}

export function getClaudeMdPath(): string {
	const claudeMdPath = path.join(os.homedir(), ".sith", "CLAUDE.md");
	fs.mkdirSync(path.dirname(claudeMdPath), { recursive: true });
	try {
		fs.writeFileSync(claudeMdPath, "", { flag: "ax" });
	} catch {
		// already exists
	}
	return claudeMdPath;
}

export function getOpenCodeConfigPath(): string {
	const configPath = path.join(os.homedir(), ".sith", "opencode.json");
	// Docker bind-mount creates a directory if the source doesn't exist; ensure it's a file.
	try {
		if (fs.statSync(configPath).isDirectory()) {
			fs.rmSync(configPath, { recursive: true, force: true });
		}
	} catch {
		// doesn't exist yet
	}
	fs.mkdirSync(path.dirname(configPath), { recursive: true });
	try {
		fs.writeFileSync(configPath, JSON.stringify(defaultConfig(), null, 2), {
			flag: "ax",
		});
	} catch {
		// already exists
	}
	return configPath;
}

function readConfig(): OpenCodeConfig {
	const parsed = JSON.parse(fs.readFileSync(getOpenCodeConfigPath(), "utf8"));
	if (!Array.isArray(parsed.instructions)) parsed.instructions = [];
	if (!parsed.model) {
		parsed.model = DEFAULT_MODEL;
		writeConfig(parsed);
	}
	return parsed;
}

function writeConfig(config: OpenCodeConfig): void {
	fs.writeFileSync(getOpenCodeConfigPath(), JSON.stringify(config, null, 2));
}

function addInstruction(containerPath: string): void {
	const config = readConfig();
	if (!config.instructions.includes(containerPath)) {
		config.instructions.push(containerPath);
		writeConfig(config);
	}
}

export function syncClaudeMd(): void {
	const skillsDir = getSkillsDir();
	const lines: string[] = [];
	for (const name of fs.readdirSync(skillsDir)) {
		const skillDir = path.join(skillsDir, name);
		const skillJsonPath = path.join(skillDir, "skill.json");
		if (!fs.existsSync(skillJsonPath)) continue;
		const meta = JSON.parse(fs.readFileSync(skillJsonPath, "utf8"));
		if (meta.autoLoad !== true) continue;
		const instructionsFile = findInstructionsFile(skillDir);
		if (instructionsFile) {
			lines.push(
				`@${DOCKER_CONFIG.claudeSkillsMount}/${name}/${instructionsFile}`,
			);
		}
	}
	fs.writeFileSync(
		getClaudeMdPath(),
		lines.join("\n") + (lines.length ? "\n" : ""),
	);
}

function removeInstructionsUnder(skillContainerDir: string): void {
	const config = readConfig();
	config.instructions = config.instructions.filter(
		(p) => !p.startsWith(skillContainerDir),
	);
	writeConfig(config);
}

export function findInstructionsFile(skillDir: string): string | null {
	const skillName = path.basename(skillDir);
	const candidates = [
		"SKILL.md",
		"CAVEMAN.md",
		"instructions.md",
		path.join("skills", skillName, "SKILL.md"),
		"AGENTS.md",
	];
	return (
		candidates.find((name) => fs.existsSync(path.join(skillDir, name))) ?? null
	);
}

export function isInstalled(name: string): boolean {
	return fs.existsSync(path.join(getSkillsDir(), name, "skill.json"));
}

export function getSkillAutoLoad(name: string): boolean {
	const skillJsonPath = path.join(getSkillsDir(), name, "skill.json");
	if (!fs.existsSync(skillJsonPath)) return false;
	const meta = JSON.parse(fs.readFileSync(skillJsonPath, "utf8"));
	return meta.autoLoad === true;
}

export function setSkillAutoLoad(name: string, autoLoad: boolean): void {
	const skillDir = path.join(getSkillsDir(), name);
	const skillJsonPath = path.join(skillDir, "skill.json");
	if (!fs.existsSync(skillJsonPath)) return;
	const meta = JSON.parse(fs.readFileSync(skillJsonPath, "utf8"));
	meta.autoLoad = autoLoad;
	fs.writeFileSync(skillJsonPath, JSON.stringify(meta, null, 2));
	if (autoLoad) {
		const instructionsFile = findInstructionsFile(skillDir);
		if (instructionsFile) {
			addInstruction(
				`${DOCKER_CONFIG.skillsMount}/${name}/${instructionsFile}`,
			);
		}
	} else {
		removeInstructionsUnder(`${DOCKER_CONFIG.skillsMount}/${name}/`);
	}
	syncClaudeMd();
}

export async function installSkill(skill: SkillEntry): Promise<void> {
	const targetDir = path.join(getSkillsDir(), skill.name);

	if (skill.builtinInstructions) {
		fs.mkdirSync(targetDir, { recursive: true });
		fs.writeFileSync(
			path.join(targetDir, "SKILL.md"),
			skill.builtinInstructions,
		);
		fs.writeFileSync(
			path.join(targetDir, "skill.json"),
			JSON.stringify(
				{
					name: skill.name,
					version: "builtin",
					autoLoad: skill.autoLoad ?? false,
				},
				null,
				2,
			),
		);
		if (skill.autoLoad === true) {
			addInstruction(`${DOCKER_CONFIG.skillsMount}/${skill.name}/SKILL.md`);
		}
		syncClaudeMd();
		return;
	}

	if (!skill.source) throw new Error(`Skill "${skill.name}" has no source URL`);

	const tmpZip = path.join(os.tmpdir(), `sith-skill-${skill.name}.zip`);
	const tmpExtract = path.join(os.tmpdir(), `sith-skill-${skill.name}-extract`);

	try {
		await execa("curl", ["-fsSL", skill.source, "-o", tmpZip]);

		fs.mkdirSync(tmpExtract, { recursive: true });
		await execa("unzip", ["-q", "-o", tmpZip, "-d", tmpExtract]);

		const entries = fs.readdirSync(tmpExtract);
		if (entries.length === 0) throw new Error("Empty archive");
		const extracted = path.join(tmpExtract, entries[0]);

		if (fs.existsSync(targetDir))
			fs.rmSync(targetDir, { recursive: true, force: true });
		fs.cpSync(extracted, targetDir, { recursive: true });

		const skillJson = path.join(targetDir, "skill.json");
		try {
			fs.writeFileSync(
				skillJson,
				JSON.stringify(
					{
						name: skill.name,
						version: "local",
						autoLoad: skill.autoLoad ?? false,
					},
					null,
					2,
				),
				{ flag: "ax" },
			);
		} catch {
			// already exists (skill.json bundled in archive)
		}

		const instructionsFile = findInstructionsFile(targetDir);
		if (instructionsFile && skill.autoLoad === true) {
			addInstruction(
				`${DOCKER_CONFIG.skillsMount}/${skill.name}/${instructionsFile}`,
			);
		}
		syncClaudeMd();
	} finally {
		fs.rmSync(tmpZip, { force: true });
		fs.rmSync(tmpExtract, { recursive: true, force: true });
	}
}

export function uninstallSkill(name: string): void {
	removeInstructionsUnder(`${DOCKER_CONFIG.skillsMount}/${name}/`);
	const targetDir = path.join(getSkillsDir(), name);
	if (fs.existsSync(targetDir)) {
		fs.rmSync(targetDir, { recursive: true, force: true });
	}
	syncClaudeMd();
}
