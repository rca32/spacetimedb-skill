import {
  BlendMode,
  Color,
  Material,
  PassType,
  RenderShaderPass,
  Shader,
  ShaderLib,
  Texture,
  Vector4,
} from '@engine/core'

export type WaterRenderProfile = 'low' | 'medium' | 'high'
export type WaterQualityLevel = 'balanced' | 'high'

export interface WaterSurfaceMaterialOptions {
  readonly depthTexture: Texture
  readonly profile: WaterRenderProfile
  readonly quality: WaterQualityLevel
  readonly phase: number
}

interface WaterProfilePreset {
  readonly shallowColor: readonly [number, number, number, number]
  readonly deepColor: readonly [number, number, number, number]
  readonly foamColor: readonly [number, number, number, number]
  readonly waveA: readonly [number, number, number, number]
  readonly waveB: readonly [number, number, number, number]
  readonly depthAlpha: readonly [number, number, number, number]
  readonly foamTime: readonly [number, number, number, number]
  readonly phaseSpec: readonly [number, number, number, number]
}

const WATER_SHADER_KEY = 'StitchWaterSurfaceShaderV1'
let waterShaderRegistered = false

const WATER_SURFACE_SHADER = /* wgsl */ `
#include "Common_vert"
#include "Common_frag"
#include "UnLit_frag"

struct WaterUniform {
  shallowColor: vec4<f32>,
  deepColor: vec4<f32>,
  foamColor: vec4<f32>,
  waveA: vec4<f32>,
  waveB: vec4<f32>,
  depthAlpha: vec4<f32>,
  foamTime: vec4<f32>,
  phaseSpec: vec4<f32>,
};

@group(2) @binding(0)
var<uniform> materialUniform: WaterUniform;

@group(1) @binding(auto)
var waterDepthMapSampler: sampler;

@group(1) @binding(auto)
var waterDepthMap: texture_2d<f32>;

fn vert(inputData: VertexAttributes) -> VertexOutput {
  var vertex = inputData;
  let uv = vertex.uv.xy;
  let waveSample = textureSampleLevel(waterDepthMap, waterDepthMapSampler, uv, 0.0).rg;
  let mask = waveSample.g;

  let phase = materialUniform.phaseSpec.x;
  let t = materialUniform.foamTime.w;

  let waveA = sin(t * materialUniform.waveA.w + uv.x * materialUniform.waveA.y + uv.y * materialUniform.waveA.z + phase) * materialUniform.waveA.x;
  let waveB = cos(t * materialUniform.waveB.w + uv.x * materialUniform.waveB.y - uv.y * materialUniform.waveB.z + phase * 0.61) * materialUniform.waveB.x;
  vertex.position.y = vertex.position.y + (waveA + waveB) * mask;

  ORI_Vert(vertex);
  return ORI_VertexOut;
}

fn hash12(p: vec2<f32>) -> f32 {
  let h = dot(p, vec2<f32>(127.1, 311.7));
  return fract(sin(h) * 43758.5453);
}

fn frag() {
  let uv = ORI_VertexVarying.fragUV0.xy;
  let depthMask = textureSample(waterDepthMap, waterDepthMapSampler, uv).rg;
  let depthNorm = clamp(depthMask.r, 0.0, 1.0);
  let waterMask = depthMask.g;

  if (waterMask < 0.02) {
    discard;
  }

  var normal = ORI_VertexVarying.vWorldNormal;
  if (!ORI_VertexVarying.face) {
    normal = -normal;
  }
  normal = normalize(normal);

  let worldPos = ORI_VertexVarying.vWorldPos.xyz;
  let viewDir = normalize(globalUniform.CameraPos.xyz - worldPos);

  let depthColorT = pow(depthNorm, materialUniform.depthAlpha.x);
  var surfaceColor = mix(materialUniform.shallowColor.rgb, materialUniform.deepColor.rgb, depthColorT);

  let fresnel = pow(max(0.0, 1.0 - max(dot(normal, viewDir), 0.0)), materialUniform.depthAlpha.w);

  let phase = materialUniform.phaseSpec.x;
  let t = materialUniform.foamTime.w;
  let foamBand = 1.0 - smoothstep(materialUniform.foamTime.x, materialUniform.foamTime.y, depthNorm);
  let foamUv = uv * materialUniform.phaseSpec.z + vec2<f32>(t * 0.05, phase * 0.37);
  let foamNoise = hash12(foamUv) * 0.55 + hash12(foamUv * 1.93 + vec2<f32>(phase, t * 0.08)) * 0.45;
  let foamWave = 0.5 + 0.5 * sin((uv.x + uv.y) * 20.0 + t * 1.9 + phase * 1.7);
  let foam = foamBand * materialUniform.foamTime.z * smoothstep(0.35, 0.95, foamNoise + foamWave * 0.35);
  surfaceColor = mix(surfaceColor, materialUniform.foamColor.rgb, clamp(foam, 0.0, 1.0));

  let spec = fresnel * materialUniform.phaseSpec.y;
  surfaceColor += vec3<f32>(spec);

  var alpha = mix(materialUniform.depthAlpha.y, materialUniform.depthAlpha.z, depthColorT);
  alpha = clamp(alpha + fresnel * 0.08 + foam * 0.2, 0.02, 1.0);

  ORI_ShadingInput.BaseColor = vec4<f32>(surfaceColor, alpha);
  UnLit();
}
`

