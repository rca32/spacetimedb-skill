import { Vector2 } from "@orillusion/core";
import { Curve2D } from "./Curve2D";
export declare class CubicBezierCurve2D extends Curve2D {
    v0: Vector2;
    v1: Vector2;
    v2: Vector2;
    v3: Vector2;
    constructor(v0: Vector2, v1: Vector2, v2: Vector2, v3: Vector2);
    get points(): Vector2[];
    getPoint(t: number, result?: Vector2): Vector2;
    copyFrom(other: CubicBezierCurve2D): void;
    protected cubicBezierP0(t: number, p: number): number;
    protected cubicBezierP1(t: number, p: number): number;
    protected cubicBezierP2(t: number, p: number): number;
    protected cubicBezierP3(t: number, p: number): number;
    protected cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number;
}
