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
} from '@orillusion/core'
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
      return
    }

    if (profile === 'medium') {
      this.taa.enable = true
      this.gtao.enable = true
      this.bloom.enable = true
      this.ssr.enable = false
      this.fog.enable = true
      this.fxaa.enable = false

      if (postSettings.gtao) {
        postSettings.gtao.maxDistance = 4
      }
      if (postSettings.bloom) {
        postSettings.bloom.bloomIntensity = 0.7
      }
      return
    }

    this.taa.enable = true
    this.gtao.enable = true
    this.bloom.enable = true
    this.ssr.enable = true
    this.fog.enable = true
    this.fxaa.enable = false

    if (postSettings.gtao) {
      postSettings.gtao.maxDistance = 6
    }
    if (postSettings.bloom) {
      postSettings.bloom.bloomIntensity = 1.1
    }
    if (postSettings.ssr) {
      postSettings.ssr.fadeEdgeRatio = 0.1
    }
  }
}
