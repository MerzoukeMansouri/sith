import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import { execa } from "execa";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { MenuItem, BuildingSpinnerProps, DockerCommandOptions } from "../types.js";
import { DOCKER_CONFIG, SPINNER_CONFIG, ASCII_LOGO } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find project root by looking for docker/ folder
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

  throw new Error(`Could not find project root (${DOCKER_CONFIG.folderName}/ folder not found)`);
}

const rootDir = findProjectRoot(__dirname);

const menuItems: readonly MenuItem[] = [
  { label: "Enter Shell", value: "shell", icon: "🚀" },
  { label: "Configuration", value: "config", icon: "⚙️" },
] as const;

const configMenuItems: readonly MenuItem[] = [
  { label: "Pull prebuilt image (recommended)", value: "pull", icon: "📦" },
  { label: "Build Docker image from scratch", value: "build", icon: "🔨" },
  { label: "Back", value: "back", icon: "◀️" },
] as const;

function Logo(): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="column">
        {ASCII_LOGO.map((line, index) => (
          <Text key={index} color="red" bold>
            {line}
          </Text>
        ))}
      </Box>
      <Box borderStyle="double" borderColor="red" paddingX={2} marginTop={1}>
        <Text color="red" bold>
          SITH - Docker Manager
        </Text>
      </Box>
    </Box>
  );
}

function BuildingSpinner({ step }: BuildingSpinnerProps): React.ReactElement {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_CONFIG.frames.length);
    }, SPINNER_CONFIG.interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyan">
        {SPINNER_CONFIG.frames[frame]} {step}
      </Text>
    </Box>
  );
}

function Menu(): React.ReactElement {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState("");
  const [processComplete, setProcessComplete] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [currentMenu, setCurrentMenu] = useState<"main" | "config">("main");

  useInput((_input, key) => {
    if (isProcessing) {
      return;
    }

    // Exit on any key press when process is complete or errored
    if (processComplete || processError) {
      exit();
      return;
    }

    const items = currentMenu === "main" ? menuItems : configMenuItems;

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      handleSelection(items[selectedIndex].value);
    }
  });

  async function handleSelection(value: string): Promise<void> {
    switch (value) {
      case "shell":
        exit();
        await runShell();
        return;

      case "config":
        setCurrentMenu("config");
        setSelectedIndex(0);
        return;

      case "back":
        setCurrentMenu("main");
        setSelectedIndex(0);
        return;

      case "pull":
        await handlePullCommand();
        break;

      case "build":
        await handleBuildCommand();
        break;

      default:
        break;
    }
  }

  async function handlePullCommand(): Promise<void> {
    setIsProcessing(true);
    setProcessStep("Pulling prebuilt Docker image...");

    try {
      await execa(
        "docker",
        ["pull", DOCKER_CONFIG.prebuiltImage],
        {
          stdio: "inherit",
        },
      );

      // Tag the pulled image with local name for compatibility
      await execa(
        "docker",
        ["tag", DOCKER_CONFIG.prebuiltImage, DOCKER_CONFIG.imageName],
        {
          stdio: "inherit",
        },
      );

      setIsProcessing(false);
      setProcessComplete(true);
      setProcessStep("");
    } catch (error) {
      setIsProcessing(false);
      setProcessError(
        error instanceof Error ? error.message : "Pull failed",
      );
    }
  }

  async function handleBuildCommand(): Promise<void> {
    setIsProcessing(true);
    setProcessStep("Building Docker image from scratch...");

    try {
      const dockerfilePath = path.join(rootDir, DOCKER_CONFIG.folderName, DOCKER_CONFIG.dockerfileName);

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

      setIsProcessing(false);
      setProcessComplete(true);
      setProcessStep("");
    } catch (error) {
      setIsProcessing(false);
      setProcessError(
        error instanceof Error ? error.message : "Operation failed",
      );
    }
  }

  // Render error state
  if (processError) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box marginTop={1}>
          <Text color="red">❌ Operation failed: {processError}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press any key to exit...</Text>
        </Box>
      </Box>
    );
  }

  // Render success state
  if (processComplete) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box marginTop={1}>
          <Text color="green">✅ Docker image ready!</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Image: {DOCKER_CONFIG.imageName}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Run: sith --it</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press any key to exit...</Text>
        </Box>
      </Box>
    );
  }

  // Render processing state
  if (isProcessing) {
    return (
      <Box flexDirection="column">
        <Logo />
        <BuildingSpinner step={processStep} />
        <Box marginTop={1}>
          <Text dimColor>Root: {rootDir}</Text>
        </Box>
      </Box>
    );
  }

  // Render menu state
  const items = currentMenu === "main" ? menuItems : configMenuItems;
  const menuTitle = currentMenu === "main" ? "What would you like to do?" : "Configuration";

  return (
    <Box flexDirection="column">
      <Logo />
      <Box flexDirection="column" marginTop={1}>
        <Text bold>{menuTitle}</Text>
        <Box flexDirection="column" marginTop={1}>
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box key={item.value} marginY={0}>
                <Text color={isSelected ? "cyan" : undefined}>
                  {isSelected ? "❯ " : "  "}
                  {item.icon} {item.label}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to navigate, Enter to select</Text>
      </Box>
    </Box>
  );
}

