# Authentication — OpenCode / GitHub Copilot

Sith runs OpenCode with **Claude Sonnet 4.6 via GitHub Copilot** by default. Requires a GitHub account with Copilot access.

---

## Automatic (recommended)

If you have the GitHub CLI installed and authenticated, Sith fetches your token automatically:

```bash
gh auth login    # once
sith             # token detected via: gh auth token
```

Nothing else needed.

---

## Manual token

If you don't have `gh` CLI or prefer explicit setup:

1. Ensure your GitHub account has Copilot access
2. Create a token at https://github.com/settings/tokens
3. Required scopes: `copilot`, `repo`, `read:org`
4. Export it:

```bash
export GITHUB_TOKEN=gho_your_token_here
```

Make it persistent:

```bash
# ~/.zshrc or ~/.bashrc
export GITHUB_TOKEN=$(gh auth token)
```

---

## Inside the container

Once OpenCode starts, if prompted to authenticate with GitHub Copilot:

```bash
opencode providers login
# Follow prompts
```

---

## CI / GitHub Actions

The default `GITHUB_TOKEN` provided by Actions has Copilot access when your repository has Copilot enabled:

```yaml
- name: Run OpenCode via sith
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    docker run --rm \
      -e GITHUB_TOKEN=$GITHUB_TOKEN \
      ghcr.io/merzoukemanouri/sith:latest "opencode --version"
```

For cross-repo or org-level Copilot access, use a PAT with the scopes above stored as `GITHUB_TOKEN` in repository secrets.
