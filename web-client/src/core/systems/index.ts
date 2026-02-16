import { Not } from 'koota'
import { CoreWorld } from '../world'
import { IsLocalPlayer, Position, PresentationTransform, Rotation } from '../traits'

const REMOTE_PRESENTATION_BLEND = 0.3

export function runCoreSystems(world: CoreWorld): void {
  // Local avatar should track input yaw immediately to keep camera/movement/animation aligned.
  world.ecs.query(IsLocalPlayer, Position, Rotation, PresentationTransform).updateEach(([position, rotation, presentation]) => {
    presentation.x = position.x
    presentation.y = position.y
    presentation.z = position.z
    presentation.qx = rotation.x
    presentation.qy = rotation.y
    presentation.qz = rotation.z
    presentation.qw = rotation.w
    normalizePresentationQuaternion(presentation)
  })

  world.ecs.query(Not(IsLocalPlayer), Position, Rotation, PresentationTransform).updateEach(([position, rotation, presentation]) => {
    presentation.x += (position.x - presentation.x) * REMOTE_PRESENTATION_BLEND
    presentation.y += (position.y - presentation.y) * REMOTE_PRESENTATION_BLEND
    presentation.z += (position.z - presentation.z) * REMOTE_PRESENTATION_BLEND

    presentation.qx += (rotation.x - presentation.qx) * REMOTE_PRESENTATION_BLEND
    presentation.qy += (rotation.y - presentation.qy) * REMOTE_PRESENTATION_BLEND
    presentation.qz += (rotation.z - presentation.qz) * REMOTE_PRESENTATION_BLEND
    presentation.qw += (rotation.w - presentation.qw) * REMOTE_PRESENTATION_BLEND
    normalizePresentationQuaternion(presentation)
  })
}

function normalizePresentationQuaternion(presentation: {
  qx: number
  qy: number
  qz: number
  qw: number
}): void {
  const qLength = Math.hypot(presentation.qx, presentation.qy, presentation.qz, presentation.qw)
  if (qLength > 1e-6) {
    const invLength = 1 / qLength
    presentation.qx *= invLength
    presentation.qy *= invLength
    presentation.qz *= invLength
    presentation.qw *= invLength
    return
  }

  presentation.qx = 0
  presentation.qy = 0
  presentation.qz = 0
  presentation.qw = 1
}
