import { describe, expect, test } from 'bun:test'
import { SERVER_TABLES } from '../net/server-contract'
import { MirrorStore } from './mirror-store'

function makeIdentity(hex: string) {
  return {
    toHexString() {
      return `0x${hex}`
    },
  }
}

function makeTable(rows: Record<string, unknown>[]) {
  return {
    iter() {
      return rows.values()
    },
  }
}

describe('MirrorStore', () => {
  test('reads server-backed snake_case table accessors', () => {
    const identity = makeIdentity('abc123')
    const store = new MirrorStore()
    const snapshot = store.refresh(
      {
        db: {
          [SERVER_TABLES.playerSessionView]: makeTable([
            { identity, regionId: 7n, dimensionId: 3, lastActiveAt: '2026-03-07T00:00:00Z' },
          ]),
          [SERVER_TABLES.physicsState]: makeTable([
            {
              entityId: identity,
              regionId: 7n,
              dimensionId: 3,
              position: [1, 0.9, 2],
              velocity: [0, 0, 0],
              grounded: true,
              lastIntentId: 'mi-1',
              lastFrameNo: 12,
            },
          ]),
          [SERVER_TABLES.transformState]: makeTable([
            {
              entityId: identity,
              regionId: 7n,
              dimensionId: 3,
              position: [1, 0.9, 2],
              rotation: [0, 0, 0],
            },
          ]),
          [SERVER_TABLES.buildingPreviewFeedbackView]: makeTable([
            {
              identity,
              requestId: 'bp-1',
              regionId: 7n,
              dimensionId: 3,
              buildingDefId: 1001n,
              hexX: 4,
              hexZ: 5,
              facing: 2,
              isValid: true,
              reasonCode: '',
              checkedAt: '2026-03-07T00:00:01Z',
            },
          ]),
          [SERVER_TABLES.serverCorrection]: makeTable([
            {
              identity,
              correctionId: 'corr-1',
              regionId: 7n,
              dimensionId: 3,
              reason: 'terrain_missing',
              serverX: 1,
              serverY: 0.9,
              serverZ: 2,
              acknowledged: false,
              ackedClientFrameNo: 21,
            },
            {
              identity,
              correctionId: 'corr-2',
              regionId: 7n,
              dimensionId: 3,
              reason: 'ignored',
              serverX: 0,
              serverY: 0,
              serverZ: 0,
              acknowledged: true,
              ackedClientFrameNo: 22,
            },
          ]),
          [SERVER_TABLES.combatHit]: makeTable([
            { hitId: 'combat-1', attacker: identity, target: identity, damage: 10, crit: false, frameNo: 13 },
          ]),
          [SERVER_TABLES.npcInteractionLog]: makeTable([
            {
              callerIdentity: identity,
              interactionKey: 'talk-1',
              npcId: 9001n,
              interactionKind: 1,
              status: 1,
              detail: 'talk accepted',
              updatedAt: '2026-03-07T00:00:02Z',
            },
          ]),
          [SERVER_TABLES.playerInventoryItemView]: makeTable([
            {
              ownerIdentity: identity,
              itemInstanceId: 501n,
              slotIndex: 0,
              itemDefId: 1n,
              quantity: 10,
            },
          ]),
          [SERVER_TABLES.playerWalletView]: makeTable([{ identity, balance: 42n }]),
          [SERVER_TABLES.npcAiStatusView]: makeTable([{ statusKey: 1, enabled: false }]),
          [SERVER_TABLES.buildingFootprint]: makeTable([
            {
              tileKey: 'tile-1',
              buildingEntityId: 701n,
              regionId: 7n,
              dimensionId: 3,
              hexX: 4,
              hexZ: 5,
              tileType: 1,
              isPerimeter: true,
            },
          ]),
          [SERVER_TABLES.worldGenParams]: makeTable([{ terrainChunkSize: 64 }]),
        },
      },
      'abc123',
    )

    expect(snapshot.session).not.toBeNull()
    expect(snapshot.session?.regionId).toBe(7n)
    expect(snapshot.session?.dimensionId).toBe(3)
    expect(snapshot.physicsByIdentity.get('abc123')?.lastIntentId).toBe('mi-1')
    expect(snapshot.preview?.requestId).toBe('bp-1')
    expect(snapshot.corrections).toHaveLength(1)
    expect(snapshot.corrections[0]?.correctionId).toBe('corr-1')
    expect(snapshot.combatHits[0]?.hitId).toBe('combat-1')
    expect(snapshot.npcLogs[0]?.detail).toBe('talk accepted')
    expect(snapshot.inventoryItems[0]?.quantity).toBe(10)
    expect(snapshot.walletBalance).toBe('42')
    expect(snapshot.npcAiEnabled).toBe(false)
    expect(snapshot.footprints[0]?.tileKey).toBe('tile-1')
    expect(snapshot.chunkSize).toBe(64)
  })
})
