import { ComponentBase } from "@orillusion/core";
/**
 * Performance info stats
 * @group Plugin
 */
export declare class Stats extends ComponentBase {
    /**
     * Stats DOM container
     * with default class="stats"
     * could custom container style with css
     */
    container: HTMLElement;
    private beginTime;
    private prevTime;
    private frames;
    private fpsPanel;
    private memPanel;
    /**
     * @internal
     */
    init(): void;
    /**
     * @internal
     */
    onDisable(): void;
    /**
     * @internal
     */
    onEnable(): void;
    /**
     * @internal
     */
    stop(): void;
    /**
     * @internal
     */
    onUpdate(): void;
}
