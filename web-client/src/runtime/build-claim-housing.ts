import { Identity } from 'spacetimedb'
import type {
  BuildClaimHousingActionResult,
  BuildClaimHousingActions,
  BuildClaimHousingSnapshot,
  RuntimeContext,
  RuntimeModule,
} from './types'

const ID_ALLOC_TIMEOUT_MS = 2_500

const BUILD_CLAIM_HOUSING_SUBSCRIPTIONS: Array<{ key: string; query: string }> = [
  { key: 'bch-building-def', query: 'SELECT * FROM building_def' },
  { key: 'bch-building-state', query: 'SELECT * FROM building_state' },
  { key: 'bch-claim-state', query: 'SELECT * FROM claim_state' },
  { key: 'bch-housing-state', query: 'SELECT * FROM housing_state' },
  { key: 'bch-dimension-network', query: 'SELECT * FROM dimension_network' },
  { key: 'bch-dimension-desc', query: 'SELECT * FROM dimension_desc' },
  { key: 'bch-rent-whitelist-entry', query: 'SELECT * FROM rent_whitelist_entry' },
]

const PERM_USE = 0x0002
const PERM_BUILD = 0x0004
const PERM_ADMIN = 0x0020

type IdKind = 'building' | 'claim' | 'housing' | 'dimensionNetwork' | 'dimensionDesc'

const ID_KIND_CODE: Record<IdKind, number> = {
  building: 1,
  claim: 2,
  housing: 3,
  dimensionNetwork: 4,
  dimensionDesc: 5,
}

const ID_ALLOC_REDUCER: Record<IdKind, string> = {
  building: 'building_next_id',
  claim: 'claim_next_id',
  housing: 'housing_next_id',
  dimensionNetwork: 'dimension_network_next_id',
  dimensionDesc: 'dimension_desc_next_id',
}

type BuildingDefRow = {
  buildingDefId: unknown
  requiredItemDefId: unknown
  requiredItemQty: number
  buildRequired: number
  footprintRadius: number
}

type BuildingStateRow = {
  entityId: unknown
  ownerIdentity: unknown
  regionId: unknown
  hexX: number
  hexZ: number
  state: number
  requiredItemDefId: unknown
  requiredItemQty: number
  buildProgress: number
  buildRequired: number
  createdAt: unknown
  updatedAt: unknown
}

type ClaimStateRow = {
  claimId: unknown
  ownerIdentity: unknown
  totemBuildingId: unknown
  regionId: unknown
  centerX: number
  centerZ: number
  radius: number
  tier: number
  createdAt: unknown
  updatedAt: unknown
}

type HousingStateRow = {
  entityId: unknown
  ownerIdentity: unknown
  entranceBuildingEntityId: unknown
  exitPortalEntityId: unknown
  networkEntityId: unknown
  regionIndex: number
  lockedUntil: unknown
  isEmpty: boolean
}

type DimensionNetworkRow = {
  entityId: unknown
  buildingId: unknown
  collapseRespawnTimestamp: unknown
}

type DimensionDescRow = {
  entityId: unknown
  dimensionId: number
  networkEntityId: unknown
  interiorInstanceId: unknown
  collapseTimestamp: unknown
}

type RentWhitelistEntryRow = {
  entryKey: string
  housingEntityId: unknown
  identity: unknown
}

type InteriorCollapseTimerRow = {
  scheduledId: unknown
  scheduledAt: unknown
  housingEntityId: unknown
}

type IdLeaseStateRow = {
  leaseKey: string
  identity: unknown
  kind: number
  requestNonce: string
  leasedId: unknown
  updatedAt: unknown
}

interface PendingIdAllocation {
  kind: IdKind
  nonce: string
  requestedAtMs: number
  onResolved: (leasedId: bigint) => void
  onError: (message: string) => void
}

