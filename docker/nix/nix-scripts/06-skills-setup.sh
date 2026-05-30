#!/bin/bash
# Display active skills mounted via volume at /root/.opencode/skills/

SKILLS_DIR="/root/.opencode/skills"
declare -a ACTIVE_SKILLS=()

if [ -d "$SKILLS_DIR" ]; then
  for skill_dir in "$SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    [ -f "$skill_dir/skill.json" ] || continue
    skill_name=$(basename "$skill_dir")
    version=$(grep -o '"version":"[^"]*"' "$skill_dir/skill.json" | cut -d'"' -f4 || echo "local")
    ACTIVE_SKILLS+=("$skill_name|$version")
  done
fi

if [ ${#ACTIVE_SKILLS[@]} -gt 0 ]; then
  echo ""
  echo "┌─────────────────┬──────────┐"
  echo "│ Skill           │ Version  │"
  echo "├─────────────────┼──────────┤"
  for skill_info in "${ACTIVE_SKILLS[@]}"; do
    IFS='|' read -r name version <<< "$skill_info"
    printf "│ %-15s │ %-8s │\n" "$name" "$version"
  done
  echo "└─────────────────┴──────────┘"
  echo ""
fi
