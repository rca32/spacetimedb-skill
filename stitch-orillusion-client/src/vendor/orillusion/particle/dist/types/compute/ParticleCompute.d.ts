/// <reference types="@webgpu/types" />
/**
 * @internal
 * @group Plugin
 */
export declare class ParticleCompute {
    private _computePipeline;
    private _computeBindGroup;
    constructor(computeShader: string, entries: GPUBindGroupEntry[]);
    compute(command: GPUCommandEncoder, workgroupCountX: GPUSize32, workgroupCountY?: GPUSize32, workgroupCountZ?: GPUSize32): void;
}
