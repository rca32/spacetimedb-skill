import { MemoryInfo } from "@orillusion/core";
import { ParticleData } from './ParticleData';
/**
 * @internal
 * particle mass data
 * @group Plugin
 */
export declare class ParticleMassData extends ParticleData {
    position: MemoryInfo;
    velocity: MemoryInfo;
    force: MemoryInfo;
    density: MemoryInfo;
    pressure: MemoryInfo;
    data1: MemoryInfo;
    data2: MemoryInfo;
    constructor();
    static generateParticleData(): ParticleMassData;
}