export class WaterSurfaceMaterial extends Material {
  private readonly foamTime: Vector4
  private readonly phaseSpec: Vector4

  constructor(options: WaterSurfaceMaterialOptions) {
    super()
    ensureWaterShaderRegistered()

    const preset = createWaterPreset(options.profile, options.quality)
    const shader = new Shader()
    const colorPass = new RenderShaderPass(WATER_SHADER_KEY, WATER_SHADER_KEY)
    colorPass.passType = PassType.COLOR
    colorPass.setShaderEntry('VertMain', 'FragMain')
    colorPass.doubleSide = true

    colorPass.setUniformColor('shallowColor', toColor(preset.shallowColor))
    colorPass.setUniformColor('deepColor', toColor(preset.deepColor))
    colorPass.setUniformColor('foamColor', toColor(preset.foamColor))

    colorPass.setUniformVector4('waveA', toVector4(preset.waveA))
    colorPass.setUniformVector4('waveB', toVector4(preset.waveB))
    colorPass.setUniformVector4('depthAlpha', toVector4(preset.depthAlpha))

    this.foamTime = toVector4(preset.foamTime)
    this.foamTime.w = 0
    colorPass.setUniformVector4('foamTime', this.foamTime)

    this.phaseSpec = toVector4(preset.phaseSpec)
    this.phaseSpec.x = options.phase
    colorPass.setUniformVector4('phaseSpec', this.phaseSpec)

    colorPass.setTexture('waterDepthMap', options.depthTexture)

    const state = colorPass.shaderState
    state.acceptShadow = false
    state.receiveEnv = false
    state.acceptGI = false
    state.useLight = false
    state.castShadow = false
    state.transparent = true
    state.blendMode = BlendMode.ALPHA
    state.depthWriteEnabled = false
    state.useZ = true

    shader.addRenderPass(colorPass)
    this.shader = shader

    this.transparent = true
    this.blendMode = BlendMode.ALPHA
    this.depthWriteEnabled = false
    this.doubleSide = true
    this.acceptShadow = false
    this.castShadow = false
  }

  setDepthTexture(texture: Texture): void {
    this.shader.setTexture('waterDepthMap', texture)
  }

  setTime(seconds: number): void {
    this.foamTime.w = seconds
    this.shader.setUniformVector4('foamTime', this.foamTime)
  }

