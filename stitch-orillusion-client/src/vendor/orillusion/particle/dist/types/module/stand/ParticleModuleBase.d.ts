import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleSimulator } from '../../simulator/ParticleSimulator';
/**
 * @internal
 * @group Plugin
 */
export declare class ParticleModuleBase {
    protected _simulator: ParticleSimulator;
    private __init;
    protected init(): void;
    set needReset(v: boolean);
    get needReset(): boolean;
    setSimulator(simulator: ParticleSimulator): void;
    calculateParticle(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
