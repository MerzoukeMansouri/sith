#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import updateNotifier from 'update-notifier';
import chalk from 'chalk';
import { dockerCommand, runShellDirect } from './commands/docker.js';
import { renderTerminalUI } from './components/TerminalUI.js';

// Import package.json for version and update checks
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const PROGRAM_NAME = 'sith';
const PROGRAM_VERSION = pkg.version;
const PROGRAM_DESCRIPTION = 'Turn your context to the dark side. Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.';

// Check for updates (automatic background check)
const notifier = updateNotifier({ pkg });
notifier.notify();

async function checkForUpdates() {
  console.log(chalk.cyan('Checking for updates...'));

  // Force update check by setting updateCheckInterval to 0
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 0
  });

  // Fetch the latest version
  await notifier.fetchInfo();

  const update = notifier.update;

  if (update && update.latest !== pkg.version) {
    console.log();
    console.log(chalk.green(`Update available: ${chalk.dim(pkg.version)} → ${chalk.bold(update.latest)}`));
    console.log(chalk.cyan(`Run ${chalk.bold(`npm install -g ${pkg.name}`)} to update`));
    console.log();
  } else {
    console.log(chalk.green(`✓ You're on the latest version (${pkg.version})`));
  }
}

function createProgram(): Command {
  const program = new Command();

  program
    .name(PROGRAM_NAME)
    .description(PROGRAM_DESCRIPTION)
    .version(PROGRAM_VERSION)
    .option('--pull', 'Pull prebuilt Docker image (recommended)')
    .option('--build', 'Build the Docker image from scratch')
    .option('--it', 'Launch interactive shell in Docker container')
    .option('--update', 'Check for updates')
    .option('--legacy', 'Use legacy menu interface');

  // Default action - show terminal UI or legacy menu
  program
    .action(async (options) => {
      if (options.update) {
        await checkForUpdates();
      } else if (options.it) {
        await runShellDirect();
      } else if (options.legacy || options.pull || options.build) {
        // Use legacy menu for explicit pull/build or --legacy flag
        await dockerCommand(options);
      } else {
        // Default: show new terminal UI
        renderTerminalUI();
      }
    });

  // Docker command - explicit Docker management
  program
    .command('docker')
    .description('Manage Docker environment')
    .option('--pull', 'Pull prebuilt Docker image (recommended)')
    .option('--build', 'Build the Docker image from scratch')
    .action(async (options) => {
      await dockerCommand(options);
    });

  // Shell command - direct interactive shell (bypasses menu)
  program
    .command('shell')
    .description('Run interactive shell in Docker container')
    .action(async () => {
      await runShellDirect();
    });

  return program;
}

// Main execution
const program = createProgram();
program.parse();