  setChunkPhase(phase: number): void {
    this.phaseSpec.x = phase
    this.shader.setUniformVector4('phaseSpec', this.phaseSpec)
  }
}

export function createWaterSurfaceMaterial(options: WaterSurfaceMaterialOptions): WaterSurfaceMaterial {
  return new WaterSurfaceMaterial(options)
}

function ensureWaterShaderRegistered(): void {
  if (waterShaderRegistered) {
    return
  }
  try {
    ShaderLib.register(WATER_SHADER_KEY, WATER_SURFACE_SHADER)
  } catch {
    // During HMR, shader key may already exist in ShaderLib.
  }
  waterShaderRegistered = true
}

function toColor(value: readonly [number, number, number, number]): Color {
  return new Color(value[0], value[1], value[2], value[3])
}

function toVector4(value: readonly [number, number, number, number]): Vector4 {
  return new Vector4(value[0], value[1], value[2], value[3])
}

function createWaterPreset(profile: WaterRenderProfile, quality: WaterQualityLevel): WaterProfilePreset {
  const base = BASE_PRESETS[profile]
  const qualityWaveScale = quality === 'high' ? 1.25 : 1
  const qualityFoamScale = quality === 'high' ? 1.18 : 1
  const qualitySpecScale = quality === 'high' ? 1.16 : 1
  const qualityNoiseScale = quality === 'high' ? 1.2 : 1

  return {
    shallowColor: base.shallowColor,
    deepColor: base.deepColor,
    foamColor: base.foamColor,
    waveA: [
      base.waveA[0] * qualityWaveScale,
      base.waveA[1],
      base.waveA[2],
      base.waveA[3],
    ],
    waveB: [
      base.waveB[0] * qualityWaveScale,
      base.waveB[1],
      base.waveB[2],
      base.waveB[3],
    ],
    depthAlpha: base.depthAlpha,
    foamTime: [
      base.foamTime[0],
      base.foamTime[1],
      base.foamTime[2] * qualityFoamScale,
      base.foamTime[3],
    ],
    phaseSpec: [
      base.phaseSpec[0],
      base.phaseSpec[1] * qualitySpecScale,
      base.phaseSpec[2] * qualityNoiseScale,
      base.phaseSpec[3],
    ],
  }
}

const BASE_PRESETS: Record<WaterRenderProfile, WaterProfilePreset> = {
  low: {
    shallowColor: [0.2, 0.46, 0.64, 1],
    deepColor: [0.06, 0.25, 0.41, 1],
    foamColor: [0.82, 0.89, 0.93, 1],
    waveA: [0.02, 8.5, 6.8, 1.05],
    waveB: [0.014, 11.6, 10.2, 1.48],
    depthAlpha: [0.95, 0.32, 0.56, 4.7],
    foamTime: [0.04, 0.27, 0.32, 0],
    phaseSpec: [0, 0.085, 42, 0],
  },
  medium: {
    shallowColor: [0.2, 0.48, 0.7, 1],
    deepColor: [0.05, 0.24, 0.43, 1],
    foamColor: [0.86, 0.92, 0.96, 1],
    waveA: [0.03, 9.8, 7.4, 1.15],
    waveB: [0.02, 12.9, 11.1, 1.62],
    depthAlpha: [0.9, 0.34, 0.6, 4.8],
    foamTime: [0.045, 0.3, 0.38, 0],
    phaseSpec: [0, 0.1, 48, 0],
  },
  high: {
    shallowColor: [0.19, 0.5, 0.72, 1],
    deepColor: [0.04, 0.22, 0.45, 1],
    foamColor: [0.88, 0.94, 0.98, 1],
    waveA: [0.038, 10.5, 8.1, 1.28],
    waveB: [0.025, 14.1, 12.4, 1.74],
    depthAlpha: [0.85, 0.36, 0.64, 4.9],
    foamTime: [0.05, 0.33, 0.42, 0],
    phaseSpec: [0, 0.12, 56, 0],
  },
}
