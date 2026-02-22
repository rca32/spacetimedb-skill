import { MemoryInfo, GPUBufferBase } from "@orillusion/core";
/**
 * Basic class of particle memory data
 * @group Particle
 */
export declare class ParticleBuffer extends GPUBufferBase {
    constructor(size: number, data?: Float32Array);
    alloc(name: string, byte: number): MemoryInfo;
    allocInt8(name: string): MemoryInfo;
    allocUint8(name: string): MemoryInfo;
    allocInt16(name: string): MemoryInfo;
    allocUint16(name: string): MemoryInfo;
    allocInt32(name: string): MemoryInfo;
    allocUint32(name: string): MemoryInfo;
    allocFloat32(name: string): MemoryInfo;
    allocVec2(name: string): MemoryInfo;
    allocVec3(name: string): MemoryInfo;
    allocVec4(name: string): MemoryInfo;
}
