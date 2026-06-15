import { Box, render, Text, useApp, useInput } from "ink";
import React, { useEffect, useMemo, useState } from "react";
import { SKILLS_CATALOG } from "../config.js";
import type { CatalogSkillEntry, SkillEntry } from "../types.js";
import { getEffectiveCatalog } from "../utils/catalog.js";
import {
	getInstalledVersion,
	getSkillAutoLoad,
	installSkill,
	isInstalled,
	setSkillAutoLoad,
	uninstallSkill,
} from "../utils/skills.js";
import { readSithConfig, writeSithConfig } from "../utils/sithConfig.js";

type Status = "idle" | "working" | "done" | "error";
type Screen = "main" | "team-picker";
type ScopeFilter = "all" | "required" | "optional" | "installed";

const KNOWN_TEAMS = ["frontend", "backend", "data", "platform", "devops"];

const LEFT_WIDTH = 36;

interface SkillRowState {
	installed: boolean;
	autoLoad: boolean;
	installedVersion: string | null;
	status: Status;
	message: string;
}

interface SkillWithRow {
	skill: SkillEntry;
	row: SkillRowState;
	catalogIndex: number;
}

function scopeColor(scope: string | undefined): string {
	if (scope === "required") return "red";
	if (scope === "forbidden") return "gray";
	return "cyan";
}

function isOutdated(row: SkillRowState, skill: SkillEntry): boolean {
	const catalogVersion = (skill as CatalogSkillEntry).version;
	return (
		row.installed &&
		!!catalogVersion &&
		!!row.installedVersion &&
		row.installedVersion !== catalogVersion &&
		row.installedVersion !== "builtin" &&
		row.installedVersion !== "local"
	);
}

// ─── Detail pane ─────────────────────────────────────────────────────────────

function SkillDetail({
	item,
	width,
}: {
	item: SkillWithRow | undefined;
	width: number;
}): React.ReactElement {
	if (!item) {
		return (
			<Box width={width} flexDirection="column" paddingX={1}>
				<Text dimColor>No skill selected</Text>
			</Box>
		);
	}

	const { skill, row } = item;
	const catalogVersion = (skill as CatalogSkillEntry).version;
	const scope = (skill as CatalogSkillEntry).scope;
	const outdated = isOutdated(row, skill);

	const versionLine = catalogVersion
		? row.installedVersion
			? outdated
				? `${row.installedVersion} → ${catalogVersion} [outdated]`
				: `${row.installedVersion} ✓`
			: catalogVersion
		: row.installedVersion ?? "–";

	let actionHint = "";
	if (scope === "forbidden") actionHint = "Forbidden by org policy";
	else if (row.status === "working") actionHint = row.message;
	else if (row.installed) actionHint = "Enter uninstall  a toggle autoload";
	else actionHint = "Enter install";

	return (
		<Box width={width} flexDirection="column" paddingX={1}>
			<Text bold color="white">
				{skill.name}
			</Text>
			<Box marginTop={1}>
				<Text wrap="wrap">{skill.description}</Text>
			</Box>
			<Box marginTop={1} flexDirection="column">
				{catalogVersion || row.installedVersion ? (
					<Box>
						<Text dimColor>Version   </Text>
						<Text color={outdated ? "yellow" : "green"}>{versionLine}</Text>
					</Box>
				) : null}
				{scope ? (
					<Box>
						<Text dimColor>Scope     </Text>
						<Text color={scopeColor(scope)}>{scope}</Text>
					</Box>
				) : null}
				<Box>
					<Text dimColor>Installed </Text>
					<Text color={row.installed ? "green" : "gray"}>
						{row.installed ? "yes" : "no"}
					</Text>
				</Box>
				{row.installed ? (
					<Box>
						<Text dimColor>Autoload  </Text>
						<Text color={row.autoLoad ? "green" : "yellow"}>
							{row.autoLoad ? "yes [auto]" : "no [on-demand]"}
						</Text>
					</Box>
				) : null}
				<Box marginTop={1}>
					<Text dimColor>{"→ "}</Text>
					<Text dimColor>{skill.homepage}</Text>
				</Box>
			</Box>
			{row.message ? (
				<Box marginTop={1}>
					<Text color={row.status === "error" ? "red" : "green"}>
						{row.message}
					</Text>
				</Box>
			) : null}
			<Box marginTop={1}>
				<Text dimColor>{actionHint}</Text>
			</Box>
		</Box>
	);
}

// ─── Team picker ──────────────────────────────────────────────────────────────

