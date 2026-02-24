import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

const repoRoot = resolve(process.cwd())
const projectRoot = repoRoot
const sourceRoot = resolve(projectRoot, '..')
const publicRoot = resolve(projectRoot, 'public')
const manifestRoot = resolve(projectRoot, 'assets/manifest')
const lockPath = join(manifestRoot, 'asset_manifest_v2.json')

const PROFILE_CORE = 'core-only'
const PROFILE_FEATURE = 'core-plus-feature'

const PROFILE_PACKS = {
  [PROFILE_CORE]: [
    {
      key: 'building-kit',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/building-kit'),
      target: resolve(publicRoot, 'props/kenney/building-kit'),
      category: 'buildings',
      licenseId: 'kenney-building-license',
      profileTags: ['core'],
    },
    {
      key: 'nature-kit',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/nature-kit'),
      target: resolve(publicRoot, 'props/kenney/nature-kit'),
      category: 'nature',
      licenseId: 'kenney-nature-license',
      profileTags: ['core'],
    },
    {
      key: 'fantasy-town-kit',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/fantasy-town-kit'),
      target: resolve(publicRoot, 'props/kenney/fantasy-town-kit'),
      category: 'environment',
      licenseId: 'kenney-fantasy-license',
      profileTags: ['core'],
    },
    {
      key: 'castle-kit',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/castle-kit'),
      target: resolve(publicRoot, 'props/kenney/castle-kit'),
      category: 'environment',
      licenseId: 'kenney-castle-license',
      profileTags: ['core'],
    },
    {
      key: 'blocky-characters',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/blocky-characters'),
      target: resolve(publicRoot, 'props/kenney/blocky-characters'),
      category: 'characters',
      licenseId: 'kenney-character-license',
      profileTags: ['core'],
    },
    {
      key: 'audio-normalized',
      source: resolve(sourceRoot, 'assetdirectory/audio/normalized'),
      target: resolve(publicRoot, 'audio/kenney/normalized'),
      category: 'audio',
      licenseId: 'kenney-audio-license',
      profileTags: ['core'],
    },
    {
      key: 'ui-common',
      source: resolve(sourceRoot, 'assetdirectory/audio/normalized/sfx/ui_sounds_50_sounds'),
      target: resolve(publicRoot, 'ui/kenney/ui-common'),
      category: 'ui',
      licenseId: 'kenney-ui-license',
      profileTags: ['core'],
    },
  ],
  [PROFILE_FEATURE]: [
    {
      key: 'modular-dungeon-kit',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/modular-dungeon-kit'),
      target: resolve(publicRoot, 'props/kenney/modular-dungeon-kit'),
      category: 'dungeon',
      licenseId: 'kenney-dungeon-license',
      profileTags: ['feature'],
    },
    {
      key: 'graveyard-kit',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/graveyard-kit'),
      target: resolve(publicRoot, 'props/kenney/graveyard-kit'),
      category: 'environment',
      licenseId: 'kenney-graveyard-license',
      profileTags: ['feature'],
    },
    {
      key: 'survival-kit',
      source: resolve(sourceRoot, 'assetdirectory/pack/kenney/survival-kit'),
      target: resolve(publicRoot, 'props/kenney/survival-kit'),
      category: 'props',
      licenseId: 'kenney-survival-license',
      profileTags: ['feature'],
    },
  ],
}

const cliArgs = new Set(process.argv.slice(2))
const command = cliArgs.has('sync') ? 'sync' : cliArgs.has('verify') ? 'verify' : 'help'
const strict = cliArgs.has('--strict')
const profile =
  (cliArgs.has('--profile') && cliArgs.values().next().value && getProfileArg()) || PROFILE_CORE

function getProfileArg() {
  const index = process.argv.findIndex((item) => item === '--profile')
  if (index >= 0) {
    return process.argv[index + 1]
  }
  return PROFILE_CORE
}

if (command === 'help') {
  printUsage()
  process.exit(0)
}

const configPacks = profile === PROFILE_FEATURE ? [...PROFILE_PACKS[PROFILE_CORE], ...PROFILE_PACKS[PROFILE_FEATURE]] : PROFILE_PACKS[PROFILE_CORE]

const manifest = {
  generatedAt: new Date().toISOString(),
  generatedBy: 'stitch-orillusion-clientv2 asset-copy',
  sourceRoot: relative(projectRoot, sourceRoot),
  targetRoot: relative(projectRoot, publicRoot),
  profile,
  artifacts: [],
}

