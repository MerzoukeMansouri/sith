#!/bin/bash
# Ready message

if command -v catimg &> /dev/null && [ -f /workspace/assets/images/logo.png ]; then
  catimg -w 80 /workspace/assets/images/logo.png 2>/dev/null
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Environment Ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
