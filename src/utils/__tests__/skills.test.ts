import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFs = {
	existsSync: vi.fn(),
	statSync: vi.fn(),
	mkdirSync: vi.fn(),
	writeFileSync: vi.fn(),
	readFileSync: vi.fn(),
	rmSync: vi.fn(),
	cpSync: vi.fn(),
	readdirSync: vi.fn(),
};

const mockExeca = vi.fn();

vi.mock("fs", () => ({ default: mockFs }));
vi.mock("execa", () => ({ execa: mockExeca }));
vi.mock("../config.js", () => ({
	DOCKER_CONFIG: {
		skillsMount: "/root/.opencode/skills",
		opencodeConfigMount: "/root/.config/opencode/opencode.json",
		claudeSkillsMount: "/root/.claude/skills",
	},
}));

const skillsModule = await import("../skills.js");
const {
	getSkillsDir,
	getOpenCodeConfigPath,
	isInstalled,
	findInstructionsFile,
	installSkill,
	uninstallSkill,
} = skillsModule;

const expectedSkillsDir = path.join(os.homedir(), ".sith", "skills");
const expectedConfigPath = path.join(os.homedir(), ".sith", "opencode.json");

const validConfig = JSON.stringify({
	$schema: "https://opencode.ai/config.json",
	instructions: [],
});

const expectedClaudeMdPath = path.join(os.homedir(), ".sith", "CLAUDE.md");

beforeEach(() => {
	vi.clearAllMocks();
	// Default: config file exists as valid file
	mockFs.existsSync.mockReturnValue(true);
	mockFs.statSync.mockReturnValue({ isDirectory: () => false });
	mockFs.readFileSync.mockReturnValue(validConfig);
	// Default: no skills installed (syncClaudeMd scans this dir)
	mockFs.readdirSync.mockReturnValue([]);
});

// ─── getSkillsDir ────────────────────────────────────────────────────────────

describe("getSkillsDir", () => {
	it("returns ~/.sith/skills and creates it", () => {
		const result = getSkillsDir();
		expect(result).toBe(expectedSkillsDir);
		expect(mockFs.mkdirSync).toHaveBeenCalledWith(expectedSkillsDir, {
			recursive: true,
		});
	});
});

// ─── getOpenCodeConfigPath ────────────────────────────────────────────────────

describe("getOpenCodeConfigPath", () => {
	it("creates config file if missing", () => {
		mockFs.existsSync.mockReturnValue(false);
		const result = getOpenCodeConfigPath();
		expect(result).toBe(expectedConfigPath);
		expect(mockFs.writeFileSync).toHaveBeenCalledWith(
			expectedConfigPath,
			expect.stringContaining('"instructions"'),
			{ flag: "ax" },
		);
	});

	it("removes directory and recreates as file if Docker created a dir", () => {
		mockFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
		mockFs.statSync.mockReturnValue({ isDirectory: () => true });
		getOpenCodeConfigPath();
		expect(mockFs.rmSync).toHaveBeenCalledWith(expectedConfigPath, {
			recursive: true,
			force: true,
		});
		expect(mockFs.writeFileSync).toHaveBeenCalled();
	});

	it("returns path without touching file if already a valid file", () => {
		const result = getOpenCodeConfigPath();
		expect(result).toBe(expectedConfigPath);
		expect(mockFs.rmSync).not.toHaveBeenCalled();
		// { flag: "ax" } = atomic create — no-op if file exists (EEXIST caught)
		const overwrite = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p, , opts]) => p === expectedConfigPath && !opts);
		expect(overwrite).toBeUndefined();
	});
});

// ─── isInstalled ─────────────────────────────────────────────────────────────

describe("isInstalled", () => {
	it("returns true when skill.json exists", () => {
		mockFs.existsSync.mockImplementation(
			(p: string) =>
				p === path.join(expectedSkillsDir, "caveman", "skill.json"),
		);
		expect(isInstalled("caveman")).toBe(true);
	});

	it("returns false when skill.json missing", () => {
		mockFs.existsSync.mockReturnValue(false);
		expect(isInstalled("caveman")).toBe(false);
	});
});

// ─── findInstructionsFile ─────────────────────────────────────────────────────

