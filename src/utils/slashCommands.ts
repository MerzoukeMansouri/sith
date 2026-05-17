export type SlashCommandType = "shell" | "config" | "help";

export interface SlashCommand {
  type: SlashCommandType;
  raw: string;
}

export function parseSlashCommand(input: string): SlashCommand | null {
  const trimmed = input.trim();

  if (!trimmed.startsWith("/")) {
    return null;
  }

  const command = trimmed.slice(1).toLowerCase();

  switch (command) {
    case "shell":
      return { type: "shell", raw: trimmed };
    case "config":
      return { type: "config", raw: trimmed };
    case "help":
      return { type: "help", raw: trimmed };
    default:
      return null;
  }
}

export function getAvailableCommands(): Array<{ command: string; description: string }> {
  return [
    { command: "/shell", description: "Start Docker shell (no OpenCode)" },
    { command: "/config", description: "Open configuration menu" },
    { command: "/help", description: "Show available commands" },
  ];
}
