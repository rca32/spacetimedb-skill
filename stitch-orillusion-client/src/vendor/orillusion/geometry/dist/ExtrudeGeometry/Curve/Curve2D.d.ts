import { Vector2 } from "@orillusion/core";
export declare enum CurveType {
    LineCurve = 0,
    SplineCurve = 1,
    EllipseCurve = 2,
    QuadraticBezierCurve = 3
}
export declare class Curve2D {
    curveType: CurveType;
    get points(): Vector2[];
    getPoint(t: number, result?: Vector2): Vector2;
    getPoints(divisions?: number): Vector2[];
}
