import React, { useState, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { execa } from "execa";
import { ConfigModal } from "./ConfigModal.js";
import { parseSlashCommand, getAvailableCommands } from "../utils/slashCommands.js";
import { DOCKER_CONFIG, ASCII_LOGO } from "../config.js";

interface Message {
  id: number;
  text: string;
  type: "system" | "user" | "success" | "error" | "info";
  timestamp: Date;
}

interface MessageItemProps {
  message: Message;
}

interface ConfigModalCallbackProps {
  onClose: () => void;
  onMessage: (text: string, type?: "success" | "error" | "info") => void;
}

function WelcomeScreen(): React.ReactElement {
  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center" paddingY={2}>
      <Box flexDirection="column" marginBottom={2}>
        {ASCII_LOGO.map((line, index) => (
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
        <Text dimColor>  /shell   - Start Docker shell</Text>
        <Text dimColor>  /config  - Configuration</Text>
        <Text dimColor>  /help    - Show help</Text>
      </Box>
    </Box>
  );
}

function getMessageColor(messageType: Message["type"]): string | undefined {
  switch (messageType) {
    case "success":
      return "green";
    case "error":
      return "red";
    case "info":
      return "cyan";
    case "user":
      return "white";
    case "system":
      return "gray";
    default:
      return undefined;
  }
}

function getMessagePrefix(messageType: Message["type"]): string {
  switch (messageType) {
    case "user":
      return "› ";
    case "system":
      return "⚡ ";
    default:
      return "";
  }
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

async function getGitHubToken(): Promise<string> {
  // Check environment variable first
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    return envToken;
  }

  // Try to get token from gh CLI
  try {
    const { stdout } = await execa("gh", ["auth", "token"]);
    return stdout.trim();
  } catch {
    // Return empty string if gh CLI is not available
    return "";
  }
}

function buildDockerShellCommand(githubToken: string): string[] {
  return [
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
}

function buildDockerOpencodeCommand(githubToken: string, prompt?: string): string[] {
  const dockerArgs = [
    "run",
    "--rm",
    "-it",
    "-v",
    `${process.cwd()}:${DOCKER_CONFIG.workspaceMount}`,
    "-e",
    `GITHUB_TOKEN=${githubToken}`,
    "--entrypoint",
    "bash",
    DOCKER_CONFIG.imageName,
    "-c",
  ];

  // Build opencode command - always interactive, use Sonnet 4.6
  let opencodeCommand = "source /opt/sith/nix/nix-scripts/setup.sh && cd /workspace && opencode -m github-copilot/claude-sonnet-4.6";

  if (prompt) {
    // Escape single quotes in prompt and use --prompt flag for interactive mode
    const escapedPrompt = prompt.replace(/'/g, "'\\''");
    opencodeCommand += ` --prompt '${escapedPrompt}'`;
  }

  dockerArgs.push(opencodeCommand);
  return dockerArgs;
}

export function TerminalUI(): React.ReactElement {
  const { exit } = useApp();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [nextMessageId, setNextMessageId] = useState(1);

  const addMessage = useCallback((text: string, type: Message["type"] = "system"): void => {
    const newMessage: Message = {
      id: nextMessageId,
      text,
      type,
      timestamp: new Date(),
    };

    setMessages((previousMessages) => [...previousMessages, newMessage]);
    setNextMessageId((previousId) => previousId + 1);
  }, [nextMessageId]);

  const handleDockerShell = useCallback(async (): Promise<void> => {
    exit();

    console.log("🚀 Starting Docker shell...");
    console.log(`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`);
    console.log('Press Ctrl+D or type "exit" to leave');
    console.log();

    const githubToken = await getGitHubToken();
    const dockerArgs = buildDockerShellCommand(githubToken);

    try {
      await execa("docker", dockerArgs, { stdio: "inherit" });
      console.log();
      console.log("✅ Exited shell");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start shell";
      console.error(`❌ ${errorMessage}`);
      process.exit(1);
    }
  }, [exit]);

  const handleOpenCode = useCallback(async (prompt?: string): Promise<void> => {
    exit();

    console.log("🚀 Starting OpenCode...");
    console.log(`Mounting current directory to ${DOCKER_CONFIG.workspaceMount}`);

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
      const errorMessage = error instanceof Error ? error.message : "Failed to start OpenCode";
      console.error(`❌ ${errorMessage}`);
      process.exit(1);
    }
  }, [exit]);

  const handleSlashCommand = useCallback(async (command: ReturnType<typeof parseSlashCommand>, userInput: string): Promise<void> => {
    if (!command) {
      return;
    }

    addMessage(userInput, "user");

    switch (command.type) {
      case "shell":
        await handleDockerShell();
        break;

      case "config":
        setShowConfigModal(true);
        break;

      case "help":
        addMessage("Available commands:", "info");
        const availableCommands = getAvailableCommands();
        for (const cmd of availableCommands) {
          addMessage(`  ${cmd.command} - ${cmd.description}`, "info");
        }
        break;
    }
  }, [addMessage, handleDockerShell]);

  const handleSubmit = useCallback(async (value: string): Promise<void> => {
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
      addMessage(`Unknown command: ${trimmedValue}. Type /help for available commands.`, "error");
    } else {
      // Regular text input - start OpenCode with this prompt
      await handleOpenCode(trimmedValue);
    }
  }, [addMessage, handleOpenCode, handleSlashCommand]);

  const handleConfigModalClose = useCallback((): void => {
    setShowConfigModal(false);
  }, []);

  const handleConfigModalMessage = useCallback((text: string, type?: "success" | "error" | "info"): void => {
    addMessage(text, type || "system");
  }, [addMessage]);

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
          <Text color="cyan" bold>›</Text>
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