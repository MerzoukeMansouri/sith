#!/bin/sh
# Generate .credentials.json from CLAUDE_CODE_OAUTH_TOKEN if present and not already authenticated
if [ -n "$CLAUDE_CODE_OAUTH_TOKEN" ] && [ ! -f /root/.claude/.credentials.json ]; then
    mkdir -p /root/.claude
    printf '{"claudeAiOauth":{"accessToken":"%s","expiresAt":4102444800000}}\n' "$CLAUDE_CODE_OAUTH_TOKEN" \
        > /root/.claude/.credentials.json
    chmod 600 /root/.claude/.credentials.json
fi

exec nix-shell /opt/sith/nix/shell.nix --run "$@"
