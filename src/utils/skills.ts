import fs from "fs";
import path from "path";
import os from "os";
import { execa } from "execa";
import type { SkillEntry } from "../types.js";
import { DOCKER_CONFIG } from "../config.js";

interface OpenCodeConfig {
  instructions: string[];
  [key: string]: unknown;
}

const OPENCODE_SCHEMA = "https://opencode.ai/config.json";

function defaultConfig(): OpenCodeConfig {
  return { $schema: OPENCODE_SCHEMA, instructions: [] };
}

export function getSkillsDir(): string {
  const dir = path.join(os.homedir(), ".sith", "skills");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getOpenCodeConfigPath(): string {
  const configPath = path.join(os.homedir(), ".sith", "opencode.json");
  // Docker bind-mount creates a directory if the source doesn't exist; ensure it's a file.
  if (fs.existsSync(configPath) && fs.statSync(configPath).isDirectory()) {
    fs.rmSync(configPath, { recursive: true, force: true });
  }
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig(), null, 2));
  }
  return configPath;
}

function readConfig(): OpenCodeConfig {
  const parsed = JSON.parse(fs.readFileSync(getOpenCodeConfigPath(), "utf8"));
  if (!Array.isArray(parsed.instructions)) parsed.instructions = [];
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

function removeInstructionsUnder(skillContainerDir: string): void {
  const config = readConfig();
  config.instructions = config.instructions.filter((p) => !p.startsWith(skillContainerDir));
  writeConfig(config);
}

function findInstructionsFile(skillDir: string): string | null {
  const skillName = path.basename(skillDir);
  const candidates = [
    "SKILL.md",
    "CAVEMAN.md",
    "instructions.md",
    path.join("skills", skillName, "SKILL.md"),
    "AGENTS.md",
  ];
  return candidates.find((name) => fs.existsSync(path.join(skillDir, name))) ?? null;
}

export function isInstalled(name: string): boolean {
  return fs.existsSync(path.join(getSkillsDir(), name, "skill.json"));
}

export async function installSkill(skill: SkillEntry): Promise<void> {
  const targetDir = path.join(getSkillsDir(), skill.name);

  if (skill.builtinInstructions) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, "SKILL.md"), skill.builtinInstructions);
    fs.writeFileSync(
      path.join(targetDir, "skill.json"),
      JSON.stringify({ name: skill.name, version: "builtin" }, null, 2),
    );
    addInstruction(`${DOCKER_CONFIG.skillsMount}/${skill.name}/SKILL.md`);
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

    if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(extracted, targetDir, { recursive: true });

    const skillJson = path.join(targetDir, "skill.json");
    if (!fs.existsSync(skillJson)) {
      fs.writeFileSync(skillJson, JSON.stringify({ name: skill.name, version: "local" }, null, 2));
    }

    const instructionsFile = findInstructionsFile(targetDir);
    if (instructionsFile) {
      addInstruction(`${DOCKER_CONFIG.skillsMount}/${skill.name}/${instructionsFile}`);
    }
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
}
