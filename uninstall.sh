#!/usr/bin/env bash
# Uninstall the OpenCode multi-agent framework.
#
# Modes:
#   --global         Remove ~/.config/opencode/
#   --project [DIR]  Remove <DIR>/.opencode/ (defaults to current directory)
#
# Other:
#   --keep-jsonc     Do not remove opencode.jsonc / AGENTS.md (project mode)
#   --dry-run        Print actions without making changes
#   -h, --help       Show this help

set -euo pipefail

MODE=""
TARGET_PROJECT=""
KEEP_JSONC=0
DRY_RUN=0

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

log() { printf '[uninstall] %s\n' "$*"; }
run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '[dry-run] %s\n' "$*"
  else
    "$@"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --global)     MODE="global"; shift ;;
    --project)
      MODE="project"
      shift
      if [[ $# -gt 0 && "$1" != --* ]]; then
        TARGET_PROJECT="$1"; shift
      fi
      ;;
    --keep-jsonc) KEEP_JSONC=1; shift ;;
    --dry-run)    DRY_RUN=1; shift ;;
    -h|--help)    usage 0 ;;
    *)            echo "Unknown argument: $1" >&2; usage 1 ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "Choose an uninstall mode:" >&2
  echo "  --global         Remove ~/.config/opencode/" >&2
  echo "  --project [DIR]  Remove <DIR>/.opencode/" >&2
  exit 1
fi

case "$MODE" in
  global)
    TARGET_BASE="$HOME/.config/opencode"
    PROJECT_ROOT=""
    ;;
  project)
    PROJECT_ROOT="${TARGET_PROJECT:-$PWD}"
    TARGET_BASE="$PROJECT_ROOT/.opencode"
    ;;
esac

if [[ ! -e "$TARGET_BASE" && ! -L "$TARGET_BASE" ]]; then
  log "Nothing to remove at $TARGET_BASE"
  exit 0
fi

log "Removing $TARGET_BASE"
run rm -rf "$TARGET_BASE"

if [[ "$MODE" == "project" && "$KEEP_JSONC" -eq 0 ]]; then
  for f in opencode.jsonc AGENTS.md; do
    if [[ -f "$PROJECT_ROOT/$f" ]]; then
      log "Removing $PROJECT_ROOT/$f"
      run rm -f "$PROJECT_ROOT/$f"
    fi
  done
fi

log "Done."
