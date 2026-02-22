import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * @internal
 * @group Particle
 */
export declare class ParticleSpeedDirModule extends ParticleModuleBase {
    private _enable;
    get enable(): boolean;
    set enable(value: boolean);
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
