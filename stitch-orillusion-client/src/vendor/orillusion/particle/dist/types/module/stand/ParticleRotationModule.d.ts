import { MinMaxCurve } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * Particle Module of rotate quad
 * @group Particle
 */
export declare class ParticleRotationModule extends ParticleModuleBase {
    /**
     * Returns angular velocity X-axis component of each quad
     */
    get angularVelocityX(): MinMaxCurve;
    /**
     * Set angular velocity X-axis component of each quad
     */
    set angularVelocityX(value: MinMaxCurve);
    /**
     * Returns angular velocity Y-axis component of each quad
     */
    get angularVelocityY(): MinMaxCurve;
    /**
     * Set angular velocity Y-axis component of each quad
     */
    set angularVelocityY(value: MinMaxCurve);
    /**
     * Returns angular velocity Z-axis component of each quad
     */
    get angularVelocityZ(): MinMaxCurve;
    /**
     * Get angular velocity Z-axis component of each quad
     */
    set angularVelocityZ(value: MinMaxCurve);
    /**
     * angular velocity of each quad
     */
    angularVelocityXYZ: MinMaxCurve[];
    /**
     * Genarate particle rotate module, init angular velocity of each quad
     * @param globalMemory
     * @param localMemory
     *
     */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
