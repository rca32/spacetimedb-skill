import { BitmapTexture2D, PlaneGeometry, Vector3 } from "@orillusion/core";
export declare class TerrainGeometry extends PlaneGeometry {
    private _heightData;
    private _greenList;
    constructor(width: number, height: number, segmentW?: number, segmentH?: number);
    setHeight(texture: BitmapTexture2D, height: number): void;
    get heightData(): number[][];
    get greenData(): Vector3[];
}
