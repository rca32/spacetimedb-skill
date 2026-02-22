/// <reference types="@webgpu/types" />
import { Texture } from './Texture';
/**
 * @internal
 * @group GFX
 */
export declare class TextureMipmapGenerator {
    private static mipmapShader;
    private static pipelineCache;
    private static pipeline;
    static getMipmapPipeline(texture: Texture): GPURenderPipeline;
    static webGPUGenerateMipmap(texture: Texture): void;
    static getMipmapCount(width: number, height: number): number;
}
