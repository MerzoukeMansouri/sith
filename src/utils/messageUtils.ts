export type MessageType = "system" | "user" | "success" | "error" | "info";

export function getMessageColor(type: MessageType): string | undefined {
  switch (type) {
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

export function getMessagePrefix(type: MessageType): string {
  switch (type) {
    case "user":
      return "› ";
    case "system":
      return "⚡ ";
    default:
      return "";
  }
}
