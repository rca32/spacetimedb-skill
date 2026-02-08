# Implementation Order Checklist

## Phase 0: Documentation Lock
- [ ] `CLIENTDESIGN/00~11` 문서 리뷰 완료
- [x] 서버 projection 계약 합의 (`player_*_view` 6종 서버 반영)
- [ ] reducer/table 매핑 검증

완료 기준:
- 구현자에게 미결정 항목이 없다.

## Phase 1: Client Skeleton
- [ ] `stitch-client` crate 생성
- [ ] `ClientAppState` 구현
- [ ] 10개 Plugin 골격 추가
- [ ] 설정/토큰/로그 인프라 추가

완료 기준:
- 앱 실행 시 상태 전이와 기본 UI 표시 가능

## Phase 2: Network Core
- [ ] `spacetime generate --lang rust` 바인딩 통합
- [ ] `DbConnection`/재연결 래퍼 구현
- [ ] `SubscriptionRegistry` 구현
- [ ] `ReducerCallQueue` 구현

완료 기준:
- 연결/재연결/기본 구독/기본 reducer 호출이 동작

## Phase 3: World + Movement
- [ ] AOI 구독 생성기 구현
- [ ] world entity upsert/despawn 동기화
- [ ] `move_to` 예측/보정 구현
- [ ] movement feedback UI 연결

완료 기준:
- 이동 체감이 안정적이고 보정이 눈에 띄게 수렴

## Phase 4: Combat + Resources
- [ ] 공격 state machine 구현
- [ ] `attack_*` 호출 체인 구현
- [ ] `attack_outcome`, `combat_state` UI 반영
- [ ] 리소스/버프 HUD 반영

완료 기준:
- 전투 결과가 서버 테이블과 일치

## Phase 5: Inventory + Trade + Economy
- [ ] projection 기반 인벤토리 캐시 구현
- [ ] `item_stack_move` UI 액션 연결
- [ ] 거래 세션/오퍼/수락 UI 구현
- [ ] 시장 주문/체결/가격 지표 UI 구현

완료 기준:
- 인벤토리/거래/시장 시나리오 pass

## Phase 6: Building + Claim + Housing
- [ ] 건축 배치/진행/해체 구현
- [ ] 클레임 생성/확장 구현
- [ ] 주거 입장/입구변경/권한/화이트리스트 구현

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
- [ ] 성능 튜닝

완료 기준:
- `10-observability-testing.md`의 exit criteria 충족
