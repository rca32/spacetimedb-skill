import {
  AnimatorComponent,
  Color,
  Engine3D,
  Material,
  MeshRenderer,
  Object3D,
  Scene3D,
  SkinnedMeshRenderer,
  SkinnedMeshRenderer2,
  SphereGeometry,
  UnLitMaterial,
} from '@engine/core'

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
  readonly preserveMaterials?: boolean
  readonly shadowSafePbr?: boolean
  readonly rootObjectName?: string
  readonly defaultAnimation?: string
  readonly defaultAnimationIndex?: number
}

const PLAYER_MODEL_PROFILE: SceneModelProfile = {
  key: 'scene-player',
  url: '/Soldier_draco.glb',
  scale: 0.3,
  offsetY: -0.9,
  rotationY: 180,
  color: [0.08, 0.95, 0.9],
  preserveMaterials: true,
  shadowSafePbr: true,
  rootObjectName: 'Character',
  defaultAnimation: 'Idle',
  defaultAnimationIndex: 0,
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

    if (profile.shadowSafePbr) {
      applyPbrShadowSafety(instance)
    }

    destroyDirectChildren(target)
    target.addChild(instance)
    playSceneAnimation(instance, profile.defaultAnimation, profile.defaultAnimationIndex)
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
      const sourceRoot = resolveModelRoot(loadedRoot, profile.rootObjectName)
      const prefab = profile.preserveMaterials ? sourceRoot : cloneNodeAsUnlit(sourceRoot, profile.color)
      if (profile.shadowSafePbr) {
        applyPbrShadowSafety(prefab)
      }
      scenePrefabByKey.set(profile.key, prefab)
      return prefab
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

type AnyMeshRenderer = MeshRenderer | SkinnedMeshRenderer | SkinnedMeshRenderer2

function applyPbrShadowSafety(root: Object3D): void {
  for (const mesh of collectMeshRenderers(root)) {
    mesh.castGI = false
    mesh.castShadow = false
    mesh.receiveShadow = false

    const materials = getMaterialsSafe(mesh)
    if (materials.length === 0) {
      continue
    }
    for (const material of materials) {
      applyShadowSafeMaterial(material)
    }
  }
}

function collectMeshRenderers(root: Object3D): AnyMeshRenderer[] {
  const out: AnyMeshRenderer[] = []
  const visited = new Set<AnyMeshRenderer>()

  for (const renderer of root.getComponentsInChild(MeshRenderer)) {
    if (!visited.has(renderer)) {
      visited.add(renderer)
      out.push(renderer)
    }
  }
  for (const renderer of root.getComponentsInChild(SkinnedMeshRenderer)) {
    if (!visited.has(renderer)) {
      visited.add(renderer)
      out.push(renderer)
    }
  }
  for (const renderer of root.getComponentsInChild(SkinnedMeshRenderer2)) {
    if (!visited.has(renderer)) {
      visited.add(renderer)
      out.push(renderer)
    }
  }

  return out
}

function getMaterialsSafe(mesh: AnyMeshRenderer): Material[] {
  try {
    const materials = mesh.materials
    if (Array.isArray(materials) && materials.length > 0) {
      return materials
    }

    const single = mesh.material
    return single ? [single] : []
  } catch (error) {
    console.warn('[stitch-orillusion-client] material read failed in world scene', error)
    return []
  }
}

function applyShadowSafeMaterial(material: Material): void {
  material.acceptShadow = false
  material.castShadow = false
  try {
    material.setDefine('USE_SHADOWMAPING', false)
  } catch {
    // Some material variants may not expose this define; ignore safely.
  }
}

function resolveModelRoot(loadedRoot: Object3D, preferredName?: string): Object3D {
  if (!preferredName) {
    return loadedRoot
  }

  const resolved = loadedRoot.getObjectByName(preferredName)
  if (resolved instanceof Object3D) {
    return resolved
  }

  console.warn('[stitch-orillusion-client] preferred model root not found, fallback to loaded root', {
    preferredName,
  })
  return loadedRoot
}

function playSceneAnimation(root: Object3D, preferredClipName?: string, preferredClipIndex?: number): void {
  const animator = root.getComponentsInChild(AnimatorComponent)[0]
  if (!animator || !animator.clips || animator.clips.length === 0) {
    return
  }

  const preferredByName = preferredClipName
    ? animator.clips.find((clip) => normalizeClipName(clip.clipName) === normalizeClipName(preferredClipName))
    : undefined
  const preferredByIndex =
    Number.isInteger(preferredClipIndex) &&
      (preferredClipIndex as number) >= 0 &&
      (preferredClipIndex as number) < animator.clips.length
      ? animator.clips[preferredClipIndex as number]
      : undefined
  const clip = preferredByName ?? preferredByIndex ?? animator.clips[0]
  if (!clip) {
    return
  }

  try {
    animator.playAnim(clip.clipName)
  } catch (error) {
    console.warn('[stitch-orillusion-client] failed to play scene animation clip', {
      clipName: clip.clipName,
      error,
    })
  }
}

function normalizeClipName(value: string): string {
  return value.trim().toLowerCase()
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
