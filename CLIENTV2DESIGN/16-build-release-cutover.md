# 16 Build Release Cutover

작성일: 2026-02-26
범위: clientv2 빌드/배포/컷오버/롤백 운영 (SpacetimeDB 2.0 동기화)

## 목표
- 서버 계약과 클라이언트 배포를 단일 컷오버로 일치시킨다.
- 실패 시 자동 증거 기반으로 신속하게 롤백한다.

## 범위
- 포함: 빌드 입력, codegen 규칙, 배포 순서, 컷오버 체크, 롤백 트리거.
- 제외: clientv1 병행 운영.

## 인터페이스
- 배포 입력:
  - `build_artifact_hash`
  - `contract_rev`
  - `asset_manifest_rev`
  - `spacetimedb_cli_version`
- 배포 출력:
  - `deployment_record.json`
  - `post_deploy_health_report.json`

## 데이터/이벤트
- 빌드/코드젠 규칙:
  - 기본:
    - `spacetime generate --lang typescript --out-dir stitch-orillusion-clientv2/src/module_bindings --module-path stitch-server/crates/game_server`
  - private 의존 시:
    - `spacetime generate --include-private --lang typescript --out-dir stitch-orillusion-clientv2/src/module_bindings --module-path stitch-server/crates/game_server`
  - 배포 직전 codegen 절차:
    1. 서버 계약 변경 여부 확인 (`03` 기준)
    2. codegen 실행
    3. `stitch-orillusion-clientv2/src/module_bindings` 산출물 존재 확인
    4. 클라이언트 타입체크/빌드 통과 확인
  - 금지 API 스캔 통과 필수
- 컷오버 순서:
  1. stage에서 `15` 전체 pass
  2. prod 서버 계약(`contract_rev`) 배포
  3. clientv2 정적 자산 배포
  4. 라우팅 전환
  5. 60분 집중 모니터링
- 롤백 트리거:
  - 로그인 성공률 `< 95%` (5분 이동평균)
  - crash rate `> 2%`
  - frame p95 `> 33ms` 10분 지속
  - 2.0 컴플라이언스 assertion fail

## 실패 모드
- 서버/클라이언트 `contract_rev` 불일치.
- codegen 옵션 불일치(`--include-private` 누락).
- 컷오버 직후 이벤트 채널 미구독.

## 검증
- 배포 전:
  - Gate-0 최신 pass
  - Lane B pass
  - 2.0 컴플라이언스 pass
- 배포 후:
  - 5분 간격 헬스체크 12회
  - `S01/S03/S04` 스모크

## 운영
- 컷오버 윈도우는 90분 확보.
- 롤백은 자동 스크립트 + 수동 승인 2단계.
- 컷오버 중 신규 기능 배포 금지.

## 수용 기준
- 컷오버 60분 내 Critical 장애 0건.
- 롤백 트리거 미충족 상태 유지.
- 승인 기록에 자동 증거 링크가 포함된다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `13-asset-pipeline-kenney.md`
- `15-test-plan-and-acceptance.md`
- `17-risk-register-and-open-issues.md`
