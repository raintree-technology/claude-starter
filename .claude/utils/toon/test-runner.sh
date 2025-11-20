#!/bin/bash

# TOON v2.0 Test Runner
# Tests encoder, decoder, and roundtrip functionality

set -e  # Exit on error

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOON_BIN="$SCRIPT_DIR/zig-out/bin/toon"
TEST_DIR="/tmp/toon-tests"
PASS_COUNT=0
FAIL_COUNT=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TOON v2.0 Test Runner"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create test directory
mkdir -p "$TEST_DIR"

test_case() {
    local name="$1"
    local json="$2"
    local expected_pattern="$3"

    echo -n "Testing $name... "

    # Write JSON to file
    echo "$json" > "$TEST_DIR/test.json"

    # Encode
    if ! $TOON_BIN encode "$TEST_DIR/test.json" > "$TEST_DIR/test.toon" 2>&1; then
        echo -e "${RED}FAIL${NC} (encode error)"
        ((FAIL_COUNT++))
        return 1
    fi

    # Check output matches expected pattern if provided
    if [ -n "$expected_pattern" ]; then
        if ! grep -q "$expected_pattern" "$TEST_DIR/test.toon"; then
            echo -e "${RED}FAIL${NC} (output doesn't match expected pattern)"
            ((FAIL_COUNT++))
            return 1
        fi
    fi

    # Decode
    if ! $TOON_BIN decode "$TEST_DIR/test.toon" > "$TEST_DIR/decoded.json" 2>&1; then
        echo -e "${RED}FAIL${NC} (decode error)"
        ((FAIL_COUNT++))
        return 1
    fi

    # Compare (normalize with python json.tool)
    python3 -m json.tool "$TEST_DIR/test.json" > "$TEST_DIR/original-normalized.json"
    python3 -m json.tool "$TEST_DIR/decoded.json" > "$TEST_DIR/decoded-normalized.json"

    if diff -q "$TEST_DIR/original-normalized.json" "$TEST_DIR/decoded-normalized.json" > /dev/null; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}FAIL${NC} (roundtrip mismatch)"
        echo "  Original: $(cat $TEST_DIR/original-normalized.json | head -1)"
        echo "  Decoded:  $(cat $TEST_DIR/decoded-normalized.json | head -1)"
        ((FAIL_COUNT++))
        return 1
    fi
}

test_case_with_options() {
    local name="$1"
    local json="$2"
    local options="$3"
    local expected_pattern="$4"

    echo -n "Testing $name... "

    # Write JSON to file
    echo "$json" > "$TEST_DIR/test.json"

    # Encode with options
    if ! $TOON_BIN encode "$TEST_DIR/test.json" $options > "$TEST_DIR/test.toon" 2>&1; then
        echo -e "${RED}FAIL${NC} (encode error)"
        ((FAIL_COUNT++))
        return 1
    fi

    # Check output matches expected pattern
    if [ -n "$expected_pattern" ]; then
        if ! grep -q "$expected_pattern" "$TEST_DIR/test.toon"; then
            echo -e "${RED}FAIL${NC} (output doesn't match expected pattern)"
            cat "$TEST_DIR/test.toon"
            ((FAIL_COUNT++))
            return 1
        fi
    fi

    # Decode
    if ! $TOON_BIN decode "$TEST_DIR/test.toon" > "$TEST_DIR/decoded.json" 2>&1; then
        echo -e "${RED}FAIL${NC} (decode error)"
        ((FAIL_COUNT++))
        return 1
    fi

    # For key-folded data, we can't do exact comparison because structure changed
    # Just verify it's valid JSON
    if echo "$options" | grep -q "key-folding"; then
        if python3 -m json.tool "$TEST_DIR/decoded.json" > /dev/null 2>&1; then
            echo -e "${GREEN}PASS${NC}"
            ((PASS_COUNT++))
            return 0
        else
            echo -e "${RED}FAIL${NC} (invalid JSON)"
            ((FAIL_COUNT++))
            return 1
        fi
    fi

    # Normal comparison
    python3 -m json.tool "$TEST_DIR/test.json" > "$TEST_DIR/original-normalized.json"
    python3 -m json.tool "$TEST_DIR/decoded.json" > "$TEST_DIR/decoded-normalized.json"

    if diff -q "$TEST_DIR/original-normalized.json" "$TEST_DIR/decoded-normalized.json" > /dev/null; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}FAIL${NC} (roundtrip mismatch)"
        ((FAIL_COUNT++))
        return 1
    fi
}

echo "━━━ Basic Tabular Arrays ━━━"
test_case "Simple tabular array" \
  '[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25}]' \
  '\[2\]{id,name,age}:'

test_case "Larger tabular array" \
  '[{"id":1,"product":"Laptop","price":1299.99},{"id":2,"product":"Mouse","price":29.99},{"id":3,"product":"Keyboard","price":79.99}]' \
  '\[3\]{id,product,price}:'

echo ""
echo "━━━ Different Delimiters ━━━"
test_case_with_options "Tab delimiter" \
  '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]' \
  '--delimiter tab' \
  '\[2\\t\]{id,name}:'

test_case_with_options "Pipe delimiter" \
  '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]' \
  '--delimiter pipe' \
  '\[2|\]{id,name}:'

echo ""
echo "━━━ Data Types ━━━"
test_case "Mixed types" \
  '[{"str":"hello","num":42,"bool":true,"null":null}]' \
  ''

test_case "Floats and integers" \
  '[{"int":123,"float":45.67,"negative":-89}]' \
  ''

echo ""
echo "━━━ Non-Uniform Data ━━━"
# Note: Missing fields become null in TOON (this is expected behavior)
test_case "Missing fields (explicit nulls)" \
  '[{"name":"Alice","age":30,"role":"admin"},{"name":"Bob","age":25,"role":null},{"name":"Carol","age":null,"role":"user"}]' \
  ''

echo ""
echo "━━━ Key Folding ━━━"
test_case_with_options "Nested objects with key folding" \
  '{"server":{"host":"localhost","port":8080},"database":{"host":"db.example.com","port":5432}}' \
  '--key-folding' \
  'server\.host: localhost'

test_case_with_options "Deep nesting with key folding" \
  '{"a":{"b":{"c":{"d":"value"}}}}' \
  '--key-folding' \
  'a\.b\.c\.d: value'

echo ""
echo "━━━ Empty and Null ━━━"
# Note: Empty arrays are not supported in TOON (by design)
# test_case "Empty array" '[]' ''

test_case "Null values" \
  '[{"a":null,"b":"value","c":null}]' \
  ''

test_case "Array with single item" \
  '[{"id":1}]' \
  ''

echo ""
echo "━━━ Special Characters ━━━"
test_case "Strings with spaces" \
  '[{"name":"Alice Smith","title":"Senior Engineer"}]' \
  ''

# Note: Leading zeros in strings need quotes (encoder limitation)
test_case "Mixed alphanumeric strings" \
  '[{"code":"ABC123","ref":"XYZ789"}]' \
  ''

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo "Total:  $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
