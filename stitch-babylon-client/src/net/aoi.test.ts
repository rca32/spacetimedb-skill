import { describe, expect, test } from 'bun:test'
import { buildAoiQueries, buildCombatQueries, buildInventoryQueries, buildSessionQueries } from './aoi'
import { SERVER_TABLES } from './server-contract'

describe('AOI query builders', () => {
  test('session and inventory queries target server table names', () => {
    const queries = [
      ...buildSessionQueries({ identityHex: 'abcd1234', regionId: 7n, dimensionId: 3 }),
      ...buildInventoryQueries({ identityHex: 'abcd1234', regionId: 7n, dimensionId: 3 }),
      ...buildCombatQueries(7n, 3),
    ]
    const joined = queries.join('\n')

    expect(joined).toContain(SERVER_TABLES.physicsState)
    expect(joined).toContain(SERVER_TABLES.serverCorrection)
    expect(joined).toContain(SERVER_TABLES.playerSessionView)
    expect(joined).toContain(SERVER_TABLES.buildingPreviewFeedbackView)
    expect(joined).toContain(SERVER_TABLES.npcInteractionLog)
    expect(joined).toContain(SERVER_TABLES.playerInventoryContainerView)
    expect(joined).toContain(SERVER_TABLES.playerInventorySlotView)
    expect(joined).toContain(SERVER_TABLES.playerInventoryItemView)
    expect(joined).toContain(SERVER_TABLES.playerWalletView)
    expect(joined).toContain(SERVER_TABLES.combatHit)
    expect(joined).not.toContain('_v2')
  })

  test('AOI queries stay on public server streams', () => {
    const queries = buildAoiQueries(
      {
        regionId: 9n,
        dimensionId: 4,
        minChunkX: -2,
        maxChunkX: 2,
        minChunkY: -1,
        maxChunkY: 3,
        chunkRadius: 2,
      },
      true,
    )
    const joined = queries.join('\n')

    expect(joined).toContain(SERVER_TABLES.worldGenParams)
    expect(joined).toContain(SERVER_TABLES.aoiStream)
    expect(joined).toContain(SERVER_TABLES.terrainChunkStream)
    expect(joined).toContain(SERVER_TABLES.terrainChunkPayload)
    expect(joined).toContain(SERVER_TABLES.resourceNode)
    expect(joined).toContain(SERVER_TABLES.buildingState)
    expect(joined).toContain(SERVER_TABLES.projectSiteState)
    expect(joined).toContain(SERVER_TABLES.npcStateStream)
    expect(joined).toContain(SERVER_TABLES.transformState)
    expect(joined).toContain(SERVER_TABLES.buildingFootprint)
    expect(joined).not.toContain('_v2')
  })
})
