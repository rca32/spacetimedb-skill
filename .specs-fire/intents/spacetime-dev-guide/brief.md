---
id: spacetime-dev-guide
title: Create SpacetimeDB Korean Educational Guide
status: completed
created: 2026-01-31T05:00:00Z
completed_at: 2026-01-31T08:00:20.542Z
---

# Intent: Create SpacetimeDB Korean Educational Guide

## Goal

Create comprehensive Korean-language educational documentation that teaches SpacetimeDB development from scratch, based on the Cozy MMO game development experience. The guide should enable beginners to understand SpacetimeDB concepts and build their own real-time multiplayer applications.

## Users

- SpacetimeDB beginners with basic programming knowledge (Rust/TypeScript)
- Game developers interested in real-time multiplayer backend solutions
- Developers looking for alternatives to traditional game server architecture
- Korean-speaking developers preferring native-language learning materials

## Problem

Existing SpacetimeDB documentation is primarily in English and focuses on reference-style documentation. Korean developers need:
- Step-by-step tutorial-style content in Korean
- Practical examples showing complete project development
- Explanation of "why" not just "how"
- Common pitfalls and solutions from real development experience
- Architecture decisions and their rationale

## Success Criteria

- Complete walkthrough from project setup to working game
- Clear explanations of SpacetimeDB core concepts (tables, reducers, subscriptions)
- Working code examples with detailed explanations
- Architecture diagrams and system design explanations
- Common issues and troubleshooting section
- Deployable final project that readers can run
- Document covers all 10 systems from the Cozy MMO implementation

## Constraints

- Must be written in Korean language
- Based on actual working code from Cozy MMO project
- Must explain SpacetimeDB 0.1.8 version features
- Should be beginner-friendly but comprehensive
- Code examples must be tested and working

## Notes

Based on the completed Cozy MMO MVP project which includes:
- Account/Authentication system with SpacetimeDB Identity
- Player movement on hex grid
- Inventory management with stacking
- Recipe-based crafting system
- NPC system with AI conversation
- React web client with real-time sync
