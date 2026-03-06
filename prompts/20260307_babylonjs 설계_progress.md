# 20260307_babylonjs 설계 progress

## 진행 현황
- [x] `AGENTS.md` 확인
- [x] `DESIGN/01-gdd.md` 검토
- [x] 기존 Bevy client RFC(`docs/rfc-002~004`) 검토
- [x] 현재 `stitch-orillusion-client`의 subscription/AOI/runtime 흐름 확인
- [x] `babylonjs-engine` 스킬 참조
- [x] `spacetimedb` 클라이언트 통합 레퍼런스 참조
- [x] `DESIGNBABYLON/01-babylonjs-client-design.md` 작성
- [x] 작업 기록 파일 갱신

## 이번 작업 결과
- Babylon.js 신규 웹 클라이언트의 상태 머신, 모듈 구조, TypeScript 인터페이스를 정의했다.
- Babylon 엔진 기능을 월드 스트리밍, 건설 preview, NPC 상호작용, HUD, VFX, 품질 계층에 매핑했다.
- SpacetimeDB 구독, `onApplied` 게이트, reducer dispatch, correction/recovery 정책을 기존 설계와 정합되게 문서화했다.

## 남은 후속 작업
- 실제 구현 단계에서 문서의 interface/module 이름을 코드 구조와 1:1 매핑
- Babylon prototype 또는 vertical slice 착수 시 quality tier와 asset budget 수치 검증
