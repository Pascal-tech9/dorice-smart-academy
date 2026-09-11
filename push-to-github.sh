#!/bin/bash
# Dorice Smart Academy — push to GitHub
# Run this from the dorice/ directory on YOUR machine (not the sandbox)
#
# Usage:
#   1. Download dorice-production.zip from the chat
#   2. Unzip it:  unzip dorice-production.zip -d dorice
#   3. cd dorice
#   4. Run:       bash push-to-github.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Dorice Smart Academy — push to GitHub"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check we're in the right place
if [ ! -f "wsgi.py" ] || [ ! -f "render.yaml" ]; then
  echo "✗ ERROR: wsgi.py or render.yaml not found."
  echo "  Make sure you ran 'unzip dorice-production.zip -d dorice && cd dorice' first."
  exit 1
fi

# Make sure git is initialized
if [ ! -d ".git" ]; then
  echo "→ Initialising git repo..."
  git init
  git config user.email "pascal-tech9@users.noreply.github.com"
  git config user.name "Pascal Tech"
  git add -A
  git commit -q -m "Dorice Smart Academy — initial production release"
fi

# Set remote
if ! git remote get-url origin >/dev/null 2>&1; then
  echo "→ Adding remote..."
  git remote add origin https://github.com/pascal-tech9/dorice-smart-academy.git
fi

# Make sure we're on master
git branch -M master 2>/dev/null || true

# Push
echo "→ Pushing to GitHub (you may be asked to sign in)..."
echo ""
git push -u origin master
echo ""
echo "✓ Done! Now go to https://github.com/pascal-tech9/dorice-smart-academy"
echo "  Then in Render: New → Blueprint → pick this repo. render.yaml will auto-provision."
