#!/bin/bash
# Supabase Documentation Search Script
# Usage: ./search-docs.sh <topic> [category]

DOCS_DIR="./docs/supabase"

if [ -z "$1" ]; then
  echo "Usage: $0 <search-term> [category]"
  echo "Categories: auth, database, storage, realtime, functions, ai, cli, platform, security"
  exit 1
fi

SEARCH_TERM="$1"
CATEGORY="${2:-}"

if [ -n "$CATEGORY" ]; then
  SEARCH_PATH="$DOCS_DIR/guides/$CATEGORY"
else
  SEARCH_PATH="$DOCS_DIR/guides"
fi

echo "Searching for '$SEARCH_TERM' in $SEARCH_PATH..."
echo "=========================================="

# Search with context
grep -r -i -B 2 -A 5 "$SEARCH_TERM" "$SEARCH_PATH" --include="*.txt" | head -100

echo ""
echo "=========================================="
echo "Files containing '$SEARCH_TERM':"
grep -r -l -i "$SEARCH_TERM" "$SEARCH_PATH" --include="*.txt"
