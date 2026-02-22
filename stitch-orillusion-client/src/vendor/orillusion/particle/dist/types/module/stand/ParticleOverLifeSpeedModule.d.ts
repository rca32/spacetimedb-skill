import { Vector4 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * Particle module of move speed over life time
 * @group Particle
 */
export declare class ParticleOverLifeSpeedModule extends ParticleModuleBase {
    /**
    * Describe the velocity change of particles from birth to end
    */
    speedSegments: Vector4[];
    /**
     * Genarate particle move speed module with type over life time
     * @param globalMemory
     * @param localMemory
     *
     */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