export function createBuildClaimHousingRuntime(): RuntimeModule {
  const pendingIdAllocations = new Map<string, PendingIdAllocation>()
  let snapshot: BuildClaimHousingSnapshot = createEmptySnapshot(false, null, 'offline')
  let nonceCounter = 0
  let lastStatus = 'idle'

  return {
    name: 'BuildClaimHousingRuntime',
    start(ctx: RuntimeContext) {
      ctx.buildClaimHousing = {
        getSnapshot: () => snapshot,
        actions: createActions(
          ctx,
          () => snapshot,
          pendingIdAllocations,
          () => `bch:${Date.now()}:${nonceCounter++}`,
          (statusText) => {
            lastStatus = statusText
          },
        ),
      }
      ctx.logger.info('build-claim-housing runtime start')
    },
    tick(ctx: RuntimeContext) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = normalizeIdentityHex(ctx.net?.getIdentityHex() ?? null)

      if (!connection || !connection.isActive) {
        for (const spec of BUILD_CLAIM_HOUSING_SUBSCRIPTIONS) {
          ctx.net?.removeSubscription(spec.key)
        }
        cancelAllPendingIdAllocations(pendingIdAllocations, 'connection lost')
        lastStatus = 'offline'
        snapshot = createEmptySnapshot(false, localIdentityHex, lastStatus)
        return
      }

      // Keep this idempotent registration on every connected tick so reconnect/HMR
      // cannot leave this domain unsubscribed.
      for (const spec of BUILD_CLAIM_HOUSING_SUBSCRIPTIONS) {
        ctx.net?.setSubscription(spec.key, [spec.query])
      }
      if (lastStatus === 'offline' || lastStatus === 'stopped') {
        lastStatus = 'ready'
      }

      const nextSnapshot: BuildClaimHousingSnapshot = {
        connected: true,
        identityHex: localIdentityHex,
        generatedAtMs: Date.now(),
        buildingDefs: collectBuildingDefs(connection.db.buildingDef.iter() as Iterable<BuildingDefRow>),
        buildings: collectBuildingStates(connection.db.buildingState.iter() as Iterable<BuildingStateRow>),
        claims: collectClaimStates(connection.db.claimState.iter() as Iterable<ClaimStateRow>),
        housings: collectHousingStates(connection.db.housingState.iter() as Iterable<HousingStateRow>),
        dimensionNetworks: collectDimensionNetworks(
          connection.db.dimensionNetwork.iter() as Iterable<DimensionNetworkRow>,
        ),
        dimensionDescs: collectDimensionDescs(connection.db.dimensionDesc.iter() as Iterable<DimensionDescRow>),
        rents: collectRentStates(
          connection.db.rentWhitelistEntry.iter() as Iterable<RentWhitelistEntryRow>,
        ),
        interiorTimers: collectInteriorTimers(
          connection.db.interiorCollapseTimer.iter() as Iterable<InteriorCollapseTimerRow>,
        ),
        leases: collectIdLeases(connection.db.idLeaseState.iter() as Iterable<IdLeaseStateRow>),
        lastStatus,
      }

      resolvePendingIdAllocations(pendingIdAllocations, nextSnapshot.leases)
      nextSnapshot.lastStatus = lastStatus
      snapshot = nextSnapshot
    },
    stop(ctx: RuntimeContext) {
      for (const spec of BUILD_CLAIM_HOUSING_SUBSCRIPTIONS) {
        ctx.net?.removeSubscription(spec.key)
      }
      cancelAllPendingIdAllocations(pendingIdAllocations, 'runtime stopped')
      lastStatus = 'stopped'
      snapshot = createEmptySnapshot(false, null, lastStatus)
      delete ctx.buildClaimHousing
      ctx.logger.info('build-claim-housing runtime stop')
    },
  }
}

