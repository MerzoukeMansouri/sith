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
  { label: "Build Docker image", value: "build", icon: "🔨" },
  { label: "Exit", value: "exit", icon: "❌" },
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
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState("");
  const [buildComplete, setBuildComplete] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (isBuilding) {
      return;
    }

    // Exit on any key press when build is complete or errored
    if (buildComplete || buildError) {
      exit();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : menuItems.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < menuItems.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      handleSelection(menuItems[selectedIndex].value);
    }
  });

  async function handleSelection(value: string): Promise<void> {
    switch (value) {
      case "exit":
        exit();
        return;

      case "build":
        await handleBuildCommand();
        break;

      default:
        break;
    }
  }

  async function handleBuildCommand(): Promise<void> {
    setIsBuilding(true);
    setBuildStep("Building Docker image...");

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

      setIsBuilding(false);
      setBuildComplete(true);
      setBuildStep("");
    } catch (error) {
      setIsBuilding(false);
      setBuildError(
        error instanceof Error ? error.message : "Build failed",
      );
    }
  }

  // Render error state
  if (buildError) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box marginTop={1}>
          <Text color="red">❌ Build failed: {buildError}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press any key to exit...</Text>
        </Box>
      </Box>
    );
  }

  // Render success state
  if (buildComplete) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box marginTop={1}>
          <Text color="green">✅ Docker image built successfully!</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Image: {DOCKER_CONFIG.imageName}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press any key to exit...</Text>
        </Box>
      </Box>
    );
  }

  // Render building state
  if (isBuilding) {
    return (
      <Box flexDirection="column">
        <Logo />
        <BuildingSpinner step={buildStep} />
        <Box marginTop={1}>
          <Text dimColor>Root: {rootDir}</Text>
        </Box>
      </Box>
    );
  }

  // Render menu state
  return (
    <Box flexDirection="column">
      <Logo />
      <Box flexDirection="column" marginTop={1}>
        <Text bold>What would you like to do?</Text>
        <Box flexDirection="column" marginTop={1}>
          {menuItems.map((item, index) => {
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

  // Check if stdin supports raw mode (interactive terminal)
  if (!process.stdin.isTTY) {
    console.error("Error: Interactive mode requires a TTY terminal");
    console.error("Use --build flag for non-interactive mode");
    process.exit(1);
  }

  // Render the interactive menu
  render(<Menu />);
}

export async function runShellDirect(): Promise<void> {
  await runShell();
}

async function buildDocker(): Promise<void> {
  console.log("🔨 Building Docker image...");
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

  const dockerArgs = [
    "run",
    "--rm",
    "-it",
    "-v",
    `${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
    "-e",
    `GITHUB_TOKEN=${process.env.GITHUB_TOKEN || ""}`,
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
