import { MinMaxCurve, Vector3 } from "@orillusion/core";
import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleStandardData } from '../../data/ParticleStandardData';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * enum shape of all particle emitter shapes
 * @group Particle
 */
export declare enum ShapeType {
    /**
     * Box shape
     */
    Box = 0,
    /**
     * Circle shape
     */
    Circle = 1,
    /**
     * Cone shape
     */
    Cone = 2,
    /**
     * Sphere shape
     */
    Sphere = 3,
    /**
     * Hemisphere shape
     */
    Hemisphere = 4
}
/**
 * enum emit loaction
 * @group Particle
 */
export declare enum EmitLocation {
    /**
     * particles will emit from default location
     */
    Default = 0,
    /**
     * particles will emit from the edges of the specified shape
     */
    Edge = 1,
    /**
     * particles will emit from the shells of the specified shape
     */
    Shell = 2,
    /**
     * particles will emit from the volume of the specified shape
     */
    Volume = 3
}
/**
 * Particle module of emit
 * @group Particle
 */
export declare class ParticleEmitterModule extends ParticleModuleBase {
    /**
     * Set shape type of emitter
     */
    set shapeType(v: ShapeType);
    /**
     * Get shape type of emitter
     */
    get shapeType(): ShapeType;
    private _shapeType;
    /**
    * Set emit location of emitter
    */
    set emitLocation(v: EmitLocation);
    /**
    * Get emit location of emitter
    */
    get emitLocation(): EmitLocation;
    private _emitLocation;
    /**
     * Set particle emitter angle
     * When shapeType is cone, this value is the size of the cylindrical opening
     */
    set angle(v: number);
    /**
     * Get particle emitter angle
     */
    get angle(): number;
    private _angle;
    /**
     * Set particle emitter radus
     */
    set radius(v: number);
    /**
     * Get particle emitter radus
     */
    get radius(): number;
    private _radius;
    /**
     * Set box size, only when the shape is box
     */
    set boxSize(v: Vector3);
    /**
     * Get box size
     */
    get boxSize(): Vector3;
    private _boxSize;
    /**
     * Set random seed
     */
    set randSeed(v: number);
    /**
     * Get random seed
     */
    get randSeed(): number;
    private _rand;
    /**
     * Set max number of quad in this particle
     */
    set maxParticle(value: number);
    /**
     * Get max number of quad in this particle
     */
    get maxParticle(): number;
    private _maxParticle;
    /**
     * Set emit rate. How many quad are allowed to be emitted per second
     */
    set emissionRate(v: number);
    /**
     * Get emit rate.
     */
    get emissionRate(): number;
    private _emissionRate;
    /**
     * Set duration of emitted particles
     */
    set duration(v: number);
    /**
     * Get duration of emitted particles
     */
    get duration(): number;
    private _duration;
    /**
     * Set life cycle of each quad
     */
    set startLifecycle(v: MinMaxCurve);
    /**
     * Get life cycle of each quad
     */
    get startLifecycle(): MinMaxCurve;
    private _startLifecycle;
    /**
     * Set velocity speed of X-axis component
     */
    set startVelocityX(value: MinMaxCurve);
    /**
     * Get velocity speed of X-axis component
     */
    get startVelocityX(): MinMaxCurve;
    /**
     * Set velocity speed of Y-axis component
     */
    set startVelocityY(value: MinMaxCurve);
    /**
     * Get velocity speed of Y-axis component
     */
    get startVelocityY(): MinMaxCurve;
    /**
     * Set velocity speed of Z-axis component
     */
    set startVelocityZ(value: MinMaxCurve);
    /**
     * Get velocity speed of Z-axis component
     */
    get startVelocityZ(): MinMaxCurve;
    private _startVelocity;
    /**
     * Set init scale of each quad
    */
    set startScale(v: MinMaxCurve);
    /**
     * Get init scale of each quad
    */
    get startScale(): MinMaxCurve;
    /**
     * Set the scaling value of each quad on the x-axis
    */
    set startScaleX(v: MinMaxCurve);
    /**
     * Get the scaling value of each quad on the x-axis
    */
    get startScaleX(): MinMaxCurve;
    /**
     * Set the scaling value of each quad on the y-axis
    */
    set startScaleY(v: MinMaxCurve);
    /**
     * Get the scaling value of each quad on the y-axis
    */
    get startScaleY(): MinMaxCurve;
    /**
     * Set the scaling value of each quad on the z-axis
    */
    set startScaleZ(v: MinMaxCurve);
    /**
     * Get the scaling value of each quad on the z-axis
    */
    get startScaleZ(): MinMaxCurve;
    private _startScaleXYZ;
    /**
     * Is the scaling of quads different on each axis
     */
    isUseStartScaleXYZ(): boolean;
    /**
     * Set init rotation of each quad
     */
    set startRotation(v: MinMaxCurve);
    /**
     * Get init rotation of each quad
     */
    get startRotation(): MinMaxCurve;
    /**
     * Set the rotation of each quad on the x-axis
     */
    set startRotationX(v: MinMaxCurve);
    /**
     * Get the rotation of each quad on the x-axis
     */
    get startRotationX(): MinMaxCurve;
    /**
     * Set the rotation of each quad on the y-axis
     */
    set startRotationY(v: MinMaxCurve);
    /**
     * Get the rotation of each quad on the y-axis
     */
    get startRotationY(): MinMaxCurve;
    /**
     * Set the rotation of each quad on the z-axis
     */
    set startRotationZ(v: MinMaxCurve);
    /**
     * Get the rotation of each quad on the z-axis
     */
    get startRotationZ(): MinMaxCurve;
    private _startRotationXYZ;
    /**
     * Is the rotation of quads different on each axis
     */
    isUseStartRotationXYZ(): boolean;
    /**
     * @private
     */
    protected init(): void;
    /**
     * Genarate particle emit module
     * @param globalMemory
     * @param localMemory
     */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
    protected calculateBoxShapeParticlePos(pd: ParticleStandardData): void;
    protected calculateCircleShapeParticlePos(pd: ParticleStandardData): void;
    protected calculateConeShapeParticlePos(pd: ParticleStandardData): void;
    protected calculateSphereShapeParticlePos(pd: ParticleStandardData): void;
    protected calculateHemisphereShapeParticlePos(pd: ParticleStandardData): void;
}
