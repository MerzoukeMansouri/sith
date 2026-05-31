import { execa } from "execa";
import { Box, render, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import type React from "react";
import { useCallback, useState } from "react";
import { skillsCommand } from "../commands/skills.js";
import { ASCII_LOGO, DOCKER_CONFIG } from "../config.js";
import {
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

interface Message {
	id: number;
	text: string;
	type: "system" | "user" | "success" | "error" | "info";
	timestamp: Date;
}

interface MessageItemProps {
	message: Message;
}

function WelcomeScreen(): React.ReactElement {
	return (
		<Box
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			paddingY={2}
		>
			<Box flexDirection="column" marginBottom={2}>
				{ASCII_LOGO.map((line, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static array, order never changes
					<Text key={index} color="red" bold>
						{line}
					</Text>
				))}
			</Box>
			<Box flexDirection="column" alignItems="center" marginTop={1}>
				<Text dimColor>Turn your context to the dark side</Text>
				<Text dimColor>Dockerized OpenCode environment</Text>
			</Box>
			<Box marginTop={2} flexDirection="column" alignItems="center">
				<Text color="cyan">Type your prompt to start coding</Text>
				<Text dimColor>or use slash commands:</Text>
			</Box>
			<Box flexDirection="column" marginTop={1} marginLeft={2}>
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
	const [nextMessageId, setNextMessageId] = useState(1);

	const addMessage = useCallback(
		(text: string, type: Message["type"] = "system"): void => {
			const newMessage: Message = {
				id: nextMessageId,
				text,
				type,
				timestamp: new Date(),
			};

			setMessages((previousMessages) => [...previousMessages, newMessage]);
			setNextMessageId((previousId) => previousId + 1);
		},
		[nextMessageId],
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
		const dockerArgs = buildDockerShellCommand(githubToken);

		try {
			await execa("docker", dockerArgs, { stdio: "inherit" });
			console.log();
			console.log("✅ Exited shell");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to start shell";
			console.error(`❌ ${errorMessage}`);
			process.exit(1);
		}
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
			const dockerArgs = buildDockerOpencodeCommand(githubToken, prompt);

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
					exit();
					skillsCommand();
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
				// Regular text input - start OpenCode with this prompt
				await handleOpenCode(trimmedValue);
			}
		},
		[addMessage, handleOpenCode, handleSlashCommand],
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
			// Let modal handle input
			return;
		}

		const shouldExit = key.escape || (key.ctrl && input === "c");
		if (shouldExit) {
			exit();
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

	const shouldShowWelcome = messages.length === 0;
	const recentMessages = messages.slice(-10);

	return (
		<Box flexDirection="column" height="100%">
			{shouldShowWelcome ? (
				<WelcomeScreen />
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
