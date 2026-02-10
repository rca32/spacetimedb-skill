import { CoreWorld } from '../world'
import { Position, PresentationTransform, Rotation } from '../traits'

export function runCoreSystems(world: CoreWorld): void {
  world.ecs.query(Position, Rotation, PresentationTransform).updateEach(([position, rotation, presentation]) => {
    const blend = 0.3
    presentation.x += (position.x - presentation.x) * blend
    presentation.y += (position.y - presentation.y) * blend
    presentation.z += (position.z - presentation.z) * blend

    presentation.qx += (rotation.x - presentation.qx) * blend
    presentation.qy += (rotation.y - presentation.qy) * blend
    presentation.qz += (rotation.z - presentation.qz) * blend
    presentation.qw += (rotation.w - presentation.qw) * blend
  })
}
