---
id: npc-client-integration-guide
title: 06. NPC, AI, Web Client and Deployment
intent: spacetime-dev-guide
complexity: high
mode: validate
status: completed
depends_on:
  - inventory-crafting-guide
created: 2026-01-31T05:05:00Z
run_id: run-003
completed_at: 2026-01-31T08:00:20.512Z
---

# Work Item: 06. NPC, AI, Web Client and Deployment

## Description

Document the NPC system with AI conversations, the React web client implementation, and final deployment steps. This is the most complex section covering the complete frontend-backend integration.

## Acceptance Criteria

- [ ] NPC 시스템 설계 (NPC system architecture)
- [ ] NpcState 테이블 (NPC positions and personality types)
- [ ] NpcMemoryShort 테이블 (NPC memory system)
- [ ] spawn_npc / despawn_npc reducers (NPC lifecycle)
- [ ] 대화 시스템 설계 (conversation system design)
- [ ] NpcConversationSession과 NpcConversationTurn 테이블
- [ ] start_conversation / send_message / end_conversation reducers
- [ ] Mock LLM 응답 생성 로직 (AI response generation)
- [ ] 웹 클라이언트 아키텍처 (web client architecture - React + TypeScript)
- [ ] SpacetimeDB 클라이언트 SDK 연결 (client SDK connection)
- [ ] 헥스 그리드 UI 구현 (hex grid visualization)
- [ ] 인벤토리 UI 패널 (inventory panel)
- [ ] NPC 상호작용 패널 (NPC interaction panel)
- [ ] 실시간 동기화 구현 (real-time sync with subscriptions)
- [ ] 구독(Subscription) 개념과 활용 (subscription concept)
- [ ] 최종 빌드 및 배포 (build and deployment steps)
- [ ] 로컬 테스트 방법 (local testing instructions)
- [ ] 배포 후 문제 해결 (troubleshooting deployed app)

## Technical Notes

- Reference Game/client/src/App.tsx for client code
- Explain SpacetimeDB TypeScript SDK usage
- Include code snippets for React components
- Explain subscription patterns for real-time updates
- Provide complete deployment checklist

## Dependencies

- inventory-crafting-guide
