import { Box, render, Text, useApp, useInput } from "ink";
import React, { useState } from "react";
import { SKILLS_CATALOG } from "../config.js";
import type { SkillEntry } from "../types.js";
import {
	getSkillAutoLoad,
	installSkill,
	isInstalled,
	setSkillAutoLoad,
	uninstallSkill,
} from "../utils/skills.js";

type Status = "idle" | "working" | "done" | "error";

interface SkillRowState {
	installed: boolean;
	autoLoad: boolean;
	status: Status;
	message: string;
}

function statusIcon(row: SkillRowState): string {
	switch (row.status) {
		case "working":
			return "⏳";
		case "error":
			return "❌";
		default:
			return row.installed ? "✅" : "☐";
	}
}

function SkillsMenu(): React.ReactElement {
	const { exit } = useApp();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [rows, setRows] = useState<SkillRowState[]>(
		SKILLS_CATALOG.map((s) => ({
			installed: isInstalled(s.name),
			autoLoad: getSkillAutoLoad(s.name),
			status: "idle",
			message: "",
		})),
	);

	function setRow(index: number, patch: Partial<SkillRowState>): void {
		setRows((prev) =>
			prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
		);
	}

	async function toggleSkill(
		index: number,
		skill: SkillEntry,
		installed: boolean,
	): Promise<void> {
		setRow(index, {
			status: "working",
			message: installed ? "Uninstalling..." : "Downloading...",
		});
		try {
			if (installed) {
				uninstallSkill(skill.name);
				setRow(index, {
					installed: false,
					status: "done",
					message: "Uninstalled",
				});
			} else {
				await installSkill(skill);
				setRow(index, {
					installed: true,
					autoLoad: skill.autoLoad ?? false,
					status: "done",
					message: "Installed",
				});
			}
		} catch (e) {
			setRow(index, {
				status: "error",
				message: e instanceof Error ? e.message : "Failed",
			});
		}
	}

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex((p) => (p > 0 ? p - 1 : SKILLS_CATALOG.length - 1));
			return;
		}
		if (key.downArrow) {
			setSelectedIndex((p) => (p < SKILLS_CATALOG.length - 1 ? p + 1 : 0));
			return;
		}
		if (key.return) {
			const row = rows[selectedIndex];
			if (row.status !== "working") {
				void toggleSkill(
					selectedIndex,
					SKILLS_CATALOG[selectedIndex],
					row.installed,
				);
			}
			return;
		}
		if (input === "a") {
			const row = rows[selectedIndex];
			if (row.installed && row.status !== "working") {
				const newAutoLoad = !row.autoLoad;
				setSkillAutoLoad(SKILLS_CATALOG[selectedIndex].name, newAutoLoad);
				setRow(selectedIndex, {
					autoLoad: newAutoLoad,
					status: "done",
					message: newAutoLoad ? "Auto-load on" : "On-demand",
				});
			}
			return;
		}
		if (input === "q" || key.escape) {
			exit();
		}
	});

	return (
		<Box flexDirection="column" paddingX={1}>
			<Box marginBottom={1}>
				<Text bold color="red">
					Skills Manager
				</Text>
				<Text dimColor> (~/.sith/skills/)</Text>
			</Box>
			{SKILLS_CATALOG.map((skill, i) => {
				const row = rows[i];
				const isSelected = i === selectedIndex;

				return (
					<Box key={skill.name} marginY={0}>
						<Text color={isSelected ? "cyan" : undefined}>
							{isSelected ? "❯ " : "  "}
							{statusIcon(row)} {skill.name.padEnd(12)}
						</Text>
						<Text dimColor={!isSelected}>{skill.description}</Text>
						{row.installed ? (
							<Text color={row.autoLoad ? "green" : "yellow"}>
								{" "}
								{row.autoLoad ? "[auto]" : "[on-demand]"}
							</Text>
						) : null}
						{row.message ? (
							<Text color={row.status === "error" ? "red" : "green"}>
								{" "}
								{row.message}
							</Text>
						) : null}
					</Box>
				);
			})}
			<Box marginTop={1}>
				<Text dimColor>
					↑↓ navigate Enter install/uninstall a toggle auto-load q quit
				</Text>
			</Box>
		</Box>
	);
}

export function skillsCommand(): void {
	render(<SkillsMenu />);
}
