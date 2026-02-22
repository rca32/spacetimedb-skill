import { Ctor } from "@orillusion/core";
import { ParticleData } from '../data/ParticleData';
import { ParticleBuffer } from './ParticleBuffer';
/**
 * @internal
 * particle data for each quad
 * @group Plugin
 */
export declare class ParticleLocalMemory extends ParticleBuffer {
    particlesData: ParticleData[];
    onChange: boolean;
    allocationParticle<T extends ParticleData>(count: number, c: Ctor<T>): void;
}
