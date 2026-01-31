---
id: npc-conversation-system
title: NPC Conversation System
intent: cozy-mmo-game
complexity: high
mode: validate
status: completed
depends_on:
  - npc-core-system
  - player-movement-system
created: 2026-01-31T00:00:00Z
run_id: run-001
completed_at: 2026-01-30T18:19:11.476Z
---

# Work Item: NPC Conversation System

## Description
Implement LLM-powered NPC conversation system based on DESIGN/07-llm-npc-design.md. Players can talk to NPCs and receive contextual responses. For MVP, can use mock/simulated responses initially.

## Acceptance Criteria

- [ ] NpcConversationSession table - tracks active conversations
- [ ] NpcConversationTurn table - stores conversation history
- [ ] start_conversation reducer - initiates talk with NPC
- [ ] send_message reducer - player sends message to NPC
- [ ] NPC response generation (LLM or mock)
- [ ] Conversation context includes player proximity
- [ ] Conversation history persistence (short-term memory)
- [ ] Client can display conversation UI

## Technical Notes

- Conversation requires player to be adjacent to NPC
- Store conversation turns for context
- LLM integration (can be mock for MVP):
  - Send prompt with NPC personality + context
  - Parse response
  - Store in conversation history
- Consider rate limiting and cost controls
- Fallback responses if LLM unavailable

## Dependencies

- npc-core-system
- player-movement-system
