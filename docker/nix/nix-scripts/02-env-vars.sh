#!/bin/bash
# Environment variables setup

export OPENCODE_MODEL="${OPENCODE_MODEL:-github-copilot/claude-sonnet-4.5}"
export OPENCODE_LOG_LEVEL="${OPENCODE_LOG_LEVEL:-INFO}"
export NODE_ENV="${NODE_ENV:-production}"
export CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN:-}"
export IS_DEMO="${IS_DEMO:-1}"

# Generate .credentials.json from token so interactive claude skips login wizard
if [ -n "$CLAUDE_CODE_OAUTH_TOKEN" ] && [ ! -f /root/.claude/.credentials.json ]; then
    mkdir -p /root/.claude
    printf '{"claudeAiOauth":{"accessToken":"%s","expiresAt":4102444800000}}\n' "$CLAUDE_CODE_OAUTH_TOKEN" \
        > /root/.claude/.credentials.json
    chmod 600 /root/.claude/.credentials.json
fi

# Chemins personnalisés
export PATH="/root/.opencode/bin:$PATH"
export PATH="/root/.local/bin:$PATH"
export PATH="/root/.npm-global/bin:$PATH"

# Configuration npm
export NPM_CONFIG_PREFIX="${NPM_CONFIG_PREFIX:-/root/.npm-global}"
