#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_ROOT/modal/.venv"
MODAL_CLI="$VENV_DIR/bin/modal"
DOWNLOAD_SCRIPT="$PROJECT_ROOT/modal/download_models.py"

echo "=== Modal Models Management ==="

# Check Modal CLI in venv
if [[ ! -f "$MODAL_CLI" ]]; then
    echo "Error: Modal CLI not found. Run 'pnpm modal:setup' first."
    exit 1
fi

# Check if download script exists
if [[ ! -f "$DOWNLOAD_SCRIPT" ]]; then
    echo "Error: Download script not found at $DOWNLOAD_SCRIPT"
    exit 1
fi

case "$1" in
    download)
        echo "Downloading models to Modal Volume..."
        echo ""
        "$MODAL_CLI" run "$DOWNLOAD_SCRIPT::download_all_models"
        echo ""
        echo "✓ Model download complete!"
        ;;
    list)
        echo "Listing installed models..."
        echo ""
        "$MODAL_CLI" run "$DOWNLOAD_SCRIPT::list_models"
        ;;
    *)
        echo "Usage: $0 {download|list}"
        echo ""
        echo "Commands:"
        echo "  download  - Download all required models to Modal Volume"
        echo "  list      - List installed models in Modal Volume"
        exit 1
        ;;
esac
