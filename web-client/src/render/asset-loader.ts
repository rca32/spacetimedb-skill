import { GLTFLoader } from 'three-stdlib'
import * as THREE from 'three'
import type { AssetManifest } from './asset-mapping'
import { ASSET_MANIFEST_PATH } from './asset-mapping'

export interface LoadedModel {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
}

export interface AssetLoaderResult {
  manifest: AssetManifest
  models: Map<string, LoadedModel>
  textures: Map<string, THREE.Texture>
  audioBuffers: Map<string, AudioBuffer>
}

class AssetLoaderImpl {
  private gltfLoader = new GLTFLoader()
  private textureLoader = new THREE.TextureLoader()
  private audioContext: AudioContext | null = null
  private modelCache = new Map<string, LoadedModel>()
  private textureCache = new Map<string, THREE.Texture>()
  private audioCache = new Map<string, AudioBuffer>()
  private manifest: AssetManifest | null = null

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  async loadManifest(): Promise<AssetManifest> {
    if (this.manifest) {
      return this.manifest
    }

    const response = await fetch(ASSET_MANIFEST_PATH)
    if (!response.ok) {
      throw new Error(`Failed to load asset manifest: ${response.status}`)
    }

    this.manifest = (await response.json()) as AssetManifest
    return this.manifest
  }

  async loadModel(path: string): Promise<LoadedModel> {
    const cached = this.modelCache.get(path)
    if (cached) {
      return cached
    }

    const gltf = await this.gltfLoader.loadAsync(path)
    const result: LoadedModel = {
      scene: gltf.scene,
      animations: gltf.animations,
    }

    this.modelCache.set(path, result)
    return result
  }

  async loadTexture(path: string): Promise<THREE.Texture> {
    const cached = this.textureCache.get(path)
    if (cached) {
      return cached
    }

    const texture = await this.textureLoader.loadAsync(path)
    this.textureCache.set(path, texture)
    return texture
  }

  async loadAudio(path: string): Promise<AudioBuffer> {
    const cached = this.audioCache.get(path)
    if (cached) {
      return cached
    }

    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${path}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await this.getAudioContext().decodeAudioData(arrayBuffer)

    this.audioCache.set(path, audioBuffer)
    return audioBuffer
  }

  async loadCriticalAssets(): Promise<AssetLoaderResult> {
    const manifest = await this.loadManifest()
    const criticalPaths = manifest.preloadPriority.critical

    for (const path of criticalPaths) {
      await this.loadAssetByPath(path)
    }

    return {
      manifest,
      models: this.modelCache,
      textures: this.textureCache,
      audioBuffers: this.audioCache,
    }
  }

  async loadAllAssets(onProgress?: (loaded: number, total: number) => void): Promise<AssetLoaderResult> {
    const manifest = await this.loadManifest()
    const allPaths = [
      ...manifest.preloadPriority.critical,
      ...manifest.preloadPriority.high,
      ...manifest.preloadPriority.normal,
    ]

    const total = allPaths.length
    let loaded = 0

    for (const path of allPaths) {
      await this.loadAssetByPath(path)
      loaded++
      onProgress?.(loaded, total)
    }

    return {
      manifest,
      models: this.modelCache,
      textures: this.textureCache,
      audioBuffers: this.audioCache,
    }
  }

  private async loadAssetByPath(path: string): Promise<void> {
    if (path.endsWith('.glb') || path.endsWith('.gltf')) {
      await this.loadModel(path)
    } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.webp')) {
      await this.loadTexture(path)
    } else if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.ogg')) {
      await this.loadAudio(path)
    }
  }

  getModel(path: string): LoadedModel | undefined {
    return this.modelCache.get(path)
  }

  getTexture(path: string): THREE.Texture | undefined {
    return this.textureCache.get(path)
  }

  getAudioBuffer(path: string): AudioBuffer | undefined {
    return this.audioCache.get(path)
  }

  getManifest(): AssetManifest | null {
    return this.manifest
  }

  playSfx(name: string, volume = 1.0): void {
    const manifest = this.manifest
    if (!manifest) return

    const path = manifest.audio.sfx[name]
    if (!path) return

    const buffer = this.audioCache.get(path)
    if (!buffer) return

    const ctx = this.getAudioContext()
    const source = ctx.createBufferSource()
    const gainNode = ctx.createGain()

    source.buffer = buffer
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(ctx.destination)
    source.start(0)
  }

  playMusic(name: string, volume = 0.5, loop = true): { stop: () => void } | null {
    const manifest = this.manifest
    if (!manifest) return null

    const path = manifest.audio.music[name]
    if (!path) return null

    const buffer = this.audioCache.get(path)
    if (!buffer) return null

    const ctx = this.getAudioContext()
    const source = ctx.createBufferSource()
    const gainNode = ctx.createGain()

    source.buffer = buffer
    source.loop = loop
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(ctx.destination)
    source.start(0)

    return {
      stop: () => {
        try {
          source.stop()
        } catch {
          // Already stopped
        }
      },
    }
  }

  dispose(): void {
    for (const model of this.modelCache.values()) {
      model.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) {
          mesh.geometry.dispose()
        }
        if (mesh.material) {
          disposeMaterial(mesh.material)
        }
      })
    }

    for (const texture of this.textureCache.values()) {
      texture.dispose()
    }

    this.modelCache.clear()
    this.textureCache.clear()
    this.audioCache.clear()
    this.manifest = null

    if (this.audioContext) {
      void this.audioContext.close()
      this.audioContext = null
    }
  }
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial)
    return
  }

  const mat = material as THREE.MeshStandardMaterial
  if (mat.map) mat.map.dispose()
  if (mat.normalMap) mat.normalMap.dispose()
  if (mat.roughnessMap) mat.roughnessMap.dispose()
  if (mat.metalnessMap) mat.metalnessMap.dispose()
  if (mat.aoMap) mat.aoMap.dispose()
  if (mat.emissiveMap) mat.emissiveMap.dispose()
  material.dispose()
}

export const AssetLoader = new AssetLoaderImpl()