function createActions(
  ctx: RuntimeContext,
  getSnapshot: () => BuildClaimHousingSnapshot,
  pendingIdAllocations: Map<string, PendingIdAllocation>,
  nextNonce: () => string,
  setStatus: (text: string) => void,
): BuildClaimHousingActions {
  return {
    placeBuilding: (input) => {
      const buildingDef = getSnapshot().buildingDefs.find((row) => row.buildingDefId === input.buildingDefId)
      if (!buildingDef) {
        return failResult('buildingDefId not found')
      }

      const regionId = toU64(input.regionId)
      if (regionId instanceof Error) {
        return failResult(regionId.message)
      }

      const dispatchPlace = (buildingId: bigint): BuildClaimHousingActionResult =>
        dispatchReducer(ctx, 'building_place', {
          buildingId,
          regionId,
          hexX: toI32(input.hexX),
          hexZ: toI32(input.hexZ),
          requiredItemDefId: toBigIntOrZero(buildingDef.requiredItemDefId),
          requiredItemQty: toU32(buildingDef.requiredItemQty),
          buildRequired: toU32(buildingDef.buildRequired),
        })

      if (input.buildingId?.trim()) {
        const buildingId = parseU64(input.buildingId, 'buildingId')
        if (buildingId instanceof Error) {
          return failResult(buildingId.message)
        }
        const result = dispatchPlace(buildingId)
        if (result.ok) {
          setStatus(`building_place dispatched (building=${buildingId.toString()})`)
        }
        return result
      }

      return requestId(
        ctx,
        pendingIdAllocations,
        'building',
        nextNonce,
        (buildingId) => {
          const result = dispatchPlace(buildingId)
          if (result.ok) {
            setStatus(`building_place dispatched (building=${buildingId.toString()})`)
          } else {
            setStatus(`building_place failed: ${result.error}`)
          }
        },
        (message) => {
          const fallbackId = estimateNextId(getSnapshot(), 'building')
          const fallback = dispatchPlace(fallbackId)
          if (fallback.ok) {
            setStatus(
              `building_next_id fallback used (${message}) -> building_place dispatched (building=${fallbackId.toString()})`,
            )
          } else {
            setStatus(`building_next_id failed: ${message}`)
          }
        },
      )
    },
    advanceBuilding: (input) => {
      const buildingId = parseU64(input.buildingId, 'buildingId')
      if (buildingId instanceof Error) {
        return failResult(buildingId.message)
      }
      const result = dispatchReducer(ctx, 'building_advance', {
        buildingId,
        steps: toU32(input.steps),
      })
      if (result.ok) {
        setStatus(`building_advance dispatched (building=${buildingId.toString()})`)
      }
      return result
    },
    deconstructBuilding: (input) => {
      const buildingId = parseU64(input.buildingId, 'buildingId')
      if (buildingId instanceof Error) {
        return failResult(buildingId.message)
      }
      const result = dispatchReducer(ctx, 'building_deconstruct', { buildingId })
      if (result.ok) {
        setStatus(`building_deconstruct dispatched (building=${buildingId.toString()})`)
      }
      return result
    },
    placeClaimTotem: (input) => {
      const totemBuildingId = parseU64(input.totemBuildingId, 'totemBuildingId')
      if (totemBuildingId instanceof Error) {
        return failResult(totemBuildingId.message)
      }

      const dispatchPlaceClaim = (claimId: bigint): BuildClaimHousingActionResult =>
        dispatchReducer(ctx, 'claim_totem_place', {
          claimId,
          totemBuildingId,
          radius: toU32(input.radius),
        })

      if (input.claimId?.trim()) {
        const claimId = parseU64(input.claimId, 'claimId')
        if (claimId instanceof Error) {
          return failResult(claimId.message)
        }
        const result = dispatchPlaceClaim(claimId)
        if (result.ok) {
          setStatus(`claim_totem_place dispatched (claim=${claimId.toString()})`)
        }
        return result
      }

      return requestId(
        ctx,
        pendingIdAllocations,
        'claim',
        nextNonce,
        (claimId) => {
          const result = dispatchPlaceClaim(claimId)
          if (result.ok) {
            setStatus(`claim_totem_place dispatched (claim=${claimId.toString()})`)
          } else {
            setStatus(`claim_totem_place failed: ${result.error}`)
          }
        },
        (message) => {
          const fallbackId = estimateNextId(getSnapshot(), 'claim')
          const fallback = dispatchPlaceClaim(fallbackId)
          if (fallback.ok) {
            setStatus(
              `claim_next_id fallback used (${message}) -> claim_totem_place dispatched (claim=${fallbackId.toString()})`,
            )
          } else {
            setStatus(`claim_next_id failed: ${message}`)
          }
        },
      )
    },
    expandClaim: (input) => {
      const claimId = parseU64(input.claimId, 'claimId')
      if (claimId instanceof Error) {
        return failResult(claimId.message)
      }
      const result = dispatchReducer(ctx, 'claim_expand', {
        claimId,
        radiusDelta: toU32(input.radiusDelta),
      })
      if (result.ok) {
        setStatus(`claim_expand dispatched (claim=${claimId.toString()})`)
      }
      return result
    },
    createHousing: (input) => {
      const entranceBuildingEntityId = parseU64(input.entranceBuildingEntityId, 'entranceBuildingEntityId')
      if (entranceBuildingEntityId instanceof Error) {
        return failResult(entranceBuildingEntityId.message)
      }

      const interiorInstanceId = parseU64(input.interiorInstanceId, 'interiorInstanceId')
      if (interiorInstanceId instanceof Error) {
        return failResult(interiorInstanceId.message)
      }

      let housingEntityId: bigint | null = null
      let networkEntityId: bigint | null = null
      let dimensionEntityId: bigint | null = null

      if (input.housingEntityId?.trim()) {
        const parsed = parseU64(input.housingEntityId, 'housingEntityId')
        if (parsed instanceof Error) {
          return failResult(parsed.message)
        }
        housingEntityId = parsed
      }
      if (input.networkEntityId?.trim()) {
        const parsed = parseU64(input.networkEntityId, 'networkEntityId')
        if (parsed instanceof Error) {
          return failResult(parsed.message)
        }
        networkEntityId = parsed
      }
      if (input.dimensionEntityId?.trim()) {
        const parsed = parseU64(input.dimensionEntityId, 'dimensionEntityId')
        if (parsed instanceof Error) {
          return failResult(parsed.message)
        }
        dimensionEntityId = parsed
      }

      const maybeDispatch = (): void => {
        if (housingEntityId === null || networkEntityId === null || dimensionEntityId === null) {
          return
        }
        const result = dispatchReducer(ctx, 'housing_create', {
          housingEntityId,
          entranceBuildingEntityId,
          networkEntityId,
          dimensionEntityId,
          dimensionId: toU32(input.dimensionId),
          interiorInstanceId,
        })
        if (result.ok) {
          setStatus(`housing_create dispatched (housing=${housingEntityId.toString()})`)
        } else {
          setStatus(`housing_create failed: ${result.error}`)
        }
      }

      const onAllocFailure =
        (kind: IdKind, label: string, applyFallbackId: (id: bigint) => void) =>
        (message: string): void => {
          const fallbackId = estimateNextId(getSnapshot(), kind)
          applyFallbackId(fallbackId)
          setStatus(`${label} fallback used (${message}) -> ${fallbackId.toString()}`)
          maybeDispatch()
        }

      if (housingEntityId === null) {
        const requested = requestId(
          ctx,
          pendingIdAllocations,
          'housing',
          nextNonce,
          (leasedId) => {
            housingEntityId = leasedId
            maybeDispatch()
          },
          onAllocFailure('housing', 'housing_next_id', (id) => {
            housingEntityId = id
          }),
        )
        if (!requested.ok) {
          return requested
        }
      }

      if (networkEntityId === null) {
        const requested = requestId(
          ctx,
          pendingIdAllocations,
          'dimensionNetwork',
          nextNonce,
          (leasedId) => {
            networkEntityId = leasedId
            maybeDispatch()
          },
          onAllocFailure('dimensionNetwork', 'dimension_network_next_id', (id) => {
            networkEntityId = id
          }),
        )
        if (!requested.ok) {
          return requested
        }
      }

      if (dimensionEntityId === null) {
        const requested = requestId(
          ctx,
          pendingIdAllocations,
          'dimensionDesc',
          nextNonce,
          (leasedId) => {
            dimensionEntityId = leasedId
            maybeDispatch()
          },
          onAllocFailure('dimensionDesc', 'dimension_desc_next_id', (id) => {
            dimensionEntityId = id
          }),
        )
        if (!requested.ok) {
          return requested
        }
      }

      maybeDispatch()
      return { ok: true }
    },
    enterHousing: (input) => {
      const housingEntityId = parseU64(input.housingEntityId, 'housingEntityId')
      if (housingEntityId instanceof Error) {
        return failResult(housingEntityId.message)
      }
      const result = dispatchReducer(ctx, 'housing_enter', {
        housingEntityId,
        portalX: toF32(input.portalX),
        portalY: toF32(input.portalY),
        portalZ: toF32(input.portalZ),
      })
      if (result.ok) {
        setStatus(`housing_enter dispatched (housing=${housingEntityId.toString()})`)
      }
      return result
    },
    changeHousingEntrance: (input) => {
      const housingEntityId = parseU64(input.housingEntityId, 'housingEntityId')
      if (housingEntityId instanceof Error) {
        return failResult(housingEntityId.message)
      }
      const newEntranceBuildingEntityId = parseU64(
        input.newEntranceBuildingEntityId,
        'newEntranceBuildingEntityId',
      )
      if (newEntranceBuildingEntityId instanceof Error) {
        return failResult(newEntranceBuildingEntityId.message)
      }

      const result = dispatchReducer(ctx, 'housing_change_entrance', {
        housingEntityId,
        newEntranceBuildingEntityId,
        targetRegionIndex: toU32(input.targetRegionIndex),
        movingMinutes: toI32(input.movingMinutes),
      })
      if (result.ok) {
        setStatus(`housing_change_entrance dispatched (housing=${housingEntityId.toString()})`)
      }
      return result
    },
    markInteriorEmpty: (input) => {
      const housingEntityId = parseU64(input.housingEntityId, 'housingEntityId')
      if (housingEntityId instanceof Error) {
        return failResult(housingEntityId.message)
      }
      const result = dispatchReducer(ctx, 'interior_mark_empty', {
        housingEntityId,
        isEmpty: input.isEmpty,
        respawnDelaySeconds: toU32(input.respawnDelaySeconds),
      })
      if (result.ok) {
        setStatus(`interior_mark_empty dispatched (housing=${housingEntityId.toString()})`)
      }
      return result
    },
    propagateHousingPermissions: (input) => {
      const housingEntityId = parseU64(input.housingEntityId, 'housingEntityId')
      if (housingEntityId instanceof Error) {
        return failResult(housingEntityId.message)
      }

      const subjectIdentity = parseIdentity(input.subjectIdentityHex)
      if (subjectIdentity instanceof Error) {
        return failResult(subjectIdentity.message)
      }

      let flags = 0
      if (input.grantUse) {
        flags |= PERM_USE
      }
      if (input.grantBuild) {
        flags |= PERM_BUILD
      }
      if (input.grantAdmin) {
        flags |= PERM_ADMIN
      }

      const result = dispatchReducer(ctx, 'housing_propagate_permissions', {
        housingEntityId,
        subjectIdentity,
        flags: toU32(flags),
      })
      if (result.ok) {
        setStatus(`housing_propagate_permissions dispatched (housing=${housingEntityId.toString()})`)
      }
      return result
    },
    setRentWhitelist: (input) => {
      const housingEntityId = parseU64(input.housingEntityId, 'housingEntityId')
      if (housingEntityId instanceof Error) {
        return failResult(housingEntityId.message)
      }

      const whiteList: Identity[] = []
      for (const identityHex of input.whiteListIdentityHexes) {
        const parsed = parseIdentity(identityHex)
        if (parsed instanceof Error) {
          return failResult(parsed.message)
        }
        whiteList.push(parsed)
      }

      const result = dispatchReducer(ctx, 'rent_set_whitelist', {
        housingEntityId,
        whiteList,
      })
      if (result.ok) {
        setStatus(`rent_set_whitelist dispatched (housing=${housingEntityId.toString()})`)
      }
      return result
    },
  }
}

