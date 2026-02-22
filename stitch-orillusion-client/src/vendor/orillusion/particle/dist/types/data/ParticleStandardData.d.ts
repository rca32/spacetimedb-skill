import { MemoryInfo } from "@orillusion/core";
import { ParticleData } from './ParticleData';
/**
 * @internal
 * standard struct of standard particle
 * @group Plugin
 */
export declare class ParticleStandardData extends ParticleData {
    particleLifeDuration: MemoryInfo;
    start_time: MemoryInfo;
    life_time: MemoryInfo;
    hide: MemoryInfo;
    vPos: MemoryInfo;
    vRot: MemoryInfo;
    vScale: MemoryInfo;
    vColor: MemoryInfo;
    vSpeed: MemoryInfo;
    vForce_pos: MemoryInfo;
    vForce_Rot: MemoryInfo;
    vForce_Scale: MemoryInfo;
    start_pos: MemoryInfo;
    start_size: MemoryInfo;
    start_rotation: MemoryInfo;
    start_velocity: MemoryInfo;
    start_acceleration: MemoryInfo;
    start_rotVelocity: MemoryInfo;
    start_rotAcceleration: MemoryInfo;
    start_scaleVelocity: MemoryInfo;
    start_scaleAcceleration: MemoryInfo;
    start_color: MemoryInfo;
    start_angularVelocity: MemoryInfo;
    textureSheet_Frame: MemoryInfo;
    protected retain0: MemoryInfo;
    protected retain1: MemoryInfo;
    protected retain2: MemoryInfo;
    static generateParticleData(): ParticleStandardData;
}
