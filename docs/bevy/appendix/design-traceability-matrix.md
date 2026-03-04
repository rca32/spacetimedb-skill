---
doc_id: bevy-appendix-design-traceability-matrix
owner: architecture-governance
status: draft
source_design_docs:
  - ../../../DESIGN/02-systems-design.md
  - ../../../DESIGN/05-data-model.md
  - ../../../DESIGN/11-testing-evaluation.md
  - ../../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-00-index
  - bevy-01-implementation-roadmap
last_reviewed: 2026-03-05
---

# DESIGN 추적 매트릭스

## 왜 (의도)
기획 문서와 구현 문서, 런타임 모듈, 테스트를 1:1로 연결해 누락 기능과 검증 공백을 제거한다.

## 무엇 (스펙)
### 매트릭스 컬럼
- `design_ref`
- `bevy_doc_ref`
- `runtime_module`
- `server_table_or_reducer`
- `test_case_id`
- `status`

### 근거 DESIGN 문서
- [시스템 디자인](../../../DESIGN/02-systems-design.md)
- [데이터 모델](../../../DESIGN/05-data-model.md)
- [테스트 및 평가](../../../DESIGN/11-testing-evaluation.md)
- [Stitch 핵심 시스템](../../../DESIGN/20-stitch-core-systems.md)

### 추적 매트릭스
| design_ref | bevy_doc_ref | runtime_module | server_table_or_reducer | test_case_id | status |
| --- | --- | --- | --- | --- | --- |
| DESIGN/02 이동/행동 | 06-movement-combat-loop | movement_plugin | submit_motion_intent | E2E-MOVE-001 | planned |
| DESIGN/02 전투 | 06-movement-combat-loop | combat_plugin | attack_start, attack_impact | E2E-COMBAT-003 | planned |
| DESIGN/02 인벤토리 | 07-inventory-trade-crafting | inventory_trade_plugin | inventory_slot, item_stack_move | E2E-INV-004 | planned |
| DESIGN/02 거래 | 07-inventory-trade-crafting | inventory_trade_plugin | trade_session_open, trade_accept | E2E-TRADE-002 | planned |
| DESIGN/02 권한/접근 | 08-claim-housing-social | social_claim_plugin | permission_state | INT-AUTH-006 | planned |
| DESIGN/02 월드/청크 | 05-world-streaming-aoi | world_plugin | terrain_chunk, request_chunks_for_aoi | PERF-AOI-002 | planned |
| DESIGN/06 서버 보정 | 03-client-server-contract | net_plugin | server_correction, ack_server_correction | INT-SYNC-005 | planned |
| DESIGN/11 테스트/평가 | 11-observability-test-ops | ops_plugin | metric_daily, anti_cheat_event | OPS-REG-001 | planned |
| DESIGN/12 경제/인플레이션 | 07-inventory-trade-crafting | economy-client | market_order, price_index | E2E-ECO-007 | planned |
| DESIGN/13 길드/소셜 | 08-claim-housing-social | social_claim_plugin | guild_state, party_state | E2E-SOC-004 | planned |

## 어떻게 (구현)
1. 기능 착수 전 대상 행을 `planned`로 생성한다.
2. 구현 완료 후 테스트 ID와 결과 링크를 업데이트한다.
3. 릴리즈 전 `planned` 잔여 항목이 없도록 점검한다.
4. DESIGN 변경 시 영향 행을 즉시 재평가한다.

## 어떻게 검증 (테스트)
- 누락 검증: 핵심 DESIGN 섹션이 매트릭스에 존재하는지 확인
- 상태 검증: 릴리즈 브랜치에서 `planned` 항목 0건 확인
- 연결 검증: test_case_id가 실제 테스트 문서/코드와 매칭되는지 확인
