#!/bin/bash
# Quick validation wrapper for Claude Code setup
# This script calls the comprehensive verification script in .claude/scripts/verify.sh

set -e

echo "Running Claude Code setup validation..."
echo ""

# Check if verify.sh exists
if [ ! -f ".claude/scripts/verify.sh" ]; then
    echo "Error: .claude/scripts/verify.sh not found"
    echo "Are you running this from the project root?"
    exit 1
fi

# Make sure verify.sh is executable
chmod +x .claude/scripts/verify.sh

# Execute the verification script, passing through all arguments
exec .claude/scripts/verify.sh "$@"
