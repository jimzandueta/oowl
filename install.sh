#!/usr/bin/env bash
# Install the OpenCode multi-agent framework.
#
# Modes:
#   --global         Install to ~/.config/opencode/ (available in every project)
#   --project [DIR]  Install to <DIR>/.opencode/ (defaults to current directory)
#
# Options:
#   --copy           Copy files (default; safe, isolated)
#   --force          Overwrite existing install without prompting
#   --no-jsonc       Do not install opencode.jsonc
#   --dry-run        Print actions without making changes
#   -h, --help       Show this help

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$REPO_DIR/framework"
SOURCE_JSONC="$REPO_DIR/framework/opencode.jsonc"
SOURCE_AGENTS_MD="$REPO_DIR/framework/AGENTS.md"
PACKAGE_VERSION="$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$REPO_DIR/package.json" | head -n 1)"
PACKAGE_VERSION="${PACKAGE_VERSION:-1.1.0}"

MODE=""
TARGET_PROJECT=""
FORCE=0
INSTALL_JSONC=1
DRY_RUN=0

usage() {
  sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
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
    --copy)     shift ;;  # No-op, copy is the only mode
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

for dir in agents commands prompts model-profiles; do
  if [[ ! -d "$SOURCE_DIR/$dir" ]]; then
    echo "Required source directory not found: $SOURCE_DIR/$dir" >&2
    exit 1
  fi
done

# Validate framework/AGENTS.md exists
if [[ ! -f "$SOURCE_AGENTS_MD" ]]; then
  echo "Required file not found: $SOURCE_AGENTS_MD" >&2
  exit 1
fi

# Resolve target.
case "$MODE" in
  global)
    TARGET_BASE="$HOME/.config/opencode"
    INSTALL_ROOT="$TARGET_BASE"
    PROJECT_ROOT=""
    ;;
  project)
    PROJECT_ROOT="${TARGET_PROJECT:-$PWD}"
    TARGET_BASE="$PROJECT_ROOT/.opencode"
    INSTALL_ROOT="$PROJECT_ROOT"
    ;;
esac

log "Mode: $MODE"
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

# Flat copy agents (skip README.md)
run mkdir -p "$TARGET_BASE/agents"
find "$SOURCE_DIR/agents" -type f -name "*.md" ! -name "README.md" | while read -r file; do
  run cp "$file" "$TARGET_BASE/agents/"
done
log "Flat copied agents: $SOURCE_DIR/agents -> $TARGET_BASE/agents"

# Flat copy commands (skip README.md)
run mkdir -p "$TARGET_BASE/commands"
find "$SOURCE_DIR/commands" -type f -name "*.md" ! -name "README.md" | while read -r file; do
  run cp "$file" "$TARGET_BASE/commands/"
done
log "Flat copied commands: $SOURCE_DIR/commands -> $TARGET_BASE/commands"

# Recursive copy for prompts (preserve shared/ subfolder)
run mkdir -p "$TARGET_BASE/prompts"
run cp -R "$SOURCE_DIR/prompts/" "$TARGET_BASE/prompts/"
log "Copied prompts: $SOURCE_DIR/prompts -> $TARGET_BASE/prompts"

# Recursive copy for model-profiles
run mkdir -p "$TARGET_BASE/model-profiles"
run cp -R "$SOURCE_DIR/model-profiles/" "$TARGET_BASE/model-profiles/"
log "Copied model-profiles: $SOURCE_DIR/model-profiles -> $TARGET_BASE/model-profiles"

# Copy JSON config files
if [[ "$INSTALL_JSONC" -eq 1 ]]; then
  if [[ -f "$SOURCE_JSONC" && ! -f "$TARGET_BASE/opencode.jsonc" ]]; then
    run cp "$SOURCE_JSONC" "$TARGET_BASE/opencode.jsonc"
    log "Copied opencode.jsonc"
  elif [[ -f "$TARGET_BASE/opencode.jsonc" ]]; then
    log "Skipping opencode.jsonc (already present in $TARGET_BASE/)"
  fi
fi

if [[ -f "$SOURCE_DIR/profile-models.json" ]]; then
  run cp "$SOURCE_DIR/profile-models.json" "$TARGET_BASE/profile-models.json"
  log "Copied profile-models.json"
fi

# Copy AGENTS.md from framework/AGENTS.md
if [[ -f "$SOURCE_AGENTS_MD" ]]; then
  if [[ "$MODE" == "project" ]]; then
    run cp "$SOURCE_AGENTS_MD" "$PROJECT_ROOT/AGENTS.md"
    log "Installed AGENTS.md to $PROJECT_ROOT/"
  elif [[ "$MODE" == "global" ]]; then
    run cp "$SOURCE_AGENTS_MD" "$TARGET_BASE/AGENTS.md"
    log "Installed AGENTS.md to $TARGET_BASE/"
  fi
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  printf '[dry-run] write %s\n' "$INSTALL_ROOT/.oowl.json"
else
  node --input-type=commonjs - "$TARGET_BASE" "$INSTALL_ROOT" "$MODE" "$PACKAGE_VERSION" <<'NODE'
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const [, , openCodeDir, installRoot, mode, version] = process.argv;

function collectChecksums(dir, base = dir, result = {}) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectChecksums(full, base, result);
    } else if (stat.isFile()) {
      const rel = path.relative(base, full).split(path.sep).join("/");
      result[rel] = crypto
        .createHash("sha256")
        .update(fs.readFileSync(full))
        .digest("hex");
    }
  }
  return result;
}

const now = new Date().toISOString();
const data = {
  version,
  location: mode === "global" ? "global" : "local",
  profile: "balanced",
  opencodeGo: true,
  installedAt: now,
  updatedAt: now,
  checksums: collectChecksums(openCodeDir),
};

fs.writeFileSync(
  path.join(installRoot, ".oowl.json"),
  JSON.stringify(data, null, 2) + "\n",
  "utf8",
);
NODE
  log "Wrote metadata: $INSTALL_ROOT/.oowl.json"
fi

log "Done."
log ""
log "Next steps:"
log "  1. Apply a model profile:"
log "       OPENCODE_DIR='$TARGET_BASE' bash '$REPO_DIR/scripts/apply-profile-models.sh' balanced"
log "  2. Open the project in OpenCode and verify agents load."
