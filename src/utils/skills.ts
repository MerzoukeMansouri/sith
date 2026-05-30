import fs from "fs";
import path from "path";
import os from "os";
import { execa } from "execa";
import type { SkillEntry } from "../types.js";

export function getSkillsDir(): string {
  const dir = path.join(os.homedir(), ".sith", "skills");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function isInstalled(name: string): boolean {
  const skillJson = path.join(getSkillsDir(), name, "skill.json");
  return fs.existsSync(skillJson);
}

export async function installSkill(skill: SkillEntry): Promise<void> {
  const targetDir = path.join(getSkillsDir(), skill.name);
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

    // Ensure skill.json exists with at minimum a name field
    const skillJson = path.join(targetDir, "skill.json");
    if (!fs.existsSync(skillJson)) {
      fs.writeFileSync(skillJson, JSON.stringify({ name: skill.name, version: "local" }, null, 2));
    }
  } finally {
    fs.rmSync(tmpZip, { force: true });
    fs.rmSync(tmpExtract, { recursive: true, force: true });
  }
}

export function uninstallSkill(name: string): void {
  const targetDir = path.join(getSkillsDir(), name);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
}
