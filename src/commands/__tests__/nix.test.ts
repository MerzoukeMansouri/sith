import { describe, expect, it } from "vitest";
import { parseNixVersionOutput } from "../nix.js";

describe("parseNixVersionOutput", () => {
	it("returns true for version meeting requirement (2.19)", () => {
		expect(parseNixVersionOutput("nix (Nix) 2.19.0")).toBe(true);
		expect(parseNixVersionOutput("nix (Nix) 2.19")).toBe(true);
	});

	it("returns true for version above requirement", () => {
		expect(parseNixVersionOutput("nix (Nix) 2.20.0")).toBe(true);
		expect(parseNixVersionOutput("nix (Nix) 3.0.0")).toBe(true);
		expect(parseNixVersionOutput("nix (Nix) 2.25")).toBe(true);
	});

	it("returns false for version below requirement", () => {
		expect(parseNixVersionOutput("nix (Nix) 2.18.9")).toBe(false);
		expect(parseNixVersionOutput("nix (Nix) 2.18")).toBe(false);
		expect(parseNixVersionOutput("nix (Nix) 1.99")).toBe(false);
	});

	it("returns false when output does not match expected format", () => {
		expect(parseNixVersionOutput("")).toBe(false);
		expect(parseNixVersionOutput("nix 2.19.0")).toBe(false);
		expect(parseNixVersionOutput("command not found")).toBe(false);
		expect(parseNixVersionOutput("NIX (NIX) 2.19.0")).toBe(false);
	});
});
