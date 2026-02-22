import { Vector2 } from "@orillusion/core";
import { Curve2D } from "./Curve2D";
export declare class QuadraticBezierCurve2D extends Curve2D {
    v0: Vector2;
    v1: Vector2;
    v2: Vector2;
    constructor(v0: Vector2, v1: Vector2, v2: Vector2);
    get points(): Vector2[];
    getPoint(t: number, result?: Vector2): Vector2;
    copyFrom(other: QuadraticBezierCurve2D): void;
    protected quadraticBezierP0(t: number, p: number): number;
    protected quadraticBezierP1(t: number, p: number): number;
    protected quadraticBezierP2(t: number, p: number): number;
    protected quadraticBezier(t: number, p0: number, p1: number, p2: number): number;
}
