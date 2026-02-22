/// <reference types="@webgpu/types" />
import { ComputeShader, Ctor } from "@orillusion/core";
import { ParticleSystem } from '../ParticleSystem';
import { ParticleGlobalMemory } from '../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from '../module/stand/ParticleModuleBase';
/**
 * enumerate particle simulator space.
 */
export declare enum SimulatorSpace {
    Local = 0,
    World = 1
}
/**
 * @internal
 * @group Particle
 */
export declare class ParticleSimulator {
    maxParticle: number;
    needReset: boolean;
    /**
     * preheat time
     */
    preheatTime: number;
    protected _simulatorSpace: SimulatorSpace;
    /**
     * Set particle simulator space. see {@link SimulatorSpace}
     */
    set simulatorSpace(v: SimulatorSpace);
    /**
     * Get particle simulator space.
     */
    get simulatorSpace(): SimulatorSpace;
    /**
     * particle data for each quad
     */
    particleLocalMemory: ParticleLocalMemory;
    /**
     * global particle data for all quad
     */
    particleGlobalMemory: ParticleGlobalMemory;
    protected _particleModules: Map<string, ParticleModuleBase>;
    protected _computes: ComputeShader[];
    protected _looping: boolean;
    protected _particleSystem: ParticleSystem;
    constructor();
    /**
     * Set need to loop animation
     */
    set looping(value: boolean);
    /**
     * Get need to loop animation
     */
    get looping(): boolean;
    /**
     * add a particle module
     * @param c class of particle module
     */
    addModule<T extends ParticleModuleBase>(c: Ctor<T>): T;
    /**
     * Get particle module
     * @param c class of particle module
     */
    getModule<T extends ParticleModuleBase>(c: Ctor<T>): T;
    /**
     * Remove particle module
     * @param c class of particle module
     */
    removeModule<T extends ParticleModuleBase>(c: Ctor<T>): void;
    protected initBuffer(ps: ParticleSystem): void;
    build(): void;
    protected generateParticleGlobalData(): void;
    protected generateParticleLocalData(): void;
    protected initPipeline(): void;
    compute(command: GPUCommandEncoder): void;
    updateBuffer(delta: number): void;
    debug(): void;
}
