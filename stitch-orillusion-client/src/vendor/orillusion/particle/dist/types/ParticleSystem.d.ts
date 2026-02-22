/// <reference types="@webgpu/types" />
import { RenderNode, GeometryBase, Ctor, View3D, Material } from "@orillusion/core";
import { ParticleSimulator } from "./simulator/ParticleSimulator";
/**
 * A particle system can simulate and render many small images or geometries, it called particles to produce visual effects
 * @group Particle
 */
export declare class ParticleSystem extends RenderNode {
    /**
     * whether the animation will auto play
     */
    autoPlay: boolean;
    /**
     * the simulator of particle.
     */
    particleSimulator: ParticleSimulator;
    /**
     * playing status
     */
    playing: boolean;
    /**
     * animation playing speed
     */
    playSpeed: number;
    constructor();
    /**
     * material
     */
    get material(): Material;
    set material(value: Material);
    /**
     * The geometry of the mesh determines its shape
     */
    get geometry(): GeometryBase;
    set geometry(value: GeometryBase);
    /**
     * Set preheat time(second)
     */
    set preheatTime(value: number);
    /**
     * Get preheat time(second)
     */
    get preheatTime(): number;
    /**
     * Set particle simulator's looping
     */
    set looping(value: boolean);
    /**
     * Get particle simulator's looping
     */
    get looping(): boolean;
    init(): void;
    /**
     * Set to use the specified particle emulator
     * @param c class of particle emulator
     */
    useSimulator<T extends ParticleSimulator>(c: Ctor<T>): ParticleSimulator;
    /**
     * start to play animation, with a speed value
     * @param speed playSpeed, see{@link playSpeed}
     */
    play(speed?: number): void;
    /**
     * stop playing
     */
    stop(): void;
    start(): void;
    private _frame;
    private _time;
    onCompute(view: View3D, command: GPUCommandEncoder): void;
}
