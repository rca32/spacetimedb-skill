import { Object3D } from '../core/entities/Object3D';
/**
 * An object group contains xyz axis objects
 * @group Util
 */
export declare class AxisObject extends Object3D {
    length: number;
    thickness: number;
    constructor(length: number, thickness?: number);
    init(): void;
}
