import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import { Box, Text, useInput } from "ink";
import React, { useState } from "react";
import { DOCKER_CONFIG } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findProjectRoot(startDir: string): string {
	let currentDir = startDir;
	const rootPath = path.parse(currentDir).root;

	while (currentDir !== rootPath) {
		const dockerPath = path.join(currentDir, DOCKER_CONFIG.folderName);
		if (fs.existsSync(dockerPath) && fs.statSync(dockerPath).isDirectory()) {
			return currentDir;
		}
		currentDir = path.dirname(currentDir);
	}

	throw new Error(
		`Could not find project root (${DOCKER_CONFIG.folderName}/ folder not found)`,
	);
}

const rootDir = findProjectRoot(__dirname);

interface ConfigOption {
	label: string;
	value: string;
	icon: string;
}

const configOptions: readonly ConfigOption[] = [
	{ label: "Pull prebuilt image (recommended)", value: "pull", icon: "📦" },
	{ label: "Build Docker image from scratch", value: "build", icon: "🔨" },
	{ label: "Back", value: "back", icon: "◀️" },
] as const;

interface ConfigModalProps {
	onClose: () => void;
	onMessage: (message: string, type?: "success" | "error" | "info") => void;
}

export function ConfigModal({
	onClose,
	onMessage,
}: ConfigModalProps): React.ReactElement {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processStep, setProcessStep] = useState("");

	useInput((_input, key) => {
		if (isProcessing) {
			return;
		}

		if (key.upArrow) {
			setSelectedIndex((prev) =>
				prev > 0 ? prev - 1 : configOptions.length - 1,
			);
		} else if (key.downArrow) {
			setSelectedIndex((prev) =>
				prev < configOptions.length - 1 ? prev + 1 : 0,
			);
		} else if (key.return) {
			handleSelection(configOptions[selectedIndex].value);
		} else if (key.escape) {
			onClose();
		}
	});

	async function handleSelection(value: string): Promise<void> {
		switch (value) {
			case "back":
				onClose();
				break;
			case "pull":
				await handlePull();
				break;
			case "build":
				await handleBuild();
				break;
		}
	}

	async function handlePull(): Promise<void> {
		setIsProcessing(true);
		setProcessStep("Pulling prebuilt Docker image...");

		try {
			await execa("docker", ["pull", DOCKER_CONFIG.prebuiltImage], {
				stdio: "inherit",
			});
			await execa(
				"docker",
				["tag", DOCKER_CONFIG.prebuiltImage, DOCKER_CONFIG.imageName],
				{
					stdio: "inherit",
				},
			);

			onMessage(`✅ Docker image ready: ${DOCKER_CONFIG.imageName}`, "success");
			onClose();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Pull failed";
			onMessage(`❌ ${message}`, "error");
			setIsProcessing(false);
		}
	}

	async function handleBuild(): Promise<void> {
		setIsProcessing(true);
		setProcessStep("Building Docker image from scratch...");

		try {
			const dockerfilePath = path.join(
				rootDir,
				DOCKER_CONFIG.folderName,
				DOCKER_CONFIG.dockerfileName,
			);

			if (!fs.existsSync(dockerfilePath)) {
				throw new Error(`Dockerfile not found at: ${dockerfilePath}`);
			}

			await execa(
				"docker",
				["build", "-f", dockerfilePath, "-t", DOCKER_CONFIG.imageName, rootDir],
				{
					stdio: "inherit",
				},
			);

			onMessage(`✅ Docker image built: ${DOCKER_CONFIG.imageName}`, "success");
			onClose();
		} catch (error) {
			const message = error instanceof Error ? error.message : "Build failed";
			onMessage(`❌ ${message}`, "error");
			setIsProcessing(false);
		}
	}

	if (isProcessing) {
		return (
			<Box
				flexDirection="column"
				borderStyle="round"
				borderColor="cyan"
				padding={1}
			>
				<Text color="cyan" bold>
					⚙️ Configuration
				</Text>
				<Box marginTop={1}>
					<Text color="yellow">{processStep}</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			padding={1}
		>
			<Text color="cyan" bold>
				⚙️ Configuration
			</Text>
			<Box flexDirection="column" marginTop={1}>
				{configOptions.map((option, index) => {
					const isSelected = index === selectedIndex;
					return (
						<Box key={option.value} marginY={0}>
							<Text color={isSelected ? "cyan" : undefined}>
								{isSelected ? "❯ " : "  "}
								{option.icon} {option.label}
							</Text>
						</Box>
					);
				})}
			</Box>
			<Box marginTop={1}>
				<Text dimColor>
					Use arrow keys to navigate, Enter to select, Esc to close
				</Text>
			</Box>
		</Box>
	);
}
