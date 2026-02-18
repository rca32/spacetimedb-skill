#!/usr/bin/env bash
set -euo pipefail

MANIFEST_PATH="${1:-web-client/public/assets/manifest.json}"
ASSET_ROOT="${2:-web-client/public}"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "manifest not found: $MANIFEST_PATH" >&2
  exit 1
fi
if [[ ! -d "$ASSET_ROOT" ]]; then
  echo "asset root not found: $ASSET_ROOT" >&2
  exit 1
fi

node - "$MANIFEST_PATH" "$ASSET_ROOT" <<'NODE'
const fs = require('node:fs')
const path = require('node:path')

const manifestPath = process.argv[2]
const assetRoot = process.argv[3]
const json = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

let replaced = 0

function maybeReplacePath(value) {
  if (typeof value !== 'string') return value
  if (!value.toLowerCase().endsWith('.fbx')) return value

  const candidate = value.replace(/\.fbx$/i, '.glb')
  const rel = candidate.startsWith('/') ? candidate.slice(1) : candidate
  const abs = path.join(assetRoot, rel)
  if (!fs.existsSync(abs)) {
    return value
  }
  replaced += 1
  return candidate
}

function walk(node) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      node[i] = walk(node[i])
    }
    return node
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      node[key] = walk(node[key])
    }
    return node
  }
  return maybeReplacePath(node)
}

walk(json)
fs.writeFileSync(manifestPath, JSON.stringify(json, null, 2) + '\n')
console.log(`manifest patched: ${manifestPath} replaced=${replaced}`)
NODE
