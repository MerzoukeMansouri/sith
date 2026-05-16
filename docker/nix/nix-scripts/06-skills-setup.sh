#!/bin/bash
# Token optimization skills installation (RTK + Caveman)

echo "=== Installation des Skills d'Optimisation de Tokens ==="
echo ""

mkdir -p /root/.agents/skills

# 1. RTK (Rust Token Killer)
# NOTE: RTK n'est actuellement pas disponible publiquement
# Désactivé par défaut - peut être activé si vous avez le binaire
if [ "${RTK_ENABLED:-false}" = "true" ]; then
  echo "📦 Installation de RTK (Rust Token Killer)..."
  
  mkdir -p /root/.agents/skills/rtk/bin
  mkdir -p /root/.agents/skills/rtk/config
  
  if [ ! -f /root/.agents/skills/rtk/bin/rtk ]; then
    echo "  ⚠️  RTK binaire non disponible publiquement"
    echo "      Pour utiliser RTK:"
    echo "      1. Copier votre binaire RTK dans l'image"
    echo "      2. Ou monter: -v /path/to/rtk:/root/.agents/skills/rtk/bin/rtk"
  else
    echo "  ✅ RTK déjà installé: $(/root/.agents/skills/rtk/bin/rtk --version 2>&1)"
  fi
  
  # Copier la configuration RTK
  if [ -f /opt/sith/skills/rtk-config.toml ]; then
    cp /opt/sith/skills/rtk-config.toml /root/.agents/skills/rtk/config/config.toml
    mkdir -p /root/.config/rtk
    ln -sf /root/.agents/skills/rtk/config/config.toml /root/.config/rtk/config.toml
    echo "  ✅ Configuration RTK prête (binaire requis)"
  fi
  
  # Initialiser le hook bash pour RTK
  if command -v rtk &> /dev/null; then
    if [ -f /root/.bashrc ] && ! grep -q "rtk hook" /root/.bashrc; then
      echo 'eval "$(rtk hook bash)"' >> /root/.bashrc
      echo "  ✅ RTK hook bash configuré"
    fi
    eval "$(rtk hook bash)" 2>/dev/null || true
  fi
fi

# 2. Caveman (mode ultra)
if [ "${CAVEMAN_AUTO:-true}" = "true" ]; then
  echo "📦 Installation de Caveman skill (mode ultra)..."

  mkdir -p /root/.agents/skills

  # Download Caveman if not present
  if [ ! -d /opt/sith/skills/caveman ]; then
    echo "  📥 Downloading Caveman from GitHub..."
    mkdir -p /opt/sith/skills
    cd /opt/sith/skills
    curl -fsSL https://github.com/JuliusBrussee/caveman/archive/refs/heads/main.zip -o caveman.zip
    unzip -q caveman.zip
    mv caveman-main caveman
    rm caveman.zip
    echo "  ✅ Caveman downloaded"
  fi

  if [ -d /opt/sith/skills/caveman ]; then
    cp -r /opt/sith/skills/caveman /root/.agents/skills/caveman

    cat > /root/.agents/skills/caveman/.config << 'EOF'
mode=ultra
auto_activate=true
EOF

    echo "  ✅ Caveman installé en mode ultra (compression maximale)"
  else
    echo "  ⚠️  Caveman skill non trouvé - continuant sans Caveman"
  fi
fi

# 3. Configuration OpenCode skills
if [ -f /opt/sith/skills/opencode-skills-config.json ]; then
  mkdir -p /root/.local/share/opencode/skills
  cp /opt/sith/skills/opencode-skills-config.json /root/.local/share/opencode/skills/config.json
fi

# Résumé
echo ""
echo "🎯 Skills d'optimisation de tokens:"
if command -v rtk &> /dev/null && [ "${RTK_ENABLED:-true}" = "true" ]; then
  echo "  ✅ RTK: Actif (60-90% réduction sur commandes CLI)"
fi
if [ -d /root/.agents/skills/caveman ] && [ "${CAVEMAN_AUTO:-true}" = "true" ]; then
  echo "  ✅ Caveman: Mode ultra (75%+ compression de langage)"
fi
echo ""
