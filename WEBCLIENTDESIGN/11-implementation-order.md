# Implementation Order Checklist (Web Client)

## Phase 0: Documentation Lock
- [ ] `WEBCLIENTDESIGN/00~11` 리뷰 완료
- [ ] 서버 projection 계약(`player_*_view` 6종) 확정
- [ ] reducer/table 매핑 검증

완료 기준:
- 구현자가 미결정 항목 없이 작업 시작 가능

검증 항목:
- reducer 존재 확인
  - 인증/세션: `account_bootstrap`, `sign_in`, `sign_out`
  - 이동/전투: `move_to`, `attack_start`, `attack_scheduled`, `attack_impact`
  - 인벤토리/거래/시장: `inventory_bootstrap`, `item_stack_move`, `trade_session_open`, `trade_item_add`, `trade_accept`, `market_order_place`, `market_order_match`, `market_order_cancel`
- projection/view 6종 확인
  - `player_inventory_container_view`
  - `player_inventory_slot_view`
  - `player_inventory_item_view`
  - `player_wallet_view`
  - `player_session_view`
  - `player_movement_feedback_view`

## Phase 1: Web Client Skeleton
- [x] `web-client` 앱 생성 (TypeScript + bundler)
- [x] `WebClientAppState` 구현
- [x] 런타임 모듈 10개 골격 생성
- [x] renderer/scene/camera 부트스트랩 구현
- [x] 설정/토큰/로그 인프라 추가

완료 기준:
- 앱 실행 시 상태 전이와 기본 HUD 표시 가능

검증 예시:
- `bun run typecheck`
- `bun run lint`
- `bun run dev`

## Phase 2: SpacetimeDB Network Core
- [x] `spacetime generate --lang typescript` 바인딩 통합
- [x] `DbConnection.builder` 연결/재연결 래퍼 구현
- [x] baseline subscription registry 구현
- [x] reducer intent queue 구현
- [x] `onConnect`/`onDisconnect`/`onConnectError` 정책 구현

완료 기준:
- 연결/재연결/기본 구독/기본 reducer 호출 동작

검증 예시:
- 연결 후 `account_bootstrap` + `sign_in` 성공
- baseline subscription `onApplied` 확인

## Phase 3: koota World + AOI + Rendering
- [x] koota traits/world/query 세트 구현
- [x] world upsert/despawn 동기화 구현
- [x] AOI query builder 구현 (region/chunk)
- [x] terrain/resource/building 렌더 파이프 구현
- [x] InstancedMesh/asset cache/dispose 정책 반영

완료 기준:
- AOI 이동 시 엔티티/청크 스트리밍이 안정 동작

검증 예시:
- draw calls budget 확인
- scene unload 시 자원 누수 없음 확인

## Phase 4: Movement + Combat
- [x] `move_to` 예측/보정 구현
- [x] `player_movement_feedback_view` UI 연결
- [x] 공격 state machine 구현
- [x] `attack_*` 호출 체인 구현
- [x] `attack_outcome`, `combat_state` HUD 반영

완료 기준:
- 이동/전투 결과가 authoritative 테이블과 일치

검증 예시:
- 지연/역전/중복 request 시나리오 pass

## Phase 5: Inventory + Trade + Economy
- [x] projection 기반 인벤토리 read model 구현
- [x] `item_stack_move` UI 액션 연결
- [x] 거래 세션/오퍼/수락 UI 구현
- [x] 시장 주문/취소/체결 UI 구현
- [x] `price_index`, `player_wallet_view` HUD 반영

완료 기준:
- 인벤토리/거래/시장 시나리오 pass

검증 예시:
- 스택 조작 반복 무결성
- 거래 양측 UI 정합성

## Phase 6: Building + Claim + Housing
- [ ] 건축 배치/진행/해체 구현
- [ ] 클레임 생성/확장 구현
- [ ] 주거 입장/입구변경/권한/화이트리스트 구현
- [ ] 권한 부족/거리 초과 오류 UX 구현

완료 기준:
- 건축/클레임/주거 시나리오 pass

## Phase 7: Social + NPC + Quest
- [ ] 채팅 채널/메시지 UI 구현
- [ ] 파티/길드 관리 UI 구현
- [ ] NPC 상호작용 UI 구현
- [ ] 퀘스트 체인/스테이지 UI 구현

완료 기준:
- 소셜/NPC/퀘스트 시나리오 pass

## Phase 8: Ops + Quality
- [ ] 관측 지표/로그 대시보드 연결
- [ ] reconnect/stability soak test
- [ ] 회귀 테스트 자동화
- [ ] 성능 튜닝 (CPU/GPU/네트워크)

완료 기준:
- `10-observability-testing.md`의 exit criteria 충족

최종 검증:
- `bun run typecheck && bun run test && bun run build`
- 수동 E2E 시나리오 전부 pass
