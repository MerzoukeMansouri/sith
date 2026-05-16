# Sith

<p align="center">
  <img src="assets/images/logo.png" alt="Sith Logo" width="400">
</p>

> Turn your context to the dark side.

Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.

## Usage

No installation required! Run with npx:

### Interactive Menu (Default)

```bash
npx sith
```

This will present you with options to:
- 🔨 Build Docker image

### Quick Build

Build the Docker image directly:

```bash
npx sith docker --build
# or
npx sith --build
```

### Interactive Shell

Run an interactive shell in the Docker container:

```bash
npx sith shell
```

This will:
- Mount current directory to `/workspace`
- Load full Nix environment with all tools
- Make OpenCode CLI available
- Pass your `GITHUB_TOKEN` environment variable

## Commands

### `npx sith` (default)
Launches the interactive menu.

### `npx sith docker --build`
Build the Docker image.

### `npx sith shell`
Run interactive shell in the Docker container.

## Features

- **Interactive Menu**: Navigate with arrow keys, select with Enter
- **Direct Commands**: Build or shell access without menu
- **Dockerized Environment**: Consistent setup across machines
- **Nix Integration**: Full development environment with all tools
- **CI-Ready**: Standardize builds across local and CI pipelines

## Development

For contributors working on the CLI:

```bash
# Install dependencies
pnpm install

# Run in development mode (no build)
pnpm dev

# Build and test
pnpm dev:build     # Build and run CLI
pnpm dev:shell     # Build and launch shell

# Type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

## Publishing

For maintainers:

1. Update version in `package.json`
2. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Action automatically builds and publishes to npm

**Requirements:** `NPM_TOKEN` secret must be configured in GitHub repository settings.
