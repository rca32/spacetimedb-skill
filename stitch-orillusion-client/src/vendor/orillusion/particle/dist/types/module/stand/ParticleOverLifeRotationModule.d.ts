import { Vector4 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * Particle module of rotation over life time
 * @group Particle
 */
export declare class ParticleOverLifeRotationModule extends ParticleModuleBase {
    /**
     * Describe the rotation of particles from birth to end
     */
    rotationSegments: Vector4[];
    /**
     * Genarate particle rotation module with type over life time
     * @param globalMemory
     * @param localMemory
     */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
