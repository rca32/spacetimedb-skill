/// <reference types="@webgpu/types" />
import { ParticleSimulator } from './ParticleSimulator';
/**
 * @internal
 * @group Particle
 */
export declare class ParticleMassSimulator extends ParticleSimulator {
    constructor();
    protected initPipeline(): void;
    protected generateGlobalParticleData(): void;
    compute(command: GPUCommandEncoder): void;
}
