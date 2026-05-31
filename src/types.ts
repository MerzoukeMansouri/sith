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
}
