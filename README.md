# Sith

<p align="center">
  <img src="assets/images/logo.png" alt="Sith Logo" width="400">
</p>

> Turn your context to the dark side.

Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.

## Usage

### Installation

**Install globally (recommended):**
```bash
npm install -g @m14i/sith
```

**Or use npx (slower, pulls image every time):**
```bash
npx @m14i/sith@latest
```

### Quick Start

```bash
# Interactive menu (recommended)
sith
# Options: Enter Shell | Configuration (Pull/Build)

# Direct commands (skip menu)
sith --it          # Launch shell immediately
sith --pull        # Pull prebuilt image
sith --build       # Build from scratch
```

### Distribution Options

| Method | Command | Speed | Trust Model | Use Case |
|--------|---------|-------|-------------|----------|
| **Prebuilt (Recommended)** | `sith --pull` | ⚡ Fast | GitHub Actions + Cosign | Production, CI/CD |
| **Local Build** | `sith --build` | 🐌 Slow | Your machine | Air-gapped, custom builds |

### Commands

| Command | Description |
|---------|-------------|
| `sith` | Interactive menu with options |
| `sith --it` | Launch interactive shell in container |
| `sith --pull` | Pull prebuilt image from GHCR |
| `sith --build` | Build Docker image from scratch |
| `sith --help` | Show all available commands |

### Prebuilt Image Details

**Pull and verify:**
```bash
# Pull (supports linux/amd64 and linux/arm64)
sith --pull

# Or use Docker directly
docker pull ghcr.io/merzoukemanouri/sith:latest

# Verify signature (optional)
cosign verify \
  --certificate-identity-regexp="https://github.com/MerzoukeMansouri/sith" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/merzoukemanouri/sith:latest
```

**Benefits:**
- ✅ Fast - no build time
- ✅ Multi-platform - amd64 and arm64
- ✅ Signed - cosign verification
- ✅ SBOM - supply chain transparency
- ✅ Auto-updated - tracks releases

## Authentication

To use GitHub Copilot models, set the `GITHUB_TOKEN` environment variable:

**Quick start (using GitHub CLI):**
```bash
export GITHUB_TOKEN=$(gh auth token)
sith --it
```

**Or inline:**
```bash
GITHUB_TOKEN=$(gh auth token) sith --it
```

**Manual token:**
1. Create a token at https://github.com/settings/tokens
2. Required scopes: `copilot`, `repo`, `read:org`
3. Export it:
```bash
export GITHUB_TOKEN=gho_your_token_here
sith --it
```

**Make it persistent (add to ~/.zshrc or ~/.bashrc):**
```bash
export GITHUB_TOKEN=$(gh auth token)
```

## Features

- **Prebuilt Images**: Pull verified images from GitHub Container Registry
- **Image Signing**: All images signed with cosign for supply chain security
- **SBOM Attestation**: Software Bill of Materials included with every image
- **Interactive Menu**: Navigate with arrow keys, select with Enter
- **Direct Commands**: Build or shell access without menu
- **Dockerized Environment**: Consistent setup across machines
- **Nix Integration**: Full development environment with all tools
- **CI-Ready**: Standardize builds across local and CI pipelines
- **Non-root User**: Images run as non-root user (UID 1000) for better security

## Security

### Image Verification

All Docker images published to `ghcr.io/merzoukemanouri/sith` are:
- **Signed with cosign** using keyless signing (OIDC)
- **Include SBOM** (Software Bill of Materials) for transparency
- **Built automatically** via GitHub Actions with provenance

See [SECURITY.md](./SECURITY.md) for detailed security practices and considerations.

### Trust Model

**Prebuilt Images:**
- Built by GitHub Actions on public infrastructure
- Signed with Sigstore keyless signing
- Verifiable provenance chain from source to image
- Trade-off: Trust GitHub's build infrastructure

**Local Builds:**
- Full control over build environment
- Can inspect Dockerfile before building
- No dependency on external registries
- Trade-off: Slower, manual security updates

For more details, see the [Docker Distribution Guide](./doc/QUICKSTART.md#docker-distribution).

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
   - Publishes to npm

**Example:**
```bash
git commit -m "feat: add new interactive menu option"
git push origin main
# Automatic release triggered!
```

**Requirements:**
- `NPM_TOKEN` secret configured in GitHub repository settings
- Commits must follow conventional commit format
