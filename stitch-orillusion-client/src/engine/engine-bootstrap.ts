import {
  AtmosphericComponent,
  Camera3D,
  DirectLight,
  Engine3D,
  KelvinUtil,
  Object3D,
  Scene3D,
  View3D,
} from '@orillusion/core'
import { Physics } from '@orillusion/physics'
import { Stats } from '@orillusion/stats'
import { AppConfig } from '../infra/config'

export interface EngineRuntime {
  readonly scene: Scene3D
  readonly cameraObject: Object3D
  readonly camera: Camera3D
  readonly view: View3D
  stop: () => void
}

export async function bootstrapEngine(
  root: HTMLElement,
  config: AppConfig,
  onTick: () => void,
): Promise<EngineRuntime> {
  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  root.appendChild(canvas)

  applyEngineSettings(config)
  let physicsReady = false
  try {
    await Physics.init({ useSoftBody: false, useDrag: false })
    physicsReady = true
  } catch (error) {
    console.warn('[stitch-orillusion-client] physics init failed, continue without physics bridge', error)
  }

  await Engine3D.init({
    canvasConfig: {
      canvas,
      devicePixelRatio: config.devicePixelRatio,
      alpha: false,
    },
    renderLoop: () => {
      if (physicsReady) {
        Physics.update()
      }
      onTick()
    },
  })

  const scene = new Scene3D()
  const sky = scene.addComponent(AtmosphericComponent)
  sky.sunY = 0.58
  sky.exposure = 1.2

  if (config.enableStatsPanel) {
    scene.addComponent(Stats)
  }

  const lightObj = new Object3D()
  lightObj.rotationX = 48
  lightObj.rotationY = 112
  const light = lightObj.addComponent(DirectLight)
  light.lightColor = KelvinUtil.color_temperature_to_rgb(5400)
  light.castShadow = false
  light.intensity = 3
  light.indirect = 0.32
  scene.addChild(lightObj)
  sky.relativeTransform = lightObj.transform

  const cameraObject = new Object3D()
  const camera = cameraObject.addComponent(Camera3D)
  camera.perspective(70, Engine3D.aspect, 0.1, 3000)
  scene.addChild(cameraObject)

  const view = new View3D()
  view.scene = scene
  view.camera = camera

  Engine3D.startRenderView(view)

  return {
    scene,
    cameraObject,
    camera,
    view,
    stop: () => {
      Engine3D.pause()
      root.innerHTML = ''
    },
  }
}

function applyEngineSettings(config: AppConfig): void {
  Engine3D.setting.light.maxLight = 256
  Engine3D.setting.render.useLogDepth = true
  Engine3D.setting.pick.enable = false
  Engine3D.setting.pick.mode = 'bound'

  // Windows WebGPU + current Orillusion build can fail pipeline validation on Lit+Shadow path.
  // Keep shadows off by default so scene remains renderable.
  Engine3D.setting.shadow.enable = false
  Engine3D.setting.shadow.shadowBound = config.postFxProfile === 'high' ? 90 : 60
  Engine3D.setting.shadow.shadowSize = config.postFxProfile === 'high' ? 2048 : 1024
  Engine3D.setting.shadow.shadowBias = 0.03
  Engine3D.setting.shadow.pointShadowBias = 0.002

  Engine3D.setting.loader.numConcurrent = config.postFxProfile === 'low' ? 4 : 8

  const post = Engine3D.setting.render.postProcessing
  if (post.bloom) {
    post.bloom.enable = false
  }
  if (post.gtao) {
    post.gtao.enable = false
  }
  if (post.taa) {
    post.taa.enable = false
  }
  if (post.ssr) {
    post.ssr.enable = false
  }
}