function requestId(
  ctx: RuntimeContext,
  pendingIdAllocations: Map<string, PendingIdAllocation>,
  kind: IdKind,
  nextNonce: () => string,
  onResolved: (leasedId: bigint) => void,
  onError: (message: string) => void,
): BuildClaimHousingActionResult {
  const requestNonce = nextNonce()
  const reducerName = ID_ALLOC_REDUCER[kind]
  const dispatched = ctx.net?.dispatchReducer(reducerName, { requestNonce }) ?? false
  if (!dispatched) {
    return failResult(`failed to dispatch ${reducerName}`)
  }

  pendingIdAllocations.set(requestNonce, {
    kind,
    nonce: requestNonce,
    requestedAtMs: Date.now(),
    onResolved,
    onError,
  })
  return { ok: true }
}

function resolvePendingIdAllocations(
  pendingIdAllocations: Map<string, PendingIdAllocation>,
  leases: BuildClaimHousingSnapshot['leases'],
): void {
  const leaseByNonce = new Map<string, BuildClaimHousingSnapshot['leases'][number]>()
  for (const lease of leases) {
    leaseByNonce.set(lease.requestNonce, lease)
  }

  const nowMs = Date.now()
  for (const [nonce, pending] of [...pendingIdAllocations.entries()]) {
    const lease = leaseByNonce.get(nonce)
    if (lease && lease.kind === ID_KIND_CODE[pending.kind]) {
      pendingIdAllocations.delete(nonce)
      try {
        pending.onResolved(BigInt(lease.leasedId))
      } catch {
        pending.onError(`invalid leased id: ${lease.leasedId}`)
      }
      continue
    }

    if (nowMs - pending.requestedAtMs >= ID_ALLOC_TIMEOUT_MS) {
      pendingIdAllocations.delete(nonce)
      pending.onError(`timeout waiting for nonce ${nonce}`)
    }
  }
}

