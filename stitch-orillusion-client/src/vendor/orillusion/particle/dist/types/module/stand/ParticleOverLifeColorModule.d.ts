import { Color } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * Particle module of color change over life time
 * @group Particle
 */
export declare class ParticleOverLifeColorModule extends ParticleModuleBase {
    /**
     * Set start color
     */
    set startColor(v: Color);
    /**
     * Get start color
     */
    get startColor(): Color;
    /**
     * Set start alpha
     */
    set startAlpha(v: number);
    /**
     * Get start alpha
     */
    get startAlpha(): number;
    /**
     * Set end color
     */
    set endColor(v: Color);
    /**
     * Get end color
     */
    get endColor(): Color;
    /**
    * Set end alpha
    */
    set endAlpha(v: number);
    /**
     * Get end alpha
     */
    get endAlpha(): number;
    private _colorSegments;
    /**
     * Genarate particle color module with type over life time
     * @param globalMemory
     * @param localMemory
     */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
