import { View3D } from "../../../../../../core/View3D";
import { RenderTexture } from "../../../../../../textures/RenderTexture";
import { StorageGPUBuffer } from "../../buffer/StorageGPUBuffer";
import { Texture } from "../../texture/Texture";
/**
 * @internal
 * @group GFX
 */
export declare class ReflectionEntries {
    storageGPUBuffer: StorageGPUBuffer;
    reflectionMap: Texture;
    sourceReflectionMap: RenderTexture;
    count: number;
    constructor();
    update(view: View3D): void;
}
