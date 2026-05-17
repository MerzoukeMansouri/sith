// Docker configuration
export const DOCKER_CONFIG = {
  imageName: "sith:latest",
  prebuiltImage: "ghcr.io/merzoukemansouri/sith:latest",
  folderName: "docker",
  dockerfileName: "Dockerfile",
  workspaceMount: "/workspace",
  shellEntrypoint: "/opt/sith/nix/shell.nix",
} as const;

// Spinner animation configuration
export const SPINNER_CONFIG = {
  frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  interval: 80,
} as const;

// ASCII logo lines
export const ASCII_LOGO = [
  "    ███████╗██╗████████╗██╗  ██╗",
  "    ██╔════╝██║╚══██╔══╝██║  ██║",
  "    ███████╗██║   ██║   ███████║",
  "    ╚════██║██║   ██║   ██╔══██║",
  "    ███████║██║   ██║   ██║  ██║",
  "    ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝",
] as const;