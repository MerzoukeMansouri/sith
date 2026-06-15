import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SithUserConfig } from "../types.js";

function getSithConfigPath(): string {
	return path.join(os.homedir(), ".sith", "config.json");
}

export function readSithConfig(): SithUserConfig {
	const configPath = getSithConfigPath();
	try {
		return JSON.parse(fs.readFileSync(configPath, "utf8")) as SithUserConfig;
	} catch {
		return {};
	}
}

export function writeSithConfig(config: SithUserConfig): void {
	const configPath = getSithConfigPath();
	fs.mkdirSync(path.dirname(configPath), { recursive: true });
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
