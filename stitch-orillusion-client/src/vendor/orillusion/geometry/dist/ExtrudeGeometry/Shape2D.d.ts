import { Vector2 } from "@orillusion/core";
import { Path2D } from "./Path2D";
export declare class Shape2D extends Path2D {
    holes: Path2D[];
    constructor(points?: Vector2[]);
    extractPoints(divisions: number): {
        shape: Vector2[];
        holes: Vector2[][];
    };
    getPointsHoles(divisions: number): Vector2[][];
}
