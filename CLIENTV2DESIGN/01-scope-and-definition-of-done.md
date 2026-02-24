# 01 Scope And Definition Of Done

작성일: 2026-02-24
범위: clientv2 빅뱅 구현 범위와 완료 정의

## 목표
- clientv2를 기존 코드와 완전히 분리된 신규 구조로 완성한다.
- 기능 정상 동작을 agent 검증 증거로만 승인 가능한 체계를 포함한다.

## 범위
- 포함(In):
  - 네트워크 동기화, AOI 구독, 엔티티/씬, 렌더/라이트/스카이, 옥트리, 물리/애니메이션, FX, 오디오, UI, 에셋 파이프라인, 테스트/배포 운영.
  - Orillusion vendored 소스 관리 체계.
  - 서버 v2 계약 재설계.
- 제외(Out):
  - clientv1 코드/데이터/런타임 호환.
  - 서버 스키마/리듀서 마이그레이션.
  - 과거 에셋 링크/공유 경로 참조.

## 인터페이스
- 클라이언트 런타임 루트: `stitch-orillusion-clientv2`.
- 엔진 소스 루트: `stitch-orillusion-clientv2/engines/orillusion-src`.
- 자산 반입 루트: `stitch-orillusion-clientv2/public/{props,audio,ui}`.
- 서버 접속 계약은 `03-spacetimedb-contract.md`를 따른다.

## 데이터/이벤트
- 기능 ID 체계: `F-<domain>-<nnn>`.
- 시나리오 ID 체계: `S<nn>`.
- assertion ID 체계: `A-<domain>-<nnn>`.
- 증적 ID 체계: `E-<run_id>-<artifact>`.

## 실패 모드
- Gate-0 통과 전 기능 구현 시작.
- 기능 정의에 시나리오/assertion/증적 매핑 누락.
- 하위 호환 요구를 암묵적으로 도입.

## 검증
- 개발 착수 조건:
  - `00-development-start-gate.md` Go 판정 필수.
- 기능 완료 조건:
  - 기능 ID별로 시나리오/assertion/증적 매핑이 존재.
  - `15` 수용 테스트 pass.
  - `14` 성능 게이트 pass.
- 릴리스 완료 조건:
  - `16` 컷오버 체크리스트 pass.

## 운영
- 범위 변경은 반드시 문서 변경 PR로 먼저 반영한다.
- 범위 변경 시 `README`, `15`, `17` 동시 갱신.

## 수용 기준
- 구현자가 추가 의사결정 없이 개발 착수 가능하다.
- 완료 판정에 수동 검증 단독 증거가 사용되지 않는다.
- 호환성/마이그레이션 요구가 문서에서 0건이다.

## Cross-Refs
- `00-development-start-gate.md`
- `15-test-plan-and-acceptance.md`
- `16-build-release-cutover.md`
