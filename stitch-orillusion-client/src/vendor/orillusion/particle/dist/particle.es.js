import { GPUBufferBase as M, webGPUContext as z, MemoryInfo as f, Material as R, ShaderLib as x, Shader as D, RenderShaderPass as V, PassType as v, Vector4 as o, Color as p, GPUCompareFunction as F, Engine3D as C, BlendMode as w, Vector3 as m, Rand as X, MinMaxCurve as r, DEGREES_TO_RADIANS as u, GPUContext as L, ComputeShader as Y, RenderNode as Z, RendererMask as T, PlaneGeometry as q, Time as _ } from "@orillusion/core";
class y extends M {
  constructor(t, e) {
    super(), t > 0 && this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST, t, e);
  }
  alloc(t, e) {
    let i = this.memoryNodes.get(t);
    return i || (i = this.memory.allocation_node(e), this.memoryNodes.set(t, i)), i;
  }
  allocInt8(t) {
    return this.alloc(t, 1);
  }
  allocUint8(t) {
    return this.alloc(t, 1);
  }
  allocInt16(t) {
    return this.alloc(t, 2);
  }
  allocUint16(t) {
    return this.alloc(t, 2);
  }
  allocInt32(t) {
    return this.alloc(t, 4);
  }
  allocUint32(t) {
    return this.alloc(t, 4);
  }
  allocFloat32(t) {
    return this.alloc(t, 4);
  }
  allocVec2(t) {
    return this.alloc(t, 4 * 2);
  }
  allocVec3(t) {
    return this.alloc(t, 4 * 3);
  }
  allocVec4(t) {
    return this.alloc(t, 4 * 4);
  }
}
class O extends y {
  particlesData = [];
  onChange = !1;
  allocationParticle(t, e) {
    if (this.particlesData.length >= t)
      return;
    for (let s = this.particlesData.length; s < t; s++) {
      let h = e.generateParticleData();
      this.particlesData.push(h);
    }
    let i = this.particlesData.length > 0 ? this.particlesData[0].totalCount : 0, l = Math.max(i * t * 4, 32);
    (this.byteSize == null || this.byteSize < l) && this.createBuffer(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC, l), this.reset();
    for (let s = 0; s < t; s++)
      this.particlesData[s].memoryList.forEach((c) => {
        this.memory.allocation_memory(c);
      });
    this.onChange = !0;
  }
}
class U extends y {
  _instanceID;
  _maxParticles;
  _time;
  _timeDelta;
  _duration;
  _isLoop;
  _simulatorSpace;
  _retain1;
  _emitterPos;
  onChange = !1;
  constructor(t, e) {
    super(t, e), this._instanceID = this.allocUint32("instance_index"), this._maxParticles = this.allocUint32("maxParticles"), this._time = this.allocFloat32("time"), this._timeDelta = this.allocFloat32("timeDelta"), this._duration = this.allocFloat32("duration"), this._isLoop = this.allocFloat32("isLoop"), this._simulatorSpace = this.allocUint32("simulatorSpace"), this._retain1 = this.allocFloat32("retain1"), this._emitterPos = this.allocVec4("emitterPos");
  }
  setInstanceID(t) {
    this._instanceID.setUint32(t), this.onChange = !0;
  }
  getInstanceID() {
    return this._instanceID.getUint32();
  }
  setMaxParticles(t) {
    this._maxParticles.setUint32(t), this.onChange = !0;
  }
  getMaxParticles() {
    return this._maxParticles.getUint32();
  }
  setTime(t) {
    this._time.setFloat(t);
  }
  getTime() {
    return this._time.getFloat();
  }
  setTimeDelta(t) {
    this._timeDelta.setFloat(t), this.onChange = !0;
  }
  getTimeDelta() {
    return this._timeDelta.getFloat();
  }
  setDuration(t) {
    this._duration.setFloat(t), this.onChange = !0;
  }
  getDuration() {
    return this._duration.getFloat();
  }
  setSimulatorSpace(t) {
    this._simulatorSpace.setUint32(t), this.onChange = !0;
  }
  getSimulatorSpace() {
    return this._simulatorSpace.getUint32();
  }
  setEmitterPos(t) {
    this._emitterPos.setXYZ(t.x, t.y, t.z), this.onChange = !0;
  }
}
class Q {
  _computePipeline;
  _computeBindGroup;
  constructor(t, e) {
    let i = z.device;
    this._computePipeline = i.createComputePipeline({
      layout: "auto",
      compute: {
        module: i.createShaderModule({
          code: t
        }),
        entryPoint: "CsMain"
      }
    }), this._computeBindGroup = i.createBindGroup({
      layout: this._computePipeline.getBindGroupLayout(0),
      entries: e
    });
  }
  compute(t, e, i, l) {
    {
      let s = t.beginComputePass();
      s.setPipeline(this._computePipeline), s.setBindGroup(0, this._computeBindGroup), s.dispatchWorkgroups(e, i, l), s.end();
    }
  }
}
class S {
  constructor() {
  }
  totalCount = 0;
  memoryList = [];
  getUint32() {
    let t = new f();
    return t.byteSize = 1 * 4, this.totalCount += t.byteSize / 4, this.memoryList.push(t), t;
  }
  getFloat() {
    let t = new f();
    return t.byteSize = 1 * 4, this.totalCount += t.byteSize / 4, this.memoryList.push(t), t;
  }
  getVec2() {
    let t = new f();
    return t.byteSize = 2 * 4, this.totalCount += t.byteSize / 4, this.memoryList.push(t), t;
  }
  getVec3() {
    let t = new f();
    return t.byteSize = 4 * 4, this.totalCount += t.byteSize / 4, this.memoryList.push(t), t;
  }
  getVec4() {
    let t = new f();
    return t.byteSize = 4 * 4, this.totalCount += t.byteSize / 4, this.memoryList.push(t), t;
  }
}
class P extends S {
  position;
  velocity;
  force;
  density;
  pressure;
  data1;
  data2;
  constructor() {
    super();
  }
  static generateParticleData() {
    let t = new P();
    return t.position = t.getVec4(), t.velocity = t.getVec4(), t.force = t.getVec4(), t.density = t.getFloat(), t.pressure = t.getFloat(), t.data1 = t.getFloat(), t.data2 = t.getFloat(), t;
  }
}
class g extends S {
  //transform storage
  particleLifeDuration;
  // 3
  start_time;
  life_time;
  hide;
  vPos;
  vRot;
  vScale;
  vColor;
  vSpeed;
  vForce_pos;
  vForce_Rot;
  vForce_Scale;
  // public vUvRectangle: MemoryInfo;
  // public vPosVelocity: MemoryInfo;
  // public vRotVelocity: MemoryInfo;
  // public vScaleVelocity: MemoryInfo;
  //source
  start_pos;
  start_size;
  start_rotation;
  start_velocity;
  start_acceleration;
  start_rotVelocity;
  start_rotAcceleration;
  start_scaleVelocity;
  start_scaleAcceleration;
  start_color;
  start_angularVelocity;
  textureSheet_Frame;
  retain0;
  retain1;
  retain2;
  static generateParticleData() {
    let t = new g();
    return t.particleLifeDuration = t.getFloat(), t.start_time = t.getFloat(), t.life_time = t.getFloat(), t.hide = t.getFloat(), t.vPos = t.getVec4(), t.vRot = t.getVec4(), t.vScale = t.getVec4(), t.vColor = t.getVec4(), t.vSpeed = t.getVec4(), t.vForce_pos = t.getVec4(), t.vForce_Rot = t.getVec4(), t.vForce_Scale = t.getVec4(), t.start_pos = t.getVec4(), t.start_size = t.getVec4(), t.start_rotation = t.getVec4(), t.start_velocity = t.getVec4(), t.start_acceleration = t.getVec4(), t.start_rotVelocity = t.getVec4(), t.start_rotAcceleration = t.getVec4(), t.start_scaleVelocity = t.getVec4(), t.start_scaleAcceleration = t.getVec4(), t.start_color = t.getVec4(), t.start_angularVelocity = t.getVec4(), t.textureSheet_Frame = t.getUint32(), t.retain0 = t.getFloat(), t.retain1 = t.getFloat(), t.retain2 = t.getFloat(), t;
  }
}
let G = (
  /* wgsl */
  `
    #include "Common_vert"
    #include "Common_frag"
    #include "UnLit_frag"
    #include "UnLitMaterialUniform_frag"
    #include "MathShader"
    #include "ParticleDataStruct"

    @group(1) @binding(0)
    var baseMapSampler: sampler;

    @group(1) @binding(1)
    var baseMap: texture_2d<f32>;

    @group(3) @binding(0)
    var<storage, read> particleGlobalData: GlobalData;

    @group(3) @binding(1)
    var<storage, read> particleLocalDatas: array<ParticleData>;

    fn vert(vertex:VertexAttributes) -> VertexOutput {
        let particle = particleLocalDatas[vertex.index];
        if (particle.hide < 0.99f) {
            return ORI_VertexOut;
        }

        const LocalSpace = 0;
        const WorldSpace = 1;
        if (particleGlobalData.simulatorSpace == WorldSpace) {
            ORI_MATRIX_M = mat4x4<f32> (
                vec4<f32>(1.0, 0.0, 0.0, 0.0),
                vec4<f32>(0.0, 1.0, 0.0, 0.0),
                vec4<f32>(0.0, 0.0, 1.0, 0.0),
                vec4<f32>(0.0, 0.0, 0.0, 1.0)
            );
        } else {
            ORI_MATRIX_M = models.matrix[particleGlobalData.instance_index];
        }

        var vertexPosition = vertex.position;

        let scaleMatrix = mat4x4<f32> (
            vec4<f32>(particle.vScale.x, 0.0, 0.0, 0.0),
            vec4<f32>(0.0, particle.vScale.y, 0.0, 0.0),
            vec4<f32>(0.0, 0.0, particle.vScale.z, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );
        vertexPosition = (scaleMatrix * vec4<f32>(vertexPosition.xyz, 1.0)).xyz;

        let rotMatrix = makeRotateMatrix(
            particle.vRot.x, 
            particle.vRot.y, 
            particle.vRot.z
        );
        vertexPosition = (rotMatrix * vec4<f32>(vertexPosition.xyz, 1.0)).xyz;

        let centerPos = (ORI_MATRIX_M * vec4<f32>(particle.vPos.xyz, 1.0)).xyz;
        let billboardMatrix: mat3x3<f32> = calculateBillboardMatrix(centerPos, ORI_MATRIX_M);
        vertexPosition = billboardMatrix * vertexPosition.xyz;
        vertexPosition += particle.vPos.xyz;

        var worldPos = (ORI_MATRIX_M * vec4<f32>(vertexPosition.xyz, 1.0));
        var viewPosition = ORI_MATRIX_V * worldPos;
        var clipPosition = ORI_MATRIX_P * viewPosition;

        let size = vec2<u32>(particleGlobalData.textureSheet_TextureWidth, particleGlobalData.textureSheet_TextureHeight);
        let frame: u32 = particle.textureSheet_Frame;
        let clipW: u32 = u32(size.x) / particleGlobalData.textureSheet_ClipCol;
        let ratioW: f32 = f32(clipW) / f32(size.x);
        let ratioH: f32 = f32(clipW) / f32(size.y);
        let col: u32 = frame % particleGlobalData.textureSheet_ClipCol;
        let row: u32 = frame / particleGlobalData.textureSheet_ClipCol;
        ORI_VertexOut.varying_UV0.x = (vertex.uv.x + f32(col)) * ratioW;
        ORI_VertexOut.varying_UV0.y = (vertex.uv.y + f32(row)) * ratioH;

        // ORI_VertexOut.varying_UV0 = vertex.uv.xy;
        ORI_VertexOut.varying_UV1 = vertex.TEXCOORD_1.xy;
        ORI_VertexOut.varying_Clip = clipPosition;
        ORI_VertexOut.varying_WPos = vec4<f32>(worldPos.xyz, f32(particleGlobalData.instance_index));
        // ORI_VertexOut.varying_WNormal = normalize(ORI_NORMALMATRIX * vertexNormal.xyz);
        ORI_VertexOut.varying_Color = particle.vColor;
        ORI_VertexOut.member = clipPosition;
        return ORI_VertexOut;
    }

    fn frag() {
        var transformUV1 = materialUniform.transformUV1;
        var transformUV2 = materialUniform.transformUV2;

        var uv = transformUV1.zw * ORI_VertexVarying.fragUV0 + transformUV1.xy; 
        let color = textureSample(baseMap,baseMapSampler, uv);
        
        ORI_ShadingInput.BaseColor = color * materialUniform.baseColor * ORI_VertexVarying.vColor;
        UnLit();
    }

    fn quaternionTransform(q: vec4<f32>, v: vec3<f32>) -> vec3<f32> {
        let u: vec3<f32> = q.xyz;
        let uv: vec3<f32> = cross(u, v);
        let uuv: vec3<f32> = cross(u, uv);
        return v + ((uv * q.w) + uuv) * 2.0;
    }

    fn calculateBillboardMatrix(pos: vec3<f32>, worldMatrix: mat4x4<f32>) -> mat3x3<f32> {
        let dir: vec3<f32> = normalize(globalUniform.cameraWorldMatrix[3].xyz - pos.xyz);
        let mat3 = mat3x3<f32> (
            worldMatrix[0].xyz,
            worldMatrix[1].xyz,
            worldMatrix[2].xyz
         );
         let v3Look: vec3<f32> = normalize(dir * mat3);
         let v3Right: vec3<f32> = normalize(cross(vec3<f32>( 0.0 , 1.0 , 0.0 ) * mat3, v3Look));
         let v3Up: vec3<f32> = cross(v3Look, v3Right);
         return mat3x3<f32>(v3Right, v3Up, v3Look);
    }

    fn makeAxleRotationMatrix(axis: vec3<f32>, angle: f32) -> mat4x4<f32> {
        var x = axis.x;
        var y = axis.y;
        var z = axis.z;

        var n = x*x +y*y + z*z;
        if (n != 1.0f) {
            n = sqrt(n);
            if (n > 0.000001) {
                n = 1.0f / n;
                x *= n;
                y *= n;
                z *= n;
            }
        }

        let c = cos(angle);
        let s = sin(angle);

        let t = 1.0 - c;
        let tx = t * x;
        let ty = t * y;
        let tz = t * z;
        let txy = tx * y;
        let txz = tx * z;
        let tyz = ty * z;
        let sx = s * x;
        let sy = s * y;
        let sz = s * z;

        return mat4x4<f32>(
            vec4<f32>(c + tx*x, txy + sz, txz - sy, 0.0),
            vec4<f32>(txy - sz, c + ty*y, tyz + sx, 0.0),
            vec4<f32>(txz + sy, tyz - sx, c + tz*z, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0),
        );
    }

   fn quaternionToRotationMatrix(q: vec4<f32>) -> mat3x3<f32> {
       let qx2: f32 = q.x * q.x;
       let qy2: f32 = q.y * q.y;
       let qz2: f32 = q.z * q.z;
       let qwqx: f32 = q.w * q.x;
       let qwqy: f32 = q.w * q.y;
       let qwqz: f32 = q.w * q.z;
       let qxqy: f32 = q.x * q.y;
       let qxqz: f32 = q.x * q.z;
       let qyqz: f32 = q.y * q.z;
       return mat3x3<f32>(
           vec3<f32>(1.0 - 2.0 * (qy2 + qz2), 2.0 * (qxqy - qwqz), 2.0 * (qxqz + qwqy)),
           vec3<f32>(2.0 * (qxqy + qwqz), 1.0 - 2.0 * (qx2 + qz2), 2.0 * (qyqz - qwqx)),
           vec3<f32>(2.0 * (qxqz - qwqy), 2.0 * (qyqz + qwqx), 1.0 - 2.0 * (qx2 + qy2)),
       );
   }

    fn makeRotateMatrix(angleX: f32, angleY: f32, angleZ: f32) -> mat4x4<f32> {
        let cosX: f32 = cos(angleX);
        let sinX: f32 = sin(angleX);
        let cosY: f32 = cos(angleY);
        let sinY: f32 = sin(angleY);
        let cosZ: f32 = cos(angleZ);
        let sinZ: f32 = sin(angleZ);

        let rotX: mat4x4<f32> = mat4x4<f32>(
            vec4<f32>(1.0, 0.0, 0.0, 0.0),
            vec4<f32>(0.0, cosX, -sinX, 0.0),
            vec4<f32>(0.0, sinX, cosX, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );

        let rotY: mat4x4<f32> = mat4x4<f32>(
            vec4<f32>(cosY, 0.0, sinY, 0.0),
            vec4<f32>(0.0, 1.0, 0.0, 0.0),
            vec4<f32>(-sinY, 0.0, cosY, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );

        let rotZ: mat4x4<f32> = mat4x4<f32>(
            vec4<f32>(cosZ, -sinZ, 0.0, 0.0),
            vec4<f32>(sinZ, cosZ, 0.0, 0.0),
            vec4<f32>(0.0, 0.0, 1.0, 0.0),
            vec4<f32>(0.0, 0.0, 0.0, 1.0)
        );

        return rotZ * rotY * rotX;
    }

   fn rotationMatrixToQuaternion(m: mat3x3<f32>) -> vec4<f32> {
        var tr: f32 = m[0][0] + m[1][1] + m[2][2];

        if (tr > 0.0) {
            var s: f32 = sqrt(1.0 + tr);
            var invs: f32 = 0.5 / s;

            return vec4<f32>(
                (m[1][2] - m[2][1]) * invs,
                (m[2][0] - m[0][2]) * invs,
                (m[0][1] - m[1][0]) * invs,
                0.5 * s
            );
        } else {
            var i:i32 = 0;
            if (m[1][1] > m[0][0]) { i = 1; }
            if (m[2][2] > m[i][i]) { i = 2; }

            var j:i32 = (i + 1) % 3;
            var k:i32 = (j + 1) % 3;

            var s: f32 = sqrt(m[i][i] - m[j][j] - m[k][k] + 1.0);
            var invs: f32 = 0.5 / s;

            var q: vec4<f32>;
            q[i] = 0.5 * s;
            q[3] = (m[j][k] - m[k][j]) * invs;
            q[j] = (m[i][j] + m[j][i]) * invs;
            q[k] = (m[i][k] + m[k][i]) * invs;

            return q;
        }
    }
`
);
class I extends R {
  constructor() {
    super(), x.register("ParticleRenderShader", G);
    let t = new D(), e = new V("ParticleRenderShader", "ParticleRenderShader");
    e.passType = v.COLOR, e.setShaderEntry("VertMain", "FragMain"), t.addRenderPass(e), e.setUniformVector4("transformUV1", new o(0, 0, 1, 1)), e.setUniformVector4("transformUV2", new o(0, 0, 1, 1)), e.setUniformColor("baseColor", new p()), e.setUniformFloat("alphaCutoff", 0.5), e.renderOrder = 3001, e.shaderState.transparent = !0, e.shaderState.depthWriteEnabled = !1, e.shaderState.depthCompare = F.less, e.shaderState.acceptShadow = !1, e.shaderState.receiveEnv = !1, e.shaderState.acceptGI = !1, e.shaderState.useLight = !1, e.shaderState.castShadow = !1, this.shader = t, this.baseMap = C.res.whiteTexture, this.blendMode = w.ADD;
  }
  set baseMap(t) {
    this.shader.setTexture("baseMap", t);
  }
  get baseMap() {
    return this.shader.getTexture("baseMap");
  }
  set envMap(t) {
  }
  set shadowMap(t) {
  }
}
class n {
  _simulator;
  __init() {
    this.init();
  }
  init() {
  }
  set needReset(t) {
    this._simulator.needReset = t;
  }
  get needReset() {
    return this._simulator.needReset;
  }
  setSimulator(t) {
    this._simulator = t;
  }
  calculateParticle(t, e) {
  }
  generateParticleModuleData(t, e) {
  }
}
class B extends n {
  init() {
  }
  calculateParticle(t, e) {
  }
}
var A = /* @__PURE__ */ ((a) => (a[a.Box = 0] = "Box", a[a.Circle = 1] = "Circle", a[a.Cone = 2] = "Cone", a[a.Sphere = 3] = "Sphere", a[a.Hemisphere = 4] = "Hemisphere", a))(A || {}), k = /* @__PURE__ */ ((a) => (a[a.Default = 0] = "Default", a[a.Edge = 1] = "Edge", a[a.Shell = 2] = "Shell", a[a.Volume = 3] = "Volume", a))(k || {});
class W extends n {
  /**
   * Set shape type of emitter
   */
  set shapeType(t) {
    this._shapeType = t, this.needReset = !0;
  }
  /**
   * Get shape type of emitter
   */
  get shapeType() {
    return this._shapeType;
  }
  _shapeType = 0;
  /**
  * Set emit location of emitter
  */
  set emitLocation(t) {
    this._emitLocation = t, this.needReset = !0;
  }
  /**
  * Get emit location of emitter
  */
  get emitLocation() {
    return this._emitLocation;
  }
  _emitLocation = 0;
  /**
   * Set particle emitter angle
   * When shapeType is cone, this value is the size of the cylindrical opening
   */
  set angle(t) {
    this._angle = t;
  }
  /**
   * Get particle emitter angle
   */
  get angle() {
    return this._angle;
  }
  _angle = 10;
  /**
   * Set particle emitter radus
   */
  set radius(t) {
    this._radius = t, this.needReset = !0;
  }
  /**
   * Get particle emitter radus
   */
  get radius() {
    return this._radius;
  }
  _radius = 10;
  /**
   * Set box size, only when the shape is box
   */
  set boxSize(t) {
    this._boxSize.copyFrom(t), this.needReset = !0;
  }
  /**
   * Get box size
   */
  get boxSize() {
    return this._boxSize;
  }
  _boxSize = new m(10, 10, 10);
  /**
   * Set random seed
   */
  set randSeed(t) {
    this._rand.seed = t, this.needReset = !0;
  }
  /**
   * Get random seed
   */
  get randSeed() {
    return this._rand.seed;
  }
  _rand = new X();
  /**
   * Set max number of quad in this particle
   */
  set maxParticle(t) {
    this._simulator.maxParticle = t, this._maxParticle != t && (this.needReset = !0), this._maxParticle = t;
  }
  /**
   * Get max number of quad in this particle
   */
  get maxParticle() {
    return this._maxParticle;
  }
  _maxParticle = 1e3;
  /**
   * Set emit rate. How many quad are allowed to be emitted per second
   */
  set emissionRate(t) {
    this._emissionRate = t, this.needReset = !0;
  }
  /**
   * Get emit rate.
   */
  get emissionRate() {
    return this._emissionRate;
  }
  _emissionRate = 1;
  /**
   * Set duration of emitted particles
   */
  set duration(t) {
    this._duration = t, this.needReset = !0;
  }
  /**
   * Get duration of emitted particles
   */
  get duration() {
    return this._duration;
  }
  _duration = 10;
  /**
   * Set life cycle of each quad
   */
  set startLifecycle(t) {
    this._startLifecycle = t, this.needReset = !0;
  }
  /**
   * Get life cycle of each quad
   */
  get startLifecycle() {
    return this._startLifecycle;
  }
  _startLifecycle = new r();
  /**
   * Set velocity speed of X-axis component
   */
  set startVelocityX(t) {
    this._startVelocity[0] = t, this.needReset = !0;
  }
  /**
   * Get velocity speed of X-axis component
   */
  get startVelocityX() {
    return this._startVelocity[0];
  }
  /**
   * Set velocity speed of Y-axis component
   */
  set startVelocityY(t) {
    this._startVelocity[1] = t, this.needReset = !0;
  }
  /**
   * Get velocity speed of Y-axis component
   */
  get startVelocityY() {
    return this._startVelocity[1];
  }
  /**
   * Set velocity speed of Z-axis component
   */
  set startVelocityZ(t) {
    this._startVelocity[2] = t, this.needReset = !0;
  }
  /**
   * Get velocity speed of Z-axis component
   */
  get startVelocityZ() {
    return this._startVelocity[2];
  }
  _startVelocity = [new r(0), new r(0), new r(0)];
  /**
   * Set init scale of each quad
  */
  set startScale(t) {
    this._startScaleXYZ = [t, t, t], this.needReset = !0;
  }
  /**
   * Get init scale of each quad
  */
  get startScale() {
    return this._startScaleXYZ[2];
  }
  /**
   * Set the scaling value of each quad on the x-axis
  */
  set startScaleX(t) {
    this._startScaleXYZ[0] = t, this.needReset = !0;
  }
  /**
   * Get the scaling value of each quad on the x-axis
  */
  get startScaleX() {
    return this._startScaleXYZ[0];
  }
  /**
   * Set the scaling value of each quad on the y-axis
  */
  set startScaleY(t) {
    this._startScaleXYZ[1] = t, this.needReset = !0;
  }
  /**
   * Get the scaling value of each quad on the y-axis
  */
  get startScaleY() {
    return this._startScaleXYZ[1];
  }
  /**
   * Set the scaling value of each quad on the z-axis
  */
  set startScaleZ(t) {
    this._startScaleXYZ[2] = t, this.needReset = !0;
  }
  /**
   * Get the scaling value of each quad on the z-axis
  */
  get startScaleZ() {
    return this._startScaleXYZ[2];
  }
  _startScaleXYZ = [new r(), new r(), new r()];
  /**
   * Is the scaling of quads different on each axis
   */
  isUseStartScaleXYZ() {
    return !(this._startScaleXYZ[0] == this._startScaleXYZ[1] && this._startScaleXYZ[1] == this._startScaleXYZ[2]);
  }
  /**
   * Set init rotation of each quad
   */
  set startRotation(t) {
    this._startRotationXYZ = [t, t, t], this.needReset = !0;
  }
  /**
   * Get init rotation of each quad
   */
  get startRotation() {
    return this._startRotationXYZ[2];
  }
  /**
   * Set the rotation of each quad on the x-axis
   */
  set startRotationX(t) {
    this._startRotationXYZ[0] = t, this.needReset = !0;
  }
  /**
   * Get the rotation of each quad on the x-axis
   */
  get startRotationX() {
    return this._startRotationXYZ[0];
  }
  /**
   * Set the rotation of each quad on the y-axis
   */
  set startRotationY(t) {
    this._startRotationXYZ[1] = t, this.needReset = !0;
  }
  /**
   * Get the rotation of each quad on the y-axis
   */
  get startRotationY() {
    return this._startRotationXYZ[1];
  }
  /**
   * Set the rotation of each quad on the z-axis
   */
  set startRotationZ(t) {
    this._startRotationXYZ[2] = t, this.needReset = !0;
  }
  /**
   * Get the rotation of each quad on the z-axis
   */
  get startRotationZ() {
    return this._startRotationXYZ[2];
  }
  _startRotationXYZ = [new r(0), new r(0), new r(0)];
  /**
   * Is the rotation of quads different on each axis
   */
  isUseStartRotationXYZ() {
    return !(this._startRotationXYZ[0] == this._startRotationXYZ[1] && this._startRotationXYZ[1] == this._startRotationXYZ[2]);
  }
  /**
   * @private
   */
  init() {
    this.maxParticle = 1e3;
  }
  /**
   * Genarate particle emit module
   * @param globalMemory
   * @param localMemory
   */
  generateParticleModuleData(t, e) {
    t.setUint32("maxParticles", this.maxParticle), t.setDuration(this.duration);
    const i = this._simulator.maxParticle;
    e.allocationParticle(i, g);
    let l = this._simulator.maxActiveParticle;
    console.warn(`Count(${l})`);
    let s = e.particlesData;
    for (let h = 0; h < l; h++) {
      const c = s[h];
      switch (this.shapeType) {
        case 0:
          this.calculateBoxShapeParticlePos(c);
          break;
        case 1:
          this.calculateCircleShapeParticlePos(c);
          break;
        case 2:
          this.calculateConeShapeParticlePos(c);
          break;
        case 3:
          this.calculateSphereShapeParticlePos(c);
          break;
        case 4:
          this.calculateHemisphereShapeParticlePos(c);
          break;
      }
      if (c.life_time.setX(r.evaluate(this.startLifecycle, this._rand.getFloat())), c.start_time.setX(Math.floor(h % this.emissionRate) / this.emissionRate + Math.floor(h / this.emissionRate)), this.isUseStartScaleXYZ())
        c.start_size.setXYZ(
          r.evaluate(this.startScaleX, this._rand.getFloat()),
          r.evaluate(this.startScaleY, this._rand.getFloat()),
          r.evaluate(this.startScaleZ, this._rand.getFloat())
        );
      else {
        let d = r.evaluate(this.startScale, this._rand.getFloat());
        c.start_size.setXYZ(d, d, d);
      }
      this.isUseStartRotationXYZ() ? c.start_rotation.setXYZ(
        r.evaluate(this.startRotationX, this._rand.getFloat()) * u,
        r.evaluate(this.startRotationY, this._rand.getFloat()) * u,
        r.evaluate(this.startRotationZ, this._rand.getFloat()) * u
      ) : c.start_rotation.setXYZ(
        0,
        0,
        r.evaluate(this.startRotation, this._rand.getFloat()) * u
      ), c.start_velocity.setXYZ(
        r.evaluate(this.startVelocityX, this._rand.getFloat()),
        r.evaluate(this.startVelocityY, this._rand.getFloat()),
        r.evaluate(this.startVelocityZ, this._rand.getFloat())
      );
    }
    e.apply();
  }
  calculateBoxShapeParticlePos(t) {
    switch (this.emitLocation) {
      case 0:
      case 1:
        let e = Math.floor(this._rand.getFloat() * 10) % 3;
        e == 0 ? t.start_pos.setXYZ(
          this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
          Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.y - this.boxSize.y * 0.5,
          Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.z - this.boxSize.z * 0.5
        ) : e == 1 ? t.start_pos.setXYZ(
          Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.x - this.boxSize.x * 0.5,
          this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
          Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.z - this.boxSize.z * 0.5
        ) : e == 2 && t.start_pos.setXYZ(
          Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.x - this.boxSize.x * 0.5,
          Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.y - this.boxSize.y * 0.5,
          this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5
        );
        break;
      case 2:
        {
          let i = Math.floor(this._rand.getFloat() * 10) % 3;
          i == 0 ? t.start_pos.setXYZ(
            this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
            this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
            Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.z - this.boxSize.z * 0.5
          ) : i == 1 ? t.start_pos.setXYZ(
            Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.x - this.boxSize.x * 0.5,
            this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
            this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5
          ) : i == 2 && t.start_pos.setXYZ(
            this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
            Math.floor(this._rand.getFloat() * 10) % 2 * this.boxSize.y - this.boxSize.y * 0.5,
            this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5
          );
        }
        break;
      case 3:
        t.start_pos.setXYZ(
          this._rand.getFloat() * this.boxSize.x - this.boxSize.x * 0.5,
          this._rand.getFloat() * this.boxSize.y - this.boxSize.y * 0.5,
          this._rand.getFloat() * this.boxSize.z - this.boxSize.z * 0.5
        );
        break;
    }
  }
  calculateCircleShapeParticlePos(t) {
    let e = this.radius;
    switch (this.emitLocation) {
      case 0:
      case 1:
        {
          var i = this._rand.getFloat() * 360 * u;
          t.start_pos.setXYZ(
            e * Math.cos(i),
            0,
            e * Math.sin(i)
          );
        }
        break;
      case 2:
      case 3:
        {
          var l = new m();
          do
            l.x = this._rand.getFloat() * this.radius * 2 - this.radius, l.z = this._rand.getFloat() * this.radius * 2 - this.radius;
          while (l.length > this.radius);
          t.start_pos.setXYZ(l.x, l.y, l.z);
        }
        break;
    }
  }
  calculateConeShapeParticlePos(t) {
  }
  calculateSphereShapeParticlePos(t) {
    let e = new m();
    do
      e.x = this._rand.getFloat() * this.radius * 2 - this.radius, e.y = this._rand.getFloat() * this.radius * 2 - this.radius, e.z = this._rand.getFloat() * this.radius * 2 - this.radius;
    while (e.length > this.radius);
    switch (this.emitLocation) {
      case 2:
      case 1:
        e.normalize().multiplyScalar(this.radius), t.start_pos.setXYZ(e.x, e.y, e.z);
        break;
      case 0:
      case 3:
      default:
        t.start_pos.setXYZ(e.x, e.y, e.z);
        break;
    }
  }
  calculateHemisphereShapeParticlePos(t) {
    let e = this.radius;
    switch (this.emitLocation) {
      case 1:
      case 2:
        e = this.radius;
        break;
      case 0:
      case 3:
      default:
        e = this._rand.getFloat() * this.radius;
        break;
    }
    var i = this._rand.getFloat() * 180 * u, l = e * Math.sin(i), s = this._rand.getFloat() * 180 * u;
    t.start_pos.setXYZ(
      l * Math.cos(s),
      l * Math.sin(s),
      -e * Math.cos(i)
    );
  }
}
class $ extends n {
  /**
   * Set gravity
   */
  set gravity(t) {
    this._gravity = t, this._simulator.particleGlobalMemory.setVector3("gravity", this.gravity);
  }
  /**
   * Get gravity
   */
  get gravity() {
    return this._gravity;
  }
  _gravity = new m(0, -9.8, 0);
  /**
   * Genarate particle gravity module
   * @param globalMemory
   * @param localMemory
   */
  generateParticleModuleData(t, e) {
    t.setVector3("gravity", this.gravity);
  }
}
class J extends n {
  /**
   * Set start color
   */
  set startColor(t) {
    this._colorSegments[0].copyFrom(t), this.needReset = !0;
  }
  /**
   * Get start color
   */
  get startColor() {
    return this._colorSegments[0];
  }
  /**
   * Set start alpha
   */
  set startAlpha(t) {
    this._colorSegments[0].a = t, this.needReset = !0;
  }
  /**
   * Get start alpha
   */
  get startAlpha() {
    return this._colorSegments[0].a;
  }
  /**
   * Set end color
   */
  set endColor(t) {
    this._colorSegments[1].copyFrom(t), this.needReset = !0;
  }
  /**
   * Get end color
   */
  get endColor() {
    return this._colorSegments[1];
  }
  /**
  * Set end alpha
  */
  set endAlpha(t) {
    this._colorSegments[1].a = t, this.needReset = !0;
  }
  /**
   * Get end alpha
   */
  get endAlpha() {
    return this._colorSegments[1].a;
  }
  _colorSegments = [new p(1, 1, 1, 1), new p(1, 1, 1, 1)];
  /**
   * Genarate particle color module with type over life time 
   * @param globalMemory
   * @param localMemory
   */
  generateParticleModuleData(t, e) {
    t.setColorArray("overLife_colors", this._colorSegments);
  }
}
class K extends n {
  /**
   * Describe the rotation of particles from birth to end
   */
  rotationSegments = [new o(), new o()];
  /**
   * Genarate particle rotation module with type over life time 
   * @param globalMemory
   * @param localMemory
   */
  generateParticleModuleData(t, e) {
    t.setVector4Array("overLife_rotations", this.rotationSegments);
  }
}
class tt extends n {
  /**
  * Describe the size scale change of particles from birth to end
  */
  scaleSegments = [new o(1, 1, 1, 1), new o(2, 2, 2, 1)];
  /**
   * Genarate particle size scale module with type over life time 
   * @param globalMemory
   * @param localMemory
   */
  generateParticleModuleData(t, e) {
    t.setVector4Array("overLife_scale", this.scaleSegments);
  }
}
class et extends n {
  /**
  * Describe the velocity change of particles from birth to end
  */
  speedSegments = [new o(0, 0, 0, 0), new o(0, 0, 0, 0)];
  /**
   * Genarate particle move speed module with type over life time 
   * @param globalMemory
   * @param localMemory
   * 
   */
  generateParticleModuleData(t, e) {
    t.setVector4Array("overLife_speed", this.speedSegments);
  }
}
class at extends n {
  /**
   * Returns angular velocity X-axis component of each quad
   */
  get angularVelocityX() {
    return this.angularVelocityXYZ[0];
  }
  /**
   * Set angular velocity X-axis component of each quad
   */
  set angularVelocityX(t) {
    this.angularVelocityXYZ[0] = t;
  }
  /**
   * Returns angular velocity Y-axis component of each quad
   */
  get angularVelocityY() {
    return this.angularVelocityXYZ[1];
  }
  /**
   * Set angular velocity Y-axis component of each quad
   */
  set angularVelocityY(t) {
    this.angularVelocityXYZ[1] = t;
  }
  /**
   * Returns angular velocity Z-axis component of each quad
   */
  get angularVelocityZ() {
    return this.angularVelocityXYZ[2];
  }
  /**
   * Get angular velocity Z-axis component of each quad
   */
  set angularVelocityZ(t) {
    this.angularVelocityXYZ[2] = t;
  }
  /**
   * angular velocity of each quad
   */
  angularVelocityXYZ = [new r(0), new r(0), new r(0)];
  /**
   * Genarate particle rotate module, init angular velocity of each quad
   * @param globalMemory
   * @param localMemory
   * 
   */
  generateParticleModuleData(t, e) {
    let i = this._simulator.maxActiveParticle, l = e.particlesData;
    for (let s = 0; s < i; s++)
      l[s].start_angularVelocity.setXYZ(
        r.evaluate(this.angularVelocityX, Math.random()),
        r.evaluate(this.angularVelocityY, Math.random()),
        r.evaluate(this.angularVelocityZ, Math.random())
      );
  }
}
class it extends n {
  _enable = !0;
  get enable() {
    return this._enable;
  }
  set enable(t) {
    this._enable = t, this._simulator.particleGlobalMemory.setFloat("enable_dirBySpeed", this.enable ? 1 : 0);
  }
  generateParticleModuleData(t, e) {
    t.setFloat("enable_dirBySpeed", this.enable ? 1 : 0);
  }
}
class rt extends n {
  /**
   * The number of columns in the texture sheet
   */
  clipCol = 1;
  /**
   * The total number of clips texture sheet
   */
  totalClip = 1;
  /**
   * playing speed
   */
  playRate = 1;
  /**
   * Texture width
   */
  textureWidth = 1;
  /**
   * Texture Height
   */
  textureHeight = 1;
  /**
   * play mode
   */
  playMode = 0;
  /**
  * Genarate particle texture sheet module: such as clip col, total clip, play speed. 
  * @param globalMemory
  * @param localMemory
  * 
  */
  generateParticleModuleData(t, e) {
    t.setUint32("textureSheet_ClipCol", this.clipCol), t.setUint32("textureSheet_TotalClip", this.totalClip), t.setFloat("textureSheet_PlayRate", this.playRate), t.setUint32("textureSheet_TextureWidth", this.textureWidth), t.setUint32("textureSheet_TextureHeight", this.textureHeight);
  }
}
var E = /* @__PURE__ */ ((a) => (a[a.Local = 0] = "Local", a[a.World = 1] = "World", a))(E || {});
class b {
  maxParticle = 1e3;
  needReset = !0;
  /**
   * preheat time
   */
  preheatTime = 0;
  _simulatorSpace = 0;
  /**
   * Set particle simulator space. see {@link SimulatorSpace}
   */
  set simulatorSpace(t) {
    this._simulatorSpace = t, this.particleGlobalMemory.setSimulatorSpace(this._simulatorSpace);
  }
  /**
   * Get particle simulator space.
   */
  get simulatorSpace() {
    return this._simulatorSpace;
  }
  /**
   * particle data for each quad
   */
  particleLocalMemory;
  /**
   * global particle data for all quad
   */
  particleGlobalMemory;
  _particleModules;
  _computes;
  _looping = !1;
  _particleSystem;
  constructor() {
    this._computes = [], this._particleModules = /* @__PURE__ */ new Map();
  }
  /**
   * Set need to loop animation
   */
  set looping(t) {
    this._looping = t, this.particleGlobalMemory.setFloat("isLoop", t ? 1 : 0);
  }
  /**
   * Get need to loop animation
   */
  get looping() {
    return this._looping;
  }
  /**
   * add a particle module
   * @param c class of particle module
   */
  addModule(t) {
    if (!this._particleModules.has(t.prototype)) {
      let e = new t();
      return e.setSimulator(this), e.__init(), this._particleModules.set(t.prototype, e), e;
    }
    return this.getModule(t);
  }
  /**
   * Get particle module
   * @param c class of particle module
   */
  getModule(t) {
    return this._particleModules.get(t.prototype);
  }
  /**
   * Remove particle module
   * @param c class of particle module
   */
  removeModule(t) {
    this._particleModules.has(t.prototype) && this._particleModules.delete(t.prototype);
  }
  initBuffer(t) {
    this.particleLocalMemory = new O(0), this.particleGlobalMemory = new U(64), this.particleGlobalMemory.setInstanceID(t.transform._worldMatrix.index), this._particleSystem = t, this.looping = !0;
  }
  build() {
    this.needReset = !1, this.generateParticleGlobalData(), this.generateParticleLocalData(), this._particleModules.forEach((t, e) => {
      t.generateParticleModuleData(this.particleGlobalMemory, this.particleLocalMemory);
    }), this.initPipeline();
  }
  generateParticleGlobalData() {
  }
  generateParticleLocalData() {
  }
  initPipeline() {
  }
  compute(t) {
    this._computes && this._computes.length > 0 && L.computeCommand(t, this._computes);
  }
  updateBuffer(t) {
    this.needReset && this.build();
    {
      this.particleGlobalMemory.setTime(this.preheatTime), this.particleGlobalMemory.setTimeDelta(t);
      let e = this._particleSystem.transform.worldPosition;
      this.particleGlobalMemory.setVector3("emitterPos", e), this.particleLocalMemory.onChange && (this.particleLocalMemory.onChange = !1, this.particleLocalMemory.apply()), this.particleGlobalMemory.onChange && (this.particleGlobalMemory.onChange = !1, this.particleGlobalMemory.apply());
    }
  }
  debug() {
  }
}
class st extends b {
  constructor() {
    super(), this.addModule(B);
  }
  initPipeline() {
  }
  generateGlobalParticleData() {
  }
  compute(t) {
  }
}
let H = (
  /* wgsl */
  `
  #include "ParticleDataStruct"

  @group(0) @binding(0) var<storage, read> globalData: GlobalData;
  @group(0) @binding(1) var<storage, read_write> particles: array<ParticleData>;

  var<private> index: u32;
  var<private> countTime: f32;
  var<private> totalLifeTime: f32;
  var<private> lifeTime: f32;
  var<private> lifeOverTime: f32;
  var<private> visible: f32;
  var<private> localForce: vec4<f32>;

  @compute @workgroup_size(64)
  fn CsMain(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    index = GlobalInvocationID.x;

    particleLife();

    var vPos: vec4<f32> = particles[index].vPos;
    vPos = vPos + calculationForce(lifeTime);
    vPos = vPos + gravity(lifeTime);
    // vPos = vPos + calculationAngularVelocity(lifeTime);

    var vSpeed: vec3<f32> = normalize(vPos.xyz - particles[index].vPos.xyz);
    particles[index].vSpeed = vec4<f32>(vSpeed,1.0);
    particles[index].vPos = vPos;
    calculationOverLifeSize(lifeTime);
    calculationOverLifeColor(lifeTime);
    calculationOverLifeRotation(lifeTime);
    calculationTextureSheetAnim(lifeTime);

    local_rotVelocity(globalData.timeDelta);

    particles[index].vPos = calculationAngularVelocity(globalData.timeDelta);
  }

  fn resetForce() {
    localForce = particles[index].start_velocity + particles[index].start_acceleration;
    particles[index].vForce_Pos = localForce;
  }

  fn waitReset() {
    lifeTime = 0.0;
    visible = 0.0;
    resetForce();

    particles[index].vScale = particles[index].start_size;
    particles[index].vPos = particles[index].start_pos;
    particles[index].vRot = particles[index].start_rotation;

    const LocalSpace = 0;
    const WorldSpace = 1;
    if (globalData.simulatorSpace == WorldSpace) {
      particles[index].vPos += globalData.emitterPos;
    }
  }

  fn particleLife() {
    visible = 0.0;
    totalLifeTime = particles[index].start_time + particles[index].life_time;

    countTime = particles[index].particleLifeDuration;
    
    if (countTime > particles[index].start_time) {
      visible = 1.0 ;
      
      lifeTime = countTime - particles[index].start_time;
      if (countTime >= totalLifeTime) {
        if (countTime >= globalData.duration && u32(globalData.isLoop) == 1) {
          countTime = countTime % globalData.duration;
          // obj.worldPos;
        }
        waitReset();
      }
    } else {
      waitReset();
    }

    lifeOverTime = lifeTime / particles[index].life_time;
    particles[index].particleLifeDuration = countTime + globalData.timeDelta;
    particles[index].hide = visible;
  }

  fn gravity(time:f32) -> vec4<f32> {
    // let t: f32 = time * time;
    // return 0.5 * vec4<f32>(globalData.gravity, 1.0) * t * ( 1.0 - (globalData.spaceDamping * 0.002) );
    return 0.5 * vec4<f32>(globalData.gravity, 1.0) * time * ( 1.0 - (globalData.spaceDamping * 0.002) );
  }

  fn calculationForce(time:f32) -> vec4<f32> {
    localForce = particles[index].vForce_Pos;
    localForce = localForce * ( 1.0 - (globalData.spaceDamping * 0.002) );

    particles[index].vForce_Pos = localForce;
    let t: f32 = time * time;
    return localForce * t;
  }

  fn calculationOverLifeSize(time:f32) {
    var vSize: vec4<f32> = mix(globalData.overLife_scale[0], globalData.overLife_scale[1], lifeOverTime);// (globalData.overLife_colors[1] - globalData.overLife_colors[0]) * lifeOverTime; 
    particles[index].vScale = vSize;
  }

  fn local_rotVelocity(time:f32) {
    var rv = particles[index].start_rotVelocity * time;
    var av = 0.5 * particles[index].start_rotAcceleration * time * time;
    particles[index].vRot += rv + av;
  }

  fn local_rotAcceleration(time:f32) {
  }

  fn calculationOverLifeColor(time:f32) {
    var vColor: vec4<f32> = mix(globalData.overLife_colors[0], globalData.overLife_colors[1], lifeOverTime);
    particles[index].vColor = vColor;
  }

  fn calculationOverLifeRotation(time:f32) {
    var vRot: vec4<f32> = mix(globalData.overLife_rotations[0], globalData.overLife_rotations[1], lifeOverTime);
    particles[index].vRot = particles[index].start_rotation + vRot;
  }

  fn calculationTextureSheetAnim(time: f32) {
    particles[index].textureSheet_Frame = u32(lifeTime * globalData.textureSheet_PlayRate) % globalData.textureSheet_TotalClip;
    // particles[index].textureSheet_Frame += 1;
  }

  fn calculationAngularVelocity(time: f32) -> vec4<f32> {
    let angle: vec3<f32> = particles[index].start_angularVelocity.xyz * time;

    let rotationMatrix: mat3x3<f32> = mat3x3<f32>(
      vec3<f32>(1.0, 0.0, 0.0),
      vec3<f32>(0.0, cos(angle.x), sin(angle.x)),
      vec3<f32>(0.0, -sin(angle.x), cos(angle.x))
    ) * mat3x3<f32>(
      vec3<f32>(cos(angle.y), 0.0, -sin(angle.y)),
      vec3<f32>(0.0, 1.0, 0.0),
      vec3<f32>(sin(angle.y), 0.0, cos(angle.y))
    ) * mat3x3<f32>(
      vec3<f32>(cos(angle.z), sin(angle.z), 0.0),
      vec3<f32>(-sin(angle.z), cos(angle.z), 0.0),
      vec3<f32>(0.0, 0.0, 1.0)
    );

    let rotatedPosition: vec3<f32> = rotationMatrix * particles[index].vPos.xyz;

    return vec4<f32>(rotatedPosition, 1.0);
  }
`
);
class lt extends b {
  _emitterModule;
  constructor() {
    super(), this._emitterModule = this.addModule(W);
  }
  /**
   * Get maximum number of active particles(read only)
   */
  get maxActiveParticle() {
    return Math.min(
      Math.max(
        Math.ceil(this._emitterModule.emissionRate * this._emitterModule.duration),
        this._emitterModule.emissionRate
      ),
      this.maxParticle
    );
  }
  generateParticleGlobalData() {
    const t = this.particleGlobalMemory;
    t.setVector3("gravity", new m(0, 0, 0)), t.setFloat("spaceDamping", 0), t.setFloat("enable_dirBySpeed", 0), t.setFloat("enable_dirBySpeed1", 0), t.setFloat("enable_dirBySpeed2", 0), t.setFloat("enable_dirBySpeed3", 0), t.setVector4Array("overLife_scale", [o.ONE.clone(), o.ONE.clone()]), t.setVector4Array("overLife_colors", [o.ONE.clone(), o.ONE.clone()]), t.setVector4Array("overLife_rotations", [o.ZERO.clone(), o.ZERO.clone()]), t.setVector4("cameraPos", o.ZERO.clone()), t.setUint32("textureSheet_ClipCol", 1), t.setUint32("textureSheet_TotalClip", 1), t.setFloat("textureSheet_PlayRate", 1), t.setUint32("textureSheet_TextureWidth", 1), t.setUint32("textureSheet_TextureHeight", 1), t.setFloat("textureSheet_retain0", 0), t.setFloat("textureSheet_retain1", 0), t.setFloat("textureSheet_retain2", 0), t.apply();
  }
  generateParticleLocalData() {
  }
  initPipeline() {
    this._computes = [];
    let t = new Y(H);
    t.setStorageBuffer("globalData", this.particleGlobalMemory), t.setStorageBuffer("particles", this.particleLocalMemory), t.workerSizeX = Math.ceil(this.maxParticle / 64), this._computes.push(t), this.updateBuffer(0);
  }
}
let j = (
  /* wgsl */
  `
    struct GlobalData {
        instance_index: u32,
        maxParticles: u32,
        time: f32,
        timeDelta: f32,

        duration: f32,
        isLoop: f32,
        simulatorSpace: u32,
        retain1: f32,

        emitterPos: vec4<f32>,

        gravity: vec3<f32>,
        spaceDamping: f32,

        enable_dirBySpeed: f32,
        enable_dirBySpeed1: f32,
        enable_dirBySpeed2: f32,
        enable_dirBySpeed3: f32,

        overLife_scale: array<vec4<f32>,2>,
        overLife_colors: array<vec4<f32>,2>,
        overLife_rotations: array<vec4<f32>,2>,
        cameraPos: vec4<f32>,

        textureSheet_ClipCol: u32,
        textureSheet_TotalClip: u32,
        textureSheet_PlayRate: f32,
        textureSheet_TextureWidth: u32,
        textureSheet_TextureHeight: u32,
        textureSheet_retain0: f32,
        textureSheet_retain1: f32,
        textureSheet_retain2: f32,
    };

    struct ParticleData {
        particleLifeDuration:f32,
        start_time:f32,
        life_time:f32,
        hide:f32,

        vPos:vec4<f32>,
        vRot:vec4<f32>,
        vScale:vec4<f32>,
        vColor:vec4<f32>,
        vSpeed:vec4<f32>,
        
        vForce_Pos:vec4<f32>,
        vForce_Rot:vec4<f32>,
        vForce_Scale:vec4<f32>,

        start_pos:vec4<f32>,
        start_size:vec4<f32>,
        start_rotation:vec4<f32>,

        start_velocity:vec4<f32>,
        start_acceleration:vec4<f32>,

        start_rotVelocity:vec4<f32>,
        start_rotAcceleration:vec4<f32>,

        start_scaleVelocity:vec4<f32>,
        start_scaleAcceleration:vec4<f32>,

        start_color:vec4<f32>,

        start_angularVelocity: vec4<f32>,

        textureSheet_Frame: u32,
        retain0: f32,
        retain1: f32,
        retain2: f32,
    };
`
);
class ot extends Z {
  /**
   * whether the animation will auto play
   */
  autoPlay = !0;
  /**
   * the simulator of particle.
   */
  particleSimulator;
  /**
   * playing status
   */
  playing = !1;
  /**
   * animation playing speed
   */
  playSpeed = 1;
  constructor() {
    super(), this.alwaysRender = !0, this.renderOrder = 3001, this._rendererMask = T.Particle, x.register("ParticleDataStruct", j);
  }
  /**
   * material
   */
  get material() {
    return this._materials[0];
  }
  set material(t) {
    this.materials = [t];
  }
  /**
   * The geometry of the mesh determines its shape
   */
  get geometry() {
    return this._geometry;
  }
  set geometry(t) {
    super.geometry = t, this.object3D.bound = this._geometry.bounds.clone(), this._readyPipeline && this.initPipeline();
  }
  /**
   * Set preheat time(second)
   */
  set preheatTime(t) {
    this.particleSimulator.preheatTime = t;
  }
  /**
   * Get preheat time(second)
   */
  get preheatTime() {
    return this.particleSimulator.preheatTime;
  }
  /**
   * Set particle simulator's looping
   */
  set looping(t) {
    this.particleSimulator.looping = t;
  }
  /**
   * Get particle simulator's looping
   */
  get looping() {
    return this.particleSimulator.looping;
  }
  init() {
    super.init();
  }
  /**
   * Set to use the specified particle emulator
   * @param c class of particle emulator
   */
  useSimulator(t) {
    return this.particleSimulator = new t(), this.particleSimulator.initBuffer(this), this.particleSimulator;
  }
  /**
   * start to play animation, with a speed value
   * @param speed playSpeed, see{@link playSpeed}
   */
  play(t = 1) {
    this.playing = !0, this.playSpeed = t;
  }
  /**
   * stop playing
   */
  stop() {
    this.playing = !1;
  }
  start() {
    this.geometry || (this.geometry = new q(1, 1, 1, 1, m.Z_AXIS)), this.material || (this.material = new I()), this.particleSimulator.build(), this.autoPlay && (this.playing = !0);
    let t = this.material.getPass(v.COLOR)[0];
    t.setStorageBuffer("particleGlobalData", this.particleSimulator.particleGlobalMemory), t.setStorageBuffer("particleLocalDatas", this.particleSimulator.particleLocalMemory), this.instanceCount = this.particleSimulator.maxParticle;
  }
  _frame = -1;
  _time = 0;
  onCompute(t, e) {
    if (this._frame == -1) {
      this._frame = _.frame, this._time += this.preheatTime, this.particleSimulator.updateBuffer(this.preheatTime), this.particleSimulator.compute(e);
      return;
    }
    if (this.playing) {
      this._frame = _.frame;
      let i = _.delta * 1e-3;
      i *= this.playSpeed, this._time += i, this.particleSimulator.updateBuffer(i), this.particleSimulator.compute(e);
    }
  }
}
export {
  k as EmitLocation,
  y as ParticleBuffer,
  Q as ParticleCompute,
  S as ParticleData,
  W as ParticleEmitterModule,
  U as ParticleGlobalMemory,
  $ as ParticleGravityModifierModule,
  O as ParticleLocalMemory,
  P as ParticleMassData,
  B as ParticleMassModule,
  st as ParticleMassSimulator,
  I as ParticleMaterial,
  n as ParticleModuleBase,
  J as ParticleOverLifeColorModule,
  K as ParticleOverLifeRotationModule,
  tt as ParticleOverLifeScaleModule,
  et as ParticleOverLifeSpeedModule,
  at as ParticleRotationModule,
  b as ParticleSimulator,
  it as ParticleSpeedDirModule,
  g as ParticleStandardData,
  lt as ParticleStandardSimulator,
  ot as ParticleSystem,
  rt as ParticleTextureSheetModule,
  A as ShapeType,
  E as SimulatorSpace
};
