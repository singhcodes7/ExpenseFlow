#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies and build
npm install
npm run build