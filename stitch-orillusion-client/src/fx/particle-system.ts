import { Color, Engine3D, Object3D, PlaneGeometry, Scene3D, Vector3 } from '@engine/core'
import {
  EmitLocation,
  ParticleEmitterModule,
  ParticleMaterial,
  ParticleStandardSimulator,
  ParticleSystem,
  ShapeType,
} from '@engine/particle'
import { FxEvent, FxEventBus } from './fx-event-bus'

export class ParticleSystemController {
  private readonly root = new Object3D()
  private readonly system: ParticleSystem
  private readonly releaseListener: () => void

  constructor(scene: Scene3D, bus: FxEventBus) {
    this.system = this.root.addComponent(ParticleSystem)
    this.system.geometry = new PlaneGeometry(0.22, 0.22, 1, 1, Vector3.Z_AXIS)

    const material = new ParticleMaterial()
    material.baseMap = Engine3D.res.whiteTexture
    material.baseColor = new Color(1.0, 0.65, 0.2, 0.9)
    this.system.material = material

    const simulator = this.system.useSimulator(ParticleStandardSimulator)
    const emitter = simulator.addModule(ParticleEmitterModule)
    emitter.maxParticle = 600
    emitter.duration = 0.12
    emitter.emissionRate = 240
    emitter.shapeType = ShapeType.Sphere
    emitter.radius = 0.12
    emitter.emitLocation = EmitLocation.Shell

    this.system.play()
    scene.addChild(this.root)

    this.releaseListener = bus.on((event) => this.handleFxEvent(event))
  }

  dispose(): void {
    this.releaseListener()
    this.root.destroy()
  }

  private handleFxEvent(event: FxEvent): void {
    this.root.x = event.x
    this.root.y = event.y
    this.root.z = event.z

    if (event.type === 'combat-hit') {
      this.system.play()
    }

    if (event.type === 'movement-dust') {
      this.system.play()
    }
  }
}
