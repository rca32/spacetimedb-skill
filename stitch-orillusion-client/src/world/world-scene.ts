import {
  BoxGeometry,
  Color,
  Engine3D,
  Material,
  MeshRenderer,
  Object3D,
  Scene3D,
  SphereGeometry,
  UnLitMaterial,
} from '@orillusion/core'

export interface WorldSceneObjects {
  readonly player: Object3D
}

interface SceneModelProfile {
  readonly key: string
  readonly url: string
  readonly scale: number
  readonly offsetY?: number
  readonly rotationY?: number
  readonly color: readonly [number, number, number]
}

const PLAYER_MODEL_PROFILE: SceneModelProfile = {
  key: 'scene-player',
  url: '/blocky-character-a.gltf',
  scale: 0.2,
  offsetY: -0.7,
  rotationY: 180,
  color: [0.08, 0.95, 0.9],
}

const LANDMARK_MODEL_PROFILE: SceneModelProfile = {
  key: 'scene-landmark',
  url: '/castle-flag-banner-short.gltf',
  scale: 0.8,
  offsetY: 0.1,
  color: [0.88, 0.82, 0.38],
}

const scenePrefabByKey = new Map<string, Object3D>()
const scenePrefabLoadByKey = new Map<string, Promise<Object3D | null>>()
const scenePrefabFailedKeys = new Set<string>()

export function seedWorldScene(scene: Scene3D): WorldSceneObjects {
  const player = createPlayer(scene)
  createLandmarks(scene)
  return { player }
}

function createPlayer(scene: Scene3D): Object3D {
  const player = new Object3D()
  const fallback = new Object3D()
  const mesh = fallback.addComponent(MeshRenderer)
  mesh.geometry = new BoxGeometry(0.9, 1.8, 0.9)
  if (setMaterialSafe(mesh, createUnlitMaterial(0.1, 0.95, 0.95))) {
    player.addChild(fallback)
  } else {
    fallback.destroy()
  }
  attachSceneModelAsync(player, PLAYER_MODEL_PROFILE)

  player.y = 1.0
  scene.addChild(player)
  return player
}

function createLandmarks(scene: Scene3D): void {
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12
    const radius = 18

    const marker = new Object3D()
    const fallback = new Object3D()
    const mesh = fallback.addComponent(MeshRenderer)
    mesh.geometry = new SphereGeometry(0.5, 20, 20)
    if (setMaterialSafe(mesh, createUnlitMaterial(0.88, 0.82, 0.38))) {
      marker.addChild(fallback)
    } else {
      fallback.destroy()
    }
    attachSceneModelAsync(marker, LANDMARK_MODEL_PROFILE)

    marker.x = Math.cos(angle) * radius
    marker.y = 0
    marker.z = Math.sin(angle) * radius
    marker.rotationY = (angle * 180) / Math.PI + 180
    scene.addChild(marker)
  }
}

function attachSceneModelAsync(target: Object3D, profile: SceneModelProfile): void {
  void loadScenePrefab(profile).then((prefab) => {
    if (!prefab) {
      return
    }

    let instance: Object3D
    try {
      instance = prefab.instantiate()
    } catch (error) {
      scenePrefabByKey.delete(profile.key)
      scenePrefabFailedKeys.add(profile.key)
      console.warn(`[stitch-orillusion-client] failed to instantiate scene model ${profile.url}`, error)
      return
    }

    instance.x = 0
    instance.y = profile.offsetY ?? 0
    instance.z = 0
    instance.rotationY = profile.rotationY ?? 0
    instance.scaleX *= profile.scale
    instance.scaleY *= profile.scale
    instance.scaleZ *= profile.scale

    destroyDirectChildren(target)
    target.addChild(instance)
  })
}

function loadScenePrefab(profile: SceneModelProfile): Promise<Object3D | null> {
  const cached = scenePrefabByKey.get(profile.key)
  if (cached) {
    return Promise.resolve(cached)
  }
  if (scenePrefabFailedKeys.has(profile.key)) {
    return Promise.resolve(null)
  }

  const pending = scenePrefabLoadByKey.get(profile.key)
  if (pending) {
    return pending
  }

  const loadPromise = Engine3D.res
    .loadGltf(profile.url)
    .then((loadedRoot) => {
      const sanitized = cloneNodeAsUnlit(loadedRoot, profile.color)
      scenePrefabByKey.set(profile.key, sanitized)
      return sanitized
    })
    .catch((error) => {
      scenePrefabFailedKeys.add(profile.key)
      console.warn(`[stitch-orillusion-client] failed to load scene model ${profile.url}`, error)
      return null
    })
    .finally(() => {
      scenePrefabLoadByKey.delete(profile.key)
    })

  scenePrefabLoadByKey.set(profile.key, loadPromise)
  return loadPromise
}

function cloneNodeAsUnlit(source: Object3D, color: readonly [number, number, number]): Object3D {
  const clone = new Object3D()
  clone.name = source.name
  clone.x = source.x
  clone.y = source.y
  clone.z = source.z
  clone.rotationX = source.rotationX
  clone.rotationY = source.rotationY
  clone.rotationZ = source.rotationZ
  clone.scaleX = source.scaleX
  clone.scaleY = source.scaleY
  clone.scaleZ = source.scaleZ

  if (source.hasComponent(MeshRenderer)) {
    const sourceMesh = source.getComponent(MeshRenderer)
    if (sourceMesh?.geometry) {
      const mesh = clone.addComponent(MeshRenderer)
      mesh.castGI = false
      mesh.castShadow = false
      mesh.receiveShadow = false
      mesh.geometry = sourceMesh.geometry
      const material = createUnlitMaterial(color[0], color[1], color[2])
      if (!setMaterialSafe(mesh, material)) {
        material.destroy(false)
        clone.removeComponent(MeshRenderer)
      }
    }
  }

  for (const child of source.entityChildren) {
    if (!(child instanceof Object3D)) {
      continue
    }
    clone.addChild(cloneNodeAsUnlit(child, color))
  }

  return clone
}

function createUnlitMaterial(r: number, g: number, b: number): UnLitMaterial {
  const material = new UnLitMaterial()
  material.baseColor = new Color(r, g, b, 1)
  return material
}

function setMaterialSafe(mesh: MeshRenderer, material: Material): boolean {
  try {
    mesh.material = material
    return true
  } catch (error) {
    console.warn('[stitch-orillusion-client] material assignment failed in world scene', error)
    return false
  }
}

function destroyDirectChildren(object: Object3D): void {
  const children = [...object.entityChildren]
  for (const child of children) {
    if (object.hasChild(child)) {
      object.removeChild(child)
    }
    child.destroy()
  }
}
