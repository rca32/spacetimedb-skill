import { Vector3 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * Particle module of gravity modifier
 * @group Particle
 */
export declare class ParticleGravityModifierModule extends ParticleModuleBase {
    /**
     * Set gravity
     */
    set gravity(value: Vector3);
    /**
     * Get gravity
     */
    get gravity(): Vector3;
    private _gravity;
    /**
     * Genarate particle gravity module
     * @param globalMemory
     * @param localMemory
     */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
