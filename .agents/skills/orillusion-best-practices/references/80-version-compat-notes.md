# Version Compatibility Notes

## 기준 버전 (로컬 리포 기준)

- `@orillusion/core`: `0.8.4` (`orillusion/package.json`)
- docs 사이트 네비게이션: `v0.8` (`orillusion-web/docs/.vitepress/config.ts`)
- docs devDependency core: `0.8.3` (`orillusion-web/package.json`)

## 해석 규칙

1. 코드 구현 기준은 엔진 소스(`orillusion`)를 우선한다.
2. 문서 예제는 약간의 버전 차이를 포함할 수 있으므로 API 명칭은 소스와 교차 확인한다.
3. 샘플 코드에서 동작하더라도 현재 프로젝트 버전에서 재검증한다.

## 변경 이력에서 주의할 점

### 2024-11-27 (`0.8.4`)

- `destroy` 관련 렌더 오류 수정
- geometry/graphic/pick 관련 버그 수정

Evidence (Local): `orillusion/CHANGELOG.md`

### 2024-07-21 (`0.8.2`)

- `PointerEvent3D` 브레이킹 변경 (`event.data` 단순화)

Evidence (Local): `orillusion/CHANGELOG.md`

### 2023-09-06 (`0.6.9`)

- material/shadow/bloom 관련 브레이킹 변경 기록

Evidence (Local): `orillusion/CHANGELOG.md`

## 호환성 체크리스트

- [ ] core와 확장 패키지(`physics/particle/stats/graphic/geometry`) 버전대가 호환되는가?
- [ ] 문서 API 경로와 실제 타입 정의 경로가 일치하는가?
- [ ] 변경 이력의 브레이킹 항목이 현재 코드에 반영되었는가?

## 대응 정책

- 버전 충돌이 의심되면 먼저 `CHANGELOG`와 `package.json`을 근거로 설명한다.
- 답변 시 "문서 예제 기준"과 "현재 소스 기준"을 분리해 표기한다.
- 변경점이 큰 API는 샘플 코드와 함께 마이그레이션 메모를 작성한다.

## 외부 참조

- Orillusion npm: <https://www.npmjs.com/package/@orillusion/core>
- 공식 문서: <https://www.orillusion.com/guide/>
- glTF 표준: <https://www.khronos.org/gltf>
