---
id: establish-extended-schema-for-liveops-social-security-domains
title: 라이브옵스/소셜/보안 도메인 확장 스키마 정립
intent: stitch-server-gap-closure-phase2
complexity: high
mode: validate
status: completed
depends_on: []
created: 2026-02-08T09:50:00Z
run_id: run-009
completed_at: 2026-02-08T10:05:00Z
---

# Work Item: 라이브옵스/소셜/보안 도메인 확장 스키마 정립

## Description

`DESIGN/05-data-model.md` 기준으로 누락된 핵심 테이블군(account_profile/role_binding/resource_state/status_effect/chat_*/guild_*/party_*/wallet/audit/rate_limit/feature_flags 등)을
`tables/`에 추가하고, public/private/RLS 경계 및 인덱스 기준을 코드에 반영한다.

## Acceptance Criteria

- [x] DESIGN 기준 핵심 누락 테이블군이 `src/tables`에 정의된다.
- [x] 접근 경계(public/private/RLS)와 인덱스 전략이 문서 기준으로 맞춰진다.
- [x] 기존 코어 루프 테이블과 충돌 없이 빌드/마이그레이션이 통과한다.

## Technical Notes

- 기준 문서: `DESIGN/05-data-model.md`, `DESIGN/05-data-model-tables/*`, `DESIGN/17-security-privacy.md`

## Dependencies

(none)
