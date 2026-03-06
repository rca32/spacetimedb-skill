import type { Logger } from '../infra/logger'
import type { AssetBundle } from '../runtime/types'
import { parseCsv } from './csv'

export interface LicenseInfo {
  sourcePack: string
  reviewStatus: string
  attributionRequired: string
  notes: string
}

export interface EnvironmentAssetEntry {
  id: string
  bundle: 'core' | 'optional'
  sourcePack: string
  logicalCategory: string
  targetPath: string
  license: string
  notes: string
  licenseInfo: LicenseInfo | null
}

export interface CharacterAssetEntry {
  id: string
  bundle: 'core' | 'optional'
  sourcePack: string
  role: string
  targetPath: string
  license: string
  licenseInfo: LicenseInfo | null
}

export interface AudioAssetEntry {
  id: string
  bundle: 'core' | 'optional'
  sourcePack: string
  usage: string
  targetPath: string
  license: string
  licenseInfo: LicenseInfo | null
}

export interface AssetCatalogs {
  environment: EnvironmentAssetEntry[]
  characters: CharacterAssetEntry[]
  audio: AudioAssetEntry[]
  pendingReviewAssetCount: number
}

export class AssetCatalogLoader {
  constructor(
    private readonly bundle: AssetBundle,
    private readonly allowUnreviewedAssets: boolean,
    private readonly logger: Logger,
  ) {}

  async load(): Promise<AssetCatalogs> {
    const [environmentCsv, characterCsv, audioCsv, licenseCsv] = await Promise.all([
      this.fetchText('/manifests/bevy_asset_copy_manifest.csv'),
      this.fetchText('/manifests/bevy_character_copy_manifest.csv'),
      this.fetchText('/manifests/bevy_audio_copy_manifest.csv'),
      this.fetchText('/manifests/license_attribution_matrix.csv'),
    ])

    const licenses = buildLicenseMap(parseCsv(licenseCsv))
    const environment = parseCsv(environmentCsv)
      .map((row) => toEnvironmentEntry(row, licenses))
      .filter((entry): entry is EnvironmentAssetEntry => entry !== null)
      .filter((entry) => this.allowEntry(entry.bundle, entry.licenseInfo))

    const characters = parseCsv(characterCsv)
      .map((row) => toCharacterEntry(row, licenses))
      .filter((entry): entry is CharacterAssetEntry => entry !== null)
      .filter((entry) => this.allowEntry(entry.bundle, entry.licenseInfo))

    const audio = parseCsv(audioCsv)
      .map((row) => toAudioEntry(row, licenses))
      .filter((entry): entry is AudioAssetEntry => entry !== null)
      .filter((entry) => this.allowEntry(entry.bundle, entry.licenseInfo))

    const pendingReviewAssetCount =
      countPending(environment) + countPending(characters) + countPending(audio)

    this.logger.info('asset catalog loaded', {
      environment: environment.length,
      characters: characters.length,
      audio: audio.length,
      pendingReviewAssetCount,
      bundle: this.bundle,
      allowUnreviewedAssets: this.allowUnreviewedAssets,
    })

    return {
      environment,
      characters,
      audio,
      pendingReviewAssetCount,
    }
  }

  private allowEntry(bundle: 'core' | 'optional', licenseInfo: LicenseInfo | null): boolean {
    if (this.bundle === 'core' && bundle !== 'core') {
      return false
    }
    if (this.bundle === 'optional' && bundle !== 'optional') {
      return false
    }
    if (licenseInfo && !this.allowUnreviewedAssets && licenseInfo.reviewStatus !== 'verified') {
      return false
    }
    return true
  }