function TeamPicker({
	current,
	onSelect,
	onCancel,
}: {
	current?: string;
	onSelect: (team: string) => void;
	onCancel: () => void;
}): React.ReactElement {
	const [idx, setIdx] = useState(
		Math.max(0, KNOWN_TEAMS.indexOf(current ?? "")),
	);

	useInput((input, key) => {
		if (key.upArrow) { setIdx((p) => (p > 0 ? p - 1 : KNOWN_TEAMS.length - 1)); return; }
		if (key.downArrow) { setIdx((p) => (p < KNOWN_TEAMS.length - 1 ? p + 1 : 0)); return; }
		if (key.return) { onSelect(KNOWN_TEAMS[idx]); return; }
		if (input === "q" || key.escape) onCancel();
	});

	return (
		<Box flexDirection="column" paddingX={1}>
			<Box marginBottom={1}>
				<Text bold color="red">Select Team</Text>
				{current ? <Text dimColor>  current: {current}</Text> : null}
			</Box>
			{KNOWN_TEAMS.map((t, i) => (
				<Box key={t}>
					<Text color={i === idx ? "cyan" : undefined}>
						{i === idx ? "❯ " : "  "}{t}
					</Text>
				</Box>
			))}
			<Box marginTop={1}>
				<Text dimColor>↑↓ navigate  Enter select  q cancel</Text>
			</Box>
		</Box>
	);
}

// ─── Main menu ────────────────────────────────────────────────────────────────

