# Sith

<p align="center">
  <img src="assets/images/logo.png" alt="Sith Logo" width="400">
</p>

> Turn your context to the dark side.

Standardize and share your OpenCode setup with a fully dockerized environment, designed for seamless collaboration and CI integration.

---

## Why?

AI coding tools are powerful in isolation. They become fragile at scale:

- **Context drift** — every developer has a different CLAUDE.md, different tool versions, different configs. The AI sees a different project depending on who's running it.
- **No CI path** — running `opencode` or `claude` in a pipeline requires wiring tokens, installing tools, and hoping the environment matches local.
- **Multiple tools** — Claude Code and OpenCode serve different use cases (Anthropic auth vs GitHub Copilot). Switching between them shouldn't require manual setup.

Sith solves this by packaging both tools, all config, and your team's context into a single Docker image. One pull, same environment, everywhere.

| Problem | Sith answer |
|---------|-------------|
| Inconsistent context across team | Shared `~/.sith/` skills + CLAUDE.md, mounted at runtime |
| AI tools hard to run in CI | Prebuilt signed image + token injection via env vars |
| Claude Code vs OpenCode friction | Both available, same container, same command |
| "Works on my machine" builds | Nix-pinned dependencies inside Docker |

---

## Docker

The recommended path. One image, works locally and in CI.

### Install the CLI

```bash
npm install -g @m14i/sith
```

Or without installing:

```bash
npx @m14i/sith@latest
```

### Get the image

**Prebuilt (recommended) — pull a signed image from GHCR:**

```bash
sith --pull
```

Supports `linux/amd64` and `linux/arm64`. Images are signed with cosign and include an SBOM.

**Verify the signature (optional):**

```bash
cosign verify \
  --certificate-identity-regexp="https://github.com/MerzoukeMansouri/sith" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/merzoukemanouri/sith:latest
```

**Build from scratch — full control, no external trust:**

```bash
sith --build
```

| | `sith --pull` | `sith --build` |
|--|--------------|----------------|
| Speed | Fast | Slow |
| Trust | GitHub Actions + Cosign | Your machine |
| Use case | Daily use, CI/CD | Air-gapped, custom builds |

### Use it

**Interactive TUI** — type a prompt or use slash commands:

```bash
sith
```

| In the TUI | What it does |
|------------|-------------|
| Type any text + Enter | Starts OpenCode with that prompt |
| `/shell` | Drop into Docker shell (no AI) |
| `/claude` | Switch active tool to Claude Code |
| `/opencode` | Switch active tool to OpenCode |
| `/config` | Pull / build options |
| `/help` | Show commands |
| `Ctrl+C` / `Esc` | Exit |

**Direct commands** — skip the TUI:

```bash
sith shell                        # Raw Nix shell inside Docker (alias: sith --it)
sith opencode -p "fix the bug"    # OpenCode starts immediately with your task
sith claude -p "fix the bug"      # Claude Code starts immediately with your task
```

**Skills:**

```bash
sith skills    # Install / manage skills from catalog (~/.sith/skills/)
```

### CI / GitHub Actions

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

See [Authentication](./doc/AUTH_CLAUDE.md) for how to generate the tokens.

---

## Direct Nix

No Docker. Runs the same Nix environment natively on your machine.

```bash
sith --nix-install    # Install Nix package manager (once)
sith --nix            # Launch Nix shell directly
```

Or via the `nix` subcommand:

```bash
sith nix --install    # Install Nix
sith nix --shell      # Run Nix shell
```

See [doc/NIX_INSTALLATION.md](./doc/NIX_INSTALLATION.md) for full setup guide.

---

## Authentication

Two AI providers, two token setups:

- **Claude Code** (Anthropic OAuth) → [doc/AUTH_CLAUDE.md](./doc/AUTH_CLAUDE.md)
- **OpenCode** (GitHub Copilot) → [doc/AUTH_OPENCODE.md](./doc/AUTH_OPENCODE.md)

---

## Development

```bash
pnpm install       # Install dependencies
pnpm dev           # Run in development mode (no build)
pnpm dev:build     # Build and run CLI
pnpm dev:shell     # Build and launch shell
pnpm typecheck     # Type checking
pnpm clean         # Clean build artifacts
```

---

## Publishing

Automated via semantic-release and conventional commits.

| Prefix | Effect |
|--------|--------|
| `feat:` | Minor version bump |
| `fix:` | Patch version bump |
| `BREAKING CHANGE:` | Major version bump |
| `chore:` `docs:` `style:` | No release |

Push to `main` → GitHub Action bumps version, generates CHANGELOG, publishes to npm.

**Requirements:** `NPM_TOKEN` secret in repository settings.
