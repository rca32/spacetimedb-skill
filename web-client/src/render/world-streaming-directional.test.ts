import { describe, expect, it } from 'bun:test'
import { computeDirectionalBlend, computeIdleTurnBlend, type ModelTransform } from './world-streaming'

function makeTransform(overrides: Partial<ModelTransform> = {}): ModelTransform {
  return {
    x: 0,
    y: 0,
    z: 0,
    sx: 1,
    sy: 1,
    sz: 1,
    qx: 0,
    qy: 0,
    qz: 0,
    qw: 1,
    ...overrides,
  }
}

describe('computeDirectionalBlend', () => {
  it('keeps forward mapping aligned with rendered yawOffset', () => {
    const blend = computeDirectionalBlend(0, -1, makeTransform({ yawOffset: Math.PI }))
    expect(Math.abs(blend.forward - 1)).toBeLessThan(1e-6)
    expect(Math.abs(blend.backward - 0)).toBeLessThan(1e-6)
  })

  it('treats world forward as backward without yawOffset compensation', () => {
    const blend = computeDirectionalBlend(0, -1, makeTransform())
    expect(Math.abs(blend.forward - 0)).toBeLessThan(1e-6)
    expect(Math.abs(blend.backward - 1)).toBeLessThan(1e-6)
  })
})

describe('computeIdleTurnBlend', () => {
  it('stays idle when yaw delta is too small', () => {
    const turn = computeIdleTurnBlend((0.2 * Math.PI) / 180, 1 / 60, true)
    expect(turn.weight).toBeLessThan(1e-6)
  })

  it('selects left turn for positive yaw delta', () => {
    const turn = computeIdleTurnBlend((12 * Math.PI) / 180, 1 / 60, false)
    expect(turn.left).toBe(1)
    expect(turn.right).toBe(0)
    expect(turn.back).toBe(0)
    expect(turn.weight).toBeGreaterThan(0)
  })

  it('selects right turn for negative yaw delta', () => {
    const turn = computeIdleTurnBlend((-12 * Math.PI) / 180, 1 / 60, false)
    expect(turn.left).toBe(0)
    expect(turn.right).toBe(1)
    expect(turn.back).toBe(0)
    expect(turn.weight).toBeGreaterThan(0)
  })

  it('uses turn-back clip for large yaw delta when available', () => {
    const turn = computeIdleTurnBlend((160 * Math.PI) / 180, 1 / 60, true)
    expect(turn.left).toBe(0)
    expect(turn.right).toBe(0)
    expect(turn.back).toBe(1)
    expect(turn.weight).toBeGreaterThan(0)
  })
})
