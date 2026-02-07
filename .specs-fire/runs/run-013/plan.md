---
run: run-013
work_item: define-sync-and-anti-cheat-contracts
intent: mmo-core-server-foundation
mode: validate
checkpoint: checkpoint_2
approved_at: 2026-02-07T15:09:29Z
---

# Implementation Plan: 동기화/안티치트 계약 정의

## Approach

`DESIGN/06-sync-anti-cheat.md`를 단일 계약 문서로 재정리한다. 핵심은 서버 권위/클라이언트 예측 경계, reducer별 검증 포인트, 동기화 파라미터(10-20Hz/델타/즉시 이벤트), 위반 점수 기반 제재 상태 전이를 표준 형식으로 고정하는 것이다.

## Files to Create

| File | Purpose |
|------|---------|
| (none) | |

## Files to Modify

| File | Changes |
|------|---------|
| `DESIGN/06-sync-anti-cheat.md` | 서버 권위/검증/동기화/제재 흐름을 reducer 계약 중심으로 정렬 |

## Tests

| Test File | Coverage |
|-----------|----------|
| `manual-doc-contract-checks` | 권한 경계/검증 규칙/제재 전이 명시 확인 |
| `manual-keyword-consistency-checks` | 관련 DESIGN 문서와 용어/수치 일관성 점검 |

## Technical Details

- 서버 권위 범위: 이동/전투/거래 최종 판정은 서버에서 수행.
- 클라이언트 예측 범위: 이동/스킬 애니메이션만 허용, 판정 결과는 서버 동기화로 수렴.
- reducer 검증: 입력 진입 시 1차 검증 + 영향 시점 2차 검증을 표준화.
- 제재 파이프라인: 점수 누적 -> 자동 제한 -> 수동 검토 -> 영구 제재.

## Based on Design Doc

Reference: `.specs-fire/intents/mmo-core-server-foundation/work-items/define-sync-and-anti-cheat-contracts-design.md`

---
*Plan approved at checkpoint. Execution follows.*
