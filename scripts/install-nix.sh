#!/bin/bash

# SITH Native Nix Installation Script
# Installs Nix package manager and sets up OpenCode environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NIX_VERSION="2.19"
NIX_INSTALLER_URL="https://nixos.org/nix/install"
SITH_NIX_DIR="$HOME/.sith/nix"

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Nix version
check_nix_version() {
    if command_exists nix; then
        local installed_version=$(nix --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+' | head -1)
        if [ -n "$installed_version" ]; then
            local major_installed=$(echo $installed_version | cut -d. -f1)
            local minor_installed=$(echo $installed_version | cut -d. -f2)
            local major_required=$(echo $NIX_VERSION | cut -d. -f1)
            local minor_required=$(echo $NIX_VERSION | cut -d. -f2)

            if [ "$major_installed" -gt "$major_required" ] || \
               ([ "$major_installed" -eq "$major_required" ] && [ "$minor_installed" -ge "$minor_required" ]); then
                return 0
            fi
        fi
    fi
    return 1
}

# Function to detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    echo "macos";;
        Linux*)     echo "linux";;
        *)          echo "unknown";;
    esac
}

# Main installation
main() {
    print_color "$CYAN" "==============================================="
    print_color "$RED" "    ███████╗██╗████████╗██╗  ██╗"
    print_color "$RED" "    ██╔════╝██║╚══██╔══╝██║  ██║"
    print_color "$RED" "    ███████╗██║   ██║   ███████║"
    print_color "$RED" "    ╚════██║██║   ██║   ██╔══██║"
    print_color "$RED" "    ███████║██║   ██║   ██║  ██║"
    print_color "$RED" "    ╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝"
    print_color "$CYAN" "==============================================="
    print_color "$CYAN" "       Native Nix Installation Script"
    print_color "$CYAN" "==============================================="
    echo

    # Detect OS
    local os=$(detect_os)
    if [ "$os" = "unknown" ]; then
        print_color "$RED" "❌ Unsupported operating system"
        print_color "$YELLOW" "Nix only supports macOS and Linux"
        exit 1
    fi
    print_color "$GREEN" "✓ Detected OS: $os"

    # Check if Nix is already installed
    if check_nix_version; then
        print_color "$GREEN" "✓ Nix is already installed and meets version requirements"
        print_color "$CYAN" "  Version: $(nix --version)"
    else
        # Install Nix
        print_color "$YELLOW" "⚙ Installing Nix package manager..."
        print_color "$CYAN" "  This may take a few minutes and require sudo access"
        echo

        if [ "$os" = "macos" ]; then
            # macOS installation
            sh <(curl -L "$NIX_INSTALLER_URL") --daemon
        else
            # Linux installation
            sh <(curl -L "$NIX_INSTALLER_URL") --daemon
        fi

        # Source Nix profile
        if [ -e "$HOME/.nix-profile/etc/profile.d/nix.sh" ]; then
            . "$HOME/.nix-profile/etc/profile.d/nix.sh"
        elif [ -e "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh" ]; then
            . "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh"
        fi

        print_color "$GREEN" "✓ Nix installed successfully"
    fi

    # Create SITH Nix directory
    print_color "$YELLOW" "⚙ Setting up SITH Nix environment..."
    mkdir -p "$SITH_NIX_DIR"
    print_color "$GREEN" "✓ Created directory: $SITH_NIX_DIR"

    # Copy Nix configuration files
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(dirname "$script_dir")"
    local nix_source="$project_root/docker/nix"

    if [ -d "$nix_source" ]; then
        print_color "$YELLOW" "⚙ Copying Nix configuration files..."

        # Copy main files
        for file in shell.nix flake.nix flake.lock; do
            if [ -f "$nix_source/$file" ]; then
                cp "$nix_source/$file" "$SITH_NIX_DIR/"
                print_color "$GREEN" "  ✓ Copied $file"
            fi
        done

        # Copy nix-config directory
        if [ -d "$nix_source/nix-config" ]; then
            cp -r "$nix_source/nix-config" "$SITH_NIX_DIR/"
            print_color "$GREEN" "  ✓ Copied nix-config/"
        fi

        # Copy nix-scripts directory
        if [ -d "$nix_source/nix-scripts" ]; then
            cp -r "$nix_source/nix-scripts" "$SITH_NIX_DIR/"
            print_color "$GREEN" "  ✓ Copied nix-scripts/"
        fi
    else
        print_color "$YELLOW" "⚠ Nix configuration files not found in $nix_source"
        print_color "$YELLOW" "  You may need to copy them manually"
    fi

    # Install OpenCode CLI
    print_color "$YELLOW" "⚙ Installing OpenCode CLI..."
    if command_exists opencode; then
        print_color "$GREEN" "✓ OpenCode CLI is already installed"
    else
        print_color "$CYAN" "  Downloading from https://opencode.ai/install..."
        curl -fsSL https://opencode.ai/install | sh
        print_color "$GREEN" "✓ OpenCode CLI installed"
    fi

    # Final instructions
    echo
    print_color "$GREEN" "==============================================="
    print_color "$GREEN" "✅ Installation complete!"
    print_color "$GREEN" "==============================================="
    echo
    print_color "$CYAN" "To start using SITH with Nix:"
    print_color "$YELLOW" "  1. Restart your shell or run:"
    print_color "$CYAN" "     source ~/.nix-profile/etc/profile.d/nix.sh"
    print_color "$YELLOW" "  2. Run SITH with Nix:"
    print_color "$CYAN" "     sith --nix"
    echo
    print_color "$CYAN" "Configuration files saved to: $SITH_NIX_DIR"
    echo
}

# Run main function
main "$@"