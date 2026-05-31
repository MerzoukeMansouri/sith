import { describe, expect, it } from "vitest";
import { getAvailableCommands, parseSlashCommand } from "../slashCommands.js";

describe("parseSlashCommand", () => {
	it("returns null for non-slash input", () => {
		expect(parseSlashCommand("hello")).toBeNull();
		expect(parseSlashCommand("shell")).toBeNull();
		expect(parseSlashCommand("")).toBeNull();
	});

	it("returns null for unknown command", () => {
		expect(parseSlashCommand("/unknown")).toBeNull();
		expect(parseSlashCommand("/foo")).toBeNull();
	});

	it("parses known commands case-insensitively", () => {
		expect(parseSlashCommand("/shell")).toEqual({
			type: "shell",
			raw: "/shell",
		});
		expect(parseSlashCommand("/SHELL")).toEqual({
			type: "shell",
			raw: "/SHELL",
		});
		expect(parseSlashCommand("/Shell")).toEqual({
			type: "shell",
			raw: "/Shell",
		});

		expect(parseSlashCommand("/config")).toEqual({
			type: "config",
			raw: "/config",
		});
		expect(parseSlashCommand("/help")).toEqual({ type: "help", raw: "/help" });
		expect(parseSlashCommand("/skills")).toEqual({
			type: "skills",
			raw: "/skills",
		});
	});

	it("trims surrounding whitespace", () => {
		expect(parseSlashCommand("  /shell  ")).toEqual({
			type: "shell",
			raw: "/shell",
		});
		expect(parseSlashCommand("  /SKILLS  ")).toEqual({
			type: "skills",
			raw: "/SKILLS",
		});
	});

	it("raw preserves original casing after trim", () => {
		const result = parseSlashCommand("  /HELP  ");
		expect(result?.raw).toBe("/HELP");
	});
});

describe("getAvailableCommands", () => {
	it("returns all four commands", () => {
		const commands = getAvailableCommands();
		const keys = commands.map((c) => c.command);
		expect(keys).toContain("/shell");
		expect(keys).toContain("/skills");
		expect(keys).toContain("/config");
		expect(keys).toContain("/help");
	});

	it("each entry has command and description", () => {
		for (const entry of getAvailableCommands()) {
			expect(entry.command).toBeTruthy();
			expect(entry.description).toBeTruthy();
		}
	});
});
