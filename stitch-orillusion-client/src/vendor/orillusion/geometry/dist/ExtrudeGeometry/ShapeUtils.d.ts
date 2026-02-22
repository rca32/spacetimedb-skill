import { Vector2 } from "@orillusion/core";
export declare class ShapeUtils {
    static isClockWise(points: Vector2[]): boolean;
    static area(contour: Vector2[]): number;
    static triangulateShape(contour: Vector2[], holes: Vector2[][]): number[][];
}