if (command === 'sync') {
  syncAssets(configPacks, manifest)
  writeManifest(manifest)
  writeLicenseSnapshot(manifest)
  process.exit(0)
}

if (command === 'verify') {
  const ok = verifyAssets(manifest, strict)
  if (!ok) {
    process.exit(1)
  }
  process.exit(0)
}

function printUsage() {
  console.log('Usage:')
  console.log('  node scripts/copy-kenney-assets.mjs sync --profile core-only')
  console.log('  node scripts/copy-kenney-assets.mjs sync --profile core-plus-feature')
  console.log('  node scripts/copy-kenney-assets.mjs verify --strict')
}

function syncAssets(packs, manifestRef) {
  for (const pack of packs) {
    if (!existsSync(pack.source)) {
      console.warn(`[copy] skip missing: ${pack.source}`)
      continue
    }

    if (strict && existsSync(resolve(pack.target, '..')) === false) {
      mkdirSync(dirname(pack.target), { recursive: true })
    }

    mkdirSync(dirname(pack.target), { recursive: true })
    cpSync(pack.source, pack.target, { recursive: true, force: true })

    const files = collectFiles(pack.target)
    for (const file of files) {
      if (!file.stats.isFile()) {
        continue
      }
      if (isSymlink(file.path)) {
        console.warn(`[copy] skip symlink: ${file.path}`)
        continue
      }

      const relPath = relative(pack.target, file.path)
      const srcPath = resolve(pack.source, relPath)
      const sha = sha256(file.path)
      manifestRef.artifacts.push({
        asset_id: `${pack.key}:${relative(pack.target, file.path)}`,
        src_path: relative(projectRoot, srcPath),
        dst_path: relative(projectRoot, file.path),
        bytes: file.stats.size,
        pack: pack.key,
        category: pack.category,
        license_id: pack.licenseId,
        profile_tags: [...pack.profileTags],
        sha256: sha,
      })
    }
    console.log(`[copy] ok: ${relative(projectRoot, pack.source)} -> ${relative(projectRoot, pack.target)}`)
  }
}

function verifyAssets(prevManifest, isStrict) {
  let ok = true
  if (!existsSync(lockPath)) {
    console.error(`[verify] missing manifest: ${lockPath}`)
    return false
  }

  const onDiskManifest = JSON.parse(readFileSync(lockPath, 'utf8'))
  const records = onDiskManifest.artifacts ?? []
  for (const row of records) {
    const abs = resolve(projectRoot, row.dst_path)
    if (!existsSync(abs)) {
      console.error(`[verify] missing artifact: ${row.dst_path}`)
      ok = false
      continue
    }
    if (isSymlink(abs)) {
      console.error(`[verify] symlink artifact: ${row.dst_path}`)
      ok = false
      continue
    }

    const stat = statSync(abs)
    if (stat.size !== row.bytes) {
      console.error(`[verify] byte mismatch: ${row.dst_path}`)
      if (isStrict) {
        ok = false
      }
    }

    const hash = sha256(abs)
    if (hash !== row.sha256) {
      console.error(`[verify] hash mismatch: ${row.dst_path}`)
      if (isStrict) {
        ok = false
      }
    }
  }

  console.log(`[verify] ok=${ok}`)
  return ok
}

function collectFiles(rootPath) {
  if (!existsSync(rootPath)) {
    return []
  }
  const entries = [rootPath]
  const output = []

  const stack = [rootPath]
  while (stack.length > 0) {
    const current = stack.pop()
    const stat = statSync(current)
    if (stat.isDirectory()) {
      for (const child of readdirSync(current)) {
        stack.push(join(current, child))
      }
    } else {
      output.push({ path: current, stats: stat })
    }
  }

  return output
}

function isSymlink(path) {
  try {
    return statSync(path).isSymbolicLink()
  } catch {
    return false
  }
}

function sha256(path) {
  const buffer = readFileSync(path)
  return createHash('sha256').update(buffer).digest('hex')
}

function writeManifest(currentManifest) {
  mkdirSync(manifestRoot, { recursive: true })
  writeFileSync(lockPath, JSON.stringify(currentManifest, null, 2))
}

function writeLicenseSnapshot(currentManifest) {
  const path = join(manifestRoot, 'license_snapshot_v2.json')
  const data = {
    generatedAt: currentManifest.generatedAt,
    source: currentManifest.sourceRoot,
    profile,
    entries: currentManifest.artifacts.map((artifact) => ({
      asset_id: artifact.asset_id,
      license_id: artifact.license_id,
      category: artifact.category,
    })),
  }
  writeFileSync(path, JSON.stringify(data, null, 2))
}
