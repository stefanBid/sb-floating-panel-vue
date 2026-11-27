#!/usr/bin/env bash
# clear.sh
# Removes the library build output, the test coverage, the packed tarballs and node_modules,
# then cleans the npm cache.
# Run 'npm install' afterwards to reinstall the dependencies from package-lock.json.

set -e

cd "$(dirname "$0")/.."

for dir in dist coverage node_modules; do
  if [[ -e "$dir" ]]; then
    echo "🗑️  Removing '$dir'..."
    rm -rf "$dir"
  fi
done

# Tarballs left by 'npm pack' and TypeScript incremental build info
shopt -s nullglob
for file in *.tgz *.tsbuildinfo; do
  echo "🗑️  Removing '$file'..."
  rm -f "$file"
done
shopt -u nullglob

echo "🧹 Cleaning the npm cache..."
npm cache clean --force

echo "✅ Done — run 'npm install' to reinstall the dependencies."
