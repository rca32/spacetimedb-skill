import { Texture, Material } from "@orillusion/core";
/**
 * material of particle renderer
 * @group Particle
 */
export declare class ParticleMaterial extends Material {
    constructor();
    set baseMap(texture: Texture);
    get baseMap(): Texture;
    set envMap(texture: Texture);
    set shadowMap(texture: Texture);
}
