# Intent Brief: cozy-mmo-game

## Goal
Build an MVP cozy survival/crafting MMO with AI-powered NPCs using SpacetimeDB server and web client.

## Users
- Players who enjoy cozy survival/crafting games
- Short session players (30-60 min playtime)
- Players interested in AI NPC interactions

## Problem Solved
Traditional MMOs lack living NPCs that remember and react. This game provides AI NPCs that generate quests and respond to player actions within the world, creating emergent storytelling.

## Success Criteria
1. **Account System**: Players can create accounts and log in
2. **Character Movement**: Players can move their character in the game world (hex grid)
3. **Crafting System**: Players can gather resources and craft items
4. **NPC Conversation**: Players can have conversations with LLM-powered NPCs
5. **Core Economy**: Basic inventory and item management works

## Constraints
- **Server**: SpacetimeDB (Rust-based server-authoritative)
- **Client**: Web-based (TypeScript/React or similar)
- **Directory**: All code in `Game/` directory
- **Scope**: MVP only - core systems, no advanced features
- **AI**: LLM integration for NPC conversations (can be mock/simulated initially)

## Technical Stack
- **Backend**: SpacetimeDB with Rust modules
- **Frontend**: Web client (TypeScript)
- **Database**: SpacetimeDB native tables
- **AI**: LLM API integration for NPC responses

## Reference Design
Based on `DESIGN/` documents:
- Server-authoritative architecture (DESIGN/04-server-architecture.md)
- Data models from DESIGN/05-data-model-tables/
- LLM NPC design (DESIGN/07-llm-npc-design.md)

## Out of Scope (MVP)
- Advanced economy/inflation controls
- Guild system
- Advanced social features
- Combat system
- Building/construction
- Full anti-cheat system

## Acceptance Criteria
- [ ] Can register new account
- [ ] Can log in with existing account
- [ ] Can move character on hex grid
- [ ] Can see and pick up items
- [ ] Can craft at least one item type
- [ ] Can talk to at least one NPC
- [ ] NPC responds contextually (even if simulated)

---
**Status**: Ready for work item decomposition
**Created**: 2026-01-31
