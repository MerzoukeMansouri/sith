import type { SkillEntry } from "./types.js";

export const CATALOG_BASE_URL =
	"https://raw.githubusercontent.com/adeo-side/adeo-skills-catalog/main";

// Predefined skill catalog — skills are installed to ~/.sith/skills/<name>/
export const SKILLS_CATALOG: SkillEntry[] = [
	{
		name: "caveman",
		description: "Ultra-compressed communication (~75% token reduction)",
		homepage: "https://github.com/JuliusBrussee/caveman",
		autoLoad: true,
		builtinInstructions: `---
name: caveman
description: Ultra-compressed communication mode (ultra — MAX compression, always active).
---

Respond terse like smart caveman. All technical substance stay. Only fluff die.

## Persistence

ACTIVE EVERY RESPONSE. No revert. Off only: "stop caveman" / "normal mode".

Level: **ultra** (fixed).

## Rules

Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries, hedging. Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged. Errors quoted exact.

Pattern: \`[thing] [action] [reason]. [next step].\`

Not: "Sure! I'd be happy to help you with that. The issue you're experiencing is likely caused by..."
Yes: "Bug in auth middleware. Token expiry check use \`<\` not \`<=\`. Fix:"

## Ultra intensity

Abbreviate prose (DB/auth/config/req/res/fn/impl), strip conjunctions, arrows for causality (X → Y), one word when one word enough. Code symbols/fn names/API names/error strings: never abbreviate.

Example — "Why React re-render?"
ultra: "Inline obj prop → new ref → re-render. \`useMemo\`."

Example — "Explain DB connection pooling."
ultra: "Pool = reuse DB conn. Skip handshake → fast under load."

## Auto-Clarity

Drop for: security warnings, irreversible ops, steps where order risks misread. Resume after.

## Boundaries

Code/commits/PRs: write normal. "stop caveman" or "normal mode": revert.`,
	},
	{
		name: "rtk",
		description: "Token-reduction proxy (~80% savings on dev commands)",
		homepage: "https://github.com/rtk-ai/rtk",
		source: "https://github.com/rtk-ai/rtk/archive/refs/tags/v0.42.4.zip",
		autoLoad: false,
	},
];

// Docker configuration
export const DOCKER_CONFIG = {
	imageName: "sith:latest",
	prebuiltImage: "ghcr.io/merzoukemansouri/sith:latest",
	folderName: "docker",
	dockerfileName: "Dockerfile",
	workspaceMount: "/workspace",
	skillsMount: "/root/.opencode/skills",
	opencodeConfigMount: "/root/.config/opencode/opencode.json",
	shellEntrypoint: "/opt/sith/nix/shell.nix",
	claudeConfigMount: "/root/.claude",
	claudeSkillsMount: "/root/.claude/skills",
	workspaceConfigMount: "/opt/sith/workspace.json",
	workspaceReposMount: "/workspace/repos",
	workspaceVolumeName: "sith-workspace-repos",
} as const;

// Nix configuration
export const NIX_CONFIG = {
	shellPath: "docker/nix/shell.nix",
	flakePath: "docker/nix/flake.nix",
	installerUrl: "https://nixos.org/nix/install",
	requiredVersion: "2.19",
	localConfigDir: ".sith/nix",
} as const;

// Spinner animation configuration
export const SPINNER_CONFIG = {
	frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
	interval: 80,
} as const;

// ASCII logo lines
export const ASCII_LOGO = [
	"    ███████╗██╗████████╗██╗  ██╗",
	"    ██╔════╝██║╚══██╔══╝██║  ██║",
	"    ███████╗██║   ██║   ███████║",
	"    ╚════██║██║   ██║   ██╔══██║",
	"    ███████║██║   ██║   ██║  ██║",
	"    ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝",
] as const;
