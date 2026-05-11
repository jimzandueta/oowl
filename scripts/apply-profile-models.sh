#!/usr/bin/env bash
set -euo pipefail

# Auto-detect the framework directory. Order:
#   1. $OPENCODE_DIR if set
#   2. ./opencode (repo source-of-truth)
#   3. ./.opencode (project install)
#   4. ~/.config/opencode (global install)
ROOT_DIR="${2:-.}"
detect_framework_dir() {
  if [[ -n "${OPENCODE_DIR:-}" && -d "$OPENCODE_DIR" ]]; then
    echo "$OPENCODE_DIR"; return
  fi
  for candidate in "$ROOT_DIR/framework" "$ROOT_DIR/opencode" "$ROOT_DIR/.opencode" "$HOME/.config/opencode"; do
    if [[ -d "$candidate/agents" ]]; then
      echo "$candidate"; return
    fi
  done
  echo ""
}

FRAMEWORK_DIR="$(detect_framework_dir)"
if [[ -z "$FRAMEWORK_DIR" ]]; then
  echo "Could not locate framework directory." >&2
  echo "Looked for: \$OPENCODE_DIR, ./opencode, ./.opencode, ~/.config/opencode" >&2
  exit 1
fi

INPUT="${1:-$FRAMEWORK_DIR/profile-models.json}"

# Accept shorthand profile names: low, balanced, high, provider-agnostic.
case "$INPUT" in
  low|balanced|high|provider-agnostic)
    PROFILE_JSON="$FRAMEWORK_DIR/model-profiles/$INPUT.json"
    ;;
  *)
    PROFILE_JSON="$INPUT"
    ;;
esac

AGENTS_DIR="$FRAMEWORK_DIR/agents"
MODEL_STRATEGY="$FRAMEWORK_DIR/prompts/shared/model-strategy.md"
OPENCODE_JSONC="$ROOT_DIR/opencode.jsonc"
ACTIVE_PROFILE="$FRAMEWORK_DIR/profile-models.json"

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Missing file: $1" >&2
    exit 1
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    echo "Install it first. On macOS: brew install $1" >&2
    exit 1
  fi
}

require_cmd jq
require_file "$PROFILE_JSON"
# opencode.jsonc is optional (e.g. global install at ~/.config/opencode has no jsonc here).
HAS_OPENCODE_JSONC=0
if [[ -f "$OPENCODE_JSONC" ]]; then
  HAS_OPENCODE_JSONC=1
fi

if [[ ! -d "$AGENTS_DIR" ]]; then
  echo "Missing agents directory: $AGENTS_DIR" >&2
  exit 1
fi

# Resolve an agent name (e.g. "dispatcher") to its file path. Agents live in
# class subfolders under $AGENTS_DIR (for example 01-orchestration/dispatcher.md),
# so we search recursively. Multiple matches are an error.
resolve_agent_file() {
  local name="$1"
  local matches
  matches=$(find "$AGENTS_DIR" -type f -name "$name.md" 2>/dev/null)
  local count
  count=$(printf '%s\n' "$matches" | sed '/^$/d' | wc -l | tr -d ' ')
  if [[ "$count" -eq 0 ]]; then
    echo ""
    return 1
  fi
  if [[ "$count" -gt 1 ]]; then
    echo "Multiple agent files found for '$name':" >&2
    printf '%s\n' "$matches" >&2
    return 2
  fi
  printf '%s' "$matches"
}

PROFILE_NAME="$(jq -r '.profile' "$PROFILE_JSON")"
PROFILE_DESCRIPTION="$(jq -r '.description // ""' "$PROFILE_JSON")"

echo "Applying model profile: $PROFILE_NAME"
echo "Profile source: $PROFILE_JSON"

# Use declared agent_order when available; otherwise use sorted agent keys.
AGENTS=()
if jq -e '.agent_order' "$PROFILE_JSON" >/dev/null 2>&1; then
  while IFS= read -r line; do AGENTS+=("$line"); done < <(jq -r '.agent_order[]' "$PROFILE_JSON")
else
  while IFS= read -r line; do AGENTS+=("$line"); done < <(jq -r '.agents | keys[]' "$PROFILE_JSON")
fi

# Validate mapped agents.
for agent in "${AGENTS[@]}"; do
  agent_file="$(resolve_agent_file "$agent")" || true
  if [[ -z "$agent_file" ]]; then
    echo "Model map references missing agent file: $agent.md (searched recursively under $AGENTS_DIR)" >&2
    exit 1
  fi

  model="$(jq -r --arg agent "$agent" '.agents[$agent].model // empty' "$PROFILE_JSON")"
  if [[ -z "$model" ]]; then
    echo "Missing model for agent: $agent" >&2
    exit 1
  fi
done