function cancelAllPendingIdAllocations(
  pendingIdAllocations: Map<string, PendingIdAllocation>,
  reason: string,
): void {
  for (const allocation of pendingIdAllocations.values()) {
    allocation.onError(reason)
  }
  pendingIdAllocations.clear()
}

function createEmptySnapshot(
  connected: boolean,
  identityHex: string | null,
  lastStatus: string,
): BuildClaimHousingSnapshot {
  return {
    connected,
    identityHex,
    generatedAtMs: Date.now(),
    buildingDefs: [],
    buildings: [],
    claims: [],
    housings: [],
    dimensionNetworks: [],
    dimensionDescs: [],
    rents: [],
    interiorTimers: [],
    leases: [],
    lastStatus,
  }
}

function collectBuildingDefs(rows: Iterable<BuildingDefRow>): BuildClaimHousingSnapshot['buildingDefs'] {
  const list: BuildClaimHousingSnapshot['buildingDefs'] = []
  for (const row of rows) {
    list.push({
      buildingDefId: toBigIntString(row.buildingDefId),
      requiredItemDefId: toBigIntString(row.requiredItemDefId),
      requiredItemQty: row.requiredItemQty,
      buildRequired: row.buildRequired,
      footprintRadius: row.footprintRadius,
    })
  }
  list.sort((left, right) => compareBigIntString(left.buildingDefId, right.buildingDefId))
  return list
}

