---
id: implement-social-chat-party-guild-core-loop
title: 소셜 채팅/파티/길드 코어 루프 구현
intent: stitch-server-gap-closure-phase2
complexity: high
mode: validate
status: pending
depends_on:
  - establish-extended-schema-for-liveops-social-security-domains
created: 2026-02-08T09:50:00Z
---

# Work Item: 소셜 채팅/파티/길드 코어 루프 구현

## Description

`chat_channel/chat_message`, `party_state/party_member`, `guild_state/guild_member/guild_project`, `social_feed`를 구현하고
채팅/파티/길드 기본 리듀서와 구독 경로를 추가한다.

## Acceptance Criteria

- [ ] 채팅 채널 송수신과 기본 레이트 제한이 동작한다.
- [ ] 파티 생성/참여/탈퇴 및 리더 변경 흐름이 동작한다.
- [ ] 길드 생성/가입/권한 역할/프로젝트 진행 상태가 기록된다.

## Technical Notes

- 기준 문서: `DESIGN/13-community-social.md`, `DESIGN/02-systems-design.md`

## Dependencies

- establish-extended-schema-for-liveops-social-security-domains
