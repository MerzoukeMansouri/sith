export interface MenuItem {
	label: string;
	value: string;
	icon: string;
}

export interface BuildingSpinnerProps {
	step: string;
}

export interface DockerCommandOptions {
	build?: boolean;
	pull?: boolean;
}

export interface NixCommandOptions {
	install?: boolean;
	shell?: boolean;
}

export interface SkillEntry {
	name: string;
	description: string;
	source?: string;
	homepage: string;
	builtinInstructions?: string;
	autoLoad?: boolean; // default: false (on-demand slash command only)
}

export type SkillScope = "required" | "optional" | "forbidden";

export interface CatalogSkillEntry extends SkillEntry {
	scope: SkillScope;
	version: string;
}

export interface TeamCatalog {
	team: string;
	skills: CatalogSkillEntry[];
}

export interface OrgCatalog {
	global: CatalogSkillEntry[];
	forbidden: string[];
}

export interface SithUserConfig {
	team?: string;
}

export interface WorkspaceRepo {
	url: string;
	branch?: string;
	name?: string; // local dir alias, inferred from URL basename if absent
	mode?: "clone" | "mount"; // default: "clone"
	localPath?: string; // required when mode === "mount"
}

export interface WorkspaceConfig {
	repos: WorkspaceRepo[];
}