function collectBuildingStates(rows: Iterable<BuildingStateRow>): BuildClaimHousingSnapshot['buildings'] {
  const list: BuildClaimHousingSnapshot['buildings'] = []
  for (const row of rows) {
    list.push({
      entityId: toBigIntString(row.entityId),
      ownerIdentityHex: identityHex(row.ownerIdentity),
      regionId: toBigIntString(row.regionId),
      hexX: row.hexX,
      hexZ: row.hexZ,
      state: row.state,
      requiredItemDefId: toBigIntString(row.requiredItemDefId),
      requiredItemQty: row.requiredItemQty,
      buildProgress: row.buildProgress,
      buildRequired: row.buildRequired,
      createdAt: timestampText(row.createdAt),
      updatedAt: timestampText(row.updatedAt),
    })
  }
  list.sort((left, right) => compareBigIntString(left.entityId, right.entityId))
  return list
}

function collectClaimStates(rows: Iterable<ClaimStateRow>): BuildClaimHousingSnapshot['claims'] {
  const list: BuildClaimHousingSnapshot['claims'] = []
  for (const row of rows) {
    list.push({
      claimId: toBigIntString(row.claimId),
      ownerIdentityHex: identityHex(row.ownerIdentity),
      totemBuildingId: toBigIntString(row.totemBuildingId),
      regionId: toBigIntString(row.regionId),
      centerX: row.centerX,
      centerZ: row.centerZ,
      radius: row.radius,
      tier: row.tier,
      createdAt: timestampText(row.createdAt),
      updatedAt: timestampText(row.updatedAt),
    })
  }
  list.sort((left, right) => compareBigIntString(left.claimId, right.claimId))
  return list
}

