import { MeshRenderer, Texture, Transform, Vector3 } from "@orillusion/core";
import { GrassMaterial } from "../material/GrassMaterial";
import { GrassGeometry } from "../GrassGeometry";
export declare class GrassComponent extends MeshRenderer {
    grassMaterial: GrassMaterial;
    grassGeometry: GrassGeometry;
    constructor();
    init(param?: any): void;
    setGrass(grassWidth: number, grassHeight: number, segment: number, density: number, count?: number): void;
    setWindNoiseTexture(gustNoiseTexture: Texture): void;
    setMinMax(min: Vector3, max: Vector3): void;
    setGrassTexture(grassTexture: Texture): void;
    get nodes(): Transform[];
}
