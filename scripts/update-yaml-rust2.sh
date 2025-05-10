#!/bin/bash

# This script updates the vendored yaml-rust2 library
# It clones the latest version of yaml-rust2, removes unnecessary files,
# and copies the source code to the third_party directory

set -e

# Configuration
# Use the correct repository URL
YAML_RUST2_REPO="https://github.com/Ethiraric/yaml-rust2.git"
YAML_RUST2_BRANCH="master"
TEMP_DIR="./tmp-yaml-rust2"
TARGET_DIR="./third_party/yaml-rust2"

# Clean up any existing temporary directory
if [ -d "$TEMP_DIR" ]; then
  echo "Cleaning up existing temporary directory..."
  rm -rf "$TEMP_DIR"
fi

# Create temporary directory
mkdir -p "$TEMP_DIR"

echo "Cloning yaml-rust2 repository..."
git clone --depth 1 --branch $YAML_RUST2_BRANCH $YAML_RUST2_REPO $TEMP_DIR

echo "Copying source files to $TARGET_DIR..."
mkdir -p $TARGET_DIR/src
cp -r $TEMP_DIR/src/* $TARGET_DIR/src/
cp $TEMP_DIR/Cargo.toml $TARGET_DIR/
# Copy LICENSE file if it exists
if [ -f $TEMP_DIR/LICENSE ]; then
  cp $TEMP_DIR/LICENSE $TARGET_DIR/
elif [ -f $TEMP_DIR/LICENSE.md ]; then
  cp $TEMP_DIR/LICENSE.md $TARGET_DIR/
fi
# Copy README if it exists
if [ -f $TEMP_DIR/README.md ]; then
  cp $TEMP_DIR/README.md $TARGET_DIR/
fi

# Clean up temporary directory
echo "Cleaning up..."
rm -rf $TEMP_DIR

echo "Done! yaml-rust2 has been updated in $TARGET_DIR"
