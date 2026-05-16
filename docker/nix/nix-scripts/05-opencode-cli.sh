#!/bin/bash
# OpenCode CLI vérification

# Configurer le PATH pour OpenCode
export PATH="$HOME/.opencode/bin:$PATH"

if command -v opencode &> /dev/null; then
  OPENCODE_VERSION=$(opencode --version 2>&1 | head -n1 || echo 'ok')
  OPENCODE_PATH=$(command -v opencode)
  echo "✅ OpenCode CLI disponible"
  echo "   Version: $OPENCODE_VERSION"
  echo "   Chemin: $OPENCODE_PATH"
else
  echo "⚠️  OpenCode CLI non trouvé"
  echo "   Installer: curl -fsSL https://opencode.ai/install | bash"
fi

echo ""
