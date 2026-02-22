import { MemoryInfo, Vector3 } from "@orillusion/core";
import { ParticleBuffer } from './ParticleBuffer';
/**
 * @internal
 * global particle data for all quad
 * @group Plugin
 */
export declare class ParticleGlobalMemory extends ParticleBuffer {
    protected _instanceID: MemoryInfo;
    protected _maxParticles: MemoryInfo;
    protected _time: MemoryInfo;
    protected _timeDelta: MemoryInfo;
    protected _duration: MemoryInfo;
    protected _isLoop: MemoryInfo;
    protected _simulatorSpace: MemoryInfo;
    protected _retain1: MemoryInfo;
    protected _emitterPos: MemoryInfo;
    onChange: boolean;
    constructor(size: number, data?: Float32Array);
    setInstanceID(v: number): void;
    getInstanceID(): number;
    setMaxParticles(v: number): void;
    getMaxParticles(): number;
    setTime(v: number): void;
    getTime(): number;
    setTimeDelta(v: number): void;
    getTimeDelta(): number;
    setDuration(v: number): void;
    getDuration(): number;
    setSimulatorSpace(v: number): void;
    getSimulatorSpace(): number;
    setEmitterPos(pos: Vector3): void;
}
