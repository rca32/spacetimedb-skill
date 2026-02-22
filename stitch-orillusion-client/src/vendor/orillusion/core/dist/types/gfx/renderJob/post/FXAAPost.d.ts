import { PostBase } from './PostBase';
import { View3D } from '../../../core/View3D';
import { ViewQuad } from '../../../core/ViewQuad';
import { RenderTexture } from '../../../textures/RenderTexture';
/**
 * FXAA(fast approximate antialiasing)
 * A deformation anti-aliasing method that pays more attention to performance.
 * It only needs one pass to get the result. FXAA focuses on fast visual anti-aliasing effect,
 * rather than pursuing perfect real anti-aliasing effect.
 * @group Post Effects
 */
export declare class FXAAPost extends PostBase {
    postQuad: ViewQuad;
    renderTexture: RenderTexture;
    constructor();
    onResize(): void;
    /**
     * @internal
     */
    onAttach(view: View3D): void;
    /**
     * @internal
     */
    onDetach(view: View3D): void;
}
