# Contract Spec: 플레이어 재생/소비 계약 정의

## Source

- `DESIGN/DETAIL/player-regeneration-system.md`

## Domain Contract

## 1) Core Tables
- `resource_state(entity_id, hp, stamina, satiation, last_damage_ts, last_stamina_use_ts, last_regen_ts)`
- `character_stats(entity_id, max_hp, max_stamina, max_satiation, active/passive regen params)`
- `starving_state(entity_id, started_at, buff_id)`
- `food_def(food_id, item_def_id, restore params, consumable_in_combat, buff fields)`

## 2) Scheduled Reducer Contract
- `player_regen_agent_loop`:
  - server/admin 권한만 실행.
  - 온라인 플레이어 기준 반복 처리.
  - 사망 상태는 재생 로직 제외.
  - 전투 여부/피해 시점/스태미나 사용 시점으로 active/passive 계산 분기.

## 3) State Transition Rules
- `hp/stamina/satiation`는 항상 `[0, max]` 클램프.
- 포만감 `0` 도달 시 `starving_state` 생성.
- 포만감 회복 시 `starving_state` 제거.
- 전투 중에는 passive 회복 차단.

## 4) Consume(`eat`) Reducer Contract
- 사전 조건:
  - 무력화/수면 상태에서는 실패.
  - 인벤토리 내 음식 아이템 존재 필요.
  - 음식 정의가 `consumable_in_combat=false`이고 전투 중이면 실패.
- 성공 처리:
  - hp/stamina/satiation 회복 적용 후 클램프.
  - 버프 적용.
  - 인벤토리 수량 1 차감.

## 5) Error Policy
- 각 실패 케이스는 구분 가능한 오류 코드/메시지 반환.
- 부분 업데이트 금지(원자성 유지).

## Acceptance Checklist

- [ ] 재생 루프가 전투/비전투 상태에 따라 기대값대로 동작한다.
- [ ] 포만감 0 전이 시 starving 생성, 회복 시 제거가 일관된다.
- [ ] `eat` 실패 조건에서 자원/인벤토리 변동이 없다.
- [ ] scheduled reducer가 비권한 호출을 거부한다.
