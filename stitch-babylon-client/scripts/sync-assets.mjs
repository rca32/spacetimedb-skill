import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)), '..')
const appRoot = resolve(repoRoot, 'stitch-babylon-client')
const publicRoot = resolve(appRoot, 'public')
const manifestDir = resolve(repoRoot, 'docs', 'manifests')

const cliArgs = new Map(
  process.argv.slice(2).map((value) => {
    const [key, ...rest] = value.split('=')
    return [key, rest.join('=')]
  }),
)

const bundleFilter = cliArgs.get('--bundle') ?? 'core'
const copyOptional = bundleFilter === 'optional' || bundleFilter === 'all'
const copyCore = bundleFilter === 'core' || bundleFilter === 'all'

const manifestNames = [
  'bevy_asset_copy_manifest.csv',
  'bevy_character_copy_manifest.csv',
  'bevy_audio_copy_manifest.csv',
  'license_attribution_matrix.csv',
]

const licenseRows = parseCsv(await readFile(resolve(manifestDir, 'license_attribution_matrix.csv'), 'utf8'))
const licenseByPack = new Map(licenseRows.map((row) => [normalizePackName(row.source_pack ?? ''), row]))

const copied = []
const warnings = []

await mkdir(join(publicRoot, 'manifests'), { recursive: true })

for (const manifestName of manifestNames) {
  const source = resolve(manifestDir, manifestName)
  const destination = join(publicRoot, 'manifests', manifestName)
  await copyFile(source, destination)
}

for (const manifestName of [
  'bevy_asset_copy_manifest.csv',
  'bevy_character_copy_manifest.csv',
  'bevy_audio_copy_manifest.csv',
]) {
  const rows = parseCsv(await readFile(resolve(manifestDir, manifestName), 'utf8'))
  for (const row of rows) {
    const bundle = (row.bundle ?? '').trim().toLowerCase()
    if ((bundle === 'core' && !copyCore) || (bundle === 'optional' && !copyOptional)) {
      continue
    }

    const sourcePath = row.source_path
    const targetPath = row.target_path
    if (!sourcePath || !targetPath) {
      warnings.push(`skip invalid row in ${manifestName}: missing source_path/target_path`)
      continue
    }

    const source = resolve(repoRoot, sourcePath)
    const target = resolve(publicRoot, stripBevyPrefix(targetPath))
    await mkdir(dirname(target), { recursive: true })
    await copyFile(source, target)
    copied.push(stripBevyPrefix(targetPath))

    const sourcePack = normalizeSourcePack(row.source_pack ?? '', targetPath)
    const licenseRow = licenseByPack.get(sourcePack)
    if (!licenseRow) {
      warnings.push(`license row missing for pack ${row.source_pack ?? '(empty)'} -> ${targetPath}`)
      continue
    }

    const reviewStatus = (licenseRow.review_status ?? '').trim().toLowerCase()
    if (reviewStatus && reviewStatus !== 'verified') {
      warnings.push(`review status ${reviewStatus} for ${targetPath}`)
    }
  }
}

await writeFile(
  join(publicRoot, 'manifests', 'sync-summary.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      bundleFilter,
      copiedCount: copied.length,
      copied,
      warnings,
    },
    null,
    2,
  ),
)

console.log(`[assets:sync] copied ${copied.length} files with ${warnings.length} warnings`)
for (const warning of warnings) {
  console.warn(`[assets:sync] ${warning}`)
}

function stripBevyPrefix(value) {
  return value.replace(/^bevy-client[\\/]/, '')
}

function normalizePackName(value) {
  return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase()
}

function normalizeSourcePack(value, targetPath) {
  const normalized = normalizePackName(value)
  const alias = {
    castle: 'kenney_castle_kit',
    building: 'kenney_building_kit',
    modular: 'kenney_modular_buildings',
    nature: 'kenney_nature_kit',
    kenney_blocky: 'kenney_blocky_characters',
    music_pack1_track_1: 'oga_music_pack1_tracks',
    music_pack1_track_2: 'oga_music_pack1_tracks',
    music_pack1_track_3: 'oga_music_pack1_tracks',
    music_pack1_track_4: 'oga_music_pack1_tracks',
    rpg_sounds_50_sounds: 'oga_rpg_sounds_50_sounds',
    '100_cc0_sfx_0': 'oga_100_cc0_sfx_0',
    ui_sounds_50_sounds: 'oga_ui_sounds_50_sounds',
    '100_cc0_wood_metal_sfx': 'oga_100_cc0_wood_metal_sfx',
    '25_cc0_mud_sfx': 'oga_25_cc0_mud_sfx',
  }[normalized]
  if (alias) {
    return alias
  }
  if (normalized === 'threejs_examples') {
    return targetPath.toLowerCase().includes('robotexpressive') ? 'threejs_robot_expressive' : 'threejs_xbot'
  }
  return normalized
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return []
  }
  const headers = splitCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row = {}
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = cells[index] ?? ''
    }
    return row
  })
}

function splitCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"') {
      if (quoted && next === '"') {
        current += '"'
        index += 1
        continue
      }
      quoted = !quoted
      continue
    }
    if (char === ',' && !quoted) {
      cells.push(current)
      current = ''
      continue
    }
    current += char
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}
