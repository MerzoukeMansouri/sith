#!/bin/bash
# Nix Shell Setup - Main entrypoint
# Called by shell.nix shellHook

set -e

# Source all setup scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Banner and versions
source "${SCRIPT_DIR}/01-banner.sh"

# 2. Environment variables
source "${SCRIPT_DIR}/02-env-vars.sh"

# 3. Directory setup
source "${SCRIPT_DIR}/03-directories.sh"

# 4. Git configuration
source "${SCRIPT_DIR}/04-git-config.sh"

# 5. OpenCode CLI installation
source "${SCRIPT_DIR}/05-opencode-cli.sh"

# 6. Skills installation (from volume mount)
source "${SCRIPT_DIR}/06-skills-setup.sh"

# 7. Ready message
source "${SCRIPT_DIR}/07-ready.sh"
