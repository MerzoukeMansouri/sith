# Native Nix Installation Guide

Run SITH without Docker using native Nix package manager for better performance.

## Quick Start

```bash
# Install Nix and setup environment
sith --nix-install

# Run Nix shell
sith --nix
```

## Benefits

- **No virtualization overhead** - Direct access to system resources
- **Faster startup** - No container initialization
- **Native filesystem** - Direct file access, no mount overhead
- **Same reproducibility** - Identical packages via Nix
- **Optional Docker fallback** - Use Docker when needed

## Installation Methods

### Method 1: Using SITH CLI (Recommended)

```bash
# Interactive menu - select "Install Nix locally"
sith

# Or direct command
sith --nix-install
```

### Method 2: Using Install Script

```bash
./scripts/install-nix.sh
```

### Method 3: Manual Installation

1. Install Nix:
```bash
sh <(curl -L https://nixos.org/nix/install) --daemon
```

2. Copy configuration:
```bash
cp -r docker/nix ~/.sith/nix
```

3. Run shell:
```bash
nix-shell ~/.sith/nix/shell.nix
```

## Commands

### Main Commands

```bash
# Run Nix shell
sith --nix

# Install Nix locally
sith --nix-install

# Nix subcommand
sith nix --shell
sith nix --install
```

### Configuration Files

Files copied to `~/.sith/nix/`:
- `shell.nix` - Main environment definition
- `flake.nix` - Flakes-based config
- `flake.lock` - Locked dependencies
- `nix-config/` - Package definitions

## Comparison: Docker vs Nix

| Feature | Docker | Native Nix |
|---------|--------|------------|
| **Setup Speed** | Pull: Fast ⚡<br>Build: Slow 🐌 | First: Moderate ⏱️<br>After: Fast ⚡ |
| **Runtime Performance** | Good | Excellent |
| **Filesystem Access** | Via mounts | Direct |
| **Resource Usage** | Higher (virtualization) | Lower (native) |
| **Reproducibility** | ✅ Full | ✅ Full |
| **Platform Support** | All | macOS/Linux |
| **CI/CD** | ✅ Ideal | ⚠️ Requires setup |

## Troubleshooting

### Nix not found after installation
```bash
# Reload shell profile
source ~/.nix-profile/etc/profile.d/nix.sh
# Or restart terminal
```

### Permission denied
```bash
# Nix requires daemon mode on macOS
# Reinstall with daemon flag:
sh <(curl -L https://nixos.org/nix/install) --daemon
```

### Build failures
```bash
# Clear Nix cache
nix-collect-garbage -d
# Retry with fresh environment
```

## Environment Variables

Set in `~/.bashrc` or `~/.zshrc`:
```bash
export OPENCODE_MODEL="claude-sonnet-4-5-20241022"
export GITHUB_TOKEN="your-token"
```

Or use GitHub CLI:
```bash
gh auth login
# Token auto-detected by SITH
```

## Skills Configuration

Token optimization skills work identically:
- **Caveman**: 75% reduction (enabled)
- **RTK**: 60-90% reduction (when available)

Configuration in `~/.sith/nix/nix-scripts/06-skills-setup.sh`

## Team Adoption Strategy

1. **Docker users**: Continue as-is
2. **Performance issues**: Switch to Nix
3. **CI/CD**: Keep using Docker
4. **Local development**: Choose based on preference

## Uninstallation

Remove Nix completely:
```bash
# macOS
/nix/nix-installer uninstall

# Linux
sudo rm -rf /nix
```

Remove SITH Nix config:
```bash
rm -rf ~/.sith/nix
```