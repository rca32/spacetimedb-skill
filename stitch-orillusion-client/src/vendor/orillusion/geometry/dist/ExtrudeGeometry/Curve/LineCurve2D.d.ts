import { Vector2 } from "@orillusion/core";
import { Curve2D } from "./Curve2D";
export declare class LineCurve2D extends Curve2D {
    v0: Vector2;
    v1: Vector2;
    constructor(v0: Vector2, v1: Vector2);
    get points(): Vector2[];
    getPoint(t: number, result?: Vector2): Vector2;
    getPointAt(u: number, result?: Vector2): Vector2;
    getTangent(t: number, result?: Vector2): Vector2;
    getTangentAt(u: number, result?: Vector2): Vector2;
    copyFrom(other: LineCurve2D): void;
}
