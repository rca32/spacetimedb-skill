import { Color3, Color4, GlowLayer, HighlightLayer, Mesh, MeshBuilder, PBRMaterial, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import type { AssetContainer } from '@babylonjs/core/assetContainer'
import type { Scene } from '@babylonjs/core/scene'
import '@babylonjs/loaders/glTF'
import type { Logger } from '../infra/logger'
import type { QualityTier } from '../runtime/types'
import {
  pickEnvironmentByCategory,
  pickNpcCharacter,
  pickPlayerCharacter,
  type AssetCatalogs,
} from '../assets/catalog'
import type {
  BuildingSnapshot,
  FootprintSnapshot,
  MirrorSnapshot,
  NpcSnapshot,
  ProjectSnapshot,
  ResourceSnapshot,
  TerrainChunkSnapshot,
  TransformSnapshot,
} from './mirror-store'

export interface PickedWorldEntity {
  kind: 'resource' | 'building' | 'project' | 'npc' | 'player' | 'chunk'
  entityKey: string
  label: string
  npcId?: bigint
  combatIdentity?: unknown
}

export interface WorldApplyState {
  localIdentityHex: string | null
  localPlayerPosition: Vector3
  regionId: bigint
  dimensionId: number
  chunkSize: number
  buildModeEnabled: boolean
  qualityTier: QualityTier
  selectedTargetKey: string | null
  preview: MirrorSnapshot['preview']
  footprints: FootprintSnapshot[]
}

interface NodeMetadata extends PickedWorldEntity {
  modelPath?: string
}

export class WorldSceneController {
  private readonly chunkRoots = new Map<string, TransformNode>()
  private readonly resourceRoots = new Map<string, TransformNode>()
  private readonly buildingRoots = new Map<string, TransformNode>()
  private readonly projectRoots = new Map<string, TransformNode>()
  private readonly npcRoots = new Map<string, TransformNode>()
  private readonly remotePlayerRoots = new Map<string, TransformNode>()
  private readonly containerCache = new Map<string, Promise<AssetContainer | null>>()
  private readonly highlightLayer: HighlightLayer
  private readonly glowLayer: GlowLayer
  private readonly worldRoot: TransformNode
  private readonly dynamicRoot: TransformNode
  private readonly previewRoot: TransformNode
  private readonly footprintRoot: TransformNode
  private readonly localPlayerRoot: TransformNode
  private readonly terrainMaterial: StandardMaterial
  private readonly previewMaterial: StandardMaterial
  private readonly chunkMaterialCache = new Map<string, StandardMaterial>()
  private loadedAssetCount = 0
  private highlightedMesh: Mesh | null = null

  constructor(
    private readonly scene: Scene,
    private readonly catalogs: AssetCatalogs,
    private readonly logger: Logger,
  ) {
    this.worldRoot = new TransformNode('worldRoot', scene)
    this.dynamicRoot = new TransformNode('dynamicRoot', scene)
    this.dynamicRoot.parent = this.worldRoot
    this.previewRoot = new TransformNode('previewRoot', scene)
    this.previewRoot.parent = this.worldRoot
    this.footprintRoot = new TransformNode('footprintRoot', scene)
    this.footprintRoot.parent = this.previewRoot
    this.localPlayerRoot = new TransformNode('localPlayerRoot', scene)
    this.localPlayerRoot.parent = this.dynamicRoot

    this.highlightLayer = new HighlightLayer('selectionLayer', scene)
    this.glowLayer = new GlowLayer('worldGlow', scene)
    this.glowLayer.intensity = 0.5

    this.terrainMaterial = new StandardMaterial('terrainMaterial', scene)
    this.terrainMaterial.diffuseColor = new Color3(0.32, 0.38, 0.26)
    this.terrainMaterial.specularColor = new Color3(0.1, 0.1, 0.1)

    this.previewMaterial = new StandardMaterial('previewMaterial', scene)
    this.previewMaterial.alpha = 0.45
    this.previewMaterial.diffuseColor = new Color3(0.95, 0.78, 0.18)
    this.previewMaterial.emissiveColor = new Color3(0.12, 0.08, 0.02)

    this.spawnLocalPlayerPlaceholder()
  }

  async start(): Promise<void> {
    const playerAsset = pickPlayerCharacter(this.catalogs)
    if (playerAsset) {
      await this.attachModel(this.localPlayerRoot, playerAsset.targetPath, 0.7)
    }
  }

  apply(snapshot: MirrorSnapshot, state: WorldApplyState): void {
    this.localPlayerRoot.position.copyFrom(state.localPlayerPosition)

    this.syncChunks(snapshot.terrainChunks, state)
    this.syncResources(snapshot.resources, state)
    this.syncBuildings(snapshot.buildings, state)
    this.syncProjects(snapshot.projects, state)
    this.syncNpcs(snapshot.npcs, state)
    this.syncRemotePlayers(snapshot.transformsByIdentity, state)
    this.syncPreview(state.preview, state)
    this.syncFootprints(state.footprints, state)
    this.syncSelection(state.selectedTargetKey)
  }

  dispose(): void {
    this.highlightLayer.dispose()
    this.glowLayer.dispose()
    this.worldRoot.dispose()
  }

  resolvePick(mesh: AbstractMesh | null): PickedWorldEntity | null {
    let current: AbstractMesh | TransformNode | null = mesh
    while (current) {
      const metadata = current.metadata as NodeMetadata | undefined
      if (metadata?.kind) {
        return metadata
      }
      current = current.parent as AbstractMesh | TransformNode | null
    }
    return null
  }

  getLoadedAssetCount(): number {
    return this.loadedAssetCount
  }

  getActiveChunkCount(): number {
    return this.chunkRoots.size
  }

  private syncChunks(chunks: Map<string, TerrainChunkSnapshot>, state: WorldApplyState): void {
    const liveKeys = new Set<string>()
    const centerChunkX = Math.trunc(state.localPlayerPosition.x / state.chunkSize)
    const centerChunkY = Math.trunc(state.localPlayerPosition.z / state.chunkSize)

    for (const chunk of chunks.values()) {
      if (chunk.regionId !== state.regionId || chunk.dimensionId !== state.dimensionId) {
        continue
      }
      liveKeys.add(chunk.chunkKey)
      let root = this.chunkRoots.get(chunk.chunkKey)
      if (!root) {
        root = new TransformNode(`chunk-${chunk.chunkKey}`, this.scene)
        root.parent = this.worldRoot
        this.chunkRoots.set(chunk.chunkKey, root)

        const tile = MeshBuilder.CreateGround(`chunk-ground-${chunk.chunkKey}`, {
          width: state.chunkSize,
          height: state.chunkSize,
          subdivisions: 1,
        }, this.scene)
        tile.parent = root
        tile.receiveShadows = true
        tile.isPickable = true
        root.metadata = {
          kind: 'chunk',
          entityKey: chunk.chunkKey,
          label: `chunk ${chunk.chunkX},${chunk.chunkY}`,
        } satisfies NodeMetadata
      }

      root.position.set(
        chunk.chunkX * state.chunkSize + state.chunkSize * 0.5,
        0,
        chunk.chunkY * state.chunkSize + state.chunkSize * 0.5,
      )
      const ring = Math.max(Math.abs(chunk.chunkX - centerChunkX), Math.abs(chunk.chunkY - centerChunkY))
      const material = this.getChunkMaterial(chunk, ring)
      for (const child of root.getChildMeshes()) {
        child.material = material
      }
    }

    disposeMissing(this.chunkRoots, liveKeys)
  }

  private syncResources(resources: Map<string, ResourceSnapshot>, state: WorldApplyState): void {
    const liveKeys = new Set<string>()
    for (const resource of resources.values()) {
      if (resource.regionId !== state.regionId || resource.dimensionId !== state.dimensionId) {
        continue
      }
      const key = resource.entityId.toString()
      liveKeys.add(key)
      let root = this.resourceRoots.get(key)
      if (!root) {
        root = new TransformNode(`resource-${key}`, this.scene)
        root.parent = this.dynamicRoot
        this.resourceRoots.set(key, root)
        const mesh = MeshBuilder.CreateSphere(`resource-mesh-${key}`, { diameter: 0.8, segments: 10 }, this.scene)
        mesh.parent = root
        const material = new StandardMaterial(`resource-mat-${key}`, this.scene)
        material.diffuseColor = new Color3(0.24, 0.53, 0.32)
        mesh.material = material
        mesh.isPickable = true
        this.applyMetadata(root, {
          kind: 'resource',
          entityKey: key,
          label: `resource ${key}`,
        })
      }
      root.position.set(resource.hexX + 0.5, 0.45, resource.hexZ + 0.5)
      root.setEnabled(!resource.isDepleted)
    }
    disposeMissing(this.resourceRoots, liveKeys)
  }

  private syncBuildings(buildings: Map<string, BuildingSnapshot>, state: WorldApplyState): void {
    const liveKeys = new Set<string>()
    for (const building of buildings.values()) {
      if (building.regionId !== state.regionId || building.dimensionId !== state.dimensionId) {
        continue
      }
      const key = building.entityId.toString()
      liveKeys.add(key)
      let root = this.buildingRoots.get(key)
      if (!root) {
        root = new TransformNode(`building-${key}`, this.scene)
        root.parent = this.dynamicRoot
        this.buildingRoots.set(key, root)
        this.spawnPlaceholderBox(root, `building-box-${key}`, new Vector3(1.6, 1.4, 1.6), new Color3(0.62, 0.55, 0.48))
        this.applyMetadata(root, {
          kind: 'building',
          entityKey: key,
          label: `building ${key}`,
        })
        const envAsset = pickEnvironmentByCategory(this.catalogs, 'buildings', Number(building.entityId % 13n))
        if (envAsset) {
          void this.attachModel(root, envAsset.targetPath, 0.9)
        }
      }
      root.position.set(building.hexX + 0.5, 0.7, building.hexZ + 0.5)
    }
    disposeMissing(this.buildingRoots, liveKeys)
  }

  private syncProjects(projects: Map<string, ProjectSnapshot>, state: WorldApplyState): void {
    const liveKeys = new Set<string>()
    for (const project of projects.values()) {
      if (project.regionId !== state.regionId || project.dimensionId !== state.dimensionId) {
        continue
      }
      const key = project.entityId.toString()
      liveKeys.add(key)
      let root = this.projectRoots.get(key)
      if (!root) {
        root = new TransformNode(`project-${key}`, this.scene)
        root.parent = this.dynamicRoot
        this.projectRoots.set(key, root)
        const mesh = this.spawnPlaceholderBox(
          root,
          `project-box-${key}`,
          new Vector3(1.5, 1.0, 1.5),
          new Color3(0.78, 0.82, 0.98),
        )
        mesh.material = this.previewMaterial
        this.applyMetadata(root, {
          kind: 'project',
          entityKey: key,
          label: `project ${key}`,
        })
      }
      root.position.set(project.hexX + 0.5, 0.5, project.hexZ + 0.5)
      root.rotation.y = (project.facing % 6) * (Math.PI / 3)
    }
    disposeMissing(this.projectRoots, liveKeys)
  }

  private syncNpcs(npcs: Map<string, NpcSnapshot>, state: WorldApplyState): void {
    const liveKeys = new Set<string>()
    for (const npc of npcs.values()) {
      if (npc.regionId !== state.regionId || npc.dimensionId !== state.dimensionId) {
        continue
      }
      const key = npc.npcId.toString()
      liveKeys.add(key)
      let root = this.npcRoots.get(key)
      if (!root) {
        root = new TransformNode(`npc-${key}`, this.scene)
        root.parent = this.dynamicRoot
        this.npcRoots.set(key, root)
        this.spawnPlaceholderBox(root, `npc-box-${key}`, new Vector3(0.7, 1.6, 0.7), new Color3(0.75, 0.64, 0.48))
        this.applyMetadata(root, {
          kind: 'npc',
          entityKey: key,
          label: `npc ${key}`,
          npcId: npc.npcId,
        })
        const npcAsset = pickNpcCharacter(this.catalogs, Number(npc.npcId % 19n))
        if (npcAsset) {
          void this.attachModel(root, npcAsset.targetPath, 0.7)
        }
      }
      root.position.set(npc.hexX + 0.5, 0.8, npc.hexZ + 0.5)
    }
    disposeMissing(this.npcRoots, liveKeys)
  }

  private syncRemotePlayers(transforms: Map<string, TransformSnapshot>, state: WorldApplyState): void {
    const liveKeys = new Set<string>()
    for (const [identityHex, transform] of transforms.entries()) {
      if (identityHex === state.localIdentityHex) {
        continue
      }
      if (transform.regionId !== state.regionId || transform.dimensionId !== state.dimensionId) {
        continue
      }
      liveKeys.add(identityHex)
      let root = this.remotePlayerRoots.get(identityHex)
      if (!root) {
        root = new TransformNode(`remote-player-${identityHex}`, this.scene)
        root.parent = this.dynamicRoot
        this.remotePlayerRoots.set(identityHex, root)
        this.spawnPlaceholderBox(root, `remote-player-box-${identityHex}`, new Vector3(0.8, 1.8, 0.8), new Color3(0.42, 0.62, 0.88))
        this.applyMetadata(root, {
          kind: 'player',
          entityKey: identityHex,
          label: `player ${identityHex.slice(0, 8)}`,
          combatIdentity: transform.rawIdentity,
        })
        const playerAsset = pickPlayerCharacter(this.catalogs)
        if (playerAsset) {
          void this.attachModel(root, playerAsset.targetPath, 0.7)
        }
      }
      root.position.set(transform.position[0] ?? 0, transform.position[1] ?? 0.9, transform.position[2] ?? 0)
    }
    disposeMissing(this.remotePlayerRoots, liveKeys)
  }

  private syncPreview(preview: MirrorSnapshot['preview'], state: WorldApplyState): void {
    if (!state.buildModeEnabled || !preview) {
      this.previewRoot.setEnabled(false)
      return
    }
    this.previewRoot.setEnabled(true)
    this.previewRoot.position.set(preview.hexX + 0.5, 0.6, preview.hexZ + 0.5)
    this.previewMaterial.diffuseColor = preview.isValid
      ? new Color3(0.16, 0.86, 0.3)
      : new Color3(0.9, 0.2, 0.18)
    this.previewMaterial.emissiveColor = preview.isValid
      ? new Color3(0.02, 0.18, 0.04)
      : new Color3(0.18, 0.03, 0.02)

    if (this.previewRoot.getChildMeshes().length === 0) {
      const mesh = MeshBuilder.CreateBox('build-preview-box', { width: 1.4, height: 1.2, depth: 1.4 }, this.scene)
      mesh.parent = this.previewRoot
      mesh.material = this.previewMaterial
      mesh.isPickable = false
    }
  }

  private syncFootprints(footprints: FootprintSnapshot[], state: WorldApplyState): void {
    clearChildren(this.footprintRoot)
    if (!state.buildModeEnabled || footprints.length === 0) {
      return
    }
    for (const footprint of footprints) {
      if (footprint.regionId !== state.regionId || footprint.dimensionId !== state.dimensionId) {
        continue
      }
      const tile = MeshBuilder.CreateGround(`footprint-${footprint.tileKey}`, {
        width: 0.92,
        height: 0.92,
      }, this.scene)
      tile.parent = this.footprintRoot
      tile.position.set(footprint.hexX + 0.5, 0.04, footprint.hexZ + 0.5)
      const material = new StandardMaterial(`footprint-mat-${footprint.tileKey}`, this.scene)
      material.alpha = 0.26
      material.diffuseColor = footprint.isPerimeter ? new Color3(0.98, 0.8, 0.26) : new Color3(0.18, 0.72, 0.98)
      tile.material = material
      tile.isPickable = false
    }
  }

  private syncSelection(selectedTargetKey: string | null): void {
    if (this.highlightedMesh) {
      this.highlightLayer.removeMesh(this.highlightedMesh)
      this.highlightedMesh = null
    }
    if (!selectedTargetKey) {
      return
    }
    const mesh = this.findMeshByEntityKey(selectedTargetKey)
    if (!mesh) {
      return
    }
    this.highlightLayer.addMesh(mesh, new Color3(0.94, 0.83, 0.32))
    this.highlightedMesh = mesh
  }

  private findMeshByEntityKey(entityKey: string): Mesh | null {
    const roots = [
      this.resourceRoots,
      this.buildingRoots,
      this.projectRoots,
      this.npcRoots,
      this.remotePlayerRoots,
    ]
    for (const collection of roots) {
      const root = collection.get(entityKey)
      if (!root) {
        continue
      }
      const mesh = root.getChildMeshes()[0]
      return mesh instanceof Mesh ? mesh : null
    }
    return null
  }

  private spawnLocalPlayerPlaceholder(): void {
    const mesh = this.spawnPlaceholderBox(
      this.localPlayerRoot,
      'local-player-box',
      new Vector3(0.82, 1.82, 0.82),
      new Color3(0.42, 0.72, 0.98),
    )
    this.glowLayer.addIncludedOnlyMesh(mesh)
    this.applyMetadata(this.localPlayerRoot, {
      kind: 'player',
      entityKey: 'self',
      label: 'local player',
    })
  }

  private getChunkMaterial(chunk: TerrainChunkSnapshot, ring: number): StandardMaterial {
    const key = `${chunk.biomeId}:${Math.min(ring, 2)}`
    const existing = this.chunkMaterialCache.get(key)
    if (existing) {
      return existing
    }

    const material = new StandardMaterial(`chunk-mat-${key}`, this.scene)
    const base = pickBiomeColor(chunk.biomeId, ring)
    material.diffuseColor = base
    material.specularColor = new Color3(0.04, 0.04, 0.04)
    material.emissiveColor = chunk.waterRatioPermille > 300 ? new Color3(0.04, 0.08, 0.12) : new Color3(0.02, 0.02, 0.02)
    this.chunkMaterialCache.set(key, material)
    return material
  }

  private spawnPlaceholderBox(
    root: TransformNode,
    name: string,
    size: Vector3,
    color: Color3,
  ): Mesh {
    const box = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene)
    box.parent = root
    box.position.y = size.y * 0.5
    box.isPickable = true
    const material = new PBRMaterial(`${name}-mat`, this.scene)
    material.albedoColor = color
    material.roughness = 0.94
    material.metallic = 0.02
    material.alpha = 0.98
    box.material = material
    return box
  }

  private applyMetadata(root: TransformNode, metadata: NodeMetadata): void {
    root.metadata = metadata
    for (const mesh of root.getChildMeshes()) {
      mesh.metadata = metadata
      mesh.isPickable = true
    }
  }

  private async attachModel(root: TransformNode, targetPath: string, scale: number): Promise<void> {
    const metadata = (root.metadata ?? {}) as NodeMetadata
    if (metadata.modelPath === targetPath) {
      return
    }
    metadata.modelPath = targetPath
    root.metadata = metadata

    const container = await this.loadContainer(targetPath)
    if (!container) {
      return
    }

    clearChildren(root)
    const modelRoot = new TransformNode(`${root.name}-model-root`, this.scene)
    modelRoot.parent = root
    modelRoot.scaling.setAll(scale)

    const instantiated = container.instantiateModelsToScene(
      (name) => `${root.name}-${name}-${crypto.randomUUID().slice(0, 6)}`,
      false,
      { doNotInstantiate: false },
    )
    for (const node of instantiated.rootNodes) {
      node.parent = modelRoot
    }

    for (const mesh of modelRoot.getChildMeshes(false)) {
      mesh.isPickable = true
      mesh.metadata = metadata
    }
    root.metadata = metadata
  }

  private async loadContainer(targetPath: string): Promise<AssetContainer | null> {
    let promise = this.containerCache.get(targetPath)
    if (!promise) {
      promise = SceneLoader.LoadAssetContainerAsync('', targetPath, this.scene)
        .then((container) => {
          this.loadedAssetCount = this.containerCache.size
          this.logger.debug('asset loaded', { targetPath })
          return container
        })
        .catch((error: unknown) => {
          this.logger.warn('asset load failed', {
            targetPath,
            error: error instanceof Error ? error.message : String(error),
          })
          return null
        })
      this.containerCache.set(targetPath, promise)
    }
    return promise
  }
}

function pickBiomeColor(biomeId: number, ring: number): Color3 {
  const near = [
    new Color3(0.35, 0.39, 0.24),
    new Color3(0.26, 0.34, 0.23),
    new Color3(0.38, 0.32, 0.19),
    new Color3(0.23, 0.25, 0.3),
  ]
  const base = near[Math.abs(biomeId) % near.length] ?? near[0]
  const multiplier = ring >= 2 ? 0.68 : ring === 1 ? 0.82 : 1
  return new Color3(base.r * multiplier, base.g * multiplier, base.b * multiplier)
}

function disposeMissing(map: Map<string, TransformNode>, liveKeys: Set<string>): void {
  for (const [key, root] of map.entries()) {
    if (liveKeys.has(key)) {
      continue
    }
    root.dispose()
    map.delete(key)
  }
}

function clearChildren(root: TransformNode): void {
  for (const child of root.getChildren(undefined, false)) {
    child.dispose()
  }
}
