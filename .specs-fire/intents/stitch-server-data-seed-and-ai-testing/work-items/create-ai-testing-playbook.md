---
id: create-ai-testing-playbook
intent: stitch-server-data-seed-and-ai-testing
complexity: low
mode: autopilot
status: pending
depends_on:
  - ai-test-food-system
  - ai-test-skill-system
  - ai-test-movement-system
created: 2026-02-01T22:05:00Z
---

# Work Item: Create AI testing playbook

## Description

Create comprehensive documentation of all AI testing commands for stitch-server. Consolidate test commands from all previous work items into a single reference document.

## Acceptance Criteria

- [ ] Create AI_TESTING_PLAYBOOK.md in stitch-server/docs/
- [ ] Document all spacetime sql commands per table
- [ ] Document all spacetime call commands per reducer
- [ ] Include pre-test state queries
- [ ] Include post-test verification queries
- [ ] Include expected results for each test
- [ ] Organize by system (Auth, Player, Combat, etc.)

## Technical Notes

**Document Structure:**
```markdown
# AI Testing Playbook for Stitch Server

## Quick Start
[Basic connection and setup]

## Auth System Tests
- account_bootstrap
- sign_in / sign_out

## Player System Tests  
- move_player
- eat
- use_ability

## Combat System Tests
- attack_start
- etc.

## Appendix: All Tables and Queries
[Complete SQL reference]
```

**Content Sources:**
- work-items/ai-test-food-system.md
- work-items/ai-test-skill-system.md
- work-items/ai-test-movement-system.md
- stitch-server-ai-tester skill documentation

**Location:**
`stitch-server/docs/AI_TESTING_PLAYBOOK.md`

## Dependencies

- ai-test-food-system (food test commands)
- ai-test-skill-system (skill test commands)
- ai-test-movement-system (movement test commands)
