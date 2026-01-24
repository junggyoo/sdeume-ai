#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_ROOT/modal/.venv"
MODAL_CLI="$VENV_DIR/bin/modal"

echo "=== Modal CLI Setup ==="

# Check if venv exists
if [[ ! -d "$VENV_DIR" ]]; then
    echo "Error: Virtual environment not found at $VENV_DIR"
    echo "Create it with: cd modal && python -m venv .venv && source .venv/bin/activate && pip install modal"
    exit 1
fi

# Check Modal CLI in venv
if [[ ! -f "$MODAL_CLI" ]]; then
    echo "Error: Modal CLI not found in venv"
    echo "Install with: cd modal && source .venv/bin/activate && pip install modal"
    exit 1
fi

echo "✓ Modal CLI found at $MODAL_CLI"

# Check authentication
if ! "$MODAL_CLI" profile current &> /dev/null; then
    echo "Setting up Modal authentication..."
    "$MODAL_CLI" token set
fi

# Verify connection
echo ""
echo "Current Modal profile:"
"$MODAL_CLI" profile current

echo ""
echo "✓ Modal setup complete!"
