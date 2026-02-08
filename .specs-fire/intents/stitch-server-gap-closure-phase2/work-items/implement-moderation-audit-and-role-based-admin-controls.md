---
id: implement-moderation-audit-and-role-based-admin-controls
title: 중재/감사/역할 기반 운영 제어 구현
intent: stitch-server-gap-closure-phase2
complexity: high
mode: validate
status: completed
depends_on:
  - establish-extended-schema-for-liveops-social-security-domains
  - implement-social-chat-party-guild-core-loop
created: 2026-02-08T09:50:00Z
run_id: run-014
completed_at: 2026-02-08T04:33:29.540Z
---

# Work Item: 중재/감사/역할 기반 운영 제어 구현

## Description

`role_binding`, `moderation_flag`, `ban_list`, `rate_limit_bucket`, `audit_log`, `report_queue`, `moderation_action` 기반으로
운영자 권한 검증, 제재/해제, 신고 큐 처리, 감사 로그 기록 경로를 구현한다.

## Acceptance Criteria

- [ ] 역할 기반 운영 리듀서 접근 제어가 적용된다.
- [ ] 신고→검토→조치 흐름이 테이블로 추적된다.
- [ ] 핵심 민감 리듀서에 감사 로그와 레이트리밋이 적용된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-authentication-authorization.md`, `DESIGN/17-security-privacy.md`, `DESIGN/13-community-social.md`

## Dependencies

- establish-extended-schema-for-liveops-social-security-domains
- implement-social-chat-party-guild-core-loop
