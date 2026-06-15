import { Box, render, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";
import type { WorkspaceRepo } from "../types.js";
import {
	addRepo,
	listRepos,
	removeRepo,
	resolveRepoName,
} from "../utils/workspace.js";

type Screen = "main" | "add";
type AddField = "url" | "branch" | "name";

const LEFT_WIDTH = 30;

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
					<Text dimColor>Press n to add a repository</Text>
				</Box>
			</Box>
		);
	}

	const name = resolveRepoName(repo);

	return (
		<Box width={width} flexDirection="column" paddingX={1}>
			<Text bold color="white">
				{name}
			</Text>
			<Box marginTop={1} flexDirection="column">
				<Box>
					<Text dimColor>URL     </Text>
					<Text color="cyan">{repo.url}</Text>
				</Box>
				<Box>
					<Text dimColor>Branch  </Text>
					<Text>{repo.branch ?? "default"}</Text>
				</Box>
				<Box>
					<Text dimColor>Name    </Text>
					<Text>{repo.name ?? <Text dimColor>(auto: {name})</Text>}</Text>
				</Box>
			</Box>
			<Box marginTop={2}>
				<Text dimColor>d remove this repo</Text>
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
	const [error, setError] = useState("");

	useInput((input, key) => {
		if (key.escape) { onCancel(); return; }
		if (key.tab || key.return) {
			if (field === "url") {
				if (!url.trim()) { setError("URL required"); return; }
				setError("");
				setField("branch");
			} else if (field === "branch") {
				setField("name");
			} else {
				if (!url.trim()) { setError("URL required"); return; }
				onConfirm({
					url: url.trim(),
					...(branch.trim() ? { branch: branch.trim() } : {}),
					...(name.trim() ? { name: name.trim() } : {}),
				});
			}
		}
	});

	const fieldColor = (f: AddField) => (field === f ? "cyan" : "gray");

	return (
		<Box flexDirection="column" paddingX={1}>
			<Box marginBottom={1}>
				<Text bold color="red">Add Repository</Text>
			</Box>

			<Box marginBottom={0}>
				<Text color={fieldColor("url")}>URL    </Text>
				{field === "url" ? (
					<TextInput value={url} onChange={setUrl} onSubmit={() => {
						if (!url.trim()) { setError("URL required"); return; }
						setError(""); setField("branch");
					}} />
				) : (
					<Text color={url ? "white" : "gray"}>{url || "–"}</Text>
				)}
			</Box>

			<Box marginBottom={0}>
				<Text color={fieldColor("branch")}>Branch </Text>
				{field === "branch" ? (
					<TextInput value={branch} onChange={setBranch} onSubmit={() => setField("name")} placeholder="main (optional)" />
				) : (
					<Text color="gray">{branch || "–"}</Text>
				)}
			</Box>

			<Box marginBottom={0}>
				<Text color={fieldColor("name")}>Name   </Text>
				{field === "name" ? (
					<TextInput value={name} onChange={setName} onSubmit={() => {
						if (!url.trim()) { setError("URL required"); return; }
						onConfirm({
							url: url.trim(),
							...(branch.trim() ? { branch: branch.trim() } : {}),
							...(name.trim() ? { name: name.trim() } : {}),
						});
					}} placeholder="auto (optional)" />
				) : (
					<Text color="gray">{name || "–"}</Text>
				)}
			</Box>

			{error ? (
				<Box marginTop={1}><Text color="red">{error}</Text></Box>
			) : null}

			<Box marginTop={1}>
				<Text dimColor>Tab/Enter next field  Esc cancel</Text>
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
		setTimeout(() => setStatusMsg(""), 2000);
	}

	useInput(
		(input, key) => {
			if (key.upArrow) { setSelectedIndex((p) => (p > 0 ? p - 1 : repos.length - 1)); return; }
			if (key.downArrow) { setSelectedIndex((p) => (p < repos.length - 1 ? p + 1 : 0)); return; }
			if (input === "n") { setScreen("add"); return; }
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

	const termWidth = process.stdout.columns ?? 120;
	const rightWidth = termWidth - LEFT_WIDTH - 3;

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box paddingX={1} marginBottom={0}>
				<Text bold color="red">Repositories</Text>
				<Text dimColor>  {repos.length} configured</Text>
				{statusMsg ? (
					<Text color={statusError ? "red" : "green"}>  {statusMsg}</Text>
				) : null}
			</Box>

			{/* Body */}
			<Box flexDirection="row">
				{/* Left pane */}
				<Box width={LEFT_WIDTH} flexDirection="column" paddingLeft={1}>
					{repos.length === 0 ? (
						<Text dimColor>  no repos — press n to add</Text>
					) : (
						repos.map((repo, i) => {
							const isSelected = i === clampedIndex;
							const name = resolveRepoName(repo);
							return (
								<Box key={name}>
									<Text color={isSelected ? "cyan" : undefined}>
										{isSelected ? "❯ " : "  "}
										{name.slice(0, LEFT_WIDTH - 4)}
									</Text>
									{repo.branch ? (
										<Text dimColor> @{repo.branch.slice(0, 8)}</Text>
									) : null}
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

			{/* Footer */}
			<Box paddingX={1} marginTop={1}>
				<Text dimColor>↑↓ nav  n add  d remove  q quit</Text>
			</Box>
		</Box>
	);
}

export { ReposMenu };

export function reposCommand(): void {
	render(<ReposMenu />);
}