# Update model line in each agent frontmatter.
for agent in "${AGENTS[@]}"; do
  agent_file="$(resolve_agent_file "$agent")"
  model="$(jq -r --arg agent "$agent" '.agents[$agent].model' "$PROFILE_JSON")"

  if ! grep -q '^model:' "$agent_file"; then
    echo "Agent file has no model line: $agent_file" >&2
    exit 1
  fi

  tmp="$(mktemp)"
  awk -v new_model="$model" '
    BEGIN { in_frontmatter = 0; replaced = 0 }
    NR == 1 && $0 == "---" { in_frontmatter = 1; print; next }
    in_frontmatter && $0 == "---" { in_frontmatter = 0; print; next }
    in_frontmatter && $0 ~ /^model:/ && replaced == 0 {
      print "model: " new_model
      replaced = 1
      next
    }
    { print }
  ' "$agent_file" > "$tmp"

  mv "$tmp" "$agent_file"
  echo "Updated $agent -> $model"
done

# Warn if any model values look like semantic placeholders (provider-agnostic profile).
placeholder_hits=()
for agent in "${AGENTS[@]}"; do
  model="$(jq -r --arg agent "$agent" '.agents[$agent].model' "$PROFILE_JSON")"
  case "$model" in
    cheap-fast|mid-balanced|premium-deep)
      placeholder_hits+=("$agent -> $model")
      ;;
  esac
done
if [[ ${#placeholder_hits[@]} -gt 0 ]]; then
  echo
  echo "Warning: provider-agnostic placeholder model names detected."
  echo "These are not real models. Map them in opencode.jsonc or substitute concrete model identifiers per agent."
  echo "See: .opencode/prompts/shared/model-mapping.md"
  for hit in "${placeholder_hits[@]}"; do
    echo "  - $hit"
  done
fi

# Update global settings in opencode.jsonc when present.
global_model="$(jq -r '.global.model // empty' "$PROFILE_JSON")"
small_model="$(jq -r '.global.small_model // empty' "$PROFILE_JSON")"
default_agent="$(jq -r '.global.default_agent // empty' "$PROFILE_JSON")"

if [[ "$HAS_OPENCODE_JSONC" -eq 1 ]]; then
  tmp="$(mktemp)"
  cp "$OPENCODE_JSONC" "$tmp"

  if [[ -n "$global_model" ]]; then
    perl -0pi -e 's#"model"\s*:\s*"[^"]+"#"model": "'"$global_model"'"#' "$tmp"
  fi

  if [[ -n "$small_model" ]]; then
    perl -0pi -e 's#"small_model"\s*:\s*"[^"]+"#"small_model": "'"$small_model"'"#' "$tmp"
  fi

  if [[ -n "$default_agent" ]]; then
    perl -0pi -e 's#"default_agent"\s*:\s*"[^"]+"#"default_agent": "'"$default_agent"'"#' "$tmp"
  fi

  mv "$tmp" "$OPENCODE_JSONC"
  echo "Updated opencode.jsonc global model settings"
else
  echo "Skipping opencode.jsonc update (not present at $OPENCODE_JSONC)"
fi

# Regenerate model-strategy.md from the selected JSON map.
mkdir -p "$(dirname "$MODEL_STRATEGY")"

{
  echo "# Model Strategy"
  echo
  echo "Profile: \`$PROFILE_NAME\`"
  echo
  if [[ -n "$PROFILE_DESCRIPTION" && "$PROFILE_DESCRIPTION" != "null" ]]; then
    echo "$PROFILE_DESCRIPTION"
    echo
  fi

  echo "This file is generated from:"
  echo
  echo '```text'
  echo "$PROFILE_JSON"
  echo '```'
  echo
  echo "Do not edit model assignments here directly. Update a JSON profile and run:"
  echo
  echo '```bash'
  echo "scripts/apply-profile-models.sh <low|balanced|high|provider-agnostic|path-to-json>"
  echo '```'
  echo
  echo "This script updates runtime agent frontmatter and this strategy file. It does not update \`AGENTS.md\`."
  echo

  echo "## Global Settings"
  echo
  echo "| Setting | Value |"
  echo "|---|---|"
  echo "| model | \`${global_model:-unchanged}\` |"
  echo "| small_model | \`${small_model:-unchanged}\` |"
  echo "| default_agent | \`${default_agent:-unchanged}\` |"
  echo

  echo "## Agent Model Map"
  echo
  echo "| Agent | Model | Reason |"
  echo "|---|---|---|"

  for agent in "${AGENTS[@]}"; do
    model="$(jq -r --arg agent "$agent" '.agents[$agent].model' "$PROFILE_JSON")"
    reason="$(jq -r --arg agent "$agent" '.agents[$agent].reason // ""' "$PROFILE_JSON")"
    reason="${reason//$'\n'/ }"
    echo "| \`$agent\` | \`$model\` | $reason |"
  done

  echo
  echo "## Runtime Rule"
  echo
  echo "The runtime source of truth is each agent file frontmatter:"
  echo
  echo '```text'
  echo ".opencode/agents/<agent>.md"
  echo '```'
  echo
  echo "The selected JSON profile is materialized into those frontmatter blocks by:"
  echo
  echo '```bash'
  echo "scripts/apply-profile-models.sh"
  echo '```'
} > "$MODEL_STRATEGY"

# Save selected profile as active profile.
cp "$PROFILE_JSON" "$ACTIVE_PROFILE"
echo "Updated active profile: $ACTIVE_PROFILE"

echo
echo "Final runtime model assignments:"
find "$AGENTS_DIR" -type f -name '*.md' -exec grep -H '^model:' {} \; | sort

echo
echo "Done."
