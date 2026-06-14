import { execa } from "execa";
import { Box, render, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import React, { useCallback, useRef, useState } from "react";
import { SkillsMenu } from "../commands/skills.js";
import { ASCII_LOGO, DOCKER_CONFIG } from "../config.js";
import {
	buildDockerClaudeCodeCommand,
	buildDockerOpencodeCommand,
	buildDockerShellCommand,
} from "../utils/dockerArgs.js";
import { getGitHubToken } from "../utils/githubToken.js";
import { getMessageColor, getMessagePrefix } from "../utils/messageUtils.js";
import {
	getAvailableCommands,
	parseSlashCommand,
} from "../utils/slashCommands.js";
import { ConfigModal } from "./ConfigModal.js";

type AITool = "opencode" | "claude";

interface Message {
	id: number;
	text: string;
	type: "system" | "user" | "success" | "error" | "info";
	timestamp: Date;
}

interface MessageItemProps {
	message: Message;
}

const TOOLS: Array<{ value: AITool; label: string; description: string }> = [
	{
		value: "opencode",
		label: "OpenCode",
		description: "github-copilot/claude-sonnet-4.6",
	},
	{ value: "claude", label: "Claude Code", description: "Anthropic Claude" },
];

function SithHeader(): React.ReactElement {
	return (
		<Box flexDirection="column" alignItems="center" paddingY={1}>
			<Box flexDirection="column">
				{ASCII_LOGO.map((line, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static array, order never changes
					<Text key={index} color="red" bold>
						{line}
					</Text>
				))}
			</Box>
			<Text dimColor>Turn your context to the dark side</Text>
		</Box>
	);
}

interface ToolPickerProps {
	selectedIndex: number;
}

function ToolPicker({ selectedIndex }: ToolPickerProps): React.ReactElement {
	return (
		<Box
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			paddingY={2}
		>
			<SithHeader />
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				paddingX={4}
				paddingY={1}
			>
				<Box marginBottom={1}>
					<Text color="cyan" bold>
						Select AI Tool
					</Text>
				</Box>
				{TOOLS.map((tool, index) => (
					<Box key={tool.value}>
						<Text
							color={index === selectedIndex ? "cyan" : undefined}
							bold={index === selectedIndex}
						>
							{index === selectedIndex ? "▶ " : "  "}
							{tool.label}
						</Text>
						<Text dimColor>
							{"  "}
							{tool.description}
						</Text>
					</Box>
				))}
				<Box marginTop={1}>
					<Text dimColor>↑↓ navigate ↵ select</Text>
				</Box>
			</Box>
		</Box>
	);
}

function WelcomeScreen({ tool }: { tool: AITool }): React.ReactElement {
	const toolLabel = TOOLS.find((t) => t.value === tool)?.label ?? tool;
	return (
		<Box
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
		>
			<Box flexDirection="column" alignItems="center">
				<Text color="cyan">
					Tool: <Text bold>{toolLabel}</Text>
				</Text>
			</Box>
			<Box marginTop={2} flexDirection="column" alignItems="center">
				<Text color="cyan">Type your prompt to start coding</Text>
				<Text dimColor>or use slash commands:</Text>
			</Box>
			<Box flexDirection="column" marginTop={1} marginLeft={2}>
				<Text dimColor> /opencode - Switch to OpenCode</Text>
				<Text dimColor> /claude - Switch to Claude Code</Text>
				<Text dimColor> /shell - Start Docker shell</Text>
				<Text dimColor> /skills - Install/uninstall skills</Text>
				<Text dimColor> /config - Configuration</Text>
				<Text dimColor> /help - Show help</Text>
			</Box>
		</Box>
	);
}

function MessageItem({ message }: MessageItemProps): React.ReactElement {
	const color = getMessageColor(message.type);
	const prefix = getMessagePrefix(message.type);

	return (
		<Box marginBottom={0}>
			<Text color={color}>
				{prefix}
				{message.text}
			</Text>
		</Box>
	);
}

export function TerminalUI(): React.ReactElement {
	const { exit } = useApp();
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [showConfigModal, setShowConfigModal] = useState(false);
	const [showSkillsMenu, setShowSkillsMenu] = useState(false);
	const nextMessageId = useRef(1);
	const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
	const [toolPickerIndex, setToolPickerIndex] = useState(0);

	const addMessage = useCallback(
		(text: string, type: Message["type"] = "system"): void => {
			const newMessage: Message = {
				id: nextMessageId.current++,
				text,
				type,
				timestamp: new Date(),
			};
			setMessages((previousMessages) => [...previousMessages, newMessage]);
		},
		[],
	);

	const handleDockerShell = useCallback(async (): Promise<void> => {
		exit();

		console.log("🚀 Starting Docker shell...");
		console.log(
			`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`,
		);
		console.log('Press Ctrl+D or type "exit" to leave');
		console.log();

		const githubToken = await getGitHubToken();
		const claudeOauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN || "";
		const dockerArgs = buildDockerShellCommand(githubToken, claudeOauthToken);

		await execa("docker", dockerArgs, { stdio: "inherit", reject: false });
		console.log();
		console.log("✅ Exited shell");
	}, [exit]);

	const handleOpenCode = useCallback(
		async (prompt?: string): Promise<void> => {
			exit();

			console.log("🚀 Starting OpenCode...");
			console.log(
				`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`,
			);

			if (prompt) {
				console.log(`Prompt: ${prompt}`);
			}

			console.log();

			const githubToken = await getGitHubToken();
			const claudeOauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN || "";
			const dockerArgs = buildDockerOpencodeCommand(
				githubToken,
				prompt,
				claudeOauthToken,
			);

			try {
				await execa("docker", dockerArgs, { stdio: "inherit" });
				console.log();
				console.log("✅ Exited OpenCode");
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to start OpenCode";
				console.error(`❌ ${errorMessage}`);
				process.exit(1);
			}
		},
		[exit],
	);

	const handleClaudeCode = useCallback(
		async (prompt?: string): Promise<void> => {
			exit();

			console.log("🤖 Starting Claude Code...");
			console.log(
				`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`,
			);

			if (prompt) {
				console.log(`Prompt: ${prompt}`);
			}

			console.log();

			const githubToken = await getGitHubToken();
			const claudeOauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN || "";
			const dockerArgs = buildDockerClaudeCodeCommand(
				githubToken,
				prompt,
				claudeOauthToken,
			);

			try {
				await execa("docker", dockerArgs, { stdio: "inherit" });
				console.log();
				console.log("✅ Exited Claude Code");
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to start Claude Code";
				console.error(`❌ ${errorMessage}`);
				process.exit(1);
			}
		},
		[exit],
	);

	const handleSlashCommand = useCallback(
		async (
			command: ReturnType<typeof parseSlashCommand>,
			userInput: string,
		): Promise<void> => {
			if (!command) {
				return;
			}

			addMessage(userInput, "user");

			switch (command.type) {
				case "shell":
					await handleDockerShell();
					break;

				case "skills":
					setShowSkillsMenu(true);
					break;

				case "config":
					setShowConfigModal(true);
					break;

				case "help": {
					addMessage("Available commands:", "info");
					const availableCommands = getAvailableCommands();
					for (const cmd of availableCommands) {
						addMessage(`  ${cmd.command} - ${cmd.description}`, "info");
					}
					break;
				}

				case "opencode":
					setSelectedTool("opencode");
					addMessage("Switched to OpenCode", "success");
					break;

				case "claude":
					setSelectedTool("claude");
					addMessage("Switched to Claude Code", "success");
					break;
			}
		},
		[addMessage, handleDockerShell, exit],
	);

	const handleSubmit = useCallback(
		async (value: string): Promise<void> => {
			const trimmedValue = value.trim();

			if (!trimmedValue) {
				return;
			}

			setInput("");

			const command = parseSlashCommand(trimmedValue);

			if (command) {
				await handleSlashCommand(command, trimmedValue);
			} else if (trimmedValue.startsWith("/")) {
				addMessage(trimmedValue, "user");
				addMessage(
					`Unknown command: ${trimmedValue}. Type /help for available commands.`,
					"error",
				);
			} else {
				// Regular text input - route to selected tool
				if (selectedTool === "claude") {
					await handleClaudeCode(trimmedValue);
				} else {
					await handleOpenCode(trimmedValue);
				}
			}
		},
		[
			addMessage,
			handleOpenCode,
			handleClaudeCode,
			handleSlashCommand,
			selectedTool,
		],
	);

	const handleConfigModalClose = useCallback((): void => {
		setShowConfigModal(false);
	}, []);

	const handleConfigModalMessage = useCallback(
		(text: string, type?: "success" | "error" | "info"): void => {
			addMessage(text, type || "system");
		},
		[addMessage],
	);

	useInput((input, key) => {
		if (showConfigModal) {
			return;
		}

		const shouldExit = key.escape || (key.ctrl && input === "c");
		if (shouldExit) {
			exit();
		}

		if (selectedTool === null) {
			if (key.upArrow) {
				setToolPickerIndex((i) => (i - 1 + TOOLS.length) % TOOLS.length);
			} else if (key.downArrow) {
				setToolPickerIndex((i) => (i + 1) % TOOLS.length);
			} else if (key.return) {
				setSelectedTool(TOOLS[toolPickerIndex].value);
			}
		}
	});

	if (showConfigModal) {
		return (
			<Box flexDirection="column">
				<ConfigModal
					onClose={handleConfigModalClose}
					onMessage={handleConfigModalMessage}
				/>
			</Box>
		);
	}

	if (showSkillsMenu) {
		return (
			<Box flexDirection="column">
				<SkillsMenu onClose={() => setShowSkillsMenu(false)} />
			</Box>
		);
	}

	if (selectedTool === null) {
		return <ToolPicker selectedIndex={toolPickerIndex} />;
	}

	const recentMessages = messages.slice(-10);

	return (
		<Box flexDirection="column" height="100%">
			<SithHeader />
			{messages.length === 0 ? (
				<WelcomeScreen tool={selectedTool} />
			) : (
				<Box flexDirection="column" flexGrow={1} marginBottom={1}>
					{recentMessages.map((message) => (
						<MessageItem key={message.id} message={message} />
					))}
				</Box>
			)}

			<Box flexDirection="column">
				<Box borderStyle="single" borderColor="gray" paddingX={1}>
					<Text color="cyan" bold>
						›
					</Text>
					<Text> </Text>
					<TextInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						placeholder="Enter your prompt..."
					/>
				</Box>
				<Box marginTop={1} paddingX={1}>
					<Text dimColor>Ctrl+C to exit</Text>
				</Box>
			</Box>
		</Box>
	);
}

export function renderTerminalUI(): void {
	render(<TerminalUI />);
}
