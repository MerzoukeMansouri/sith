# Sith

<p align="center">
  <img src="assets/images/logo.png" alt="Sith Logo" width="400">
</p>

> Turn your context to the dark side.

Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.

## Usage

No installation required! Run with npx:

```bash
npx @merzouke-mansouri/sith
```

Available from both npm and GitHub Packages.

### Interactive Menu (Default)

```bash
npx @merzouke-mansouri/sith
```

This will present you with options to:
- 🔨 Build Docker image

### Quick Build

Build the Docker image directly:

```bash
npx @merzouke-mansouri/sith docker --build
# or
npx @merzouke-mansouri/sith --build
```

### Interactive Shell

Run an interactive shell in the Docker container:

```bash
npx @merzouke-mansouri/sith shell
```

This will:
- Mount current directory to `/workspace`
- Load full Nix environment with all tools
- Make OpenCode CLI available
- Pass your `GITHUB_TOKEN` environment variable

## Commands

### `npx @merzouke-mansouri/sith` (default)
Launches the interactive menu.

### `npx @merzouke-mansouri/sith docker --build`
Build the Docker image.

### `npx @merzouke-mansouri/sith shell`
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

Automated releases using semantic-release and conventional commits.

### For Maintainers

**Commit Format:**
- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `BREAKING CHANGE:` - Breaking change (triggers major version bump)
- `chore:`, `docs:`, `style:` - No release

**Release Process:**
1. Commit changes following conventional commit format
2. Push to `main` branch
3. GitHub Action automatically:
   - Analyzes commits and determines version bump
   - Generates CHANGELOG.md
   - Creates GitHub release
   - Publishes to npm and GitHub Packages in parallel

**Example:**
```bash
git commit -m "feat: add new interactive menu option"
git push origin main
# Automatic release triggered!
```

**Requirements:**
- `NPM_TOKEN` secret configured in GitHub repository settings
- Commits must follow conventional commit format
