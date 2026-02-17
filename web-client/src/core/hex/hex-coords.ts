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

export enum HexDirection {
  NE = 0,
  ENE = 1,
  E = 2,
  ESE = 3,
  SE = 4,
  S = 5,
  SW = 6,
  WSW = 7,
  W = 8,
  WNW = 9,
  NW = 10,
  N = 11,
}

export const HEX_DIRECTIONS_ALL: readonly HexDirection[] = [
  HexDirection.NE,
  HexDirection.ENE,
  HexDirection.E,
  HexDirection.ESE,
  HexDirection.SE,
  HexDirection.S,
  HexDirection.SW,
  HexDirection.WSW,
  HexDirection.W,
  HexDirection.WNW,
  HexDirection.NW,
  HexDirection.N,
]

export const HEX_DIRECTIONS_FLAT: readonly HexDirection[] = [
  HexDirection.NE,
  HexDirection.E,
  HexDirection.SE,
  HexDirection.SW,
  HexDirection.W,
  HexDirection.NW,
]

export function zeroHex(dimension = 1): HexCoord {
  return { q: 0, r: 0, dimension }
}

export function cubeY(coord: HexCoord): number {
  return -coord.q - coord.r
}

export function directionOffset(direction: HexDirection): { dq: number; dr: number } {
  switch (direction) {
    case HexDirection.NE:
      return { dq: 0, dr: 1 }
    case HexDirection.ENE:
      return { dq: 1, dr: 1 }
    case HexDirection.E:
      return { dq: 1, dr: 0 }
    case HexDirection.ESE:
      return { dq: 2, dr: -1 }
    case HexDirection.SE:
      return { dq: 1, dr: -1 }
    case HexDirection.S:
      return { dq: 1, dr: -2 }
    case HexDirection.SW:
      return { dq: 0, dr: -1 }
    case HexDirection.WSW:
      return { dq: -1, dr: -1 }
    case HexDirection.W:
      return { dq: -1, dr: 0 }
    case HexDirection.WNW:
      return { dq: -2, dr: 1 }
    case HexDirection.NW:
      return { dq: -1, dr: 1 }
    case HexDirection.N:
      return { dq: -1, dr: 2 }
  }
}

export function isPointyDirection(direction: HexDirection): boolean {
  return direction % 2 === 1
}

export function directionMovementCost(direction: HexDirection): number {
  return isPointyDirection(direction) ? 1.5 : 1.0
}

export function nextFlatDirection(direction: HexDirection): HexDirection {
  if (direction === HexDirection.NW) {
    return HexDirection.NE
  }
  return (((direction >> 1) + 1) << 1) as HexDirection
}

export function previousFlatDirection(direction: HexDirection): HexDirection {
  if (direction === HexDirection.NE) {
    return HexDirection.NW
  }
  return (((direction >> 1) - 1) << 1) as HexDirection
}

export function neighbor(coord: HexCoord, direction: HexDirection, n = 1): HexCoord {
  const { dq, dr } = directionOffset(direction)
  return {
    q: coord.q + dq * n,
    r: coord.r + dr * n,
    dimension: coord.dimension,
  }
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = Math.abs(b.q - a.q)
  const dr = Math.abs(b.r - a.r)
  const dy = Math.abs(cubeY(b) - cubeY(a))
  return Math.floor((dq + dr + dy) / 2)
}

export function ring(center: HexCoord, radius: number): HexCoord[] {
  if (radius <= 0) {
    return [center]
  }

  const out: HexCoord[] = []
  let direction = HexDirection.NE
  let cursor = neighbor(center, nextFlatDirection(nextFlatDirection(direction)), radius)

  for (let i = 0; i < 6; i += 1) {
    for (let step = 0; step < radius; step += 1) {
      cursor = neighbor(cursor, direction)
      out.push(cursor)
    }
    direction = previousFlatDirection(direction)
  }

  return out
}

export function offsetToHex(offset: OffsetCoord): HexCoord {
  return {
    q: offset.x - Math.trunc(offset.z / 2),
    r: offset.z,
    dimension: offset.dimension,
  }
}

export function hexToOffset(hex: HexCoord): OffsetCoord {
  return {
    x: hex.q + Math.trunc(hex.r / 2),
    z: hex.r,
    dimension: hex.dimension,
  }
}

export function worldToHex(x: number, z: number, dimension = 1): HexCoord {
  const q = Number.isFinite(x) ? Math.floor(x) : 0
  const r = Number.isFinite(z) ? Math.floor(z) : 0
  return { q, r, dimension }
}
