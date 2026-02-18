# Shader and Compute Rules

## TOC

- `shader-register-key-unique`
- `shader-include-reuse-first`
- `shader-variant-define-gate`
- `shader-uniform-binding-name-match`
- `compute-workgroup-grid-fit`
- `compute-buffer-apply-before-dispatch`
- `compute-storage-texture-contract`
- `shader-minimal-debug-path`

## Rule `shader-register-key-unique`

- Priority: CRITICAL
- Anti-pattern: `ShaderLib.register` 키를 중복 사용해 다른 셰이더를 덮어쓴다.
- Preferred pattern: 셰이더 키 네이밍 규칙을 두고 유일성을 강제한다.
- Verification: 프로젝트 내 `ShaderLib.register` 키 중복 검사 스크립트를 실행한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_material.md`
- Evidence (External): <https://www.orillusion.com/zh/wgsl.html>

## Rule `shader-include-reuse-first`

- Priority: HIGH
- Anti-pattern: 공통 WGSL 로직을 파일마다 복붙한다.
- Preferred pattern: 공통 조각은 `#include` 기반으로 재사용하고 한 곳에서 유지보수한다.
- Verification: 공통 함수/구조체 중복 정의를 검색해 `#include`로 정리한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_include.md`
- Evidence (External): <https://www.orillusion.com/guide/>

## Rule `shader-variant-define-gate`

- Priority: HIGH
- Anti-pattern: 하나의 대형 셰이더에서 분기 제어 없이 기능을 모두 활성화한다.
- Preferred pattern: `setDefine`/`setConst`로 기능 변형을 분리해 필요한 경로만 활성화한다.
- Verification: 변형별 define 조합을 문서화하고 테스트 장면에서 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_variants.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/shader/shader_variants.html>

## Rule `shader-uniform-binding-name-match`

- Priority: CRITICAL
- Anti-pattern: WGSL 변수명과 TypeScript `setUniform*`, `setStorageBuffer`, `setStorageTexture` 이름이 불일치한다.
- Preferred pattern: 바인딩 이름을 단일 출처로 관리하고 셰이더-코드 간 이름을 일치시킨다.
- Verification: compute/material 초기화 코드에서 모든 binding name을 정적 점검한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_compute.md`
- Evidence (External): <https://www.orillusion.com/zh/wgsl.html>

## Rule `compute-workgroup-grid-fit`

- Priority: HIGH
- Anti-pattern: 출력 크기와 맞지 않는 워크그룹 디스패치 수를 하드코딩한다.
- Preferred pattern: `ceil(width / workgroup_size)` 방식으로 `workerSizeX/Y/Z`를 계산한다.
- Verification: 다양한 해상도에서 out-of-bounds 없이 동일 결과를 보장한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_compute.md`
- Evidence (External): <https://www.orillusion.com/zh/wgsl.html>

## Rule `compute-buffer-apply-before-dispatch`

- Priority: HIGH
- Anti-pattern: `UniformGPUBuffer`/`ComputeGPUBuffer` 갱신 후 `apply()` 없이 디스패치한다.
- Preferred pattern: 버퍼 변경 직후 `apply()`를 호출해 GPU 동기화 후 디스패치한다.
- Verification: 버퍼 값 변경 테스트에서 프레임 반영 지연이 없는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_compute.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/shader/shader_compute.html>

## Rule `compute-storage-texture-contract`

- Priority: HIGH
- Anti-pattern: Storage texture를 생성할 때 usage 플래그를 누락한다.
- Preferred pattern: `GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING` 계약을 지킨다.
- Verification: 컴퓨트 결과 텍스처를 후속 패스에서 재샘플링 가능한지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_compute.md`
- Evidence (External): <https://www.orillusion.com/zh/webgpu.html>

## Rule `shader-minimal-debug-path`

- Priority: MEDIUM
- Anti-pattern: 복합 패스 전체를 동시에 수정해 셰이더 오류 원인을 찾는다.
- Preferred pattern: 최소 패스/최소 define 조합으로 축소해 오류를 분리한다.
- Verification: base pass 성공 후 기능을 단계적으로 다시 켠다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/shader/shader_unlit.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/shader/shader_unlit.html>
