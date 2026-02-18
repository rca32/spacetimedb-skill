import {
  buildPathDebugQueries,
  buildTerrainPayloadAoiQuery,
  buildWorldAoiQueries,
  hashQueries,
} from '../net/aoi'
import { WorldStreamingRenderer, type CharacterActionSlot } from '../render/world-streaming'
import { IsLocalPlayer, Rotation } from '../core/traits'
import { ThirdPersonCameraController } from './third-person-camera'
import { RuntimeContext, RuntimeModule } from './types'
import {
  clearWorld,
  findLocalSession,
  normalizeIdentityHex,
  readTerrainChunkSize,
  shouldReanchorAoi,
  snapActorPresentationToTerrain,
  syncBuildingState,
  syncClaims,
  syncNpcState,
  syncPathResults,
  syncPathSteps,
  syncResourceState,
  syncTerrainChunkPayloads,
  syncTerrainChunks,
  syncTransformState,
  type KnownKeyMap,
} from './world-systems'
import { toKeyString } from './world-systems/common'

const AOI_SUBSCRIPTION_KEY = 'world-aoi'
const AOI_TERRAIN_PAYLOAD_SUBSCRIPTION_KEY = 'world-aoi-terrain-payload'
const AOI_PATH_DEBUG_SUBSCRIPTION_KEY = 'world-path-debug'
const TERRAIN_RADIUS_CHUNKS = Number.parseInt(import.meta.env.VITE_TERRAIN_RADIUS_CHUNKS ?? '2', 10)
const DYNAMIC_RADIUS_CHUNKS = Number.parseInt(import.meta.env.VITE_DYNAMIC_RADIUS_CHUNKS ?? '1', 10)
const COMBAT_LIMIT = Number.parseInt(import.meta.env.VITE_COMBAT_LIMIT ?? '300', 10)
const DEFAULT_CHUNK_SIZE = 32
const DEFAULT_WORLD_DIMENSION_ID = Number.parseInt(import.meta.env.VITE_WORLD_DIMENSION_ID ?? '1', 10)
const ENABLE_WORLD_AOI_SUBSCRIPTION = (import.meta.env.VITE_ENABLE_WORLD_AOI_SUB ?? '1') === '1'
const ENABLE_TERRAIN_PAYLOAD_SUBSCRIPTION = (import.meta.env.VITE_ENABLE_TERRAIN_PAYLOAD_SUB ?? '1') === '1'
const ENABLE_PATH_DEBUG_OVERLAY_SUBSCRIPTION = (import.meta.env.VITE_DEBUG_PATH_OVERLAY ?? '0') === '1'
const AOI_UPDATE_MIN_INTERVAL_MS = 500
const MAX_TRACKED_ANIMATION_EVENTS = 1024

type CombatStateRow = {
  identity: unknown
  lastAttackClientTsMs: bigint
}

type AttackOutcomeRow = {
  outcomeId: string
  attackerIdentity: unknown
  targetIdentity: unknown
  hit: boolean
  targetHpAfter: number
}

type CharacterActionEventDetail = {
  identityHex?: string
  action?: string
}

