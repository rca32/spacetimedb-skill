import * as THREE from 'three'
import { createPerspectiveCamera, resizeCamera } from './camera'
import { createMaterialPalette, disposeMaterialPalette, MaterialPalette } from './materials'
import { createSceneBundle, SceneBundle } from './scene'

export interface RendererRuntime {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly materials: MaterialPalette
  getStats: () => {
    calls: number
    triangles: number
    points: number
    lines: number
  }
  start: (onTick: (dtSeconds: number) => void) => void
  stop: () => void
}

export function createRendererRuntime(root: HTMLElement): RendererRuntime {
  const bundle: SceneBundle = createSceneBundle()
  const camera = createPerspectiveCamera(root.clientWidth, root.clientHeight)
  const materials = createMaterialPalette()

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(root.clientWidth, root.clientHeight)

  root.innerHTML = ''
  root.appendChild(renderer.domElement)

  let previous = performance.now()

  const onResize = () => {
    const width = root.clientWidth
    const height = root.clientHeight
    resizeCamera(camera, width, height)
    renderer.setSize(width, height)
  }

  window.addEventListener('resize', onResize)

  return {
    scene: bundle.scene,
    camera,
    materials,
    getStats() {
      return {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        points: renderer.info.render.points,
        lines: renderer.info.render.lines,
      }
    },
    start(onTick) {
      renderer.setAnimationLoop(() => {
        const now = performance.now()
        const dtSeconds = Math.min((now - previous) / 1000, 0.1)
        previous = now

        onTick(dtSeconds)
        renderer.render(bundle.scene, camera)
      })
    },
    stop() {
      renderer.setAnimationLoop(null)
      window.removeEventListener('resize', onResize)
      disposeMaterialPalette(materials)
      renderer.dispose()
      root.innerHTML = ''
    },
  }
}
