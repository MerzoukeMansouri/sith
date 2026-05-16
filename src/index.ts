#!/usr/bin/env node

import { Command } from 'commander';
import { dockerCommand, runShellDirect } from './commands/docker.js';

const program = new Command();

program
  .name('sith')
  .description('Turn your context to the dark side. Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.')
  .version('1.0.0')
  .option('--build', 'Build the Docker image');

// Default action - show interactive menu
program
  .action(async (options) => {
    await dockerCommand(options);
  });

// Docker command
program
  .command('docker')
  .description('Manage Docker environment')
  .option('--build', 'Build the Docker image')
  .action(async (options) => {
    await dockerCommand(options);
  });

// Shell command - direct interactive shell (not via menu)
program
  .command('shell')
  .description('Run interactive shell in Docker container')
  .action(async () => {
    await runShellDirect();
  });

program.parse();
