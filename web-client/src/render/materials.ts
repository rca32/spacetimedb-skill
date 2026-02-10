import * as THREE from 'three'

export interface MaterialPalette {
  ground: THREE.MeshStandardMaterial
  actor: THREE.MeshStandardMaterial
}

export function createMaterialPalette(): MaterialPalette {
  return {
    ground: new THREE.MeshStandardMaterial({ color: 0x1f2b3b, roughness: 0.95 }),
    actor: new THREE.MeshStandardMaterial({ color: 0x8fc9ff, roughness: 0.4, metalness: 0.1 }),
  }
}

export function disposeMaterialPalette(palette: MaterialPalette): void {
  palette.ground.dispose()
  palette.actor.dispose()
}
