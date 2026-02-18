export type HexCoord = {
  q: number
  r: number
  dimension: number
}

export type OffsetCoord = {
  x: number
  z: number
  dimension: number
}

export function clampDimension(dimension: number): number {
  const safe = Number.isFinite(dimension) ? Math.trunc(dimension) : 1
  return safe > 0 ? safe : 1
}

export function offsetToHex(offset: OffsetCoord): HexCoord {
  return {
    q: offset.x - Math.trunc(offset.z / 2),
    r: offset.z,
    dimension: clampDimension(offset.dimension),
  }
}

export function hexToOffset(hex: HexCoord): OffsetCoord {
  return {
    x: hex.q + Math.trunc(hex.r / 2),
    z: hex.r,
    dimension: clampDimension(hex.dimension),
  }
}

export function worldToHex(x: number, z: number, dimension = 1): HexCoord {
  return {
    q: Number.isFinite(x) ? Math.floor(x) : 0,
    r: Number.isFinite(z) ? Math.floor(z) : 0,
    dimension: clampDimension(dimension),
  }
}

export function hexToWorldXZ(hex: HexCoord): { x: number; z: number } {
  // Current stitch-server contract stores hex fields in the same scalar world-cell basis.
  return { x: hex.q, z: hex.r }
}
