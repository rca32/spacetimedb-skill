import {
  Camera3D,
  DirectLight,
  Engine3D,
  KelvinUtil,
  Object3D,
  Scene3D,
  SkyRenderer,
  View3D,
} from '@engine/core'
import { Physics } from '@engine/physics'
import { Stats } from '@engine/stats'
import { AppConfig } from '../infra/config'

export interface EngineRuntime {
  readonly canvas: HTMLCanvasElement
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
  const sky = scene.getOrAddComponent(SkyRenderer)
  const skyMap = await Engine3D.res.loadLDRTextureCube('sky/LDR_sky.jpg')
  sky.map = skyMap
  scene.envMap = skyMap

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

  const cameraObject = new Object3D()
  const camera = cameraObject.addComponent(Camera3D)
  camera.perspective(70, Engine3D.aspect, 0.03, 3000)
  scene.addChild(cameraObject)

  const view = new View3D()
  view.scene = scene
  view.camera = camera

  Engine3D.startRenderView(view)

  return {
    canvas,
    scene,
    cameraObject,
    camera,
    view,
    stop: () => {
      Engine3D.pause()
      try {
        scene.destroy(true)
      } catch (error) {
        console.warn('[stitch-orillusion-client] scene destroy failed during engine stop', error)
      }
      try {
        Engine3D.renderJobs?.clear()
      } catch (error) {
        console.warn('[stitch-orillusion-client] render job clear failed during engine stop', error)
      }
      Engine3D.views = []
      root.innerHTML = ''
    },
  }
}

function applyEngineSettings(config: AppConfig): void {
  Engine3D.setting.light.maxLight = 4096
  Engine3D.setting.render.useLogDepth = false
  Engine3D.setting.pick.enable = true
  Engine3D.setting.pick.mode = 'bound'

  Engine3D.setting.shadow.enable = true
  Engine3D.setting.shadow.type = 'HARD'
  Engine3D.setting.shadow.pointShadowBias = 0.0005
  Engine3D.setting.shadow.shadowSize = 2048
  Engine3D.setting.shadow.pointShadowSize = 1024
  Engine3D.setting.shadow.shadowSoft = 0.005
  Engine3D.setting.shadow.shadowBound = 100
  Engine3D.setting.shadow.shadowBias = 0.05
  Engine3D.setting.shadow.needUpdate = true
  Engine3D.setting.shadow.autoUpdate = true
  Engine3D.setting.shadow.updateFrameRate = 2
  Engine3D.setting.shadow.csmMargin = 0.1
  Engine3D.setting.shadow.csmScatteringExp = 0.7
  Engine3D.setting.shadow.csmAreaScale = 0.4
  Engine3D.setting.shadow.debug = false

  Engine3D.setting.loader.numConcurrent = 20

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

  void config
}
