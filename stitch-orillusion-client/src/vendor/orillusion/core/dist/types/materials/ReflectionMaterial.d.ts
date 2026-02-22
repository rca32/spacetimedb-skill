import { Texture } from '../gfx/graphics/webGpu/core/texture/Texture';
import { Color } from '../math/Color';
import { Material } from './Material';
/**
 * Unlit Mateiral
 * A non glossy surface material without specular highlights.
 * @group Material
 */
export declare class ReflectionMaterial extends Material {
    /**
     * @constructor
     */
    constructor();
    set baseMap(texture: Texture);
    get baseMap(): Texture;
    /**
     * set base color (tint color)
     */
    set baseColor(color: Color);
    set reflectionIndex(i: number);
    /**
     * get base color (tint color)
     */
    get baseColor(): Color;
    /**
     * set environment texture, usually referring to cubemap
     */
    set envMap(texture: Texture);
    /**
     * @internal
     * set shadow map
     */
    set shadowMap(texture: Texture);
}
