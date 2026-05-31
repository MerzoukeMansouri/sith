import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../skills.js", () => ({
	getSkillsDir: () => "/home/user/.sith/skills",
	getOpenCodeConfigPath: () => "/home/user/.sith/opencode.json",
}));

const { buildDockerShellCommand, buildDockerOpencodeCommand } = await import(
	"../dockerArgs.js"
);

beforeEach(() => {
	vi.spyOn(process, "cwd").mockReturnValue("/projects/myapp");
});

describe("buildDockerShellCommand", () => {
	it("starts with docker run --rm -it", () => {
		const args = buildDockerShellCommand("token123");
		expect(args.slice(0, 3)).toEqual(["run", "--rm", "-it"]);
	});

	it("mounts workspace to cwd", () => {
		const args = buildDockerShellCommand("token123");
		const idx = args.indexOf("-v");
		expect(args[idx + 1]).toBe("/projects/myapp:/workspace");
	});

	it("mounts skills dir", () => {
		const args = buildDockerShellCommand("token123");
		const mounts = args.filter((_, i) => args[i - 1] === "-v");
		expect(mounts.some((m) => m.startsWith("/home/user/.sith/skills:"))).toBe(
			true,
		);
	});

	it("mounts opencode config file", () => {
		const args = buildDockerShellCommand("token123");
		const mounts = args.filter((_, i) => args[i - 1] === "-v");
		expect(
			mounts.some((m) => m.includes("/home/user/.sith/opencode.json:")),
		).toBe(true);
	});

	it("passes GITHUB_TOKEN env var", () => {
		const args = buildDockerShellCommand("mytoken");
		const eIdx = args.indexOf("-e");
		expect(args[eIdx + 1]).toBe("GITHUB_TOKEN=mytoken");
	});

	it("uses nix-shell entrypoint", () => {
		const args = buildDockerShellCommand("token");
		expect(args).toContain("--entrypoint");
		expect(args[args.indexOf("--entrypoint") + 1]).toBe("nix-shell");
	});
});

describe("buildDockerOpencodeCommand", () => {
	it("uses bash entrypoint", () => {
		const args = buildDockerOpencodeCommand("token");
		expect(args[args.indexOf("--entrypoint") + 1]).toBe("bash");
	});

	it("last arg is the shell command string", () => {
		const args = buildDockerOpencodeCommand("token");
		expect(args[args.length - 2]).toBe("-c");
		expect(args[args.length - 1]).toContain("opencode");
	});

	it("appends --prompt when prompt provided", () => {
		const args = buildDockerOpencodeCommand("token", "fix the bug");
		expect(args[args.length - 1]).toContain("--prompt");
		expect(args[args.length - 1]).toContain("fix the bug");
	});

	it("escapes single quotes in prompt", () => {
		const args = buildDockerOpencodeCommand("token", "it's broken");
		const cmd = args[args.length - 1];
		expect(cmd).toContain("it'\\''s broken");
	});

	it("no --prompt flag when prompt omitted", () => {
		const args = buildDockerOpencodeCommand("token");
		expect(args[args.length - 1]).not.toContain("--prompt");
	});

	it("empty string prompt treated as no prompt", () => {
		const args = buildDockerOpencodeCommand("token", "");
		expect(args[args.length - 1]).not.toContain("--prompt");
	});
});
