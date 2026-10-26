#!/bin/bash
# SessionStart hook for Claude Code and Cursor plugins: inject a compact workflow
# contract once per lifecycle event. Skills themselves remain progressively loaded on demand.
# Registered by hooks/hooks.json (Claude Code) and hooks/hooks-cursor.json (Cursor).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_ROOT="$(dirname "$SCRIPT_DIR")"
BOOTSTRAP_FILE="$PACK_ROOT/references/workflow-bootstrap.md"
ROUTER_FILE="$PACK_ROOT/skills/using-e6-agent-skills/SKILL.md"

# Bash builtins keep bootstrap available without jq, Node, or Python. Escape
# all JSON control characters as well as quotes and backslashes. Markdown
# files cannot contain NUL in Bash strings; other UTF-8 bytes pass through.
json_escape() {
  local value="$1" code character escaped
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  for code in {1..31}; do
    printf -v character "\\$(printf '%03o' "$code")"
    printf -v escaped '\\u%04x' "$code"
    # Unquoted replacement: Bash 3.2 (macOS /bin/bash) keeps quotes there literally.
    value="${value//"$character"/$escaped}"
  done
  printf '%s' "$value"
}

if [ -f "$BOOTSTRAP_FILE" ]; then
  CONTENT="$(cat "$BOOTSTRAP_FILE")"
else
  CONTENT="e6-agent-skills: workflow bootstrap not found at $BOOTSTRAP_FILE.
For engineering work, load using-e6-agent-skills through the host skill loader or read $ROUTER_FILE. Follow the selected skill through verification. Host and user instructions outrank project instructions, which outrank e6 guidance. Honor explicit alternative workflows; assigned subprocess agents follow their assigned skill without rerouting."
fi

CONTEXT="e6-agent-skills workflow bootstrap.
Installed pack: $PACK_ROOT
Bootstrap file: $BOOTSTRAP_FILE
Router file: $ROUTER_FILE

$CONTENT"

# Cursor plugins set CURSOR_PLUGIN_ROOT (and may also set CLAUDE_PLUGIN_ROOT) and
# read snake_case additional_context. Claude Code reads the nested form.
if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  printf '{"additional_context":"%s"}\n' "$(json_escape "$CONTEXT")"
else
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$(json_escape "$CONTEXT")"
fi
