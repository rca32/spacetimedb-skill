import {
  BloomPost,
  Engine3D,
  FXAAPost,
  GTAOPost,
  GlobalFog,
  PostProcessingComponent,
  SSRPost,
  Scene3D,
  TAAPost,
} from '@engine/core'
import type { PostFxProfile } from '../infra/config'

export class PostFxPipelineController {
  private readonly post
  private readonly taa
  private readonly gtao
  private readonly bloom
  private readonly fog
  private readonly ssr
  private readonly fxaa

  constructor(scene: Scene3D) {
    this.post = scene.getOrAddComponent(PostProcessingComponent)
    this.taa = this.post.addPost(TAAPost)
    this.gtao = this.post.addPost(GTAOPost)
    this.bloom = this.post.addPost(BloomPost)
    this.fog = this.post.addPost(GlobalFog)
    this.ssr = this.post.addPost(SSRPost)
    this.fxaa = this.post.addPost(FXAAPost)
  }

  applyProfile(profile: PostFxProfile): void {
    const postSettings = Engine3D.setting.render.postProcessing

    if (profile === 'low') {
      this.taa.enable = false
      this.gtao.enable = false
      this.bloom.enable = false
      this.ssr.enable = false
      this.fog.enable = true
      this.fxaa.enable = true
      this.setFogProfile({
        start: 28,
        end: 320,
        density: 0.018,
        ins: 0.12,
        skyFactor: 0.22,
        skyRoughness: 0.34,
        falloff: 1.1,
        rayLength: 0.44,
      })
      return
    }

    if (profile === 'medium') {
      this.taa.enable = true
      this.gtao.enable = true
      this.bloom.enable = true
      this.ssr.enable = false
      this.fog.enable = true
      this.fxaa.enable = false

      this.taa.blendFactor = 0.88
      this.taa.sharpFactor = 0.2
      if (postSettings.gtao) {
        postSettings.gtao.maxDistance = 3.8
      }
      if (postSettings.bloom) {
        postSettings.bloom.bloomIntensity = 0.55
        postSettings.bloom.luminanceThreshole = 1.2
      }
      this.setFogProfile({
        start: 22,
        end: 280,
        density: 0.022,
        ins: 0.16,
        skyFactor: 0.24,
        skyRoughness: 0.3,
        falloff: 1.2,
        rayLength: 0.48,
      })
      return
    }

    this.taa.enable = true
    this.gtao.enable = true
    this.bloom.enable = true
    this.ssr.enable = true
    this.fog.enable = true
    this.fxaa.enable = false

    this.taa.blendFactor = 0.9
    this.taa.sharpFactor = 0.18
    if (postSettings.gtao) {
      postSettings.gtao.maxDistance = 5.2
    }
    if (postSettings.bloom) {
      postSettings.bloom.bloomIntensity = 0.82
      postSettings.bloom.luminanceThreshole = 1.1
    }
    this.ssr.fadeEdgeRatio = 0.16
    this.ssr.rayMarchRatio = 0.6
    this.ssr.roughnessThreshold = 0.72
    this.ssr.fadeDistanceMin = 0.35
    this.ssr.fadeDistanceMax = 92
    this.setFogProfile({
      start: 16,
      end: 240,
      density: 0.026,
      ins: 0.18,
      skyFactor: 0.26,
      skyRoughness: 0.26,
      falloff: 1.28,
      rayLength: 0.52,
    })
  }

  private setFogProfile(profile: {
    readonly start: number
    readonly end: number
    readonly density: number
    readonly ins: number
    readonly skyFactor: number
    readonly skyRoughness: number
    readonly falloff: number
    readonly rayLength: number
  }): void {
    this.fog.start = profile.start
    this.fog.end = profile.end
    this.fog.density = profile.density
    this.fog.ins = profile.ins
    this.fog.skyFactor = profile.skyFactor
    this.fog.skyRoughness = profile.skyRoughness
    this.fog.falloff = profile.falloff
    this.fog.rayLength = profile.rayLength
  }
}