export async function dockerCommand(options: DockerCommandOptions): Promise<void> {
  if (options.build) {
    await buildDocker();
    return;
  }

  if (options.pull) {
    await pullDocker();
    return;
  }

  // Check if stdin supports raw mode (interactive terminal)
  if (!process.stdin.isTTY) {
    console.error("Error: Interactive mode requires a TTY terminal");
    console.error("Use --build or --pull flag for non-interactive mode");
    process.exit(1);
  }

  // Render the interactive menu
  render(<Menu />);
}

export async function runShellDirect(): Promise<void> {
  await runShell();
}

async function pullDocker(): Promise<void> {
  console.log("📦 Pulling prebuilt Docker image...");
  console.log();

  try {
    console.log(`Source: ${DOCKER_CONFIG.prebuiltImage}`);
    console.log(`Target: ${DOCKER_CONFIG.imageName}`);
    console.log();

    await execa(
      "docker",
      ["pull", DOCKER_CONFIG.prebuiltImage],
      {
        stdio: "inherit",
      },
    );

    console.log();
    console.log("🏷️  Tagging image for local use...");

    await execa(
      "docker",
      ["tag", DOCKER_CONFIG.prebuiltImage, DOCKER_CONFIG.imageName],
      {
        stdio: "inherit",
      },
    );

    console.log();
    console.log("✅ Docker image ready!");
    console.log(`Image: ${DOCKER_CONFIG.imageName}`);
    console.log();
    console.log("Run: sith --it");
  } catch (error) {
    console.error("❌ Pull failed");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

async function buildDocker(): Promise<void> {
  console.log("🔨 Building Docker image from scratch...");
  console.log();

  try {
    const dockerfilePath = path.join(rootDir, DOCKER_CONFIG.folderName, DOCKER_CONFIG.dockerfileName);

    if (!fs.existsSync(dockerfilePath)) {
      throw new Error(`Dockerfile not found at: ${dockerfilePath}`);
    }

    console.log(`Root: ${rootDir}`);
    console.log(`Dockerfile: ${dockerfilePath}`);
    console.log();

    await execa(
      "docker",
      ["build", "-f", dockerfilePath, "-t", DOCKER_CONFIG.imageName, rootDir],
      {
        stdio: "inherit",
      },
    );

    console.log();
    console.log("✅ Docker image built successfully!");
    console.log(`Image: ${DOCKER_CONFIG.imageName}`);
    console.log();
    console.log("Run: sith --it");
  } catch (error) {
    console.error("❌ Build failed");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

async function runShell(): Promise<void> {
  console.log("🚀 Starting interactive shell...");
  console.log(`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`);
  console.log('Press Ctrl+D or type "exit" to leave');
  console.log();

  // Try to get GitHub token from gh CLI if not in env
  let githubToken = process.env.GITHUB_TOKEN || "";
  if (!githubToken) {
    try {
      const { stdout } = await execa("gh", ["auth", "token"]);
      githubToken = stdout.trim();
    } catch {
      // Ignore if gh CLI not available or not authenticated
    }
  }

  const dockerArgs = [
    "run",
    "--rm",
    "-it",
    "-v",
    `${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
    "-e",
    `GITHUB_TOKEN=${githubToken}`,
    "--entrypoint",
    "nix-shell",
    DOCKER_CONFIG.imageName,
    DOCKER_CONFIG.shellEntrypoint,
  ];

  try {
    await execa("docker", dockerArgs, {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Failed to start shell");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}
