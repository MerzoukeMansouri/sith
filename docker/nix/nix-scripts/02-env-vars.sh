#!/bin/bash
# Environment variables setup

export OPENCODE_MODEL="${OPENCODE_MODEL:-github-copilot/claude-sonnet-4.5}"
export OPENCODE_LOG_LEVEL="${OPENCODE_LOG_LEVEL:-INFO}"
export NODE_ENV="${NODE_ENV:-production}"
export CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN:-}"

# Chemins personnalisés
export PATH="/root/.opencode/bin:$PATH"
export PATH="/root/.local/bin:$PATH"
export PATH="/root/.npm-global/bin:$PATH"

# Configuration npm
export NPM_CONFIG_PREFIX="${NPM_CONFIG_PREFIX:-/root/.npm-global}"
