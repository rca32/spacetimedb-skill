import { Object3D } from "../core/entities/Object3D";
/**
 * An object contains grids - two dimensional arrrys of lines
 * @group Util
 */
export declare class GridObject extends Object3D {
    size: number;
    divisions: number;
    constructor(size?: number, divisions?: number);
    private buildGeometry;
    private addAxis;
}
