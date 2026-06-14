# Authentication — Claude Code

Sith ships with the `claude` CLI inside Docker. It authenticates via a long-lived OAuth token tied to your Anthropic account — no API key required.

**Requirements:** Claude Pro, Max, Team, or Enterprise subscription.

---

## Generate the token

Run this **once, on your local machine** (not inside Docker):

```bash
claude setup-token
```

Follow the browser prompt. Copy the printed token. Valid for one year, scoped to inference only.

---

## Set the environment variable

```bash
export CLAUDE_CODE_OAUTH_TOKEN=your_token_here
```

Make it persistent:

```bash
# ~/.zshrc or ~/.bashrc
export CLAUDE_CODE_OAUTH_TOKEN=your_token_here
```

Sith reads this variable at launch and injects it into the container automatically.

---

## Verify

```bash
claude auth status
# Expected: "loggedIn": true, "authMethod": "claude.ai"
```

---

## CI / GitHub Actions

Store the token as a repository secret (`CLAUDE_CODE_OAUTH_TOKEN`), then pass it to the container:

```yaml
- name: Run Claude Code via sith
  env:
    CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
  run: |
    docker run --rm \
      -e CLAUDE_CODE_OAUTH_TOKEN=$CLAUDE_CODE_OAUTH_TOKEN \
      ghcr.io/merzoukemanouri/sith:latest "claude auth status"
```

Generate the token once with `claude setup-token` → store in **Settings → Secrets → Actions**.