describe("findInstructionsFile", () => {
	it("returns SKILL.md when it exists", () => {
		mockFs.existsSync.mockImplementation((p: string) => p.endsWith("SKILL.md"));
		expect(findInstructionsFile("/skills/caveman")).toBe("SKILL.md");
	});

	it("falls through to CAVEMAN.md", () => {
		mockFs.existsSync.mockImplementation((p: string) =>
			p.endsWith("CAVEMAN.md"),
		);
		expect(findInstructionsFile("/skills/caveman")).toBe("CAVEMAN.md");
	});

	it("falls through to instructions.md", () => {
		mockFs.existsSync.mockImplementation((p: string) =>
			p.endsWith("instructions.md"),
		);
		expect(findInstructionsFile("/skills/caveman")).toBe("instructions.md");
	});

	it("handles nested skills/<name>/SKILL.md structure", () => {
		mockFs.existsSync.mockImplementation(
			(p: string) =>
				p === path.join("/skills/caveman", "skills", "caveman", "SKILL.md"),
		);
		expect(findInstructionsFile("/skills/caveman")).toBe(
			path.join("skills", "caveman", "SKILL.md"),
		);
	});

	it("returns null when no candidate exists", () => {
		mockFs.existsSync.mockReturnValue(false);
		expect(findInstructionsFile("/skills/unknown")).toBeNull();
	});
});

// ─── installSkill (builtin) ───────────────────────────────────────────────────

describe("installSkill — builtin", () => {
	const builtinSkill = {
		name: "caveman",
		description: "test skill",
		homepage: "https://example.com",
		builtinInstructions: "# Caveman\nBe terse.",
		autoLoad: true,
	};

	it("writes SKILL.md and skill.json to target dir", async () => {
		await installSkill(builtinSkill);
		const targetDir = path.join(expectedSkillsDir, "caveman");
		expect(mockFs.mkdirSync).toHaveBeenCalledWith(targetDir, {
			recursive: true,
		});
		expect(mockFs.writeFileSync).toHaveBeenCalledWith(
			path.join(targetDir, "SKILL.md"),
			builtinSkill.builtinInstructions,
		);
		expect(mockFs.writeFileSync).toHaveBeenCalledWith(
			path.join(targetDir, "skill.json"),
			expect.stringContaining('"builtin"'),
		);
	});

	it("adds container instruction path to opencode.json", async () => {
		mockFs.readFileSync.mockReturnValue(validConfig);
		await installSkill(builtinSkill);
		// Find the writeConfig call — no { flag } option, distinguishes from atomic init
		const written = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p, , opts]) => p === expectedConfigPath && !opts);
		expect(written).toBeDefined();
		const content = JSON.parse(written?.[1] as string);
		expect(content.instructions).toContain(
			"/root/.opencode/skills/caveman/SKILL.md",
		);
	});

	it("does not add duplicate instruction", async () => {
		const existingConfig = JSON.stringify({
			instructions: ["/root/.opencode/skills/caveman/SKILL.md"],
		});
		mockFs.readFileSync.mockReturnValue(existingConfig);
		await installSkill(builtinSkill);
		// No writeConfig call should happen when instruction already exists
		const configUpdate = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p, , opts]) => p === expectedConfigPath && !opts);
		expect(configUpdate).toBeUndefined();
	});

	it("does not call execa (no download for builtin)", async () => {
		await installSkill(builtinSkill);
		expect(mockExeca).not.toHaveBeenCalled();
	});

	it("stores autoLoad in skill.json", async () => {
		await installSkill({ ...builtinSkill, autoLoad: false });
		const targetDir = path.join(expectedSkillsDir, "caveman");
		const skillJsonCall = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p]) => p === path.join(targetDir, "skill.json"));
		expect(JSON.parse(skillJsonCall?.[1] as string).autoLoad).toBe(false);
	});

	it("skips opencode.json instruction when autoLoad: false", async () => {
		mockFs.readFileSync.mockReturnValue(validConfig);
		await installSkill({ ...builtinSkill, autoLoad: false });
		const configUpdate = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p, , opts]) => p === expectedConfigPath && !opts);
		expect(configUpdate).toBeUndefined();
	});
});

// ─── syncClaudeMd (via installSkill) ─────────────────────────────────────────

