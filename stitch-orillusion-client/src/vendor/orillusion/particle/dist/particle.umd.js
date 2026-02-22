(function(r,e){typeof exports=="object"&&typeof module<"u"?e(exports,require("@orillusion/core")):typeof define=="function"&&define.amd?define(["exports","@orillusion/core"],e):(r=typeof globalThis<"u"?globalThis:r||self,e(r.Particle={},r.Orillusion))})(this,function(r,e){"use strict";class m extends e.GPUBufferBase{constructor(t,a){super(),t>0&&this.createBuffer(GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST,t,a)}alloc(t,a){let s=this.memoryNodes.get(t);return s||(s=this.memory.allocation_node(a),this.memoryNodes.set(t,s)),s}allocInt8(t){return this.alloc(t,1)}allocUint8(t){return this.alloc(t,1)}allocInt16(t){return this.alloc(t,2)}allocUint16(t){return this.alloc(t,2)}allocInt32(t){return this.alloc(t,4)}allocUint32(t){return this.alloc(t,4)}allocFloat32(t){return this.alloc(t,4)}allocVec2(t){return this.alloc(t,4*2)}allocVec3(t){return this.alloc(t,4*3)}allocVec4(t){return this.alloc(t,4*4)}}class v extends m{particlesData=[];onChange=!1;allocationParticle(t,a){if(this.particlesData.length>=t)return;for(let l=this.particlesData.length;l<t;l++){let u=a.generateParticleData();this.particlesData.push(u)}let s=this.particlesData.length>0?this.particlesData[0].totalCount:0,o=Math.max(s*t*4,32);(this.byteSize==null||this.byteSize<o)&&this.createBuffer(GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC,o),this.reset();for(let l=0;l<t;l++)this.particlesData[l].memoryList.forEach(n=>{this.memory.allocation_memory(n)});this.onChange=!0}}class x extends m{_instanceID;_maxParticles;_time;_timeDelta;_duration;_isLoop;_simulatorSpace;_retain1;_emitterPos;onChange=!1;constructor(t,a){super(t,a),this._instanceID=this.allocUint32("instance_index"),this._maxParticles=this.allocUint32("maxParticles"),this._time=this.allocFloat32("time"),this._timeDelta=this.allocFloat32("timeDelta"),this._duration=this.allocFloat32("duration"),this._isLoop=this.allocFloat32("isLoop"),this._simulatorSpace=this.allocUint32("simulatorSpace"),this._retain1=this.allocFloat32("retain1"),this._emitterPos=this.allocVec4("emitterPos")}setInstanceID(t){this._instanceID.setUint32(t),this.onChange=!0}getInstanceID(){return this._instanceID.getUint32()}setMaxParticles(t){this._maxParticles.setUint32(t),this.onChange=!0}getMaxParticles(){return this._maxParticles.getUint32()}setTime(t){this._time.setFloat(t)}getTime(){return this._time.getFloat()}setTimeDelta(t){this._timeDelta.setFloat(t),this.onChange=!0}getTimeDelta(){return this._timeDelta.getFloat()}setDuration(t){this._duration.setFloat(t),this.onChange=!0}getDuration(){return this._duration.getFloat()}setSimulatorSpace(t){this._simulatorSpace.setUint32(t),this.onChange=!0}getSimulatorSpace(){return this._simulatorSpace.getUint32()}setEmitterPos(t){this._emitterPos.setXYZ(t.x,t.y,t.z),this.onChange=!0}}class z{_computePipeline;_computeBindGroup;constructor(t,a){let s=e.webGPUContext.device;this._computePipeline=s.createComputePipeline({layout:"auto",compute:{module:s.createShaderModule({code:t}),entryPoint:"CsMain"}}),this._computeBindGroup=s.createBindGroup({layout:this._computePipeline.getBindGroupLayout(0),entries:a})}compute(t,a,s,o){{let l=t.beginComputePass();l.setPipeline(this._computePipeline),l.setBindGroup(0,this._computeBindGroup),l.dispatchWorkgroups(a,s,o),l.end()}}}class d{constructor(){}totalCount=0;memoryList=[];getUint32(){let t=new e.MemoryInfo;return t.byteSize=1*4,this.totalCount+=t.byteSize/4,this.memoryList.push(t),t}getFloat(){let t=new e.MemoryInfo;return t.byteSize=1*4,this.totalCount+=t.byteSize/4,this.memoryList.push(t),t}getVec2(){let t=new e.MemoryInfo;return t.byteSize=2*4,this.totalCount+=t.byteSize/4,this.memoryList.push(t),t}getVec3(){let t=new e.MemoryInfo;return t.byteSize=4*4,this.totalCount+=t.byteSize/4,this.memoryList.push(t),t}getVec4(){let t=new e.MemoryInfo;return t.byteSize=4*4,this.totalCount+=t.byteSize/4,this.memoryList.push(t),t}}class f extends d{position;velocity;force;density;pressure;data1;data2;constructor(){super()}static generateParticleData(){let t=new f;return t.position=t.getVec4(),t.velocity=t.getVec4(),t.force=t.getVec4(),t.density=t.getFloat(),t.pressure=t.getFloat(),t.data1=t.getFloat(),t.data2=t.getFloat(),t}}class h extends d{particleLifeDuration;start_time;life_time;hide;vPos;vRot;vScale;vColor;vSpeed;vForce_pos;vForce_Rot;vForce_Scale;start_pos;start_size;start_rotation;start_velocity;start_acceleration;start_rotVelocity;start_rotAcceleration;start_scaleVelocity;start_scaleAcceleration;start_color;start_angularVelocity;textureSheet_Frame;retain0;retain1;retain2;static generateParticleData(){let t=new h;return t.particleLifeDuration=t.getFloat(),t.start_time=t.getFloat(),t.life_time=t.getFloat(),t.hide=t.getFloat(),t.vPos=t.getVec4(),t.vRot=t.getVec4(),t.vScale=t.getVec4(),t.vColor=t.getVec4(),t.vSpeed=t.getVec4(),t.vForce_pos=t.getVec4(),t.vForce_Rot=t.getVec4(),t.vForce_Scale=t.getVec4(),t.start_pos=t.getVec4(),t.start_size=t.getVec4(),t.start_rotation=t.getVec4(),t.start_velocity=t.getVec4(),t.start_acceleration=t.getVec4(),t.start_rotVelocity=t.getVec4(),t.start_rotAcceleration=t.getVec4(),t.start_scaleVelocity=t.getVec4(),t.start_scaleAcceleration=t.getVec4(),t.start_color=t.getVec4(),t.start_angularVelocity=t.getVec4(),t.textureSheet_Frame=t.getUint32(),t.retain0=t.getFloat(),t.retain1=t.getFloat(),t.retain2=t.getFloat(),t}}let R=`
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
`;class g extends e.Material{constructor(){super(),e.ShaderLib.register("ParticleRenderShader",R);let t=new e.Shader,a=new e.RenderShaderPass("ParticleRenderShader","ParticleRenderShader");a.passType=e.PassType.COLOR,a.setShaderEntry("VertMain","FragMain"),t.addRenderPass(a),a.setUniformVector4("transformUV1",new e.Vector4(0,0,1,1)),a.setUniformVector4("transformUV2",new e.Vector4(0,0,1,1)),a.setUniformColor("baseColor",new e.Color),a.setUniformFloat("alphaCutoff",.5),a.renderOrder=3001,a.shaderState.transparent=!0,a.shaderState.depthWriteEnabled=!1,a.shaderState.depthCompare=e.GPUCompareFunction.less,a.shaderState.acceptShadow=!1,a.shaderState.receiveEnv=!1,a.shaderState.acceptGI=!1,a.shaderState.useLight=!1,a.shaderState.castShadow=!1,this.shader=t,this.baseMap=e.Engine3D.res.whiteTexture,this.blendMode=e.BlendMode.ADD}set baseMap(t){this.shader.setTexture("baseMap",t)}get baseMap(){return this.shader.getTexture("baseMap")}set envMap(t){}set shadowMap(t){}}class c{_simulator;__init(){this.init()}init(){}set needReset(t){this._simulator.needReset=t}get needReset(){return this._simulator.needReset}setSimulator(t){this._simulator=t}calculateParticle(t,a){}generateParticleModuleData(t,a){}}class y extends c{init(){}calculateParticle(t,a){}}var S=(i=>(i[i.Box=0]="Box",i[i.Circle=1]="Circle",i[i.Cone=2]="Cone",i[i.Sphere=3]="Sphere",i[i.Hemisphere=4]="Hemisphere",i))(S||{}),M=(i=>(i[i.Default=0]="Default",i[i.Edge=1]="Edge",i[i.Shell=2]="Shell",i[i.Volume=3]="Volume",i))(M||{});class P extends c{set shapeType(t){this._shapeType=t,this.needReset=!0}get shapeType(){return this._shapeType}_shapeType=0;set emitLocation(t){this._emitLocation=t,this.needReset=!0}get emitLocation(){return this._emitLocation}_emitLocation=0;set angle(t){this._angle=t}get angle(){return this._angle}_angle=10;set radius(t){this._radius=t,this.needReset=!0}get radius(){return this._radius}_radius=10;set boxSize(t){this._boxSize.copyFrom(t),this.needReset=!0}get boxSize(){return this._boxSize}_boxSize=new e.Vector3(10,10,10);set randSeed(t){this._rand.seed=t,this.needReset=!0}get randSeed(){return this._rand.seed}_rand=new e.Rand;set maxParticle(t){this._simulator.maxParticle=t,this._maxParticle!=t&&(this.needReset=!0),this._maxParticle=t}get maxParticle(){return this._maxParticle}_maxParticle=1e3;set emissionRate(t){this._emissionRate=t,this.needReset=!0}get emissionRate(){return this._emissionRate}_emissionRate=1;set duration(t){this._duration=t,this.needReset=!0}get duration(){return this._duration}_duration=10;set startLifecycle(t){this._startLifecycle=t,this.needReset=!0}get startLifecycle(){return this._startLifecycle}_startLifecycle=new e.MinMaxCurve;set startVelocityX(t){this._startVelocity[0]=t,this.needReset=!0}get startVelocityX(){return this._startVelocity[0]}set startVelocityY(t){this._startVelocity[1]=t,this.needReset=!0}get startVelocityY(){return this._startVelocity[1]}set startVelocityZ(t){this._startVelocity[2]=t,this.needReset=!0}get startVelocityZ(){return this._startVelocity[2]}_startVelocity=[new e.MinMaxCurve(0),new e.MinMaxCurve(0),new e.MinMaxCurve(0)];set startScale(t){this._startScaleXYZ=[t,t,t],this.needReset=!0}get startScale(){return this._startScaleXYZ[2]}set startScaleX(t){this._startScaleXYZ[0]=t,this.needReset=!0}get startScaleX(){return this._startScaleXYZ[0]}set startScaleY(t){this._startScaleXYZ[1]=t,this.needReset=!0}get startScaleY(){return this._startScaleXYZ[1]}set startScaleZ(t){this._startScaleXYZ[2]=t,this.needReset=!0}get startScaleZ(){return this._startScaleXYZ[2]}_startScaleXYZ=[new e.MinMaxCurve,new e.MinMaxCurve,new e.MinMaxCurve];isUseStartScaleXYZ(){return!(this._startScaleXYZ[0]==this._startScaleXYZ[1]&&this._startScaleXYZ[1]==this._startScaleXYZ[2])}set startRotation(t){this._startRotationXYZ=[t,t,t],this.needReset=!0}get startRotation(){return this._startRotationXYZ[2]}set startRotationX(t){this._startRotationXYZ[0]=t,this.needReset=!0}get startRotationX(){return this._startRotationXYZ[0]}set startRotationY(t){this._startRotationXYZ[1]=t,this.needReset=!0}get startRotationY(){return this._startRotationXYZ[1]}set startRotationZ(t){this._startRotationXYZ[2]=t,this.needReset=!0}get startRotationZ(){return this._startRotationXYZ[2]}_startRotationXYZ=[new e.MinMaxCurve(0),new e.MinMaxCurve(0),new e.MinMaxCurve(0)];isUseStartRotationXYZ(){return!(this._startRotationXYZ[0]==this._startRotationXYZ[1]&&this._startRotationXYZ[1]==this._startRotationXYZ[2])}init(){this.maxParticle=1e3}generateParticleModuleData(t,a){t.setUint32("maxParticles",this.maxParticle),t.setDuration(this.duration);const s=this._simulator.maxParticle;a.allocationParticle(s,h);let o=this._simulator.maxActiveParticle;console.warn(`Count(${o})`);let l=a.particlesData;for(let u=0;u<o;u++){const n=l[u];switch(this.shapeType){case 0:this.calculateBoxShapeParticlePos(n);break;case 1:this.calculateCircleShapeParticlePos(n);break;case 2:this.calculateConeShapeParticlePos(n);break;case 3:this.calculateSphereShapeParticlePos(n);break;case 4:this.calculateHemisphereShapeParticlePos(n);break}if(n.life_time.setX(e.MinMaxCurve.evaluate(this.startLifecycle,this._rand.getFloat())),n.start_time.setX(Math.floor(u%this.emissionRate)/this.emissionRate+Math.floor(u/this.emissionRate)),this.isUseStartScaleXYZ())n.start_size.setXYZ(e.MinMaxCurve.evaluate(this.startScaleX,this._rand.getFloat()),e.MinMaxCurve.evaluate(this.startScaleY,this._rand.getFloat()),e.MinMaxCurve.evaluate(this.startScaleZ,this._rand.getFloat()));else{let p=e.MinMaxCurve.evaluate(this.startScale,this._rand.getFloat());n.start_size.setXYZ(p,p,p)}this.isUseStartRotationXYZ()?n.start_rotation.setXYZ(e.MinMaxCurve.evaluate(this.startRotationX,this._rand.getFloat())*e.DEGREES_TO_RADIANS,e.MinMaxCurve.evaluate(this.startRotationY,this._rand.getFloat())*e.DEGREES_TO_RADIANS,e.MinMaxCurve.evaluate(this.startRotationZ,this._rand.getFloat())*e.DEGREES_TO_RADIANS):n.start_rotation.setXYZ(0,0,e.MinMaxCurve.evaluate(this.startRotation,this._rand.getFloat())*e.DEGREES_TO_RADIANS),n.start_velocity.setXYZ(e.MinMaxCurve.evaluate(this.startVelocityX,this._rand.getFloat()),e.MinMaxCurve.evaluate(this.startVelocityY,this._rand.getFloat()),e.MinMaxCurve.evaluate(this.startVelocityZ,this._rand.getFloat()))}a.apply()}calculateBoxShapeParticlePos(t){switch(this.emitLocation){case 0:case 1:let a=Math.floor(this._rand.getFloat()*10)%3;a==0?t.start_pos.setXYZ(this._rand.getFloat()*this.boxSize.x-this.boxSize.x*.5,Math.floor(this._rand.getFloat()*10)%2*this.boxSize.y-this.boxSize.y*.5,Math.floor(this._rand.getFloat()*10)%2*this.boxSize.z-this.boxSize.z*.5):a==1?t.start_pos.setXYZ(Math.floor(this._rand.getFloat()*10)%2*this.boxSize.x-this.boxSize.x*.5,this._rand.getFloat()*this.boxSize.y-this.boxSize.y*.5,Math.floor(this._rand.getFloat()*10)%2*this.boxSize.z-this.boxSize.z*.5):a==2&&t.start_pos.setXYZ(Math.floor(this._rand.getFloat()*10)%2*this.boxSize.x-this.boxSize.x*.5,Math.floor(this._rand.getFloat()*10)%2*this.boxSize.y-this.boxSize.y*.5,this._rand.getFloat()*this.boxSize.z-this.boxSize.z*.5);break;case 2:{let s=Math.floor(this._rand.getFloat()*10)%3;s==0?t.start_pos.setXYZ(this._rand.getFloat()*this.boxSize.x-this.boxSize.x*.5,this._rand.getFloat()*this.boxSize.y-this.boxSize.y*.5,Math.floor(this._rand.getFloat()*10)%2*this.boxSize.z-this.boxSize.z*.5):s==1?t.start_pos.setXYZ(Math.floor(this._rand.getFloat()*10)%2*this.boxSize.x-this.boxSize.x*.5,this._rand.getFloat()*this.boxSize.y-this.boxSize.y*.5,this._rand.getFloat()*this.boxSize.z-this.boxSize.z*.5):s==2&&t.start_pos.setXYZ(this._rand.getFloat()*this.boxSize.x-this.boxSize.x*.5,Math.floor(this._rand.getFloat()*10)%2*this.boxSize.y-this.boxSize.y*.5,this._rand.getFloat()*this.boxSize.z-this.boxSize.z*.5)}break;case 3:t.start_pos.setXYZ(this._rand.getFloat()*this.boxSize.x-this.boxSize.x*.5,this._rand.getFloat()*this.boxSize.y-this.boxSize.y*.5,this._rand.getFloat()*this.boxSize.z-this.boxSize.z*.5);break}}calculateCircleShapeParticlePos(t){let a=this.radius;switch(this.emitLocation){case 0:case 1:{var s=this._rand.getFloat()*360*e.DEGREES_TO_RADIANS;t.start_pos.setXYZ(a*Math.cos(s),0,a*Math.sin(s))}break;case 2:case 3:{var o=new e.Vector3;do o.x=this._rand.getFloat()*this.radius*2-this.radius,o.z=this._rand.getFloat()*this.radius*2-this.radius;while(o.length>this.radius);t.start_pos.setXYZ(o.x,o.y,o.z)}break}}calculateConeShapeParticlePos(t){}calculateSphereShapeParticlePos(t){let a=new e.Vector3;do a.x=this._rand.getFloat()*this.radius*2-this.radius,a.y=this._rand.getFloat()*this.radius*2-this.radius,a.z=this._rand.getFloat()*this.radius*2-this.radius;while(a.length>this.radius);switch(this.emitLocation){case 2:case 1:a.normalize().multiplyScalar(this.radius),t.start_pos.setXYZ(a.x,a.y,a.z);break;case 0:case 3:default:t.start_pos.setXYZ(a.x,a.y,a.z);break}}calculateHemisphereShapeParticlePos(t){let a=this.radius;switch(this.emitLocation){case 1:case 2:a=this.radius;break;case 0:case 3:default:a=this._rand.getFloat()*this.radius;break}var s=this._rand.getFloat()*180*e.DEGREES_TO_RADIANS,o=a*Math.sin(s),l=this._rand.getFloat()*180*e.DEGREES_TO_RADIANS;t.start_pos.setXYZ(o*Math.cos(l),o*Math.sin(l),-a*Math.cos(s))}}class V extends c{set gravity(t){this._gravity=t,this._simulator.particleGlobalMemory.setVector3("gravity",this.gravity)}get gravity(){return this._gravity}_gravity=new e.Vector3(0,-9.8,0);generateParticleModuleData(t,a){t.setVector3("gravity",this.gravity)}}class D extends c{set startColor(t){this._colorSegments[0].copyFrom(t),this.needReset=!0}get startColor(){return this._colorSegments[0]}set startAlpha(t){this._colorSegments[0].a=t,this.needReset=!0}get startAlpha(){return this._colorSegments[0].a}set endColor(t){this._colorSegments[1].copyFrom(t),this.needReset=!0}get endColor(){return this._colorSegments[1]}set endAlpha(t){this._colorSegments[1].a=t,this.needReset=!0}get endAlpha(){return this._colorSegments[1].a}_colorSegments=[new e.Color(1,1,1,1),new e.Color(1,1,1,1)];generateParticleModuleData(t,a){t.setColorArray("overLife_colors",this._colorSegments)}}class C extends c{rotationSegments=[new e.Vector4,new e.Vector4];generateParticleModuleData(t,a){t.setVector4Array("overLife_rotations",this.rotationSegments)}}class F extends c{scaleSegments=[new e.Vector4(1,1,1,1),new e.Vector4(2,2,2,1)];generateParticleModuleData(t,a){t.setVector4Array("overLife_scale",this.scaleSegments)}}class L extends c{speedSegments=[new e.Vector4(0,0,0,0),new e.Vector4(0,0,0,0)];generateParticleModuleData(t,a){t.setVector4Array("overLife_speed",this.speedSegments)}}class w extends c{get angularVelocityX(){return this.angularVelocityXYZ[0]}set angularVelocityX(t){this.angularVelocityXYZ[0]=t}get angularVelocityY(){return this.angularVelocityXYZ[1]}set angularVelocityY(t){this.angularVelocityXYZ[1]=t}get angularVelocityZ(){return this.angularVelocityXYZ[2]}set angularVelocityZ(t){this.angularVelocityXYZ[2]=t}angularVelocityXYZ=[new e.MinMaxCurve(0),new e.MinMaxCurve(0),new e.MinMaxCurve(0)];generateParticleModuleData(t,a){let s=this._simulator.maxActiveParticle,o=a.particlesData;for(let l=0;l<s;l++)o[l].start_angularVelocity.setXYZ(e.MinMaxCurve.evaluate(this.angularVelocityX,Math.random()),e.MinMaxCurve.evaluate(this.angularVelocityY,Math.random()),e.MinMaxCurve.evaluate(this.angularVelocityZ,Math.random()))}}class T extends c{_enable=!0;get enable(){return this._enable}set enable(t){this._enable=t,this._simulator.particleGlobalMemory.setFloat("enable_dirBySpeed",this.enable?1:0)}generateParticleModuleData(t,a){t.setFloat("enable_dirBySpeed",this.enable?1:0)}}class X extends c{clipCol=1;totalClip=1;playRate=1;textureWidth=1;textureHeight=1;playMode=0;generateParticleModuleData(t,a){t.setUint32("textureSheet_ClipCol",this.clipCol),t.setUint32("textureSheet_TotalClip",this.totalClip),t.setFloat("textureSheet_PlayRate",this.playRate),t.setUint32("textureSheet_TextureWidth",this.textureWidth),t.setUint32("textureSheet_TextureHeight",this.textureHeight)}}var b=(i=>(i[i.Local=0]="Local",i[i.World=1]="World",i))(b||{});class _{maxParticle=1e3;needReset=!0;preheatTime=0;_simulatorSpace=0;set simulatorSpace(t){this._simulatorSpace=t,this.particleGlobalMemory.setSimulatorSpace(this._simulatorSpace)}get simulatorSpace(){return this._simulatorSpace}particleLocalMemory;particleGlobalMemory;_particleModules;_computes;_looping=!1;_particleSystem;constructor(){this._computes=[],this._particleModules=new Map}set looping(t){this._looping=t,this.particleGlobalMemory.setFloat("isLoop",t?1:0)}get looping(){return this._looping}addModule(t){if(!this._particleModules.has(t.prototype)){let a=new t;return a.setSimulator(this),a.__init(),this._particleModules.set(t.prototype,a),a}return this.getModule(t)}getModule(t){return this._particleModules.get(t.prototype)}removeModule(t){this._particleModules.has(t.prototype)&&this._particleModules.delete(t.prototype)}initBuffer(t){this.particleLocalMemory=new v(0),this.particleGlobalMemory=new x(64),this.particleGlobalMemory.setInstanceID(t.transform._worldMatrix.index),this._particleSystem=t,this.looping=!0}build(){this.needReset=!1,this.generateParticleGlobalData(),this.generateParticleLocalData(),this._particleModules.forEach((t,a)=>{t.generateParticleModuleData(this.particleGlobalMemory,this.particleLocalMemory)}),this.initPipeline()}generateParticleGlobalData(){}generateParticleLocalData(){}initPipeline(){}compute(t){this._computes&&this._computes.length>0&&e.GPUContext.computeCommand(t,this._computes)}updateBuffer(t){this.needReset&&this.build();{this.particleGlobalMemory.setTime(this.preheatTime),this.particleGlobalMemory.setTimeDelta(t);let a=this._particleSystem.transform.worldPosition;this.particleGlobalMemory.setVector3("emitterPos",a),this.particleLocalMemory.onChange&&(this.particleLocalMemory.onChange=!1,this.particleLocalMemory.apply()),this.particleGlobalMemory.onChange&&(this.particleGlobalMemory.onChange=!1,this.particleGlobalMemory.apply())}}debug(){}}class O extends _{constructor(){super(),this.addModule(y)}initPipeline(){}generateGlobalParticleData(){}compute(t){}}let Y=`
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
`;class Z extends _{_emitterModule;constructor(){super(),this._emitterModule=this.addModule(P)}get maxActiveParticle(){return Math.min(Math.max(Math.ceil(this._emitterModule.emissionRate*this._emitterModule.duration),this._emitterModule.emissionRate),this.maxParticle)}generateParticleGlobalData(){const t=this.particleGlobalMemory;t.setVector3("gravity",new e.Vector3(0,0,0)),t.setFloat("spaceDamping",0),t.setFloat("enable_dirBySpeed",0),t.setFloat("enable_dirBySpeed1",0),t.setFloat("enable_dirBySpeed2",0),t.setFloat("enable_dirBySpeed3",0),t.setVector4Array("overLife_scale",[e.Vector4.ONE.clone(),e.Vector4.ONE.clone()]),t.setVector4Array("overLife_colors",[e.Vector4.ONE.clone(),e.Vector4.ONE.clone()]),t.setVector4Array("overLife_rotations",[e.Vector4.ZERO.clone(),e.Vector4.ZERO.clone()]),t.setVector4("cameraPos",e.Vector4.ZERO.clone()),t.setUint32("textureSheet_ClipCol",1),t.setUint32("textureSheet_TotalClip",1),t.setFloat("textureSheet_PlayRate",1),t.setUint32("textureSheet_TextureWidth",1),t.setUint32("textureSheet_TextureHeight",1),t.setFloat("textureSheet_retain0",0),t.setFloat("textureSheet_retain1",0),t.setFloat("textureSheet_retain2",0),t.apply()}generateParticleLocalData(){}initPipeline(){this._computes=[];let t=new e.ComputeShader(Y);t.setStorageBuffer("globalData",this.particleGlobalMemory),t.setStorageBuffer("particles",this.particleLocalMemory),t.workerSizeX=Math.ceil(this.maxParticle/64),this._computes.push(t),this.updateBuffer(0)}}let q=`
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
`;class U extends e.RenderNode{autoPlay=!0;particleSimulator;playing=!1;playSpeed=1;constructor(){super(),this.alwaysRender=!0,this.renderOrder=3001,this._rendererMask=e.RendererMask.Particle,e.ShaderLib.register("ParticleDataStruct",q)}get material(){return this._materials[0]}set material(t){this.materials=[t]}get geometry(){return this._geometry}set geometry(t){super.geometry=t,this.object3D.bound=this._geometry.bounds.clone(),this._readyPipeline&&this.initPipeline()}set preheatTime(t){this.particleSimulator.preheatTime=t}get preheatTime(){return this.particleSimulator.preheatTime}set looping(t){this.particleSimulator.looping=t}get looping(){return this.particleSimulator.looping}init(){super.init()}useSimulator(t){return this.particleSimulator=new t,this.particleSimulator.initBuffer(this),this.particleSimulator}play(t=1){this.playing=!0,this.playSpeed=t}stop(){this.playing=!1}start(){this.geometry||(this.geometry=new e.PlaneGeometry(1,1,1,1,e.Vector3.Z_AXIS)),this.material||(this.material=new g),this.particleSimulator.build(),this.autoPlay&&(this.playing=!0);let t=this.material.getPass(e.PassType.COLOR)[0];t.setStorageBuffer("particleGlobalData",this.particleSimulator.particleGlobalMemory),t.setStorageBuffer("particleLocalDatas",this.particleSimulator.particleLocalMemory),this.instanceCount=this.particleSimulator.maxParticle}_frame=-1;_time=0;onCompute(t,a){if(this._frame==-1){this._frame=e.Time.frame,this._time+=this.preheatTime,this.particleSimulator.updateBuffer(this.preheatTime),this.particleSimulator.compute(a);return}if(this.playing){this._frame=e.Time.frame;let s=e.Time.delta*.001;s*=this.playSpeed,this._time+=s,this.particleSimulator.updateBuffer(s),this.particleSimulator.compute(a)}}}r.EmitLocation=M,r.ParticleBuffer=m,r.ParticleCompute=z,r.ParticleData=d,r.ParticleEmitterModule=P,r.ParticleGlobalMemory=x,r.ParticleGravityModifierModule=V,r.ParticleLocalMemory=v,r.ParticleMassData=f,r.ParticleMassModule=y,r.ParticleMassSimulator=O,r.ParticleMaterial=g,r.ParticleModuleBase=c,r.ParticleOverLifeColorModule=D,r.ParticleOverLifeRotationModule=C,r.ParticleOverLifeScaleModule=F,r.ParticleOverLifeSpeedModule=L,r.ParticleRotationModule=w,r.ParticleSimulator=_,r.ParticleSpeedDirModule=T,r.ParticleStandardData=h,r.ParticleStandardSimulator=Z,r.ParticleSystem=U,r.ParticleTextureSheetModule=X,r.ShapeType=S,r.SimulatorSpace=b,Object.defineProperty(r,Symbol.toStringTag,{value:"Module"})});
