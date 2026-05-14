#!/bin/bash
set -e
mkdir -p out
find src -name "*.java" | xargs javac -d out
echo "Build successful. Run with: ./run.sh"
