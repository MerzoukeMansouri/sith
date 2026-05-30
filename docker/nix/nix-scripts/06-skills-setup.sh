#!/bin/bash
# Skills installation from volume mount (~/.sith/skills → /opt/sith/external-skills)

EXTERNAL_SKILLS_DIR="${SITH_EXTERNAL_SKILLS:-/opt/sith/external-skills}"
declare -a INSTALLED_SKILLS=()

mkdir -p /root/.agents/skills

if [ -d "$EXTERNAL_SKILLS_DIR" ]; then
  for skill_dir in "$EXTERNAL_SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    [ -f "$skill_dir/skill.json" ] || continue
    skill_name=$(basename "$skill_dir")
    cp -r "$skill_dir" "/root/.agents/skills/$skill_name"
    if [ -f "/root/.agents/skills/$skill_name/skill.sh" ]; then
      source "/root/.agents/skills/$skill_name/skill.sh" 2>/dev/null || true
    fi
    version=$(grep -o '"version":"[^"]*"' "$skill_dir/skill.json" | cut -d'"' -f4 || echo "local")
    INSTALLED_SKILLS+=("$skill_name|$version|~/.sith/skills")
  done
fi

if [ ${#INSTALLED_SKILLS[@]} -gt 0 ]; then
  echo ""
  echo "┌─────────────────┬──────────┬─────────────────────────────────────────┐"
  echo "│ Skill           │ Version  │ Source                                  │"
  echo "├─────────────────┼──────────┼─────────────────────────────────────────┤"
  for skill_info in "${INSTALLED_SKILLS[@]}"; do
    IFS='|' read -r name version source <<< "$skill_info"
    printf "│ %-15s │ %-8s │ %-39s │\n" "$name" "$version" "$source"
  done
  echo "└─────────────────┴──────────┴─────────────────────────────────────────┘"
  echo ""
fi
