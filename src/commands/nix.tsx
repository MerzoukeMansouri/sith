import { execa } from "execa";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { NIX_CONFIG } from "../config.js";
import type { NixCommandOptions } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find project root by looking for docker/ folder
function findProjectRoot(startDir: string): string {
  let currentDir = startDir;
  const rootPath = path.parse(currentDir).root;

  while (currentDir !== rootPath) {
    const dockerPath = path.join(currentDir, "docker");
    if (fs.existsSync(dockerPath) && fs.statSync(dockerPath).isDirectory()) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error("Could not find project root (docker/ folder not found)");
}

const rootDir = findProjectRoot(__dirname);

export function parseNixVersionOutput(stdout: string): boolean {
  const match = stdout.match(/nix \(Nix\) (\d+\.\d+)/);
  if (!match) return false;
  const [major, minor] = match[1].split(".").map(Number);
  const [reqMajor, reqMinor] = NIX_CONFIG.requiredVersion.split(".").map(Number);
  return major > reqMajor || (major === reqMajor && minor >= reqMinor);
}

export async function checkNixInstalled(): Promise<boolean> {
  try {
    const { stdout } = await execa("nix", ["--version"]);
    return parseNixVersionOutput(stdout);
  } catch {
    return false;
  }
}

export async function installNix(): Promise<void> {
  console.log("🔧 Installing Nix package manager...");
  console.log();

  // Check if already installed
  if (await checkNixInstalled()) {
    console.log("✅ Nix is already installed and meets version requirements");
    return;
  }

  // Detect OS
  const platform = os.platform();
  if (platform !== "darwin" && platform !== "linux") {
    throw new Error(`Unsupported platform: ${platform}. Nix only supports macOS and Linux.`);
  }

  console.log(`Platform: ${platform}`);
  console.log(`Installer: ${NIX_CONFIG.installerUrl}`);
  console.log();

  // Download and run installer
  console.log("📥 Downloading Nix installer...");
  try {
    await execa("sh", ["-c", `curl -L ${NIX_CONFIG.installerUrl} | sh -s -- --daemon`], {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("❌ Failed to install Nix");
    throw error;
  }

  console.log();
  console.log("✅ Nix installed successfully!");
  console.log("⚠️  Please restart your shell or run: source ~/.nix-profile/etc/profile.d/nix.sh");
}

export async function copyNixFiles(): Promise<void> {
  const homeDir = os.homedir();
  const localConfigDir = path.join(homeDir, NIX_CONFIG.localConfigDir);

  console.log(`📁 Copying Nix configuration to ${localConfigDir}...`);

  // Create directory if it doesn't exist
  if (!fs.existsSync(localConfigDir)) {
    fs.mkdirSync(localConfigDir, { recursive: true });
  }

  // Copy shell.nix and flake files
  const sourcePath = path.join(rootDir, "docker", "nix");
  const filesToCopy = ["shell.nix", "flake.nix", "flake.lock"];

  for (const file of filesToCopy) {
    const src = path.join(sourcePath, file);
    const dest = path.join(localConfigDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Copied ${file}`);
    }
  }

  // Copy nix-config directory
  const configSrc = path.join(sourcePath, "nix-config");
  const configDest = path.join(localConfigDir, "nix-config");
  if (!fs.existsSync(configDest)) {
    fs.mkdirSync(configDest, { recursive: true });
  }

  const configFiles = fs.readdirSync(configSrc);
  for (const file of configFiles) {
    fs.copyFileSync(path.join(configSrc, file), path.join(configDest, file));
    console.log(`  ✓ Copied nix-config/${file}`);
  }

  console.log();
  console.log("✅ Nix files copied successfully!");
}

export async function runNixShell(): Promise<void> {
  // Check if Nix is installed
  if (!(await checkNixInstalled())) {
    console.error("❌ Nix is not installed");
    console.error("Run: sith --nix-install");
    process.exit(1);
  }

  // Copy files if not already present
  const homeDir = os.homedir();
  const localConfigDir = path.join(homeDir, NIX_CONFIG.localConfigDir);
  const shellNixPath = path.join(localConfigDir, "shell.nix");

  if (!fs.existsSync(shellNixPath)) {
    await copyNixFiles();
  }

  console.log("🚀 Starting Nix shell...");
  console.log(`Configuration: ${shellNixPath}`);
  console.log('Press Ctrl+D or type "exit" to leave');
  console.log();

  // Set environment variables
  const env: Record<string, string | undefined> = {
    ...process.env,
    OPENCODE_MODEL: "claude-sonnet-4-5-20241022",
  };

  // Try to get GitHub token from gh CLI if not in env
  if (!env.GITHUB_TOKEN) {
    try {
      const { stdout } = await execa("gh", ["auth", "token"]);
      env.GITHUB_TOKEN = stdout.trim();
    } catch {
      // Ignore if gh CLI not available or not authenticated
    }
  }

  // Run nix-shell
  try {
    await execa("nix-shell", [shellNixPath], {
      stdio: "inherit",
      env,
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error("❌ Failed to start Nix shell");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

export async function nixCommand(options: NixCommandOptions): Promise<void> {
  if (options.install) {
    await installNix();
    await copyNixFiles();
    return;
  }

  if (options.shell) {
    await runNixShell();
    return;
  }

  // Default: run shell
  await runNixShell();
}