import type { SkillEntry } from "./types.js";

// Predefined skill catalog — skills are installed to ~/.sith/skills/<name>/
export const SKILLS_CATALOG: SkillEntry[] = [
  {
    name: "caveman",
    description: "Ultra-compressed communication (~75% token reduction)",
    source: "https://github.com/JuliusBrussee/caveman/archive/refs/heads/main.zip",
    homepage: "https://github.com/JuliusBrussee/caveman",
  },
];

// Docker configuration
export const DOCKER_CONFIG = {
  imageName: "sith:latest",
  prebuiltImage: "ghcr.io/merzoukemansouri/sith:latest",
  folderName: "docker",
  dockerfileName: "Dockerfile",
  workspaceMount: "/workspace",
  skillsMount: "/opt/sith/external-skills",
  shellEntrypoint: "/opt/sith/nix/shell.nix",
} as const;

// Nix configuration
export const NIX_CONFIG = {
  shellPath: "docker/nix/shell.nix",
  flakePath: "docker/nix/flake.nix",
  installerUrl: "https://nixos.org/nix/install",
  requiredVersion: "2.19",
  localConfigDir: ".sith/nix",
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