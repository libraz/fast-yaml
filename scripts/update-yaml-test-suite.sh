#!/bin/bash
# Update YAML Test Suite script
# This script updates the YAML Test Suite from the official repository

set -e

# Configuration
YAML_TEST_SUITE_REPO="https://github.com/yaml/yaml-test-suite.git"
YAML_TEST_SUITE_DIR="test/yaml-test-suite"
TEMP_DIR="$(mktemp -d)"

echo "Updating YAML Test Suite..."

# Check if the directory already exists as a git repository
if [ -d "$YAML_TEST_SUITE_DIR/.git" ]; then
    echo "Updating existing YAML Test Suite repository..."
    cd "$YAML_TEST_SUITE_DIR"
    git pull
    cd -
else
    # Clone the repository
    echo "Cloning YAML Test Suite repository..."
    if [ -d "$YAML_TEST_SUITE_DIR" ]; then
        rm -rf "$YAML_TEST_SUITE_DIR"
    fi
    git clone "$YAML_TEST_SUITE_REPO" "$YAML_TEST_SUITE_DIR"
fi

# Remove unnecessary files but keep license
echo "Cleaning up unnecessary files..."
find "$YAML_TEST_SUITE_DIR" -name ".git*" -exec rm -rf {} \; 2>/dev/null || true
rm -rf "$YAML_TEST_SUITE_DIR/bin" 2>/dev/null || true
rm -rf "$YAML_TEST_SUITE_DIR/doc" 2>/dev/null || true
rm -rf "$YAML_TEST_SUITE_DIR/data" 2>/dev/null || true
rm -rf "$YAML_TEST_SUITE_DIR/test" 2>/dev/null || true

# Keep only src directory, License and ReadMe.md
echo "Keeping only necessary files..."
find "$YAML_TEST_SUITE_DIR" -type f -not -path "*/src/*" -not -name "License" -not -name "ReadMe.md" -exec rm -f {} \; 2>/dev/null || true

# Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "YAML Test Suite updated successfully!"
