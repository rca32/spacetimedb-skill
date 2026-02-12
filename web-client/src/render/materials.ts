import * as THREE from 'three'

export interface MaterialPalette {
  ground: THREE.MeshStandardMaterial
  actor: THREE.MeshStandardMaterial
  npc: THREE.MeshStandardMaterial
  building: THREE.MeshStandardMaterial
  claim: THREE.MeshStandardMaterial
  resource: THREE.MeshStandardMaterial
}

export function createMaterialPalette(): MaterialPalette {
  return {
    ground: new THREE.MeshStandardMaterial({ color: 0x1f2b3b, roughness: 0.95 }),
    actor: new THREE.MeshStandardMaterial({ color: 0x8fc9ff, roughness: 0.4, metalness: 0.1 }),
    npc: new THREE.MeshStandardMaterial({ color: 0xffc788, roughness: 0.55, metalness: 0.08 }),
    building: new THREE.MeshStandardMaterial({ color: 0x8892a0, roughness: 0.8, metalness: 0.15 }),
    claim: new THREE.MeshStandardMaterial({
      color: 0x8effb2,
      roughness: 0.65,
      metalness: 0.05,
      transparent: true,
      opacity: 0.58,
    }),
    resource: new THREE.MeshStandardMaterial({ color: 0x8dd66a, roughness: 0.62, metalness: 0.05 }),
  }
}

export function disposeMaterialPalette(palette: MaterialPalette): void {
  palette.ground.dispose()
  palette.actor.dispose()
  palette.npc.dispose()
  palette.building.dispose()
  palette.claim.dispose()
  palette.resource.dispose()
}
