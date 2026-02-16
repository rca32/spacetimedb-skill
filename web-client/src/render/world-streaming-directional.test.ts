import { describe, expect, it } from 'bun:test'
import { computeDirectionalBlend, type ModelTransform } from './world-streaming'

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
