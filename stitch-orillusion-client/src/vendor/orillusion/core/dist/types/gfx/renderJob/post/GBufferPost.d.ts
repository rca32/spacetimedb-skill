/// <reference types="@webgpu/types" />
import { VirtualTexture } from '../../../textures/VirtualTexture';
import { UniformGPUBuffer } from '../../graphics/webGpu/core/buffer/UniformGPUBuffer';
import { ComputeShader } from '../../graphics/webGpu/shader/ComputeShader';
import { RendererPassState } from '../passRenderer/state/RendererPassState';
import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
import { RTFrame } from '../frame/RTFrame';
import { RenderTexture } from '../../../textures/RenderTexture';
/**
 * Ground base Ambient Occlusion
 * Let the intersection of the object and the object imitate the effect of the light being cross-occluded
 * ```
 * gtao setting
 * let cfg = {@link Engine3D.setting.render.postProcessing.gtao};
 *```
 * @group Post Effects
 */
export declare class GBufferPost extends PostBase {
    /**
     * @internal
     */
    outTexture: VirtualTexture;
    /**
     * @internal
     */
    rendererPassState: RendererPassState;
    rtFrame: RTFrame;
    view: View3D;
    gBufferTexture: RenderTexture;
    testCompute: ComputeShader;
    private _state;
    private _state1;
    private _state2;
    uniformBuffer: UniformGPUBuffer;
    currentRenderTexture: RenderTexture;
    constructor();
    /**
     * @internal
     */
    onAttach(view: View3D): void;
    /**
     * @internal
     */ Render: any;
    onDetach(view: View3D): void;
    /**
     * check state
     */
    set state(v: number);
    get state(): number;
    set size1(v: number);
    get size1(): number;
    set size2(v: number);
    get size2(): number;
    private createResource;
    private createCompute;
    render(view: View3D, command: GPUCommandEncoder): void;
    compute(view: View3D): void;
    onResize(): void;
}
