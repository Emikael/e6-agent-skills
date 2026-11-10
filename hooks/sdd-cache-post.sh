#!/bin/bash
# sdd-cache-post.sh — PostToolUse hook for WebFetch.
#
# After WebFetch, stores the response body in the per-user cache as <sha>.json
# with the current ETag / Last-Modified captured via a HEAD request so the
# pre hook can revalidate on the next fetch.
#
# Keyed by URL. The caller's prompt is stored as metadata (not part of the
# key) so a future cache hit can show what question produced the cached
# reading. Entries without ETag or Last-Modified are not cached.
#
# Dependencies: jq, curl, shasum (or sha256sum).

set -euo pipefail

command -v jq   >/dev/null 2>&1 || exit 0
command -v curl >/dev/null 2>&1 || exit 0
command -v shasum >/dev/null 2>&1 || command -v sha256sum >/dev/null 2>&1 || exit 0

if [ -t 0 ]; then INPUT="{}"; else INPUT=$(cat); fi

# Cache key is sha256 of its input, truncated to 128 bits.
hash_key() {
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$1" | shasum -a 256 | cut -c1-32
  else
    printf '%s' "$1" | sha256sum | cut -c1-32
  fi
}

# The cache lives in per-user storage, one directory per project, never inside
# the project: a repo could ship planted entries there. SDD_CACHE_DIR
# overrides the location (tests use it).
PROJECT_DIR=$(cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null && pwd -P) || PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
CACHE_DIR="${SDD_CACHE_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/e6-agent-skills/sdd-cache/$(hash_key "$PROJECT_DIR")}"

# Debug logging: active when SDD_CACHE_DEBUG=1 is set, or when a sentinel
# file exists at $CACHE_DIR/.debug. Toggle with `touch` / `rm`.
dbg() {
  [ "${SDD_CACHE_DEBUG:-0}" = "1" ] || [ -f "$CACHE_DIR/.debug" ] || return 0
  (umask 077; mkdir -p "$CACHE_DIR")
  printf '%s [post] %s\n' "$(date -u +%FT%TZ)" "$*" >> "$CACHE_DIR/.debug.log"
}
dbg "fired, input=$(printf '%s' "$INPUT" | head -c 400)"

URL=$(printf '%s'    "$INPUT" | jq -r '.tool_input.url    // empty' 2>/dev/null || true)
PROMPT=$(printf '%s' "$INPUT" | jq -r '.tool_input.prompt // empty' 2>/dev/null || true)
if [ -z "$URL" ]; then dbg "no url in tool_input, exit"; exit 0; fi
dbg "url=$URL prompt=$(printf '%s' "$PROMPT" | head -c 80)"
# Only plain web URLs: never let curl read file:// or other schemes, and never
# let a URL that starts with "-" be read as a curl option.
case "$URL" in
  http://*|https://*) ;;
  *) dbg "not an http(s) url, exit"; exit 0 ;;
esac

# WebFetch tool_response shape (Claude Code as of 2026-04): an object with
# keys bytes, code, codeText, durationMs, result, url — content lives at
# .result. The other keys (.output / .text / .content / .body) are kept as
# defensive fallbacks in case the shape changes; jq returns empty if none
# match. The string branch handles older/custom integrations.
TOOL_RESPONSE_TYPE=$(printf '%s' "$INPUT" | jq -r '.tool_response | type' 2>/dev/null || echo "unknown")
dbg "tool_response type=$TOOL_RESPONSE_TYPE keys=$(printf '%s' "$INPUT" | jq -r 'try (.tool_response | keys | join(",")) catch "n/a"' 2>/dev/null)"

CONTENT=$(printf '%s' "$INPUT" | jq -r '
  if (.tool_response | type) == "object" then
    (.tool_response.result
     // .tool_response.output
     // .tool_response.text
     // .tool_response.content
     // .tool_response.body
     // empty)
  elif (.tool_response | type) == "string" then
    .tool_response
  else
    empty
  end
' 2>/dev/null || true)

if [ -z "$CONTENT" ]; then
  dbg "could not extract content from tool_response, exit (shape unknown)"
  exit 0
fi
dbg "extracted content bytes=${#CONTENT}"


(umask 077; mkdir -p "$CACHE_DIR")
CACHE_FILE="$CACHE_DIR/$(hash_key "$URL").json"

# Capture validators from the origin. Follow redirects so they match the
# URL the agent actually talked to. Strip CR so awk's paragraph mode
# recognises blank separators between response blocks on a redirect chain.
HEAD_OUT=$(curl -sI -L --max-time 5 --proto '=http,https' --proto-redir '=http,https' "$URL" 2>/dev/null | tr -d '\r' || true)

# Take only the final response's headers (last paragraph) to avoid picking
# up validators from intermediate 301/302 hops.
FINAL_HEADERS=$(printf '%s' "$HEAD_OUT" | awk '
  BEGIN { RS = ""; last = "" }
  { last = $0 }
  END { print last }
')

extract_header() {
  local name="$1"
  printf '%s' "$FINAL_HEADERS" | awk -v h="$name" '
    BEGIN { FS = ":" }
    tolower($1) == tolower(h) {
      sub(/^[^:]*:[ \t]*/, "")
      sub(/[ \t]+$/, "")
      print
      exit
    }
  '
}

ETAG=$(extract_header "ETag")
LAST_MOD=$(extract_header "Last-Modified")
dbg "HEAD etag=$ETAG last_modified=$LAST_MOD"

if [ -z "$ETAG" ] && [ -z "$LAST_MOD" ]; then
  dbg "no validator from origin, removing any stale entry and exit"
  rm -f "$CACHE_FILE"
  exit 0
fi

NOW=$(date +%s)

TMP="${CACHE_FILE}.$$.tmp"
# The body goes through stdin, not --arg: Linux caps a single argument at
# 128 KiB, so a large page passed as an argument would fail to cache.
if printf '%s' "$CONTENT" | jq -Rs \
  --arg url           "$URL" \
  --arg prompt        "$PROMPT" \
  --arg etag          "$ETAG" \
  --arg last_modified "$LAST_MOD" \
  --argjson fetched_at "$NOW" \
  '{url: $url, prompt: $prompt, etag: $etag, last_modified: $last_modified, content: ., fetched_at: $fetched_at}' \
  > "$TMP"
then
  mv "$TMP" "$CACHE_FILE"
  dbg "wrote cache file $CACHE_FILE"
else
  rm -f "$TMP"
  dbg "jq failed, temp cleaned"
fi

exit 0
