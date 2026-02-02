---
id: ai-test-skill-system
intent: stitch-server-data-seed-and-ai-testing
complexity: medium
mode: confirm
status: completed
depends_on:
  - seed-skill-def-data
created: 2026-02-01T22:05:00Z
run_id: run-007
completed_at: 2026-02-01T14:21:38.518Z
---

# Work Item: AI test skill system end-to-end

## Description

Test the complete skill system using stitch-server-ai-tester skill. Add XP to skill, verify level up, check ability unlocks.

## Acceptance Criteria

- [ ] Can query skill_def and see skill data
- [ ] Can call add_skill_xp with skill_id and xp_amount
- [ ] Skill progress updates correctly after adding XP
- [ ] Level up occurs when threshold reached
- [ ] Document all test commands in test report

## Technical Notes

**AI Testing Sequence:**
```bash
# 1. Check skill definitions
spacetime sql stitch-server "SELECT skill_id, name, max_level FROM skill_def"

# 2. Check player skills before
spacetime sql stitch-server "SELECT skill_id, level, xp FROM skill_progress WHERE entity_id = X"

# 3. Add XP to skill
spacetime call stitch-server add_skill_xp 1 50

# 4. Verify skill progress
spacetime sql stitch-server "SELECT skill_id, level, xp FROM skill_progress WHERE skill_id = 1"

# 5. Add more XP for level up
spacetime call stitch-server add_skill_xp 1 100

# 6. Verify level up occurred
spacetime sql stitch-server "SELECT level FROM skill_progress WHERE skill_id = 1"
```

**Test Report Output:**
Create markdown report documenting:
- XP addition tests
- Level up threshold tests
- Ability unlock verification (if applicable)

## Dependencies

- seed-skill-def-data (needs skill definitions)
