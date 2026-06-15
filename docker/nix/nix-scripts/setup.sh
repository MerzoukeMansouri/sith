#!/bin/bash
# Nix Shell Setup - Main entrypoint
# Called by shell.nix shellHook

set -e

# Source all setup scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Banner and versions
# shellcheck source=./01-banner.sh
source "${SCRIPT_DIR}/01-banner.sh"

# 2. Environment variables
# shellcheck source=./02-env-vars.sh
source "${SCRIPT_DIR}/02-env-vars.sh"

# 3. Directory setup
# shellcheck source=./03-directories.sh
source "${SCRIPT_DIR}/03-directories.sh"

# 4. Git configuration
# shellcheck source=./04-git-config.sh
source "${SCRIPT_DIR}/04-git-config.sh"

# 5. OpenCode CLI installation
# shellcheck source=./05-opencode-cli.sh
source "${SCRIPT_DIR}/05-opencode-cli.sh"

# 6. Skills installation (from volume mount)
# shellcheck source=./06-skills-setup.sh
source "${SCRIPT_DIR}/06-skills-setup.sh"

# 7. Workspace repositories (clone/pull)
# shellcheck source=./07-workspace-repos.sh
source "${SCRIPT_DIR}/07-workspace-repos.sh"

# 8. Ready message
# shellcheck source=./07-ready.sh
source "${SCRIPT_DIR}/07-ready.sh"