function collectHousingStates(rows: Iterable<HousingStateRow>): BuildClaimHousingSnapshot['housings'] {
  const list: BuildClaimHousingSnapshot['housings'] = []
  for (const row of rows) {
    list.push({
      entityId: toBigIntString(row.entityId),
      ownerIdentityHex: identityHex(row.ownerIdentity),
      entranceBuildingEntityId: toBigIntString(row.entranceBuildingEntityId),
      exitPortalEntityId: toBigIntString(row.exitPortalEntityId),
      networkEntityId: toBigIntString(row.networkEntityId),
      regionIndex: row.regionIndex,
      lockedUntil: timestampText(row.lockedUntil),
      isEmpty: row.isEmpty,
    })
  }
  list.sort((left, right) => compareBigIntString(left.entityId, right.entityId))
  return list
}

function collectDimensionNetworks(
  rows: Iterable<DimensionNetworkRow>,
): BuildClaimHousingSnapshot['dimensionNetworks'] {
  const list: BuildClaimHousingSnapshot['dimensionNetworks'] = []
  for (const row of rows) {
    list.push({
      entityId: toBigIntString(row.entityId),
      buildingId: toBigIntString(row.buildingId),
      collapseRespawnTimestamp: timestampText(row.collapseRespawnTimestamp),
    })
  }
  list.sort((left, right) => compareBigIntString(left.entityId, right.entityId))
  return list
}

function collectDimensionDescs(rows: Iterable<DimensionDescRow>): BuildClaimHousingSnapshot['dimensionDescs'] {
  const list: BuildClaimHousingSnapshot['dimensionDescs'] = []
  for (const row of rows) {
    list.push({
      entityId: toBigIntString(row.entityId),
      dimensionId: row.dimensionId,
      networkEntityId: toBigIntString(row.networkEntityId),
      interiorInstanceId: toBigIntString(row.interiorInstanceId),
      collapseTimestamp: timestampText(row.collapseTimestamp),
    })
  }
  list.sort((left, right) => compareBigIntString(left.entityId, right.entityId))
  return list
}

function collectRentStates(rows: Iterable<RentWhitelistEntryRow>): BuildClaimHousingSnapshot['rents'] {
  const grouped = new Map<string, Set<string>>()
  for (const row of rows) {
    const entityId = toBigIntString(row.housingEntityId)
    const idHex = identityHex(row.identity)
    if (!idHex) {
      continue
    }
    const entry = grouped.get(entityId) ?? new Set<string>()
    entry.add(idHex)
    grouped.set(entityId, entry)
  }

  const list: BuildClaimHousingSnapshot['rents'] = [...grouped.entries()].map(
    ([entityId, identities]) => ({
      entityId,
      whiteListIdentityHexes: [...identities].sort(),
    }),
  )
  list.sort((left, right) => compareBigIntString(left.entityId, right.entityId))
  return list
}

function collectInteriorTimers(
  rows: Iterable<InteriorCollapseTimerRow>,
): BuildClaimHousingSnapshot['interiorTimers'] {
  const list: BuildClaimHousingSnapshot['interiorTimers'] = []
  for (const row of rows) {
    list.push({
      scheduledId: toBigIntString(row.scheduledId),
      scheduledAt: timestampText(row.scheduledAt),
      housingEntityId: toBigIntString(row.housingEntityId),
    })
  }
  list.sort((left, right) => compareBigIntString(left.scheduledId, right.scheduledId))
  return list
}

