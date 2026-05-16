#!/bin/bash
# Banner and version display

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚀 OpenCode CI - Nix Environment (CI/CD Ready)         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📦 Versions installées:"
echo "  • Bash:      $(bash --version | head -n1)"
echo "  • Node.js:   $(node --version)"
echo "  • Python:    $(python3 --version)"
echo "  • Git:       $(git --version | cut -d' ' -f3)"
echo "  • jq:        $(jq --version)"
echo ""
