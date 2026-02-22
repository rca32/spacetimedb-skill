import { Vector2 } from "@orillusion/core";
import { Curve2D } from "./Curve/Curve2D";
export declare class Path2D {
    autoClose: boolean;
    protected curves: Array<Curve2D>;
    protected currentPoint: Vector2;
    constructor(points?: Vector2[]);
    getPoints(divisions: number): Vector2[];
    setFromPoints(points: Vector2[]): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    quadraticCurveTo(cpX: number, cpY: number, x: number, y: number): this;
    bezierCurveTo(cp1X: number, cp1Y: number, cp2X: number, cp2Y: number, x: number, y: number): this;
    isIntersect(path: Path2D): boolean;
    pointInPolygon(point: Vector2, polygon: Vector2[]): boolean;
}
