#!/bin/bash
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
  echo "Warning: Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY environment variable is set."
  echo "The server will start, but requests will require an API key in the request header unless a default key is set later."
fi
java -cp out com.promptforge.Main