describe("syncClaudeMd", () => {
	const builtinSkill = {
		name: "caveman",
		description: "test skill",
		homepage: "https://example.com",
		builtinInstructions: "# Caveman\nBe terse.",
		autoLoad: true,
	};

	it("writes @import to CLAUDE.md when autoLoad: true", async () => {
		mockFs.readdirSync.mockReturnValue(["caveman"]);
		mockFs.existsSync.mockImplementation((p: string) => {
			if (p.endsWith("skill.json")) return true;
			if (p.endsWith("SKILL.md")) return true;
			return true;
		});
		mockFs.readFileSync.mockImplementation((p: string) => {
			if (typeof p === "string" && p.endsWith("skill.json"))
				return JSON.stringify({
					name: "caveman",
					version: "builtin",
					autoLoad: true,
				});
			return validConfig;
		});
		await installSkill(builtinSkill);
		const claudeWrite = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p, , opts]) => p === expectedClaudeMdPath && !opts);
		expect(claudeWrite?.[1]).toBe("@/root/.claude/skills/caveman/SKILL.md\n");
	});

	it("excludes skill from CLAUDE.md when autoLoad: false", async () => {
		mockFs.readdirSync.mockReturnValue(["caveman"]);
		mockFs.existsSync.mockImplementation((p: string) => {
			if (p.endsWith("skill.json")) return true;
			return true;
		});
		mockFs.readFileSync.mockImplementation((p: string) => {
			if (typeof p === "string" && p.endsWith("skill.json"))
				return JSON.stringify({
					name: "caveman",
					version: "builtin",
					autoLoad: false,
				});
			return validConfig;
		});
		await installSkill({ ...builtinSkill, autoLoad: false });
		const claudeWrite = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p, , opts]) => p === expectedClaudeMdPath && !opts);
		expect(claudeWrite?.[1]).toBe("");
	});
});

// ─── installSkill (URL source) ────────────────────────────────────────────────

describe("installSkill — URL source", () => {
	const remoteSkill = {
		name: "remote-skill",
		description: "downloaded skill",
		homepage: "https://example.com",
		source: "https://example.com/skill.zip",
	};

	it("throws when no source and no builtinInstructions", async () => {
		const noSource = { name: "x", description: "x", homepage: "x" };
		await expect(installSkill(noSource)).rejects.toThrow(
			'Skill "x" has no source URL',
		);
	});

	it("downloads and extracts archive", async () => {
		mockExeca.mockResolvedValue({});
		mockFs.readdirSync.mockReturnValue(["skill-root"]);
		mockFs.existsSync.mockImplementation((p: string) => {
			if (p === expectedConfigPath) return true;
			if (p === path.join(expectedSkillsDir, "remote-skill")) return false;
			return false;
		});
		mockFs.statSync.mockReturnValue({ isDirectory: () => false });
		mockFs.readFileSync.mockReturnValue(validConfig);

		await installSkill(remoteSkill);

		expect(mockExeca).toHaveBeenCalledWith(
			"curl",
			expect.arrayContaining([remoteSkill.source]),
		);
		expect(mockExeca).toHaveBeenCalledWith("unzip", expect.any(Array));
	});
});

// ─── uninstallSkill ───────────────────────────────────────────────────────────

describe("uninstallSkill", () => {
	it("removes skill directory", () => {
		mockFs.readFileSync.mockReturnValue(validConfig);
		uninstallSkill("caveman");
		const targetDir = path.join(expectedSkillsDir, "caveman");
		expect(mockFs.rmSync).toHaveBeenCalledWith(targetDir, {
			recursive: true,
			force: true,
		});
	});

	it("removes instruction from opencode.json", () => {
		const config = JSON.stringify({
			instructions: [
				"/root/.opencode/skills/caveman/SKILL.md",
				"/root/.opencode/skills/other/SKILL.md",
			],
		});
		mockFs.readFileSync.mockReturnValue(config);
		uninstallSkill("caveman");
		// Find writeConfig call — no { flag } option
		const written = vi
			.mocked(mockFs.writeFileSync)
			.mock.calls.find(([p, , opts]) => p === expectedConfigPath && !opts);
		expect(written).toBeDefined();
		const content = JSON.parse(written?.[1] as string);
		expect(content.instructions).not.toContain(
			"/root/.opencode/skills/caveman/SKILL.md",
		);
		expect(content.instructions).toContain(
			"/root/.opencode/skills/other/SKILL.md",
		);
	});

	it("does not rmSync dir if it does not exist", () => {
		mockFs.readFileSync.mockReturnValue(validConfig);
		mockFs.existsSync.mockImplementation(
			(p: string) => p === expectedConfigPath,
		);
		uninstallSkill("ghost");
		expect(mockFs.rmSync).not.toHaveBeenCalledWith(
			expect.stringContaining("ghost"),
			expect.anything(),
		);
	});
});
