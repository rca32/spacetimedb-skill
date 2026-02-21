import {
  BoundingBox,
  MeshRenderer,
  type Texture,
  type Transform,
  Vector3,
} from "@orillusion/core";
import { GrassGeometry, GrassMaterial } from "@orillusion/geometry";

export class LocalGrassComponent extends MeshRenderer {
  public readonly grassMaterial: GrassMaterial;
  public grassGeometry: GrassGeometry | null = null;

  constructor() {
    super();
    this.grassMaterial = new GrassMaterial();
    this.alwaysRender = true;
  }

  public setGrass(
    grassWidth: number,
    grassHeight: number,
    segment: number,
    density: number,
    count = 1000,
  ): void {
    void density;
    this.grassGeometry = new GrassGeometry(
      grassWidth,
      grassHeight,
      1,
      segment,
      count,
    );
    this.geometry = this.grassGeometry;
    this.material = this.grassMaterial;
    // Keep geometry and shader height in sync. Upstream GrassComponent omits this.
    this.grassMaterial.grassHeight = grassHeight;
  }

  public setWindNoiseTexture(gustNoiseTexture: Texture): void {
    this.grassMaterial.windMap = gustNoiseTexture;
  }

  public setMinMax(min: Vector3, max: Vector3): void {
    if (!this.grassGeometry) {
      return;
    }
    this.grassGeometry.bounds = new BoundingBox(new Vector3(), new Vector3(1, 1, 1));
    this.grassGeometry.bounds.setFromMinMax(min, max);
  }

  public setGrassTexture(grassTexture: Texture): void {
    this.grassMaterial.baseMap = grassTexture;
  }

  public get nodes(): Transform[] {
    return this.grassGeometry?.nodes ?? [];
  }
}
