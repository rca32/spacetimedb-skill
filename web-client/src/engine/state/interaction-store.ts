export interface BuildingPreviewState {
  enabled: boolean;
  targeting: boolean;
  requestId: string | null;
  buildingDefId: number;
  regionId: number | null;
  dimensionId: number | null;
  hexX: number;
  hexZ: number;
  facing: number;
  isValid: boolean | null;
  reasonCode: string;
}

type Listener = (state: BuildingPreviewState) => void;

const DEFAULT_BUILDING_PREVIEW_STATE: BuildingPreviewState = {
  enabled: false,
  targeting: false,
  requestId: null,
  buildingDefId: 1,
  regionId: null,
  dimensionId: null,
  hexX: 0,
  hexZ: 0,
  facing: 0,
  isValid: null,
  reasonCode: "idle"
};

export class InteractionStore {
  private readonly listeners = new Set<Listener>();
  private buildingPreview: BuildingPreviewState = { ...DEFAULT_BUILDING_PREVIEW_STATE };

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getBuildingPreview());
    return () => this.listeners.delete(listener);
  }

  getBuildingPreview(): BuildingPreviewState {
    return { ...this.buildingPreview };
  }

  updateBuildingPreview(patch: Partial<BuildingPreviewState>): void {
    this.buildingPreview = {
      ...this.buildingPreview,
      ...patch
    };
    this.emit();
  }

  beginPreview(regionId: number, dimensionId: number): void {
    this.updateBuildingPreview({
      enabled: true,
      targeting: true,
      regionId,
      dimensionId,
      isValid: null,
      reasonCode: "targeting"
    });
  }

  clearPreview(): void {
    this.buildingPreview = { ...DEFAULT_BUILDING_PREVIEW_STATE };
    this.emit();
  }

  private emit(): void {
    const snapshot = this.getBuildingPreview();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
