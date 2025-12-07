#!/bin/bash
# Quick type-safety check for Swift files
# Looks for common FFI mismatches between RustBridge and Module

set -e

echo "Checking Swift type consistency..."

# Extract wrapper function signatures from RustBridge.swift
echo "=== RustBridge.swift function returns ==="
grep -E "^public func.*Wrapper" ios/RustFFI/RustBridge.swift | head -10

# Extract calls to wrapper functions in LoqaExpoDspModule.swift
echo ""
echo "=== LoqaExpoDspModule.swift wrapper calls ==="
grep -E "try.*Wrapper\(" ios/LoqaExpoDspModule.swift | head -10

# Check for optional types being passed without unwrapping
echo ""
echo "=== Potential optional issues (variables ending in ?) ==="
grep -n "Wrapper.*:.*[a-zA-Z]\+)" ios/LoqaExpoDspModule.swift | grep -v "//" || echo "None found"

echo ""
echo "Done. Review above for mismatches."
