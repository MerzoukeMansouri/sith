# Sith

<p align="center">
  <img src="assets/images/logo.png" alt="Sith Logo" width="400">
</p>

> Turn your context to the dark side.

Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.

## Installation

```bash
pnpm install
pnpm build
```

## Usage

### Interactive Menu (Default)

Simply run `sith` to launch the interactive menu:

```bash
sith
```

This will present you with options to:
- 🔨 Build Docker image

### Quick Build

Build the Docker image directly:

```bash
sith docker --build
# or
sith --build
```

### Interactive Shell

Run an interactive shell in the Docker container:

```bash
sith shell
```

This will:
- Mount current directory to `/workspace`
- Load full Nix environment with all tools
- Make OpenCode CLI available
- Pass your `GITHUB_TOKEN` environment variable

## Commands

### `sith` (default)
Launches the interactive menu.

### `sith docker --build`
Build the Docker image.

### `sith shell`
Run interactive shell in the Docker container.

## Features

- **Interactive Menu**: Navigate with arrow keys, select with Enter
- **Direct Commands**: Build or shell access without menu
- **Dockerized Environment**: Consistent setup across machines
- **Nix Integration**: Full development environment with all tools
- **CI-Ready**: Standardize builds across local and CI pipelines

## Development

```bash
# Build and test in development
pnpm dev:build     # Build and run CLI
pnpm dev:shell     # Build and launch shell

# Production build
pnpm build

# Type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```
