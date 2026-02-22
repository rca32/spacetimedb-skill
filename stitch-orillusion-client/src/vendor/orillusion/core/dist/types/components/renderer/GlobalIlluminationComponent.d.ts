import { Scene3D } from "../../core/Scene3D";
import { ComponentBase } from "../ComponentBase";
/**
 *
 * Global illumination component.
 * Use global illumination to achieve more realistic lighting.
 * The global illumination system can model the way light reflects
 *  or refracts on the surface to other surfaces (indirect lighting),
 *  rather than limiting that light can only shine from the light
 *  source to a certain surface.
 * @group Components
 */
export declare class GlobalIlluminationComponent extends ComponentBase {
    private _probes;
    private _volume;
    private _debugMr;
    init(scene: Scene3D): void;
    private initProbe;
    debug(): void;
    private debugProbeRay;
    private changeProbesVolumeData;
    private changeProbesPosition;
    onUpdate(): void;
}
