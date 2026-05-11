#!/usr/bin/env bash
# Install the OpenCode multi-agent framework.
#
# Modes:
#   --global         Install to ~/.config/opencode/ (available in every project)
#   --project [DIR]  Install to <DIR>/.opencode/ (defaults to current directory)
#
# Methods:
#   --copy           Copy files (default; safe, isolated)
#   --symlink        Symlink the source repo (live updates as you `git pull`)
#
# Other:
#   --force          Overwrite existing install without prompting
#   --no-jsonc       Do not install opencode.jsonc (project mode only)
#   --dry-run        Print actions without making changes
#   -h, --help       Show this help

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$REPO_DIR/opencode"
SOURCE_JSONC="$REPO_DIR/opencode.jsonc"
SOURCE_AGENTS_MD="$REPO_DIR/AGENTS.md"

MODE=""
TARGET_PROJECT=""
METHOD="copy"
FORCE=0
INSTALL_JSONC=1
DRY_RUN=0

usage() {
  sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

log() { printf '[install] %s\n' "$*"; }
run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '[dry-run] %s\n' "$*"
  else
    "$@"
  fi
}

# Parse args.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --global)   MODE="global"; shift ;;
    --project)
      MODE="project"
      shift
      if [[ $# -gt 0 && "$1" != --* ]]; then
        TARGET_PROJECT="$1"; shift
      fi
      ;;
    --copy)     METHOD="copy"; shift ;;
    --symlink)  METHOD="symlink"; shift ;;
    --force)    FORCE=1; shift ;;
    --no-jsonc) INSTALL_JSONC=0; shift ;;
    --dry-run)  DRY_RUN=1; shift ;;
    -h|--help)  usage 0 ;;
    *)          echo "Unknown argument: $1" >&2; usage 1 ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "Choose an install mode:" >&2
  echo "  --global         Install to ~/.config/opencode/" >&2
  echo "  --project [DIR]  Install to <DIR>/.opencode/" >&2
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  echo "Run install.sh from the repo root." >&2
  exit 1
fi

# Resolve target.
case "$MODE" in
  global)
    TARGET_BASE="$HOME/.config/opencode"
    ;;
  project)
    TARGET_BASE="${TARGET_PROJECT:-$PWD}/.opencode"
    ;;
esac

log "Mode: $MODE"
log "Method: $METHOD"
log "Target: $TARGET_BASE"

if [[ -e "$TARGET_BASE" || -L "$TARGET_BASE" ]]; then
  if [[ "$FORCE" -eq 1 ]]; then
    log "Removing existing install at $TARGET_BASE"
    run rm -rf "$TARGET_BASE"
  else
    echo "Target already exists: $TARGET_BASE" >&2
    echo "Re-run with --force to overwrite." >&2
    exit 1
  fi
fi

run mkdir -p "$(dirname "$TARGET_BASE")"

if [[ "$METHOD" == "symlink" ]]; then
  run ln -s "$SOURCE_DIR" "$TARGET_BASE"
  log "Symlinked $SOURCE_DIR -> $TARGET_BASE"
else
  run cp -R "$SOURCE_DIR/" "$TARGET_BASE"
  log "Copied $SOURCE_DIR -> $TARGET_BASE"
fi

# Place opencode.jsonc and AGENTS.md when missing (project mode only for AGENTS.md).
if [[ "$INSTALL_JSONC" -eq 1 ]]; then
  if [[ "$MODE" == "project" ]]; then
    PROJECT_ROOT="${TARGET_PROJECT:-$PWD}"

    if [[ -f "$SOURCE_JSONC" && ! -f "$PROJECT_ROOT/opencode.jsonc" ]]; then
      run cp "$SOURCE_JSONC" "$PROJECT_ROOT/opencode.jsonc"
      log "Installed opencode.jsonc to $PROJECT_ROOT/"
    elif [[ -f "$PROJECT_ROOT/opencode.jsonc" ]]; then
      log "Skipping opencode.jsonc (already present in $PROJECT_ROOT/)"
    fi

    if [[ -f "$SOURCE_AGENTS_MD" && ! -f "$PROJECT_ROOT/AGENTS.md" ]]; then
      run cp "$SOURCE_AGENTS_MD" "$PROJECT_ROOT/AGENTS.md"
      log "Installed AGENTS.md to $PROJECT_ROOT/"
    elif [[ -f "$PROJECT_ROOT/AGENTS.md" ]]; then
      log "Skipping AGENTS.md (already present in $PROJECT_ROOT/)"
    fi
  elif [[ "$MODE" == "global" ]]; then
    if [[ -f "$SOURCE_JSONC" && ! -f "$TARGET_BASE/opencode.jsonc" ]]; then
      run cp "$SOURCE_JSONC" "$TARGET_BASE/opencode.jsonc"
      log "Installed opencode.jsonc to $TARGET_BASE/"
    elif [[ -f "$TARGET_BASE/opencode.jsonc" ]]; then
      log "Skipping opencode.jsonc (already present in $TARGET_BASE/)"
    fi
  fi
fi

log "Done."
log ""
log "Next steps:"
log "  1. Apply a model profile:"
log "       OPENCODE_DIR='$TARGET_BASE' bash '$REPO_DIR/scripts/apply-profile-models.sh' balanced"
log "  2. Open the project in OpenCode and verify agents load."
