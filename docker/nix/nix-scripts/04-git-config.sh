#!/bin/bash
# Git global configuration for CI/CD

git config --global user.name "OpenCode Bot" 2>/dev/null || true
git config --global user.email "opencode-bot@example.com" 2>/dev/null || true
git config --global init.defaultBranch main 2>/dev/null || true
git config --global --add safe.directory '*' 2>/dev/null || true
