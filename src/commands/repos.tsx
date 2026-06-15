import { Box, render, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";
import type { WorkspaceRepo } from "../types.js";
import {
	addRepo,
	listRepos,
	removeRepo,
	resolveRepoName,
	updateRepo,
} from "../utils/workspace.js";

type Screen = "main" | "add" | "set-path";
type AddField = "url" | "branch" | "name" | "localPath";

const LEFT_WIDTH = 32;

// ─── Detail pane ─────────────────────────────────────────────────────────────

function RepoDetail({
	repo,
	width,
}: {
	repo: WorkspaceRepo | undefined;
	width: number;
}): React.ReactElement {
	if (!repo) {
		return (
			<Box width={width} flexDirection="column" paddingX={1}>
				<Text dimColor>No repository selected</Text>
				<Box marginTop={1}>
					<Text dimColor>n  add a repository</Text>
				</Box>
			</Box>
		);
	}

	const name = resolveRepoName(repo);
	const mode = repo.mode ?? "clone";

	return (
		<Box width={width} flexDirection="column" paddingX={1}>
			<Text bold color="white">{name}</Text>
			<Box marginTop={1} flexDirection="column">
				<Box>
					<Text dimColor>URL       </Text>
					<Text color="cyan">{repo.url}</Text>
				</Box>
				<Box>
					<Text dimColor>Branch    </Text>
					<Text>{repo.branch ?? "default"}</Text>
				</Box>
				<Box>
					<Text dimColor>Name      </Text>
					<Text dimColor>{repo.name ? repo.name : `(auto: ${name})`}</Text>
				</Box>
				<Box>
					<Text dimColor>Mode      </Text>
					<Text color={mode === "mount" ? "yellow" : "green"}>
						{mode === "mount" ? "mount (bind)" : "clone (volume)"}
					</Text>
				</Box>
				{mode === "mount" ? (
					<Box>
						<Text dimColor>Local path</Text>
						<Text color={repo.localPath ? "white" : "red"}>
							{"  "}{repo.localPath ?? "⚠ not set — press m to configure"}
						</Text>
					</Box>
				) : null}
			</Box>
			<Box marginTop={2} flexDirection="column">
				<Text dimColor>m  toggle mode ({mode === "clone" ? "→ mount" : "→ clone"})</Text>
				<Text dimColor>d  remove</Text>
			</Box>
		</Box>
	);
}

// ─── Add form ────────────────────────────────────────────────────────────────

function AddRepoForm({
	onConfirm,
	onCancel,
}: {
	onConfirm: (repo: WorkspaceRepo) => void;
	onCancel: () => void;
}): React.ReactElement {
	const [field, setField] = useState<AddField>("url");
	const [url, setUrl] = useState("");
	const [branch, setBranch] = useState("");
	const [name, setName] = useState("");
	const [mode, setMode] = useState<"clone" | "mount">("clone");
	const [localPath, setLocalPath] = useState("");
	const [error, setError] = useState("");

	function advance() {
		if (field === "url") {
			if (!url.trim()) { setError("URL required"); return; }
			setError(""); setField("branch");
		} else if (field === "branch") {
			setField("name");
		} else if (field === "name") {
			if (mode === "mount") { setField("localPath"); } else { submit(); }
		} else {
			submit();
		}
	}

	function submit() {
		onConfirm({
			url: url.trim(),
			mode,
			...(branch.trim() ? { branch: branch.trim() } : {}),
			...(name.trim() ? { name: name.trim() } : {}),
			...(mode === "mount" && localPath.trim() ? { localPath: localPath.trim() } : {}),
		});
	}

	useInput((input, key) => {
		if (key.escape) { onCancel(); return; }
		if (key.tab) { advance(); return; }
		if (input === "m" && field === "name") {
			setMode((m) => (m === "clone" ? "mount" : "clone"));
		}
	});

	const active = (f: AddField) => field === f;

	return (
		<Box flexDirection="column" paddingX={1}>
			<Box marginBottom={1}>
				<Text bold color="red">Add Repository</Text>
			</Box>
			<Box>
				<Text color={active("url") ? "cyan" : "gray"}>URL       </Text>
				{active("url")
					? <TextInput value={url} onChange={setUrl} onSubmit={advance} />
					: <Text color={url ? "white" : "gray"}>{url || "–"}</Text>}
			</Box>
			<Box>
				<Text color={active("branch") ? "cyan" : "gray"}>Branch    </Text>
				{active("branch")
					? <TextInput value={branch} onChange={setBranch} onSubmit={advance} placeholder="main (optional)" />
					: <Text color="gray">{branch || "–"}</Text>}
			</Box>
			<Box>
				<Text color={active("name") ? "cyan" : "gray"}>Name      </Text>
				{active("name")
					? <TextInput value={name} onChange={setName} onSubmit={advance} placeholder="auto (optional)" />
					: <Text color="gray">{name || "–"}</Text>}
			</Box>
			<Box>
				<Text color="gray">Mode      </Text>
				<Text color={mode === "mount" ? "yellow" : "green"}>
					{mode === "clone" ? "clone (volume)" : "mount (bind)"}
				</Text>
				{active("name") ? <Text dimColor>  m toggle</Text> : null}
			</Box>
			{mode === "mount" ? (
				<Box>
					<Text color={active("localPath") ? "cyan" : "gray"}>Local path</Text>
					{active("localPath")
						? <TextInput value={localPath} onChange={setLocalPath} onSubmit={advance} placeholder="/path/to/local/repo" />
						: <Text color="gray">{"  "}{localPath || "–"}</Text>}
				</Box>
			) : null}
			{error ? <Box marginTop={1}><Text color="red">{error}</Text></Box> : null}
			<Box marginTop={1}>
				<Text dimColor>Tab/Enter next  m toggle-mode  Esc cancel</Text>
			</Box>
		</Box>
	);
}

// ─── Set local path form ──────────────────────────────────────────────────────

function SetPathForm({
	repoName,
	current,
	onConfirm,
	onCancel,
}: {
	repoName: string;
	current?: string;
	onConfirm: (localPath: string) => void;
	onCancel: () => void;
}): React.ReactElement {
	const [value, setValue] = useState(current ?? "");
	const [error, setError] = useState("");

	return (
		<Box flexDirection="column" paddingX={1}>
			<Box marginBottom={1}>
				<Text bold color="red">Set Local Path — </Text>
				<Text color="cyan">{repoName}</Text>
			</Box>
			<Box>
				<Text color="cyan">Path  </Text>
				<TextInput
					value={value}
					onChange={setValue}
					onSubmit={(v) => {
						if (!v.trim()) { setError("Path required"); return; }
						onConfirm(v.trim());
					}}
					placeholder="/path/to/local/repo"
				/>
			</Box>
			{error ? <Box marginTop={1}><Text color="red">{error}</Text></Box> : null}
			<Box marginTop={1}>
				<Text dimColor>Enter confirm  Esc cancel</Text>
			</Box>
		</Box>
	);
}

// ─── Main menu ────────────────────────────────────────────────────────────────

function ReposMenu({ onClose }: { onClose?: () => void }): React.ReactElement {
	const { exit } = useApp();
	const [screen, setScreen] = useState<Screen>("main");
	const [repos, setRepos] = useState<WorkspaceRepo[]>(listRepos);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [statusMsg, setStatusMsg] = useState("");
	const [statusError, setStatusError] = useState(false);

	const clampedIndex = Math.min(selectedIndex, Math.max(0, repos.length - 1));
	const selectedRepo = repos[clampedIndex];

	function refresh() {
		const updated = listRepos();
		setRepos(updated);
		setSelectedIndex((i) => Math.min(i, Math.max(0, updated.length - 1)));
	}

	function flash(msg: string, isError = false) {
		setStatusMsg(msg);
		setStatusError(isError);
		setTimeout(() => setStatusMsg(""), 2500);
	}

	function toggleMode(repo: WorkspaceRepo) {
		const currentMode = repo.mode ?? "clone";
		if (currentMode === "clone") {
			setScreen("set-path");
		} else {
			try {
				updateRepo(resolveRepoName(repo), { mode: "clone", localPath: undefined });
				refresh();
				flash(`${resolveRepoName(repo)} → clone mode`);
			} catch (e) {
				flash(e instanceof Error ? e.message : "Failed", true);
			}
		}
	}

	useInput(
		(input, key) => {
			if (key.upArrow) { setSelectedIndex((p) => (p > 0 ? p - 1 : repos.length - 1)); return; }
			if (key.downArrow) { setSelectedIndex((p) => (p < repos.length - 1 ? p + 1 : 0)); return; }
			if (input === "n") { setScreen("add"); return; }
			if (input === "m" && selectedRepo) { toggleMode(selectedRepo); return; }
			if (input === "d" && selectedRepo) {
				try {
					removeRepo(resolveRepoName(selectedRepo));
					flash(`Removed "${resolveRepoName(selectedRepo)}"`);
					refresh();
				} catch (e) {
					flash(e instanceof Error ? e.message : "Failed", true);
				}
				return;
			}
			if (input === "q" || key.escape) { if (onClose) onClose(); else exit(); }
		},
		{ isActive: screen === "main" },
	);

	if (screen === "add") {
		return (
			<AddRepoForm
				onConfirm={(repo) => {
					try {
						addRepo(repo);
						refresh();
						flash(`Added "${resolveRepoName(repo)}"`);
					} catch (e) {
						flash(e instanceof Error ? e.message : "Failed", true);
					}
					setScreen("main");
				}}
				onCancel={() => setScreen("main")}
			/>
		);
	}

	if (screen === "set-path" && selectedRepo) {
		return (
			<SetPathForm
				repoName={resolveRepoName(selectedRepo)}
				current={selectedRepo.localPath}
				onConfirm={(localPath) => {
					try {
						updateRepo(resolveRepoName(selectedRepo), { mode: "mount", localPath });
						refresh();
						flash(`${resolveRepoName(selectedRepo)} → mount mode`);
					} catch (e) {
						flash(e instanceof Error ? e.message : "Failed", true);
					}
					setScreen("main");
				}}
				onCancel={() => setScreen("main")}
			/>
		);
	}

	const termWidth = process.stdout.columns ?? 120;
	const rightWidth = termWidth - LEFT_WIDTH - 3;

	return (
		<Box flexDirection="column">
			<Box paddingX={1} marginBottom={0}>
				<Text bold color="red">Repositories</Text>
				<Text dimColor>  {repos.length} configured</Text>
				{statusMsg
					? <Text color={statusError ? "red" : "green"}>  {statusMsg}</Text>
					: null}
			</Box>

			<Box flexDirection="row">
				{/* Left pane */}
				<Box width={LEFT_WIDTH} flexDirection="column" paddingLeft={1}>
					{repos.length === 0 ? (
						<Text dimColor>  no repos — press n to add</Text>
					) : (
						repos.map((repo, i) => {
							const isSelected = i === clampedIndex;
							const name = resolveRepoName(repo);
							const mode = repo.mode ?? "clone";
							return (
								<Box key={name}>
									<Text color={isSelected ? "cyan" : undefined}>
										{isSelected ? "❯ " : "  "}
										{name.slice(0, LEFT_WIDTH - 8).padEnd(LEFT_WIDTH - 8)}
									</Text>
									<Text color={mode === "mount" ? "yellow" : "green"} dimColor={!isSelected}>
										{mode === "mount" ? "⬆ mnt" : "⬇ cln"}
									</Text>
									{mode === "mount" && !repo.localPath
										? <Text color="red"> !</Text>
										: null}
								</Box>
							);
						})
					)}
				</Box>

				{/* Separator */}
				<Box flexDirection="column">
					{Array.from({ length: Math.max(repos.length + 1, 4) }).map((_, i) => (
						<Text key={i} dimColor>│</Text>
					))}
				</Box>

				{/* Right pane */}
				<RepoDetail repo={selectedRepo} width={rightWidth} />
			</Box>

			<Box paddingX={1} marginTop={1}>
				<Text dimColor>↑↓ nav  n add  m toggle-mode  d remove  q quit</Text>
			</Box>
		</Box>
	);
}

export { ReposMenu };

export function reposCommand(): void {
	render(<ReposMenu />);
}
