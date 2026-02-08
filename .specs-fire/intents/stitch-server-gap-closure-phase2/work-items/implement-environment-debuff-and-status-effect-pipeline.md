---
id: implement-environment-debuff-and-status-effect-pipeline
title: 환경 디버프 및 상태효과 파이프라인 구현
intent: stitch-server-gap-closure-phase2
complexity: high
mode: validate
status: completed
depends_on:
  - establish-extended-schema-for-liveops-social-security-domains
  - implement-world-resource-and-regeneration-agent-loops
created: 2026-02-08T09:50:00Z
run_id: run-011
completed_at: 2026-02-08T10:54:00Z
---

# Work Item: 환경 디버프 및 상태효과 파이프라인 구현

## Description

환경 조건(바이옴/시간대/수중 여부)에 따라 디버프를 적용하는 에이전트와
`status_effect` 기반 상태효과 누적/감쇠 로직을 구현한다.

## Acceptance Criteria

- [x] 온라인 플레이어 대상 환경 효과 평가 루프가 동작한다.
- [x] `status_effect` 적용/해제/만료가 일관되게 기록된다.
- [x] 저항/면역/피해 간격 제약을 파라미터 기반으로 검증한다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/environment-debuffs-and-status-effects.md`, `DESIGN/02-systems-design.md`

## Dependencies

- establish-extended-schema-for-liveops-social-security-domains
- implement-world-resource-and-regeneration-agent-loops
