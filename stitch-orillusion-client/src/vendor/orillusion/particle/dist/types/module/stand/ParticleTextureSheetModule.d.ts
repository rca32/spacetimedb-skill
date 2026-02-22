import { ParticleGlobalMemory } from '../../buffer/ParticleGlobalMemory';
import { ParticleLocalMemory } from '../../buffer/ParticleLocalMemory';
import { ParticleModuleBase } from './ParticleModuleBase';
/**
 * Particle Module of texture sheet
 * @group Particle
 */
export declare class ParticleTextureSheetModule extends ParticleModuleBase {
    /**
     * The number of columns in the texture sheet
     */
    clipCol: number;
    /**
     * The total number of clips texture sheet
     */
    totalClip: number;
    /**
     * playing speed
     */
    playRate: number;
    /**
     * Texture width
     */
    textureWidth: number;
    /**
     * Texture Height
     */
    textureHeight: number;
    /**
     * play mode
     */
    playMode: number;
    /**
    * Genarate particle texture sheet module: such as clip col, total clip, play speed.
    * @param globalMemory
    * @param localMemory
    *
    */
    generateParticleModuleData(globalMemory: ParticleGlobalMemory, localMemory: ParticleLocalMemory): void;
}
