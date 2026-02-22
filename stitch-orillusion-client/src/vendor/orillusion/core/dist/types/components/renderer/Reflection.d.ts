/// <reference types="@webgpu/types" />
import { View3D } from '../../core/View3D';
import { ClusterLightingBuffer } from '../../gfx/renderJob/passRenderer/cluster/ClusterLightingBuffer';
import { RendererPassState } from '../../gfx/renderJob/passRenderer/state/RendererPassState';
import { PassType } from '../../gfx/renderJob/passRenderer/state/PassType';
import { RenderNode } from './RenderNode';
/**
 *
 * Sky Box Renderer Component
 * @group Components
 */
export declare class Reflection extends RenderNode {
    gid: number;
    needUpdate: boolean;
    autoUpdate: boolean;
    radius: number;
    init(): void;
    onEnable(): void;
    onDisable(): void;
    renderPass2(view: View3D, passType: PassType, rendererPassState: RendererPassState, clusterLightingBuffer: ClusterLightingBuffer, encoder: GPURenderPassEncoder, useBundle?: boolean): void;
}