function collectIdLeases(rows: Iterable<IdLeaseStateRow>): BuildClaimHousingSnapshot['leases'] {
  const list: BuildClaimHousingSnapshot['leases'] = []
  for (const row of rows) {
    list.push({
      leaseKey: row.leaseKey,
      identityHex: identityHex(row.identity),
      kind: row.kind,
      requestNonce: row.requestNonce,
      leasedId: toBigIntString(row.leasedId),
      updatedAt: timestampText(row.updatedAt),
    })
  }
  list.sort((left, right) => left.requestNonce.localeCompare(right.requestNonce))
  return list
}

function dispatchReducer(
  ctx: RuntimeContext,
  reducerName: string,
  payload: Record<string, unknown>,
): BuildClaimHousingActionResult {
  const dispatched = ctx.net?.dispatchReducer(reducerName, payload) ?? false
  return dispatched ? { ok: true } : failResult(`failed to dispatch ${reducerName}`)
}

function parseIdentity(value: string): Identity | Error {
  const normalized = normalizeIdentityHex(value)
  if (!normalized || normalized.length !== 64) {
    return new Error('identity must be a 64-char hex string')
  }
  return new Identity(normalized)
}

function parseU64(value: string, fieldName: string): bigint | Error {
  try {
    const parsed = BigInt(value)
    if (parsed < 0n) {
      return new Error(`${fieldName} must be non-negative`)
    }
    return parsed
  } catch {
    return new Error(`${fieldName} must be a valid integer`)
  }
}

function toU64(value: number): bigint | Error {
  if (!Number.isFinite(value)) {
    return new Error('value must be numeric')
  }
  if (value < 0) {
    return new Error('value must be non-negative')
  }
  return BigInt(Math.floor(value))
}

function toU32(value: number): number {
  return Math.max(0, Math.floor(value))
}

function toI32(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.trunc(value)
}

function toF32(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return value
}

function toBigIntString(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value).toString()
  }
  return String(value)
}

function toBigIntOrZero(value: unknown): bigint {
  try {
    return BigInt(toBigIntString(value))
  } catch {
    return 0n
  }
}

function compareBigIntString(left: string, right: string): number {
  try {
    const leftBig = BigInt(left)
    const rightBig = BigInt(right)
    if (leftBig === rightBig) {
      return 0
    }
    return leftBig > rightBig ? 1 : -1
  } catch {
    return left.localeCompare(right)
  }
}

function estimateNextId(snapshot: BuildClaimHousingSnapshot, kind: IdKind): bigint {
  let max = 0n
  const updateMax = (value: string): void => {
    try {
      const parsed = BigInt(value)
      if (parsed > max) {
        max = parsed
      }
    } catch {
      // Ignore invalid ids in fallback estimator.
    }
  }

  switch (kind) {
    case 'building':
      for (const row of snapshot.buildings) {
        updateMax(row.entityId)
      }
      break
    case 'claim':
      for (const row of snapshot.claims) {
        updateMax(row.claimId)
      }
      break
    case 'housing':
      for (const row of snapshot.housings) {
        updateMax(row.entityId)
      }
      break
    case 'dimensionNetwork':
      for (const row of snapshot.dimensionNetworks) {
        updateMax(row.entityId)
      }
      break
    case 'dimensionDesc':
      for (const row of snapshot.dimensionDescs) {
        updateMax(row.entityId)
      }
      break
  }

  return max + 1n
}

function timestampText(value: unknown): string {
  return String(value)
}

function identityHex(value: unknown): string {
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return normalizeIdentityHex(candidate.toHexString()) ?? ''
  }
  return normalizeIdentityHex(String(value)) ?? ''
}

function normalizeIdentityHex(value: string | null): string | null {
  if (!value) {
    return null
  }
  const normalized = value.trim().toLowerCase().replace(/^0x/, '')
  return normalized.length > 0 ? normalized : null
}

function failResult(error: string): BuildClaimHousingActionResult {
  return { ok: false, error }
}
