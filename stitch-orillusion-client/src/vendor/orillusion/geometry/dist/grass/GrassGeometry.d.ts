import { GeometryBase, Transform } from "@orillusion/core";
export declare class GrassGeometry extends GeometryBase {
    width: number;
    height: number;
    segmentW: number;
    segmentH: number;
    nodes: Transform[];
    constructor(width: number, height: number, segmentW: number, segmentH: number, count: number);
    private buildGrass;
}
