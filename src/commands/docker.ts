import { select } from '@inquirer/prompts';
import { execa } from 'execa';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find project root by looking for docker/ folder
function findProjectRoot(startDir: string): string {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    const dockerPath = path.join(currentDir, 'docker');
    if (fs.existsSync(dockerPath) && fs.statSync(dockerPath).isDirectory()) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find project root (docker/ folder not found)');
}

const rootDir = findProjectRoot(__dirname);

export async function dockerCommand(options: { build?: boolean }) {
  if (options.build) {
    await buildDocker();
    return;
  }

  // Interactive menu
  await showMenu();
}

export async function runShellDirect() {
  await runShell();
}

async function showMenu() {
  console.clear();
  console.log(chalk.bold.red('╔═══════════════════════════════════════╗'));
  console.log(chalk.bold.red('║         SITH - Docker Manager         ║'));
  console.log(chalk.bold.red('╚═══════════════════════════════════════╝'));
  console.log();

  const action = await select({
    message: 'What would you like to do?',
    choices: [
      {
        name: '🔨 Build Docker image',
        value: 'build',
        description: 'Build the OpenCode Docker image',
      },
      {
        name: '❌ Exit',
        value: 'exit',
      },
    ],
  });

  switch (action) {
    case 'build':
      await buildDocker();
      break;
    case 'exit':
      console.log(chalk.dim('May the Force be with you.'));
      process.exit(0);
  }

  // Show menu again after action
  console.log();
  await showMenu();
}

async function buildDocker() {
  console.log(chalk.blue('🔨 Building Docker image...'));
  console.log();

  try {
    const dockerfilePath = path.join(rootDir, 'docker', 'Dockerfile');

    // Verify paths exist
    if (!fs.existsSync(dockerfilePath)) {
      throw new Error(`Dockerfile not found at: ${dockerfilePath}`);
    }

    console.log(chalk.dim(`Root: ${rootDir}`));
    console.log(chalk.dim(`Dockerfile: ${dockerfilePath}`));
    console.log();

    await execa('docker', ['build', '-f', dockerfilePath, '-t', 'opencode-ci:latest', rootDir], {
      stdio: 'inherit',
    });

    console.log();
    console.log(chalk.green('✅ Docker image built successfully!'));
    console.log(chalk.dim('Image: opencode-ci:latest'));
  } catch (error) {
    console.error(chalk.red('❌ Build failed'));
    if (error instanceof Error) {
      console.error(chalk.dim(error.message));
    }
    process.exit(1);
  }
}

async function runShell() {
  console.log(chalk.blue('🚀 Starting interactive shell...'));
  console.log(chalk.dim('Mounting current directory to /workspace'));
  console.log(chalk.dim('Press Ctrl+D or type "exit" to leave'));
  console.log();

  try {
    await execa(
      'docker',
      [
        'run',
        '--rm',
        '-it',
        '-v',
        `${process.cwd()}:/workspace`,
        '-e',
        `GITHUB_TOKEN=${process.env.GITHUB_TOKEN || ''}`,
        '--entrypoint',
        'nix-shell',
        'opencode-ci:latest',
        '/opt/sith/nix/shell.nix',
      ],
      {
        stdio: 'inherit',
      }
    );
  } catch (error) {
    console.error(chalk.red('❌ Failed to start shell'));
    if (error instanceof Error) {
      console.error(chalk.dim(error.message));
    }
    process.exit(1);
  }
}
