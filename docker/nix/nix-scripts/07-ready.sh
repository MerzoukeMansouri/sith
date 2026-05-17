#!/bin/bash
# Ready message

if command -v catimg &> /dev/null; then
  if [ -f /opt/sith/assets/images/logo.png ]; then
    catimg -w 80 /opt/sith/assets/images/logo.png 2>/dev/null
    echo ""
  elif [ -f /workspace/assets/images/logo.png ]; then
    catimg -w 80 /workspace/assets/images/logo.png 2>/dev/null
    echo ""
  fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Environment Ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
