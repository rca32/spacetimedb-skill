# Resource and Lifecycle Rules

## TOC

- `resource-use-res-cache`
- `resource-prefab-clone-contract`
- `resource-loader-callback-policy`
- `resource-gltf-first-format`
- `lifecycle-avoid-force-destroy-on-shared`
- `lifecycle-explicit-release-unused-assets`
- `resource-texture-sampling-defaults`
- `resource-loader-concurrency-tune`

## Rule `resource-use-res-cache`

- Priority: CRITICAL
- Anti-pattern: 동일 URL 리소스를 반복 로딩해 중복 메모리를 만든다.
- Preferred pattern: `Engine3D.res` 풀(`add/get/load*`)을 기준으로 리소스를 재사용한다.
- Verification: 동일 텍스처/모델 URL의 중복 네트워크 요청이 없는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/resource/Readme.md`
- Evidence (External): <https://www.orillusion.com/guide/resource/Readme.html>

## Rule `resource-prefab-clone-contract`

- Priority: HIGH
- Anti-pattern: prefab 원본 오브젝트를 직접 수정해 전역 상태를 오염시킨다.
- Preferred pattern: 프리팹은 `instantiate()`된 클론 인스턴스를 사용해 씬별 상태를 분리한다.
- Verification: 씬 A의 수정이 씬 B 인스턴스에 전파되지 않는지 확인한다.
- Evidence (Local): `orillusion/src/assets/Res.ts`
- Evidence (External): <https://www.orillusion.com/guide/core/object.html>

## Rule `resource-loader-callback-policy`

- Priority: HIGH
- Anti-pattern: 인증 헤더, URL 리라이트, 에러 핸들링을 로더마다 중복 구현한다.
- Preferred pattern: `LoaderFunctions`(`onProgress`, `onError`, `onUrl`, `headers`)로 로딩 정책을 표준화한다.
- Verification: glTF/texture 로딩 경로에서 공통 콜백 정책이 재사용되는지 점검한다.
- Evidence (Local): `orillusion-web/docs/guide/resource/Readme.md`
- Evidence (External): <https://www.orillusion.com/guide/resource/Readme.html>

## Rule `resource-gltf-first-format`

- Priority: HIGH
- Anti-pattern: 파이프라인 표준 없이 혼합 포맷을 임의 사용한다.
- Preferred pattern: 모델 전송/런타임 포맷은 glTF/glb를 기본으로 하고 확장은 명시적으로 관리한다.
- Verification: 에셋 파이프라인 문서에 포맷 우선순위를 정의한다.
- Evidence (Local): `orillusion-web/docs/guide/resource/gltf.md`
- Evidence (External): <https://www.khronos.org/gltf>

## Rule `lifecycle-avoid-force-destroy-on-shared`

- Priority: CRITICAL
- Anti-pattern: 공유 중인 geometry/material에 `destroy(true)`를 사용해 렌더 오류를 유발한다.
- Preferred pattern: 공유 리소스는 참조 관계를 확인하고 강제 파괴를 피한다.
- Verification: 공유 객체 제거 시 다른 오브젝트 렌더가 유지되는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/core/object.md`
- Evidence (External): <https://www.orillusion.com/guide/core/object.html>

## Rule `lifecycle-explicit-release-unused-assets`

- Priority: HIGH
- Anti-pattern: 엔티티 파괴만 수행하고 리소스 해제를 생략한다.
- Preferred pattern: 재사용 계획이 없는 geometry/material/texture는 명시적으로 해제한다.
- Verification: 장시간 플레이 후 메모리 사용량 추세가 안정적인지 확인한다.
- Evidence (Local): `orillusion/src/core/entities/Entity.ts`
- Evidence (External): <https://www.orillusion.com/guide/>

## Rule `resource-texture-sampling-defaults`

- Priority: MEDIUM
- Anti-pattern: 텍스처 주소/필터/mipmap 기본값을 이해하지 않고 임의 변경한다.
- Preferred pattern: 기본값을 유지하고 아트 요구가 명확할 때만 `addressMode`, `min/magFilter`를 조정한다.
- Verification: 텍스처 품질 이슈 발생 시 샘플링 파라미터 diff를 먼저 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/texture.md`
- Evidence (External): <https://www.orillusion.com/guide/graphics/texture.html>

## Rule `resource-loader-concurrency-tune`

- Priority: MEDIUM
- Anti-pattern: 느린 네트워크/모바일 환경에서도 고정 고동시성으로 로딩한다.
- Preferred pattern: `Engine3D.setting.loader.numConcurrent`를 환경별로 조정한다.
- Verification: 초기 로딩 시간과 실패율을 동시성별로 측정한다.
- Evidence (Local): `orillusion/src/Engine3D.ts`
- Evidence (External): <https://www.orillusion.com/guide/resource/Readme.html>
