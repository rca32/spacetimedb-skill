import { describe, expect, it } from 'bun:test'
import { runCoreSystems } from './index'
import { createCoreWorld } from '../world'
import { IsLocalPlayer, Position, PresentationTransform, Rotation } from '../traits'

describe('runCoreSystems', () => {
  it('snaps local player presentation transform to predicted transform', () => {
    const world = createCoreWorld()
    const yaw = Math.PI * 0.25
    const local = world.ecs.spawn(
      IsLocalPlayer,
      Position({ x: 12, y: 0, z: -4 }),
      Rotation({ x: 0, y: Math.sin(yaw * 0.5), z: 0, w: Math.cos(yaw * 0.5) }),
      PresentationTransform({ x: -2, y: 0, z: 3, qx: 0, qy: 0, qz: 0, qw: 1 }),
    )

    runCoreSystems(world)

    const presentation = local.get(PresentationTransform)
    if (!presentation) {
      throw new Error('local presentation missing')
    }
    expect(Math.abs(presentation.x - 12)).toBeLessThan(1e-6)
    expect(Math.abs(presentation.z + 4)).toBeLessThan(1e-6)
    expect(Math.abs(presentation.qy - Math.sin(yaw * 0.5))).toBeLessThan(1e-6)
    expect(Math.abs(presentation.qw - Math.cos(yaw * 0.5))).toBeLessThan(1e-6)
  })

  it('keeps smoothing for non-local entities', () => {
    const world = createCoreWorld()
    const remote = world.ecs.spawn(
      Position({ x: 10, y: 0, z: -5 }),
      Rotation({ x: 0, y: 0, z: 0, w: 1 }),
      PresentationTransform({ x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1 }),
    )

    runCoreSystems(world)

    const presentation = remote.get(PresentationTransform)
    if (!presentation) {
      throw new Error('remote presentation missing')
    }
    expect(Math.abs(presentation.x - 3)).toBeLessThan(1e-6)
    expect(Math.abs(presentation.z + 1.5)).toBeLessThan(1e-6)
  })
})
