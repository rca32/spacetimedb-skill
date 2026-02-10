---
name: spacetime-test-debugger
description: SpacetimeDB CLI 기반 테스트/디버깅 스킬. stitch-server에서 구독 실패, reducer 동작 불일치, 테이블 데이터 누락, AOI/월드 렌더링 이상을 점검할 때 사용한다. 증상 재현, SQL 카운트/샘플 조회, reducer 호출, 재검증 순서로 빠르게 원인을 좁힌다.
---

# Spacetime Test Debugger

## Overview

이 스킬은 SpacetimeDB 이슈를 "로그 증상 -> 서버 데이터 상태 -> reducer 실행 결과"로 분해해 진단한다.
특히 `stitch-server`의 월드 스트리밍/구독 관련 문제에서, CLI 명령으로 즉시 재현/검증 루프를 수행할 때 사용한다.

## 사용 조건

- 콘솔/브라우저 로그에서 `subscription failed`, reducer error, 데이터 미노출 문제가 보일 때
- `web-client`에서 draw call이 비정상적으로 낮거나 월드 오브젝트가 비어 보일 때
- 서버 리듀서 호출 후에도 테이블 변경이 없는지 빠르게 확인해야 할 때

## 기본 워크플로

1. 증상 고정
- 에러 문구(원문), 발생 reducer/SQL, 재현 순서를 먼저 확보한다.

2. 데이터 현황 확인
- 카운트로 비어있는 테이블을 먼저 식별한다.
- 필요하면 샘플 row 1~5개를 조회해 스키마/값 이상 여부를 본다.

3. 최소 재현 reducer 호출
- 인증/세션 -> 도메인 reducer 순서로 가장 작은 호출 체인을 만든다.
- 각 호출 직후 대상 테이블 변화를 즉시 재확인한다.

4. 원인 축소
- SQL 문법 불지원, 권한 제약, 인자 타입 오류, 선행 상태 누락 중 무엇인지 분류한다.

5. 수정 후 회귀 검증
- 동일 시나리오 재실행
- 카운트/샘플/클라이언트 로그를 다시 확인해 회귀 여부를 확인한다.

## 프로젝트 기본 명령

- 서버 루트: `/home/rca32/workspaces/spacetimedb-skill/stitch-server`
- DB 시작: `spacetime start`
- 모듈 빌드: `cd stitch-server && spacetime build`
- 모듈 배포: `spacetime publish --server 127.0.0.1:3000 stitch-server`

## 빠른 진단 커맨드

```bash
spacetime sql stitch-server "SELECT COUNT(*) AS c FROM transform_state"
spacetime sql stitch-server "SELECT COUNT(*) AS c FROM terrain_chunk"
spacetime sql stitch-server "SELECT COUNT(*) AS c FROM building_state"
spacetime sql stitch-server "SELECT COUNT(*) AS c FROM resource_node"
spacetime sql stitch-server "SELECT COUNT(*) AS c FROM npc_state"
```

```bash
spacetime call stitch-server account_bootstrap "CliTester"
spacetime call stitch-server sign_in 1
spacetime call stitch-server inventory_bootstrap
```

## 월드 데이터 강제 생성 샘플

```bash
spacetime call stitch-server building_place 9001 1 0 0 1 1 10
spacetime call stitch-server npc_talk 5001 "seed-npc-5001"
```

위 호출은 `building_state`, `npc_state`를 빠르게 채우는 smoke test 용도다.

## 디버깅 규칙

- 쿼리/리듀서 실패 시 에러 문자열을 절대 축약하지 않는다.
- 한 번에 하나씩만 바꾸고(쿼리 문법, reducer 인자, 구독 범위), 매번 카운트를 재확인한다.
- 호출 성공(0 exit)과 실제 테이블 반영은 별개로 보고 반드시 SQL로 확인한다.

## 알려진 이슈 플레이북: movement-feedback decode RangeError

증상 시그니처:
- 브라우저 콘솔에서 아래 형태가 반복될 때
- `RangeError: Tried to read <N> byte(s) at relative offset <K>, but only <M> byte(s) remain`
- 스택에 `parseRowList -> parseTableUpdate -> parseDatabaseUpdate`가 포함될 때
- `movement-feedback` subscription 활성화 시 재현되고 비활성화 시 사라질 때

즉시 완화(서비스 유지 우선):
1. `VITE_ENABLE_MOVEMENT_FEEDBACK_SUB=0`으로 movement feedback 구독을 끈다.
2. 누적 피드백 행 정리:
- `spacetime call stitch-server movement_feedback_cleanup 64`
- `spacetime call stitch-server movement_feedback_cleanup_global 64`
3. 스냅샷 수집:
- `stitch-server/scripts/movement_feedback_debug_snapshot.sh stitch-server <identity_hex>`

원인 분류 체크:
1. `st_column`에서 `player_movement_feedback_view` 컬럼 타입 확인:
- `server_pos`가 배열(`Vec<f32>`)이면 디코더 경로 문제 가능성을 우선 의심한다.
2. 에러 숫자가 `0x3e800000` 같은 f32 비트패턴(예: 0.25)으로 보이면, 문자열 길이 파싱 오프셋이 깨진 케이스로 분류한다.
3. baseline subscription만 켰을 때 정상, movement-feedback를 추가했을 때만 실패하는지 비교한다.

근본 수정 기준:
1. movement feedback 좌표를 배열 대신 스칼라 컬럼으로 저장:
- `server_x`, `server_y`, `server_z`
2. 클라이언트 generated bindings 재생성:
- `cd web-client && bun run spacetime:generate`
3. runtime 타입/사용부(`sync`, `ui`, `net`)를 새 컬럼명으로 동기화
4. schema 변경 publish 시 수동 마이그레이션 정책 결정:
- 로컬 디버그 목적이면 `spacetime publish --delete-data=always --yes ...`
- 운영 환경이면 데이터 보존 마이그레이션 절차를 별도 준비
5. 검증:
- `cargo check`, `bun run typecheck`, `bun run lint`
- movement-feedback 활성 상태에서 RangeError 미재발 확인

## Resources

- 상세 절차: `references/workflows.md`
- 자주 쓰는 점검 스크립트: `scripts/world_counts.sh`
- 자동 smoke test: `scripts/world_smoke_test.sh`
- movement feedback 스냅샷: `/home/rca32/workspaces/spacetimedb-skill/stitch-server/scripts/movement_feedback_debug_snapshot.sh`

## 자동 스모크 테스트

```bash
./scripts/world_smoke_test.sh stitch-server
```

옵션:
- 1번째 인자: DB 이름 (기본 `stitch-server`)
- 2번째 인자: region_id (기본 `1`)
- 3번째 인자: building_id (기본 `9001`)
- 4번째 인자: npc_id (기본 `5001`)
- 5번째 인자: display_name (기본 `CliSmoke`)
