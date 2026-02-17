import {
  buildPathDebugQueries,
  buildTerrainPayloadAoiQuery,
  buildWorldAoiQueries,
  hashQueries,
} from '../net/aoi'
import { WorldStreamingRenderer } from '../render/world-streaming'
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

const AOI_SUBSCRIPTION_KEY = 'world-aoi'
const AOI_TERRAIN_PAYLOAD_SUBSCRIPTION_KEY = 'world-aoi-terrain-payload'
const AOI_PATH_DEBUG_SUBSCRIPTION_KEY = 'world-path-debug'
const TERRAIN_RADIUS_CHUNKS = 3
const DYNAMIC_RADIUS_CHUNKS = 2
const COMBAT_LIMIT = 500
const DEFAULT_CHUNK_SIZE = 32
const ENABLE_WORLD_AOI_SUBSCRIPTION = (import.meta.env.VITE_ENABLE_WORLD_AOI_SUB ?? '1') === '1'
const ENABLE_TERRAIN_PAYLOAD_SUBSCRIPTION = (import.meta.env.VITE_ENABLE_TERRAIN_PAYLOAD_SUB ?? '1') === '1'
const ENABLE_PATH_DEBUG_OVERLAY_SUBSCRIPTION = (import.meta.env.VITE_DEBUG_PATH_OVERLAY ?? '0') === '1'
const AOI_UPDATE_MIN_INTERVAL_MS = 500

export function createWorldRuntime(): RuntimeModule {
  const knownKeys: KnownKeyMap = new Map()
  let streaming: WorldStreamingRenderer | null = null
  let cameraController: ThirdPersonCameraController | null = null
  let currentAoiHash = ''
  let currentTerrainPayloadAoiHash = ''
  let currentPathDebugHash = ''
  let localRegionId: bigint | null = null
  let localPosition = { x: 0, y: 0, z: 0 }
  let aoiAnchorPosition = { x: 0, z: 0 }
  let lastAoiUpdateAtMs = 0
  let lastConnectionActive = false
  let terrainChunkSize = DEFAULT_CHUNK_SIZE

  return {
    name: 'WorldRuntime',
    start(ctx: RuntimeContext) {
      streaming = new WorldStreamingRenderer(ctx.renderer.scene, ctx.renderer.materials)
      cameraController = new ThirdPersonCameraController()
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
          localPosition = { x: 0, y: 0, z: 0 }
          aoiAnchorPosition = { x: 0, z: 0 }
          lastAoiUpdateAtMs = 0
          terrainChunkSize = DEFAULT_CHUNK_SIZE
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
          const pathQueries = buildPathDebugQueries(localRegionId)
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

      syncNpcState(ctx, knownKeys, connection.db.npcState.iter())
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
