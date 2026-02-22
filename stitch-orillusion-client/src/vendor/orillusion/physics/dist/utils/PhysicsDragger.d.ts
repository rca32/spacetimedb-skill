/**
 * PhysicsDragger 类用于通过鼠标操作拖拽3D物体。
 * 利用物理引擎中的射线检测与刚体交互，实现物体的实时拖拽效果。
 */
export declare class PhysicsDragger {
    private _view;
    private _interactionDepth;
    private _rigidBody;
    private _rayStart;
    private _rayEnd;
    private _raycastResult;
    private _isDragging;
    private _hitPoint;
    private _offset;
    private _enable;
    get enable(): boolean;
    /**
     * 是否启用拖拽功能
     */
    set enable(value: boolean);
    /**
     * 是否过滤静态刚体对象，默认值为 `true`
     */
    filterStatic: boolean;
    /**
     * 设置射线过滤组
     */
    set collisionFilterGroup(value: number);
    /**
     * 设置射线过滤掩码
     */
    set collisionFilterMask(value: number);
    constructor();
    private initRaycast;
    private tryRegisterEvents;
    private registerEvents;
    private unregisterEvents;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    private onMouseWheel;
    private resetRayCallback;
    private castRay;
    private updateRigidBody;
    private resetState;
}
