#!/usr/bin/env bash
# Enforce TOON format in documentation files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="${SCRIPT_DIR}/../../docs/toon"
TOON_BIN="${SCRIPT_DIR}/zig-out/bin/toon"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build Zig binary if not exists
if [[ ! -f "$TOON_BIN" ]]; then
    echo -e "${YELLOW}Building TOON encoder/decoder...${NC}"
    cd "$SCRIPT_DIR"
    zig build -Doptimize=ReleaseFast
    cd - > /dev/null
    echo -e "${GREEN}✓ Built TOON binary${NC}"
fi

# Find all JSON code blocks in markdown files
enforce_in_file() {
    local file="$1"
    local changed=false

    echo "Checking: $file"

    # Extract JSON code blocks and check if they should use TOON
    # This is a simplified check - looks for [...]  array patterns

    # Create temp file for processing
    local tmpfile=$(mktemp)
    cp "$file" "$tmpfile"

    # Look for JSON arrays in code blocks
    local in_json_block=false
    local json_content=""
    local line_num=0

    while IFS= read -r line; do
        ((line_num++))

        if [[ "$line" =~ ^\`\`\`json ]]; then
            in_json_block=true
            json_content=""
            continue
        fi

        if [[ "$in_json_block" == true ]]; then
            if [[ "$line" =~ ^\`\`\` ]]; then
                # End of JSON block - check if should use TOON
                if [[ -n "$json_content" ]]; then
                    echo "$json_content" > /tmp/toon_check.json

                    if "$TOON_BIN" check /tmp/toon_check.json 2>/dev/null; then
                        echo -e "  ${YELLOW}⚠ Line $line_num: JSON array should use TOON format${NC}"
                        echo "    Suggested conversion:"
                        "$TOON_BIN" encode /tmp/toon_check.json | head -n 10
                        echo ""
                        changed=true
                    fi
                fi

                in_json_block=false
                json_content=""
            else
                json_content+="$line"$'\n'
            fi
        fi
    done < "$file"

    rm -f "$tmpfile" /tmp/toon_check.json

    if [[ "$changed" == true ]]; then
        return 1
    fi
    return 0
}

# Main execution
echo -e "${GREEN}Enforcing TOON format in documentation...${NC}"
echo ""

total_files=0
files_with_suggestions=0

while IFS= read -r file; do
    ((total_files++))
    if ! enforce_in_file "$file"; then
        ((files_with_suggestions++))
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Checked $total_files files"
if [[ $files_with_suggestions -gt 0 ]]; then
    echo -e "${YELLOW}⚠ $files_with_suggestions file(s) have JSON that should use TOON${NC}"
    echo ""
    echo "To auto-convert, run:"
    echo "  $0 --fix"
    exit 1
else
    echo -e "${GREEN}✓ All documentation uses appropriate formats${NC}"
    exit 0
fi
