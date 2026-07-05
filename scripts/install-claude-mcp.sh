#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd "$(dirname "$0")/.." && pwd)

SERVER_NAME=${DEBURAPY_MCP_NAME:-deburapy}
DEBURAPY_URL=${DEBURAPY_URL:-http://127.0.0.1:8787}
DEBURAPY_ROOM_ID=${DEBURAPY_ROOM_ID:-default}
DEBURAPY_PARTICIPANT_ID=${DEBURAPY_PARTICIPANT_ID:-companion}

find_binary() {
  name=$1
  shift

  if command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
    return 0
  fi

  for candidate in "$@"; do
    if [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

NODE_BIN=${NODE_BIN:-}
if [ -z "$NODE_BIN" ]; then
  NODE_BIN=$(find_binary node \
    "$HOME/.local/bin/node" \
    /opt/homebrew/bin/node \
    /usr/local/bin/node) || {
      echo "Node.js 20+ is required. Install Node, then rerun this script." >&2
      exit 1
    }
fi

CLAUDE_BIN=${CLAUDE_BIN:-}
if [ -z "$CLAUDE_BIN" ]; then
  CLAUDE_BIN=$(find_binary claude \
    "$HOME/.local/bin/claude" \
    /opt/homebrew/bin/claude \
    /usr/local/bin/claude) || {
      echo "Claude Code CLI is required for this installer." >&2
      exit 1
    }
fi

if [ "${DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS:-}" = "1" ]; then
  "$CLAUDE_BIN" mcp add \
    --env "DEBURAPY_URL=$DEBURAPY_URL" \
    --env "DEBURAPY_ROOM_ID=$DEBURAPY_ROOM_ID" \
    --env "DEBURAPY_PARTICIPANT_ID=$DEBURAPY_PARTICIPANT_ID" \
    --env "DEBURAPY_CLAUDE_CHANNEL_NOTIFICATIONS=1" \
    --transport stdio "$SERVER_NAME" \
    -- "$NODE_BIN" "$ROOT_DIR/src/mcp-server.mjs"
else
  "$CLAUDE_BIN" mcp add \
    --env "DEBURAPY_URL=$DEBURAPY_URL" \
    --env "DEBURAPY_ROOM_ID=$DEBURAPY_ROOM_ID" \
    --env "DEBURAPY_PARTICIPANT_ID=$DEBURAPY_PARTICIPANT_ID" \
    --transport stdio "$SERVER_NAME" \
    -- "$NODE_BIN" "$ROOT_DIR/src/mcp-server.mjs"
fi

"$CLAUDE_BIN" mcp get "$SERVER_NAME"
