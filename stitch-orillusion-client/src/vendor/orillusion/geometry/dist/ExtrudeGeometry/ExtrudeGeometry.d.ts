import { GeometryBase, Vector2, Vector3 } from "@orillusion/core";
import { Shape2D } from "./Shape2D";
export type ExtrudeGeometryArgs = {
    curveSegments?: number;
    steps?: number;
    depth?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
    anchorPoint?: Vector3;
};
export declare class ExtrudeGeometry extends GeometryBase {
    shapes: Shape2D[];
    options: ExtrudeGeometryArgs;
    protected verticesArray: number[];
    protected uvArray: number[];
    constructor(shapes?: Shape2D[], options?: ExtrudeGeometryArgs);
    protected getExtractPointsAndBoundingSize(shapes: Shape2D[], options: ExtrudeGeometryArgs): {
        BoundingSize: {
            min: Vector3;
            max: Vector3;
        };
        ShapePoints: {
            shape: Vector2[];
            holes: Vector2[][];
        }[];
    };
    protected buildGeometry(options: ExtrudeGeometryArgs): void;
    protected addGroup(start: number, count: number, materialIndex?: number): void;
    protected addShape(shape: Shape2D, options: ExtrudeGeometryArgs, offsetSize: Vector3): void;
    protected scalePoint2(pt: Vector2, vec: Vector2, size: number): Vector2;
    protected getBevelVec(inPt: Vector2, inPrev: Vector2, inNext: Vector2): Vector2;
}
