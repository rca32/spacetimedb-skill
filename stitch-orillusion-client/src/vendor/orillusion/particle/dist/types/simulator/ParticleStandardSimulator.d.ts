import { ParticleEmitterModule } from "../module/stand/ParticleEmitterModule";
import { ParticleSimulator } from "./ParticleSimulator";
/**
 * Standard particle simulator
 * @group Particle
 */
export declare class ParticleStandardSimulator extends ParticleSimulator {
    protected _emitterModule: ParticleEmitterModule;
    constructor();
    /**
     * Get maximum number of active particles(read only)
     */
    get maxActiveParticle(): number;
    protected generateParticleGlobalData(): void;
    protected generateParticleLocalData(): void;
    protected initPipeline(): void;
}
