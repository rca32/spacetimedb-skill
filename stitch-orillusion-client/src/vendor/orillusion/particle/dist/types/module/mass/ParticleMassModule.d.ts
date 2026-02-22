import { ComputeGPUBuffer } from "@orillusion/core";
import { ParticleModuleBase } from '../stand/ParticleModuleBase';
/**
 * @internal
 * @group Plugin
 */
export declare class ParticleMassModule extends ParticleModuleBase {
    protected init(): void;
    calculateParticle(globalBuffer: ComputeGPUBuffer, localData: ComputeGPUBuffer): void;
}
