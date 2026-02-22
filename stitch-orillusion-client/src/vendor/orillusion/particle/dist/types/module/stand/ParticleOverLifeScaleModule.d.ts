import { Vector4 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * Particle module of size scale over life time
 * @group Particle
 */
export declare class ParticleOverLifeScaleModule extends ParticleModuleBase {
    /**
    * Describe the size scale change of particles from birth to end
    */
    scaleSegments: Vector4[];
    /**
     * Genarate particle size scale module with type over life time
     * @param globalMemory
     * @param localMemory
     */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