  private async fetchText(path: string): Promise<string> {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to load asset manifest ${path}: ${response.status}`)
    }
    return response.text()
  }
}

export function pickPlayerCharacter(catalogs: AssetCatalogs): CharacterAssetEntry | null {
  return (
    catalogs.characters.find((entry) => entry.role.includes('player')) ??
    catalogs.characters.find((entry) => entry.bundle === 'core') ??
    null
  )
}

export function pickNpcCharacter(catalogs: AssetCatalogs, seed = 0): CharacterAssetEntry | null {
  const npcEntries = catalogs.characters.filter((entry) => entry.role.includes('npc'))
  if (npcEntries.length === 0) {
    return pickPlayerCharacter(catalogs)
  }
  const index = Math.abs(seed) % npcEntries.length
  return npcEntries[index] ?? npcEntries[0] ?? null
}

export function pickEnvironmentByCategory(
  catalogs: AssetCatalogs,
  category: string,
  seed = 0,
): EnvironmentAssetEntry | null {
  const matches = catalogs.environment.filter((entry) => entry.logicalCategory === category)
  if (matches.length === 0) {
    return catalogs.environment[0] ?? null
  }
  const index = Math.abs(seed) % matches.length
  return matches[index] ?? matches[0] ?? null
}

export function pickAudioByUsage(catalogs: AssetCatalogs, usagePrefix: string): AudioAssetEntry[] {
  return catalogs.audio.filter((entry) => entry.usage.startsWith(usagePrefix))
}

function buildLicenseMap(rows: Record<string, string>[]): Map<string, LicenseInfo> {
  const map = new Map<string, LicenseInfo>()
  for (const row of rows) {
    const sourcePack = normalizeSourcePack(row.source_pack ?? '', row.upstream_reference ?? '', row.notes ?? '')
    if (!sourcePack) {
      continue
    }
    map.set(sourcePack, {
      sourcePack,
      reviewStatus: (row.review_status ?? '').trim().toLowerCase() || 'unknown',
      attributionRequired: (row.attribution_required ?? '').trim().toLowerCase(),
      notes: row.notes ?? '',
    })
  }
  return map
}

function toEnvironmentEntry(
  row: Record<string, string>,
  licenses: Map<string, LicenseInfo>,
): EnvironmentAssetEntry | null {
  if (!row.asset_id || !row.target_path) {
    return null
  }
  const targetPath = toRuntimePath(row.target_path)
  return {
    id: row.asset_id,
    bundle: normalizeBundle(row.bundle),
    sourcePack: row.source_pack ?? '',
    logicalCategory: targetPath.split('/')[2] ?? 'misc',
    targetPath,
    license: row.license ?? '',
    notes: row.notes ?? '',
    licenseInfo: licenses.get(normalizeSourcePack(row.source_pack ?? '', row.target_path ?? '', row.notes ?? '')) ?? null,
  }
}

function toCharacterEntry(
  row: Record<string, string>,
  licenses: Map<string, LicenseInfo>,
): CharacterAssetEntry | null {
  if (!row.char_id || !row.target_path) {
    return null
  }
  const targetPath = toRuntimePath(row.target_path)
  return {
    id: row.char_id,
    bundle: normalizeBundle(row.bundle),
    sourcePack: row.source_pack ?? '',
    role: row.role ?? '',
    targetPath,
    license: row.license ?? '',
    licenseInfo: licenses.get(normalizeSourcePack(row.source_pack ?? '', row.target_path ?? '', row.role ?? '')) ?? null,
  }
}

function toAudioEntry(
  row: Record<string, string>,
  licenses: Map<string, LicenseInfo>,
): AudioAssetEntry | null {
  if (!row.audio_id || !row.target_path) {
    return null
  }
  const targetPath = toRuntimePath(row.target_path)
  return {
    id: row.audio_id,
    bundle: normalizeBundle(row.bundle),
    sourcePack: row.source_pack ?? '',
    usage: row.usage ?? '',
    targetPath,
    license: row.license ?? '',
    licenseInfo: licenses.get(normalizeSourcePack(row.source_pack ?? '', row.target_path ?? '', row.usage ?? '')) ?? null,
  }
}

function normalizeBundle(value: string): 'core' | 'optional' {
  return value === 'optional' ? 'optional' : 'core'
}

function normalizePackName(value: string): string {
  return value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase()
}

function normalizeSourcePack(value: string, targetPath: string, detail: string): string {
  const normalized = normalizePackName(value)
  const alias: Record<string, string> = {
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
  }
  if (alias[normalized]) {
    return alias[normalized]
  }
  if (normalized === 'threejs_examples') {
    const composite = `${targetPath} ${detail}`.toLowerCase()
    return composite.includes('robotexpressive') ? 'threejs_robot_expressive' : 'threejs_xbot'
  }
  return normalized
}

function toRuntimePath(value: string): string {
  const normalized = value.replace(/\\/g, '/')
  const stripped = normalized.replace(/^bevy-client\//, '')
  return `/${stripped}`
}

function countPending(entries: Array<{ licenseInfo: LicenseInfo | null }>): number {
  return entries.filter((entry) => entry.licenseInfo && entry.licenseInfo.reviewStatus !== 'verified').length
}
