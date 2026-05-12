#!/usr/bin/env bash
# Uninstall the OpenCode multi-agent framework.
#
# Modes:
#   --global         Remove ~/.config/opencode/
#   --project [DIR]  Remove <DIR>/.opencode/ and project metadata
#
# Other:
#   --keep-project-files
#                   Do not remove AGENTS.md, .oowl.json, or legacy opencode.jsonc
#   --keep-jsonc     Legacy alias for --keep-project-files
#   --dry-run        Print actions without making changes
#   -h, --help       Show this help

set -euo pipefail

MODE=""
TARGET_PROJECT=""
KEEP_PROJECT_FILES=0
DRY_RUN=0

usage() {
  awk '
    NR == 1 { next }
    /^#$/ { print ""; next }
    /^# / { sub(/^# ?/, ""); print; next }
    { exit }
  ' "$0"
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
    --keep-project-files|--keep-jsonc) KEEP_PROJECT_FILES=1; shift ;;
    --dry-run)    DRY_RUN=1; shift ;;
    -h|--help)    usage 0 ;;
    *)            echo "Unknown argument: $1" >&2; usage 1 ;;
  esac
done

if [[ -z "$MODE" ]]; then
  echo "Choose an uninstall mode:" >&2
  echo "  --global         Remove ~/.config/opencode/" >&2
  echo "  --project [DIR]  Remove <DIR>/.opencode/ and project metadata" >&2
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

REMOVED=0

remove_dir() {
  local path="$1"
  if [[ -e "$path" || -L "$path" ]]; then
    log "Removing $path"
    run rm -rf "$path"
    REMOVED=1
  fi
}

remove_file() {
  local path="$1"
  if [[ -e "$path" || -L "$path" ]]; then
    log "Removing $path"
    run rm -f "$path"
    REMOVED=1
  fi
}

remove_dir "$TARGET_BASE"

if [[ "$MODE" == "project" && "$KEEP_PROJECT_FILES" -eq 0 ]]; then
  for f in AGENTS.md .oowl.json opencode.jsonc; do
    remove_file "$PROJECT_ROOT/$f"
  done
fi

if [[ "$REMOVED" -eq 0 ]]; then
  log "Nothing to remove."
fi

log "Done."
