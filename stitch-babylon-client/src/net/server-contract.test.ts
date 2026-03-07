import { describe, expect, test } from 'bun:test'
import { reducers, tables } from '../module_bindings'
import { SERVER_REDUCERS, SERVER_TABLES } from './server-contract'

describe('server contract accessors', () => {
  test('generated table accessors stay aligned with server snake_case names', () => {
    const generatedTables = tables as Record<string, unknown>

    for (const tableName of Object.values(SERVER_TABLES)) {
      expect(generatedTables[tableName]).toBeDefined()
    }

    expect(generatedTables.physicsState).toBeUndefined()
    expect(generatedTables.serverCorrection).toBeUndefined()
    expect(generatedTables.combatHit).toBeUndefined()
    expect(generatedTables.aoiStream).toBeUndefined()
  })

  test('generated reducers stay aligned with camelCase client accessors', () => {
    const generatedReducers = reducers as Record<string, unknown>
    const syncClientFrame = generatedReducers.syncClientFrame as { name?: string; accessorName?: string } | undefined
    const submitMotionIntent = generatedReducers.submitMotionIntent as { name?: string; accessorName?: string } | undefined
    const ackServerCorrection = generatedReducers.ackServerCorrection as { name?: string; accessorName?: string } | undefined
    const buildingValidatePreview = generatedReducers.buildingValidatePreview as { name?: string; accessorName?: string } | undefined
    const submitCombatIntent = generatedReducers.submitCombatIntent as { name?: string; accessorName?: string } | undefined
    const npcTalk = generatedReducers.npcTalk as { name?: string; accessorName?: string } | undefined

    expect(syncClientFrame).toBeDefined()
    expect(syncClientFrame?.name).toBe(SERVER_REDUCERS.syncClientFrame)
    expect(syncClientFrame?.accessorName).toBe('syncClientFrame')

    expect(submitMotionIntent).toBeDefined()
    expect(submitMotionIntent?.name).toBe(SERVER_REDUCERS.submitMotionIntent)
    expect(submitMotionIntent?.accessorName).toBe('submitMotionIntent')

    expect(ackServerCorrection).toBeDefined()
    expect(ackServerCorrection?.name).toBe(SERVER_REDUCERS.ackServerCorrection)
    expect(ackServerCorrection?.accessorName).toBe('ackServerCorrection')

    expect(buildingValidatePreview).toBeDefined()
    expect(buildingValidatePreview?.name).toBe(SERVER_REDUCERS.buildingValidatePreview)
    expect(buildingValidatePreview?.accessorName).toBe('buildingValidatePreview')

    expect(submitCombatIntent).toBeDefined()
    expect(submitCombatIntent?.name).toBe(SERVER_REDUCERS.submitCombatIntent)
    expect(submitCombatIntent?.accessorName).toBe('submitCombatIntent')

    expect(npcTalk).toBeDefined()
    expect(npcTalk?.name).toBe(SERVER_REDUCERS.npcTalk)
    expect(npcTalk?.accessorName).toBe('npcTalk')

    for (const reducerName of Object.values(SERVER_REDUCERS)) {
      expect(generatedReducers[reducerName]).toBeUndefined()
    }
  })
})