function SkillsMenu({ onClose }: { onClose?: () => void }): React.ReactElement {
	const { exit } = useApp();
	const [screen, setScreen] = useState<Screen>("main");
	const [catalog, setCatalog] = useState<SkillEntry[]>(SKILLS_CATALOG);
	const [loading, setLoading] = useState(true);
	const [team, setTeam] = useState<string | undefined>(readSithConfig().team);
	const [rows, setRows] = useState<SkillRowState[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [query, setQuery] = useState("");
	const [searching, setSearching] = useState(false);
	const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");

	useEffect(() => {
		setLoading(true);
		void getEffectiveCatalog(team).then((skills) => {
			setCatalog(skills);
			setRows(
				skills.map((s) => ({
					installed: isInstalled(s.name),
					autoLoad: getSkillAutoLoad(s.name),
					installedVersion: getInstalledVersion(s.name),
					status: "idle" as Status,
					message: "",
				})),
			);
			setSelectedIndex(0);
			setLoading(false);
		});
	}, [team]);

	const filtered = useMemo<SkillWithRow[]>(() => {
		return catalog
			.map((skill, catalogIndex) => ({ skill, row: rows[catalogIndex], catalogIndex }))
			.filter((item): item is SkillWithRow => {
				if (!item.row) return false;
				const q = query.toLowerCase();
				if (q && !item.skill.name.includes(q) && !item.skill.description.toLowerCase().includes(q)) return false;
				if (scopeFilter === "installed") return item.row.installed;
				if (scopeFilter === "required") return (item.skill as CatalogSkillEntry).scope === "required";
				if (scopeFilter === "optional") return (item.skill as CatalogSkillEntry).scope === "optional" || !(item.skill as CatalogSkillEntry).scope;
				return true;
			});
	}, [catalog, rows, query, scopeFilter]);

	const clampedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));
	const selectedItem = filtered[clampedIndex];

	function updateRow(catalogIndex: number, patch: Partial<SkillRowState>): void {
		setRows((prev) =>
			prev.map((r, i) => (i === catalogIndex ? { ...r, ...patch } : r)),
		);
	}

	async function toggleSkill(item: SkillWithRow): Promise<void> {
		const { skill, row, catalogIndex } = item;
		const scope = (skill as CatalogSkillEntry).scope;
		if (scope === "forbidden") {
			updateRow(catalogIndex, { status: "error", message: "Forbidden by org policy" });
			return;
		}
		updateRow(catalogIndex, { status: "working", message: row.installed ? "Uninstalling..." : "Downloading..." });
		try {
			if (row.installed) {
				uninstallSkill(skill.name);
				updateRow(catalogIndex, { installed: false, installedVersion: null, status: "done", message: "Uninstalled" });
			} else {
				await installSkill(skill);
				updateRow(catalogIndex, {
					installed: true,
					autoLoad: skill.autoLoad ?? false,
					installedVersion: getInstalledVersion(skill.name),
					status: "done",
					message: "Installed",
				});
			}
		} catch (e) {
			updateRow(catalogIndex, { status: "error", message: e instanceof Error ? e.message : "Failed" });
		}
	}

	async function installAllRequired(): Promise<void> {
		const required = filtered.filter(
			(item) => (item.skill as CatalogSkillEntry).scope === "required" && !item.row.installed,
		);
		for (const item of required) {
			await toggleSkill(item);
		}
	}

	const SCOPE_FILTERS: ScopeFilter[] = ["all", "required", "optional", "installed"];

	useInput(
		(input, key) => {
			if (searching) {
				if (key.escape || (key.ctrl && input === "c")) { setSearching(false); setQuery(""); return; }
				if (key.return) { setSearching(false); return; }
				if (key.backspace || key.delete) { setQuery((q) => q.slice(0, -1)); return; }
				if (input && !key.ctrl && !key.meta) setQuery((q) => q + input);
				return;
			}

			if (key.upArrow) { setSelectedIndex((p) => (p > 0 ? p - 1 : filtered.length - 1)); return; }
			if (key.downArrow) { setSelectedIndex((p) => (p < filtered.length - 1 ? p + 1 : 0)); return; }
			if (key.return && selectedItem) { void toggleSkill(selectedItem); return; }
			if (input === "a" && selectedItem?.row.installed) {
				const newAutoLoad = !selectedItem.row.autoLoad;
				setSkillAutoLoad(selectedItem.skill.name, newAutoLoad);
				updateRow(selectedItem.catalogIndex, { autoLoad: newAutoLoad, status: "done", message: newAutoLoad ? "Auto-load on" : "On-demand" });
				return;
			}
			if (input === "t") { setScreen("team-picker"); return; }
			if (input === "/") { setSearching(true); return; }
			if (input === "f") {
				setScopeFilter((f) => SCOPE_FILTERS[(SCOPE_FILTERS.indexOf(f) + 1) % SCOPE_FILTERS.length]);
				setSelectedIndex(0);
				return;
			}
			if (input === "R") { void installAllRequired(); return; }
			if (input === "q" || key.escape) { if (onClose) onClose(); else exit(); }
		},
		{ isActive: screen === "main" },
	);

	if (screen === "team-picker") {
		return (
			<TeamPicker
				current={team}
				onSelect={(selected) => { setTeam(selected); writeSithConfig({ team: selected }); setScreen("main"); }}
				onCancel={() => setScreen("main")}
			/>
		);
	}

	const termWidth = process.stdout.columns ?? 120;
	const rightWidth = termWidth - LEFT_WIDTH - 3;
	const outdatedCount = rows.filter((r, i) => isOutdated(r, catalog[i])).length;
	const installedCount = rows.filter((r) => r.installed).length;

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box paddingX={1} marginBottom={0}>
				<Text bold color="red">Skills</Text>
				{team ? <Text color="cyan">  [{team}]</Text> : <Text dimColor>  [no team]</Text>}
				<Text dimColor>  {installedCount}/{catalog.length} installed</Text>
				{outdatedCount > 0 ? <Text color="yellow">  {outdatedCount} outdated</Text> : null}
				{loading ? <Text color="yellow">  loading…</Text> : null}
				{searching ? <Text color="cyan">  /{query}<Text bold>_</Text></Text> : null}
				{scopeFilter !== "all" ? <Text color="magenta">  filter:{scopeFilter}</Text> : null}
			</Box>

			{/* Body: two panes */}
			<Box flexDirection="row">
				{/* Left pane */}
				<Box width={LEFT_WIDTH} flexDirection="column" paddingLeft={1}>
					{filtered.length === 0 ? (
						<Text dimColor>  no skills match</Text>
					) : (
						filtered.map((item, i) => {
							const { skill, row } = item;
							const isSelected = i === clampedIndex;
							const scope = (skill as CatalogSkillEntry).scope;
							const outdated = isOutdated(row, skill);

							let statusChar = row.installed ? "✅" : "☐";
							if (row.status === "working") statusChar = "⏳";
							if (row.status === "error") statusChar = "❌";

							return (
								<Box key={skill.name}>
									<Text color={isSelected ? "cyan" : undefined}>
										{isSelected ? "❯ " : "  "}
										{statusChar}{" "}
										{skill.name.padEnd(14)}
									</Text>
									{scope ? <Text color={scopeColor(scope)} dimColor={!isSelected}>{scope.slice(0, 3)}</Text> : null}
									{outdated ? <Text color="yellow"> ↑</Text> : null}
									{row.installed && row.autoLoad ? <Text color="green"> ●</Text> : null}
								</Box>
							);
						})
					)}
				</Box>

				{/* Separator */}
				<Box flexDirection="column" paddingX={0}>
					{Array.from({ length: Math.max(filtered.length + 1, 6) }).map((_, i) => (
						<Text key={i} dimColor>│</Text>
					))}
				</Box>

				{/* Right pane */}
				<SkillDetail item={selectedItem} width={rightWidth} />
			</Box>

			{/* Footer */}
			<Box paddingX={1} marginTop={1}>
				<Text dimColor>
					↑↓ nav  Enter toggle  a autoload  t team  / search  f filter  R install-required  q quit
				</Text>
			</Box>
		</Box>
	);
}

export { SkillsMenu };

export function skillsCommand(): void {
	render(<SkillsMenu />);
}
