#!/bin/bash

# verify-android-symbols.sh
# Verifies that all JNI symbols declared in RustBridge.kt are exported by the Android .so files
#
# This script prevents the issue where Kotlin JNI declarations exist but the
# corresponding Rust functions aren't compiled into the shared library.
#
# Usage: ./scripts/verify-android-symbols.sh
# Exit codes:
#   0 - All symbols verified
#   1 - Missing symbols detected
#   2 - Required files not found

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

KOTLIN_BRIDGE="$PROJECT_ROOT/android/src/main/java/com/loqalabs/loqaaudiodsp/RustJNI/RustBridge.kt"
JNI_LIBS_DIR="$PROJECT_ROOT/android/src/main/jniLibs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Android Symbol Verification ==="
echo ""

# Check that required files exist
if [[ ! -f "$KOTLIN_BRIDGE" ]]; then
    echo -e "${RED}ERROR: RustBridge.kt not found at: $KOTLIN_BRIDGE${NC}"
    exit 2
fi

if [[ ! -d "$JNI_LIBS_DIR" ]]; then
    echo -e "${RED}ERROR: jniLibs directory not found at: $JNI_LIBS_DIR${NC}"
    echo -e "${YELLOW}Hint: Run 'cd rust && ./build-android.sh' to build the Android libraries${NC}"
    exit 2
fi

# Find any .so file to check symbols (arm64-v8a preferred)
SO_FILE=""
for arch in arm64-v8a armeabi-v7a x86_64 x86; do
    candidate="$JNI_LIBS_DIR/$arch/libloqa_voice_dsp.so"
    if [[ -f "$candidate" ]]; then
        SO_FILE="$candidate"
        break
    fi
done

if [[ -z "$SO_FILE" ]]; then
    echo -e "${RED}ERROR: No libloqa_voice_dsp.so found in jniLibs${NC}"
    echo "Expected locations:"
    echo "  - $JNI_LIBS_DIR/arm64-v8a/libloqa_voice_dsp.so"
    echo "  - $JNI_LIBS_DIR/armeabi-v7a/libloqa_voice_dsp.so"
    exit 2
fi

echo "Kotlin bridge: $KOTLIN_BRIDGE"
echo "Shared library: $SO_FILE"
echo ""

# Extract external fun declarations from Kotlin
# These map to JNI symbols: Java_<package>_<class>_<method>
echo "Extracting expected JNI methods from RustBridge.kt..."

# Get all 'external fun native*' declarations and convert to expected JNI symbol names
# Package: com.loqalabs.loqaexpodsp.RustJNI
# Class: RustBridge (object)
# JNI format: Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_<methodName>
# Note: [A-Za-z0-9]+ to capture method names like nativeCalculateH1H2
EXPECTED_METHODS=$(grep -E "external fun native[A-Za-z0-9]+" "$KOTLIN_BRIDGE" | \
    sed -E 's/.*external fun (native[A-Za-z0-9]+).*/\1/' | \
    sort -u)

if [[ -z "$EXPECTED_METHODS" ]]; then
    echo -e "${YELLOW}WARNING: No external fun declarations found in RustBridge.kt${NC}"
    exit 0
fi

# Convert method names to JNI symbol names
JNI_PREFIX="Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_"
EXPECTED_SYMBOLS=""
for method in $EXPECTED_METHODS; do
    EXPECTED_SYMBOLS="$EXPECTED_SYMBOLS ${JNI_PREFIX}${method}"
done

echo "Expected JNI symbols:"
for method in $EXPECTED_METHODS; do
    echo "  - ${JNI_PREFIX}${method}"
done
echo ""

# Extract exported symbols from shared library
# nm -D shows dynamic symbols, T = text (code) section
echo "Extracting exported symbols from .so file..."
EXPORTED_SYMBOLS=$(nm -D "$SO_FILE" 2>/dev/null | \
    grep " T " | \
    awk '{print $3}' | \
    sort -u)

# Verify each expected symbol exists
echo "Verifying symbols..."
echo ""

MISSING_SYMBOLS=""
FOUND_COUNT=0
MISSING_COUNT=0

for method in $EXPECTED_METHODS; do
    symbol="${JNI_PREFIX}${method}"
    if echo "$EXPORTED_SYMBOLS" | grep -q "^${symbol}$"; then
        echo -e "  ${GREEN}✓${NC} $method"
        ((FOUND_COUNT++))
    else
        echo -e "  ${RED}✗${NC} $method ${RED}(MISSING)${NC}"
        MISSING_SYMBOLS="$MISSING_SYMBOLS $method"
        ((MISSING_COUNT++))
    fi
done

echo ""
echo "=== Results ==="
echo "Found: $FOUND_COUNT JNI methods"
echo "Missing: $MISSING_COUNT JNI methods"

if [[ $MISSING_COUNT -gt 0 ]]; then
    echo ""
    echo -e "${RED}ERROR: Missing JNI symbols detected!${NC}"
    echo ""
    echo "The following methods are declared in RustBridge.kt but not exported"
    echo "by the Rust shared library:"
    echo ""
    for method in $MISSING_SYMBOLS; do
        echo "  - $method"
        echo "    Expected symbol: ${JNI_PREFIX}${method}"
    done
    echo ""
    echo "To fix this issue:"
    echo "  1. Ensure the Rust JNI functions are defined with #[no_mangle] and the correct name"
    echo "  2. Rebuild the Android libraries: cd rust && ./build-android.sh"
    echo "  3. Re-run this script to verify"
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}All JNI symbols verified successfully!${NC}"
    exit 0
fi
