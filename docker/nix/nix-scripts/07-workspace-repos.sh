#!/bin/bash
# 07-workspace-repos.sh — clone or pull configured workspace repositories

WORKSPACE_CONFIG="/opt/sith/workspace.json"
REPOS_DIR="/workspace/repos"

[ -f "$WORKSPACE_CONFIG" ] || return 0

REPO_COUNT=$(jq '.repos | length' "$WORKSPACE_CONFIG" 2>/dev/null || echo 0)
[ "$REPO_COUNT" -eq 0 ] && return 0

mkdir -p "$REPOS_DIR"

echo ""
echo "┌─ Workspace Repositories ──────────────────────────────────┐"

for i in $(seq 0 $((REPO_COUNT - 1))); do
  MODE=$(jq -r ".repos[$i].mode // \"clone\"" "$WORKSPACE_CONFIG")
  URL=$(jq -r ".repos[$i].url" "$WORKSPACE_CONFIG")
  BRANCH=$(jq -r ".repos[$i].branch // empty" "$WORKSPACE_CONFIG")
  NAME=$(jq -r ".repos[$i].name // empty" "$WORKSPACE_CONFIG")

  if [ -z "$NAME" ]; then
    NAME=$(basename "$URL" .git)
  fi

  if [ "$MODE" = "mount" ]; then
    printf "│  %-40s  mounted\n" "$NAME"
    continue
  fi

  DEST="$REPOS_DIR/$NAME"

  if [ -d "$DEST/.git" ]; then
    printf "│  %-40s  pulling...\n" "$NAME"
    git -C "$DEST" \
      -c "credential.helper=!f(){ echo username=x-token; echo password=$GITHUB_TOKEN; };f" \
      pull --ff-only --quiet 2>&1 | tail -1 || true
  else
    printf "│  %-40s  cloning...\n" "$NAME"
    CLONE_ARGS=("$URL" "$DEST" "--depth=1" "--quiet")
    if [ -n "$BRANCH" ]; then
      CLONE_ARGS=(-b "$BRANCH" "$URL" "$DEST" "--depth=1" "--quiet")
    fi
    git \
      -c "credential.helper=!f(){ echo username=x-token; echo password=$GITHUB_TOKEN; };f" \
      clone "${CLONE_ARGS[@]}" 2>&1 | tail -1 || true
  fi
done

echo "└───────────────────────────────────────────────────────────┘"
echo ""
