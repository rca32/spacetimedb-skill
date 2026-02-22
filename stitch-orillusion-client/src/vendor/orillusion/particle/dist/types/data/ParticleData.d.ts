import { MemoryInfo } from "@orillusion/core";
/**
 * @internal
 * particle data
 * @group Plugin
 */
export declare class ParticleData {
    constructor();
    totalCount: number;
    memoryList: MemoryInfo[];
    getUint32(): MemoryInfo;
    getFloat(): MemoryInfo;
    getVec2(): MemoryInfo;
    getVec3(): MemoryInfo;
    getVec4(): MemoryInfo;
}
