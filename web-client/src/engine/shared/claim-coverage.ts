import { normalizeIdentityHex, readField, readNumber } from "./row-access";

export interface ClaimCoverage {
  row: Record<string, unknown>;
  claimId: number;
  ownerIdentityHex: string | null;
  regionId: number;
  dimensionId: number;
  centerX: number;
  centerZ: number;
  radius: number;
}

export function toClaimCoverage(row: Record<string, unknown>): ClaimCoverage {
  return {
    row,
    claimId: readNumber(row, 0, "claimId", "claim_id"),
    ownerIdentityHex: normalizeIdentityHex(
      readField(row, "ownerIdentity", "owner_identity")
    ),
    regionId: readNumber(row, 0, "regionId", "region_id"),
    dimensionId: readNumber(row, 0, "dimensionId", "dimension_id"),
    centerX: readNumber(row, 0, "centerX", "center_x"),
    centerZ: readNumber(row, 0, "centerZ", "center_z"),
    radius: readNumber(row, 0, "radius")
  };
}

export function claimContainsHex(
  row: Record<string, unknown>,
  regionId: number,
  dimensionId: number,
  hexX: number,
  hexZ: number
): boolean {
  const claim = toClaimCoverage(row);
  if (claim.regionId !== regionId || claim.dimensionId !== dimensionId) {
    return false;
  }

  const dx = claim.centerX - hexX;
  const dz = claim.centerZ - hexZ;
  return dx * dx + dz * dz <= claim.radius * claim.radius;
}

export function findClaimCoverage(
  rows: readonly Record<string, unknown>[],
  regionId: number,
  dimensionId: number,
  hexX: number,
  hexZ: number
): ClaimCoverage | null {
  let bestMatch: ClaimCoverage | null = null;

  for (const row of rows) {
    if (!claimContainsHex(row, regionId, dimensionId, hexX, hexZ)) {
      continue;
    }

    const claim = toClaimCoverage(row);
    if (!bestMatch || claim.radius < bestMatch.radius) {
      bestMatch = claim;
    }
  }

  return bestMatch;
}
