#!/usr/bin/env node

import { Command } from 'commander';
import { dockerCommand, runShellDirect } from './commands/docker.js';

const PROGRAM_NAME = 'sith';
const PROGRAM_VERSION = '1.0.0';
const PROGRAM_DESCRIPTION = 'Turn your context to the dark side. Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.';

function createProgram(): Command {
  const program = new Command();

  program
    .name(PROGRAM_NAME)
    .description(PROGRAM_DESCRIPTION)
    .version(PROGRAM_VERSION)
    .option('--pull', 'Pull prebuilt Docker image (recommended)')
    .option('--build', 'Build the Docker image from scratch')
    .option('--it', 'Launch interactive shell in Docker container');

  // Default action - show interactive menu or run shell with --it
  program
    .action(async (options) => {
      if (options.it) {
        await runShellDirect();
      } else {
        await dockerCommand(options);
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
