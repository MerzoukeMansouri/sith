#!/bin/bash
# Token optimization skills installation (RTK + Caveman)

mkdir -p /root/.agents/skills

# Track installed skills
declare -a INSTALLED_SKILLS=()

# 1. RTK (Rust Token Killer)
if [ "${RTK_ENABLED:-false}" = "true" ]; then
  mkdir -p /root/.agents/skills/rtk/bin
  mkdir -p /root/.agents/skills/rtk/config

  if [ -f /opt/sith/skills/rtk-config.toml ]; then
    cp /opt/sith/skills/rtk-config.toml /root/.agents/skills/rtk/config/config.toml
    mkdir -p /root/.config/rtk
    ln -sf /root/.agents/skills/rtk/config/config.toml /root/.config/rtk/config.toml
  fi

  if command -v rtk &> /dev/null; then
    RTK_VERSION=$(rtk --version 2>&1 | head -n1 | awk '{print $2}' || echo "unknown")
    INSTALLED_SKILLS+=("RTK|$RTK_VERSION|https://github.com/rust-token-killer/rtk")

    if [ -f /root/.bashrc ] && ! grep -q "rtk hook" /root/.bashrc; then
      echo 'eval "$(rtk hook bash)"' >> /root/.bashrc
    fi
    eval "$(rtk hook bash)" 2>/dev/null || true
  fi
fi

# 2. Caveman (mode ultra)
if [ "${CAVEMAN_AUTO:-true}" = "true" ]; then
  mkdir -p /root/.agents/skills

  if [ ! -d /opt/sith/skills/caveman ]; then
    mkdir -p /opt/sith/skills
    cd /opt/sith/skills
    curl -fsSL https://github.com/JuliusBrussee/caveman/archive/refs/heads/main.zip -o caveman.zip 2>/dev/null
    unzip -q caveman.zip 2>/dev/null
    mv caveman-main caveman 2>/dev/null
    rm caveman.zip 2>/dev/null
  fi

  if [ -d /opt/sith/skills/caveman ]; then
    cp -r /opt/sith/skills/caveman /root/.agents/skills/caveman

    cat > /root/.agents/skills/caveman/.config << 'EOF'
mode=ultra
auto_activate=true
EOF

    CAVEMAN_VERSION=$(grep -oP '(?<=version: ).*' /root/.agents/skills/caveman/skill.json 2>/dev/null || echo "main")
    INSTALLED_SKILLS+=("Caveman|$CAVEMAN_VERSION|https://github.com/JuliusBrussee/caveman")
  fi
fi

# 3. Configuration OpenCode skills
if [ -f /opt/sith/skills/opencode-skills-config.json ]; then
  mkdir -p /root/.local/share/opencode/skills
  cp /opt/sith/skills/opencode-skills-config.json /root/.local/share/opencode/skills/config.json
fi

# Display table if any skills installed
if [ ${#INSTALLED_SKILLS[@]} -gt 0 ]; then
  echo ""
  echo "┌─────────────────┬──────────┬─────────────────────────────────────────┐"
  echo "│ Skill           │ Version  │ GitHub                                  │"
  echo "├─────────────────┼──────────┼─────────────────────────────────────────┤"

  for skill_info in "${INSTALLED_SKILLS[@]}"; do
    IFS='|' read -r name version github <<< "$skill_info"
    printf "│ %-15s │ %-8s │ %-39s │\n" "$name" "$version" "$github"
  done

  echo "└─────────────────┴──────────┴─────────────────────────────────────────┘"
  echo ""
fi
