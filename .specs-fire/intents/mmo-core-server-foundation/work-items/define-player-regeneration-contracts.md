---
id: define-player-regeneration-contracts
title: 플레이어 재생/소비 계약 정의
intent: mmo-core-server-foundation
complexity: medium
mode: confirm
status: pending
depends_on: [align-data-model-and-permissions]
created: 2026-02-07T14:35:19Z
---

# Work Item: 플레이어 재생/소비 계약 정의

## Description

`DESIGN/DETAIL/player-regeneration-system.md`를 기준으로 자원 상태 전이, 타이머, 음식 소비 규칙을 reducer 계약으로 정리한다.

## Acceptance Criteria

- [ ] `resource_state`, `character_stats`, `starving_state`, `food_def`의 역할과 제약이 정리된다.
- [ ] 재생 루프(scheduled reducer) 실행 조건/주기/권한 검증이 명시된다.
- [ ] 전투/비전투/포만감 상태 전이 규칙이 테스트 가능한 형태로 작성된다.
- [ ] 음식 사용 실패 조건(무력화, 수면, 전투 등)이 표준 오류 정책과 함께 정의된다.

## Technical Notes

`last_damage_ts`, `last_stamina_use_ts`, `last_regen_ts`를 사용한 쿨다운 계산 기준을 포함한다.

## Dependencies

- align-data-model-and-permissions
