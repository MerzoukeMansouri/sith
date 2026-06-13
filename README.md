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
# Interactive terminal UI (default)
sith
# Type your prompt to start OpenCode with that task
# Or use slash commands: /shell, /config, /help

# Direct commands
sith --it          # Launch Docker shell immediately
sith --pull        # Pull prebuilt image
sith --build       # Build from scratch
sith --legacy      # Use legacy menu interface
```

### Distribution Options

| Method | Command | Speed | Trust Model | Use Case |
|--------|---------|-------|-------------|----------|
| **Prebuilt (Recommended)** | `sith --pull` | ⚡ Fast | GitHub Actions + Cosign | Production, CI/CD |
| **Local Build** | `sith --build` | 🐌 Slow | Your machine | Air-gapped, custom builds |

### Commands

| Command | Description |
|---------|-------------|
| `sith` | Interactive terminal UI (Claude Code style) |
| `sith --it` | Launch Docker shell immediately |
| `sith --pull` | Pull prebuilt image from GHCR |
| `sith --build` | Build Docker image from scratch |
| `sith --legacy` | Use legacy menu interface |
| `sith --help` | Show all available commands |

### Terminal UI Usage

When you run `sith`, you get an interactive terminal interface:

**Prompt input:**
- Type any text → Starts OpenCode with that prompt using Claude Sonnet 4.6
- Example: `Fix authentication bug` → OpenCode launches with this task

**Slash commands:**
- `/shell` → Start Docker shell only (no OpenCode)
- `/config` → Open configuration menu (pull/build options)
- `/help` → Show available commands

**Navigation:**
- `Ctrl+C` or `Esc` → Exit terminal UI

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

Sith supports two AI providers: **Claude Code** (via Anthropic) and **OpenCode** (via GitHub Copilot).

### Claude Code (claude CLI)

Sith ships with the `claude` CLI. Authenticate it with your Anthropic account using a long-lived OAuth token — no API key required.

**Step 1 — Generate the token (once, on your local machine):**
```bash
claude setup-token
```
Follow the browser prompt, then copy the printed token. It is valid for one year and scoped to inference only.

**Step 2 — Export it:**
```bash
export CLAUDE_CODE_OAUTH_TOKEN=your_token_here
```

**Make it persistent (add to ~/.zshrc or ~/.bashrc):**
```bash
export CLAUDE_CODE_OAUTH_TOKEN=your_token_here
```

**Verify:**
```bash
claude auth status
# Should show: "loggedIn": true, "authMethod": "claude.ai"
```

**Requirements:** Claude Pro, Max, Team, or Enterprise subscription.

### GitHub Copilot (opencode CLI)

Sith uses **Claude Sonnet 4.6 via GitHub Copilot** by default for OpenCode. Requires a GitHub token with Copilot access.

**Automatic (recommended):**
If you have GitHub CLI (`gh`) installed and authenticated, Sith automatically fetches your token:
```bash
sith  # Auto-detects token via gh auth token
```

**Manual token:**
If you don't have `gh` CLI or prefer manual setup:

1. Ensure you have GitHub Copilot access
2. Create a token at https://github.com/settings/tokens
3. Required scopes: `copilot`, `repo`, `read:org`
4. Export it:
```bash
export GITHUB_TOKEN=gho_your_token_here
sith
```

**Make it persistent (add to ~/.zshrc or ~/.bashrc):**
```bash
export GITHUB_TOKEN=$(gh auth token)
```

**Inside container:**
Once OpenCode starts, authenticate with GitHub Copilot:
```bash
opencode providers login
# Follow prompts to authenticate with GitHub
```

### CI / GitHub Actions

Add both tokens as repository secrets, then pass them to the container:

```yaml
- name: Run sith
  env:
    CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    docker run --rm \
      -e CLAUDE_CODE_OAUTH_TOKEN=$CLAUDE_CODE_OAUTH_TOKEN \
      -e GITHUB_TOKEN=$GITHUB_TOKEN \
      ghcr.io/merzoukemanouri/sith:latest "claude auth status"
```

Generate `CLAUDE_CODE_OAUTH_TOKEN` once with `claude setup-token` and store it in **Settings → Secrets → Actions** as `CLAUDE_CODE_OAUTH_TOKEN`.

## Features

- **Claude Code-style UI**: Interactive terminal interface with prompt input and slash commands
- **OpenCode Integration**: Start coding with a simple text prompt
- **Model Selection**: Uses Claude Sonnet 4.6 via GitHub Copilot by default
- **Prebuilt Images**: Pull verified images from GitHub Container Registry
- **Image Signing**: All images signed with cosign for supply chain security
- **SBOM Attestation**: Software Bill of Materials included with every image
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
