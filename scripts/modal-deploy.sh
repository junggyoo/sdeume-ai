#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_ROOT/modal/.venv"
MODAL_CLI="$VENV_DIR/bin/modal"
PYTHON="$VENV_DIR/bin/python"
MODAL_APP="$PROJECT_ROOT/modal/comfyui_workflow.py"

echo "=== Modal Deploy ==="

# Check Modal CLI in venv
if [[ ! -f "$MODAL_CLI" ]]; then
    echo "Error: Modal CLI not found. Run 'pnpm modal:setup' first."
    exit 1
fi

# Check if modal app file exists
if [[ ! -f "$MODAL_APP" ]]; then
    echo "Error: Modal app not found at $MODAL_APP"
    exit 1
fi

# Check if validate
if [[ "$1" == "--validate" ]]; then
    echo "Validating Modal app..."
    echo "App: $MODAL_APP"
    echo ""
    # Check Python syntax only
    "$PYTHON" -m py_compile "$MODAL_APP"
    echo "✓ Python syntax valid"
    echo ""
    echo "✓ Validation complete!"
    echo ""
    echo "Note: Run 'pnpm modal:deploy' to deploy to Modal"
else
    echo "Deploying to Modal..."
    echo "App: $MODAL_APP"
    echo ""
    "$MODAL_CLI" deploy "$MODAL_APP"
    echo ""
    echo "✓ Deploy complete!"
fi
