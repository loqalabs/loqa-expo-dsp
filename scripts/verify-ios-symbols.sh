#!/bin/bash

# verify-ios-symbols.sh
# Verifies that all FFI symbols declared in RustBridge.swift are exported by the XCFramework
#
# This script prevents the issue where Swift FFI declarations exist but the
# corresponding Rust functions aren't compiled into the static library.
#
# Usage: ./scripts/verify-ios-symbols.sh
# Exit codes:
#   0 - All symbols verified
#   1 - Missing symbols detected
#   2 - Required files not found

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SWIFT_BRIDGE="$PROJECT_ROOT/ios/RustFFI/RustBridge.swift"
XCFRAMEWORK="$PROJECT_ROOT/ios/RustFFI/LoqaVoiceDSP.xcframework"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== iOS Symbol Verification ==="
echo ""

# Check that required files exist
if [[ ! -f "$SWIFT_BRIDGE" ]]; then
    echo -e "${RED}ERROR: RustBridge.swift not found at: $SWIFT_BRIDGE${NC}"
    exit 2
fi

if [[ ! -d "$XCFRAMEWORK" ]]; then
    echo -e "${RED}ERROR: XCFramework not found at: $XCFRAMEWORK${NC}"
    echo -e "${YELLOW}Hint: Run 'cd rust && ./build-ios.sh' to build the XCFramework${NC}"
    exit 2
fi

# Find the static library in the XCFramework
# Check both simulator and device slices
SIMULATOR_LIB="$XCFRAMEWORK/ios-arm64_x86_64-simulator/libloqa_voice_dsp.a"
DEVICE_LIB="$XCFRAMEWORK/ios-arm64/libloqa_voice_dsp.a"

if [[ ! -f "$SIMULATOR_LIB" ]] && [[ ! -f "$DEVICE_LIB" ]]; then
    echo -e "${RED}ERROR: No static library found in XCFramework${NC}"
    echo "Expected locations:"
    echo "  - $SIMULATOR_LIB"
    echo "  - $DEVICE_LIB"
    exit 2
fi

# Use whichever library exists (prefer simulator for local dev on Mac)
if [[ -f "$SIMULATOR_LIB" ]]; then
    STATIC_LIB="$SIMULATOR_LIB"
else
    STATIC_LIB="$DEVICE_LIB"
fi

echo "Swift bridge: $SWIFT_BRIDGE"
echo "Static library: $STATIC_LIB"
echo ""

# Extract @_silgen_name declarations from Swift
# These are the symbols Swift expects to find in the Rust library
echo "Extracting expected symbols from RustBridge.swift..."
EXPECTED_SYMBOLS=$(grep -oE '@_silgen_name\("[^"]+"\)' "$SWIFT_BRIDGE" | \
    sed 's/@_silgen_name("\([^"]*\)")/\1/' | \
    sort -u)

if [[ -z "$EXPECTED_SYMBOLS" ]]; then
    echo -e "${YELLOW}WARNING: No @_silgen_name declarations found in RustBridge.swift${NC}"
    exit 0
fi

echo "Expected symbols:"
echo "$EXPECTED_SYMBOLS" | sed 's/^/  - /'
echo ""

# Extract exported symbols from static library
# nm -gU shows global (exported) symbols, T = text (code) section
echo "Extracting exported symbols from XCFramework..."
EXPORTED_SYMBOLS=$(nm -gU "$STATIC_LIB" 2>/dev/null | \
    grep " T _" | \
    awk '{print $3}' | \
    sed 's/^_//' | \
    sort -u)

# Verify each expected symbol exists
echo "Verifying symbols..."
echo ""

MISSING_SYMBOLS=""
FOUND_COUNT=0
MISSING_COUNT=0

for symbol in $EXPECTED_SYMBOLS; do
    if echo "$EXPORTED_SYMBOLS" | grep -q "^${symbol}$"; then
        echo -e "  ${GREEN}✓${NC} $symbol"
        ((FOUND_COUNT++))
    else
        echo -e "  ${RED}✗${NC} $symbol ${RED}(MISSING)${NC}"
        MISSING_SYMBOLS="$MISSING_SYMBOLS $symbol"
        ((MISSING_COUNT++))
    fi
done

echo ""
echo "=== Results ==="
echo "Found: $FOUND_COUNT symbols"
echo "Missing: $MISSING_COUNT symbols"

if [[ $MISSING_COUNT -gt 0 ]]; then
    echo ""
    echo -e "${RED}ERROR: Missing symbols detected!${NC}"
    echo ""
    echo "The following symbols are declared in RustBridge.swift but not exported"
    echo "by the Rust static library:"
    echo ""
    for symbol in $MISSING_SYMBOLS; do
        echo "  - $symbol"
    done
    echo ""
    echo "To fix this issue:"
    echo "  1. Ensure the Rust functions are defined with #[no_mangle] and pub extern \"C\""
    echo "  2. Rebuild the XCFramework: cd rust && ./build-ios.sh"
    echo "  3. Re-run this script to verify"
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}All symbols verified successfully!${NC}"
    exit 0
fi
