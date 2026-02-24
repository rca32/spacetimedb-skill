# 09 Animation Graph Expression

작성일: 2026-02-24
범위: 애니메이션 그래프, 레이어 전환, morph/표정 제어

## 목표
- 이동/전투/상호작용 애니메이션을 상태머신 기반으로 안정적으로 운용한다.

## 범위
- 포함: layer graph, cross-fade, server sync, expression.
- 제외: 신규 리그 제작.

## 인터페이스
- 애니메이션 API:
  - `setLocomotion(speed, direction)`
  - `playAction(actionId, priority)`
  - `setHitReaction(type, intensity)`
  - `setEmote(emoteId, durationMs)`
- 표정 API:
  - `setMorphWeights(channel, weights)`
  - `setBlink(state)`

## 데이터/이벤트
- 레이어 구성:
  - `L0 Locomotion`
  - `L1 Action`
  - `L2 Reaction`
  - `L3 Emote`
- 전환 기본값:
  - locomotion cross-fade `120ms`
  - action entry `80ms`, exit `100ms`
  - reaction override 우선순위 최고
- 표현 채널:
  - `face_smile`, `face_frown`, `face_angry`, `face_surprised`, `blink_l`, `blink_r`.
- 이벤트:
  - `ANIM_STATE_ENTER`, `ANIM_STATE_EXIT`, `ANIM_BLEND`, `MORPH_APPLY`.

## 실패 모드
- 동시에 다수 action 입력으로 state deadlock.
- 서버 보정과 로컬 전환 충돌.
- morph 채널 누락으로 표정 깜빡임.

## 검증
- 시나리오:
  - `S03` 전투 연속 액션 + 피격.
  - `S04` 감정표현 + UI 상호작용 동시.
- assertion:
  - `A-ANIM-001` 불법 상태 전환 0건.
  - `A-ANIM-002` 보정 후 animation pop 길이 < `120ms`.
  - `A-ANIM-003` morph 채널 적용 실패 0건.
- 지표:
  - blend count/frame, layer eval ms, morph update ms.

## 운영
- 서버 권위 이벤트(`animation_state_v2`, `expression_state_v2`) 우선.
- 로컬 예측은 시각 응답성 용도로만 한정.
- 신규 액션 추가 시 전환표와 assertion 케이스 동시 갱신 필수.

## 수용 기준
- 이동/전투/피격/표정 전환이 끊김 없이 재생.
- 네트워크 지연 상황에서 전환 일관성 유지.
- 자동 시나리오로 전환 회귀를 탐지 가능.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `10-fx-particle-event-bus.md`
- `15-test-plan-and-acceptance.md`