export function createWorldRuntime(): RuntimeModule {
  const knownKeys: KnownKeyMap = new Map()
  let streaming: WorldStreamingRenderer | null = null
  let cameraController: ThirdPersonCameraController | null = null
  let currentAoiHash = ''
  let currentTerrainPayloadAoiHash = ''
  let currentPathDebugHash = ''
  let localRegionId: bigint | null = null
  let localDimensionId = Number.isFinite(DEFAULT_WORLD_DIMENSION_ID) && DEFAULT_WORLD_DIMENSION_ID > 0
    ? DEFAULT_WORLD_DIMENSION_ID
    : 1
  let localPosition = { x: 0, y: 0, z: 0 }
  let aoiAnchorPosition = { x: 0, z: 0 }
  let lastAoiUpdateAtMs = 0
  let lastConnectionActive = false
  let terrainChunkSize = DEFAULT_CHUNK_SIZE
  const seenAttackOutcomes = new Set<string>()
  const lastAttackTsByIdentity = new Map<string, string>()
  const pendingCharacterActions: Array<{ identityHex: string; slot: CharacterActionSlot }> = []
  let onCharacterActionEvent: ((event: Event) => void) | null = null

  return {
    name: 'WorldRuntime',
    start(ctx: RuntimeContext) {
      streaming = new WorldStreamingRenderer(ctx.renderer.scene, ctx.renderer.materials)
      cameraController = new ThirdPersonCameraController()
      onCharacterActionEvent = (event) => {
        const detail = (event as CustomEvent<CharacterActionEventDetail>).detail
        const slot = actionSlotFromEvent(detail?.action)
        const identityHex = normalizeIdentityHex(detail?.identityHex ?? null)
        if (!slot || !identityHex) {
          return
        }
        pendingCharacterActions.push({ identityHex, slot })
        trimArray(pendingCharacterActions, MAX_TRACKED_ANIMATION_EVENTS)
      }
      window.addEventListener('stitch:character-action', onCharacterActionEvent as EventListener)
      ctx.logger.info('world runtime start')
    },
    tick(ctx: RuntimeContext, dtSeconds: number) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = normalizeIdentityHex(ctx.net?.getIdentityHex() ?? null)

      if (!connection || !connection.isActive) {
        if (lastConnectionActive) {
          clearWorld(ctx, knownKeys)
          streaming?.clear()
          currentAoiHash = ''
          currentTerrainPayloadAoiHash = ''
          currentPathDebugHash = ''
          localRegionId = null
          localDimensionId = Number.isFinite(DEFAULT_WORLD_DIMENSION_ID) && DEFAULT_WORLD_DIMENSION_ID > 0
            ? DEFAULT_WORLD_DIMENSION_ID
            : 1
          localPosition = { x: 0, y: 0, z: 0 }
          aoiAnchorPosition = { x: 0, z: 0 }
          lastAoiUpdateAtMs = 0
          terrainChunkSize = DEFAULT_CHUNK_SIZE
          seenAttackOutcomes.clear()
          lastAttackTsByIdentity.clear()
          pendingCharacterActions.length = 0
          cameraController?.reset()
          ctx.net?.removeSubscription(AOI_SUBSCRIPTION_KEY)
          ctx.net?.removeSubscription(AOI_TERRAIN_PAYLOAD_SUBSCRIPTION_KEY)
          ctx.net?.removeSubscription(AOI_PATH_DEBUG_SUBSCRIPTION_KEY)
        }
        lastConnectionActive = false
        return
      }
      lastConnectionActive = true

      terrainChunkSize = readTerrainChunkSize(connection.db.worldGenParams.iter(), terrainChunkSize)

      if (localIdentityHex) {
        const session = findLocalSession(connection.db.playerSessionView.iter(), localIdentityHex)
        if (session) {
          localRegionId = session.regionId
          const nextDimension = Number.isFinite(session.dimensionId) && session.dimensionId > 0
            ? Math.floor(session.dimensionId)
            : 1
          localDimensionId = nextDimension
        } else {
          localRegionId = null
          localDimensionId = Number.isFinite(DEFAULT_WORLD_DIMENSION_ID) && DEFAULT_WORLD_DIMENSION_ID > 0
            ? DEFAULT_WORLD_DIMENSION_ID
            : 1
        }
      }

      if (ENABLE_WORLD_AOI_SUBSCRIPTION && localRegionId !== null) {
        const nowMs = Date.now()
        if (
          currentAoiHash === '' ||
          shouldReanchorAoi(localPosition, aoiAnchorPosition, terrainChunkSize * 1.5)
        ) {
          aoiAnchorPosition = { x: localPosition.x, z: localPosition.z }
        }

        const queries = buildWorldAoiQueries({
          regionId: localRegionId,
          dimensionId: localDimensionId,
          centerX: aoiAnchorPosition.x,
          centerZ: aoiAnchorPosition.z,
          terrainRadius: TERRAIN_RADIUS_CHUNKS,
          dynamicRadius: DYNAMIC_RADIUS_CHUNKS,
          chunkSize: terrainChunkSize,
          combatLimit: COMBAT_LIMIT,
        })

        const nextHash = hashQueries(queries)
        const intervalPassed = nowMs - lastAoiUpdateAtMs >= AOI_UPDATE_MIN_INTERVAL_MS
        if (nextHash !== currentAoiHash && (intervalPassed || currentAoiHash === '')) {
          ctx.net?.setSubscription(AOI_SUBSCRIPTION_KEY, queries)
          currentAoiHash = nextHash
          lastAoiUpdateAtMs = nowMs
        }

        if (ENABLE_TERRAIN_PAYLOAD_SUBSCRIPTION) {
          const payloadQuery = buildTerrainPayloadAoiQuery({
            regionId: localRegionId,
            dimensionId: localDimensionId,
            centerX: aoiAnchorPosition.x,
            centerZ: aoiAnchorPosition.z,
            terrainRadius: TERRAIN_RADIUS_CHUNKS,
            dynamicRadius: DYNAMIC_RADIUS_CHUNKS,
            chunkSize: terrainChunkSize,
            combatLimit: COMBAT_LIMIT,
          })
          const payloadHash = hashQueries([payloadQuery])
          if (
            payloadHash !== currentTerrainPayloadAoiHash &&
            (intervalPassed || currentTerrainPayloadAoiHash === '')
          ) {
            ctx.net?.setSubscription(AOI_TERRAIN_PAYLOAD_SUBSCRIPTION_KEY, [payloadQuery])
            currentTerrainPayloadAoiHash = payloadHash
          }
        } else {
          currentTerrainPayloadAoiHash = ''
          ctx.net?.removeSubscription(AOI_TERRAIN_PAYLOAD_SUBSCRIPTION_KEY)
        }

        if (ENABLE_PATH_DEBUG_OVERLAY_SUBSCRIPTION) {
          const pathQueries = buildPathDebugQueries(localRegionId, localDimensionId)
          const pathHash = hashQueries(pathQueries)
          if (pathHash !== currentPathDebugHash && (intervalPassed || currentPathDebugHash === '')) {
            ctx.net?.setSubscription(AOI_PATH_DEBUG_SUBSCRIPTION_KEY, pathQueries)
            currentPathDebugHash = pathHash
          }
        } else {
          currentPathDebugHash = ''
          ctx.net?.removeSubscription(AOI_PATH_DEBUG_SUBSCRIPTION_KEY)
        }
      }

      const nextLocalPosition = syncTransformState(
        ctx,
        knownKeys,
        connection.db.transformState.iter(),
        localIdentityHex,
      )
      if (nextLocalPosition) {
        localPosition = nextLocalPosition
      }

      for (const row of connection.db.combatState.iter() as Iterable<CombatStateRow>) {
        const identityHex = toKeyString(row.identity)
        const lastAttackTs = row.lastAttackClientTsMs.toString()
        const previous = lastAttackTsByIdentity.get(identityHex)
        if (previous !== undefined && previous !== lastAttackTs && lastAttackTs !== '0') {
          streaming?.queueCharacterActionByIdentity(identityHex, 'attack_primary_external')
        }
        lastAttackTsByIdentity.set(identityHex, lastAttackTs)
      }
      trimMap(lastAttackTsByIdentity, MAX_TRACKED_ANIMATION_EVENTS)

      for (const row of connection.db.attackOutcome.iter() as Iterable<AttackOutcomeRow>) {
        if (seenAttackOutcomes.has(row.outcomeId)) {
          continue
        }
        seenAttackOutcomes.add(row.outcomeId)
        trimSet(seenAttackOutcomes, MAX_TRACKED_ANIMATION_EVENTS)
        if (!row.hit) {
          continue
        }
        const targetIdentityHex = toKeyString(row.targetIdentity)
        const slot: CharacterActionSlot = row.targetHpAfter <= 0 ? 'death_external' : 'hit_reaction_external'
        streaming?.queueCharacterActionByIdentity(targetIdentityHex, slot)
      }

      if (pendingCharacterActions.length > 0) {
        const batch = pendingCharacterActions.splice(0, pendingCharacterActions.length)
        for (const event of batch) {
          streaming?.queueCharacterActionByIdentity(event.identityHex, event.slot)
        }
      }

      syncNpcState(ctx, knownKeys, connection.db.npcStateStream.iter())
      syncBuildingState(ctx, knownKeys, connection.db.buildingState.iter())
      syncResourceState(ctx, knownKeys, connection.db.resourceNode.iter())
      syncTerrainChunks(ctx, knownKeys, connection.db.terrainChunkStream.iter(), terrainChunkSize)
      syncTerrainChunkPayloads(ctx, knownKeys, connection.db.terrainChunkPayload.iter())
      syncClaims(ctx, knownKeys, connection.db.claimState.iter())
      syncPathResults(ctx, knownKeys, connection.db.pathResult.iter())
      syncPathSteps(ctx, knownKeys, connection.db.pathStep.iter())
      const localGroundY = snapActorPresentationToTerrain(ctx.world)
      if (localGroundY !== null) {
        localPosition = {
          x: localPosition.x,
          y: localGroundY,
          z: localPosition.z,
        }
      }

      const localPlayer = ctx.world.ecs.queryFirst(IsLocalPlayer, Rotation)
      const localRotation = localPlayer?.get(Rotation)
      const bodyYaw = localRotation ? quatYawFromY(localRotation.y, localRotation.w) : undefined
      cameraController?.update({
        camera: ctx.renderer.camera,
        scene: ctx.renderer.scene,
        targetX: localPosition.x,
        targetY: localPosition.y,
        targetZ: localPosition.z,
        viewYaw: ctx.sync?.getViewYaw() ?? 0,
        viewPitch: ctx.sync?.getViewPitch() ?? 0,
        bodyYaw,
        aimMode: ctx.sync?.isAimModeActive() ?? false,
        dtSeconds,
      })

      streaming?.sync(ctx.world, dtSeconds)
    },
    stop(ctx: RuntimeContext) {
      ctx.net?.removeSubscription(AOI_SUBSCRIPTION_KEY)
      ctx.net?.removeSubscription(AOI_TERRAIN_PAYLOAD_SUBSCRIPTION_KEY)
      ctx.net?.removeSubscription(AOI_PATH_DEBUG_SUBSCRIPTION_KEY)
      clearWorld(ctx, knownKeys)
      seenAttackOutcomes.clear()
      lastAttackTsByIdentity.clear()
      pendingCharacterActions.length = 0
      if (onCharacterActionEvent) {
        window.removeEventListener('stitch:character-action', onCharacterActionEvent as EventListener)
        onCharacterActionEvent = null
      }
      streaming?.dispose(ctx.renderer.scene)
      streaming = null
      cameraController = null
      ctx.logger.info('world runtime stop')
    },
  }
}

function quatYawFromY(y: number, w: number): number {
  return Math.atan2(2 * w * y, 1 - 2 * y * y)
}

function actionSlotFromEvent(action: string | undefined): CharacterActionSlot | null {
  switch (action) {
    case 'jump':
      return 'jump_external'
    case 'wave':
      return 'emote_wave_external'
    case 'attack':
      return 'attack_primary_external'
    case 'hit':
      return 'hit_reaction_external'
    case 'death':
      return 'death_external'
    default:
      return null
  }
}

function trimSet(set: Set<string>, max: number): void {
  while (set.size > max) {
    const first = set.values().next().value as string | undefined
    if (!first) {
      break
    }
    set.delete(first)
  }
}

function trimMap(map: Map<string, string>, max: number): void {
  while (map.size > max) {
    const first = map.keys().next().value as string | undefined
    if (!first) {
      break
    }
    map.delete(first)
  }
}

function trimArray<T>(arr: T[], max: number): void {
  while (arr.length > max) {
    arr.shift()
  }
}
