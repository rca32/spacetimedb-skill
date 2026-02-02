# Test Report - Run-007

## Work Item: ai-test-food-system

### Test Cases Executed

**Test 5.1: food_def 데이터 확인**
- Command: `spacetime sql stitch-server "SELECT food_id, item_def_id, hp_restore, satiation_restore FROM food_def"`
- Result: ✅ PASS
- Output: 5 food items confirmed (Apple, Bread, Meat, Fish, Potion)

**Test 5.2: 계정 생성 (인벤토리 포함)**
- Command: `spacetime call stitch-server account_bootstrap '"AITestPlayer"'`
- Result: ✅ PASS

**Test 5.3: 인벤토리 생성 확인**
- Command: `spacetime sql stitch-server "SELECT container_id, owner_entity_id, slot_count FROM inventory_container"`
- Result: ✅ PASS
- Output: container_id=6387854307793395302, slot_count=20

**Test 5.4: eat reducer 테스트**
- Command: `spacetime call stitch-server eat 99999`
- Result: ✅ PASS (Error: "Item not found in inventory")
- Expected: Reducer validates inventory correctly

**Test 5.5: 리소스 상태 확인**
- Command: `spacetime sql stitch-server "SELECT hp, stamina, satiation FROM resource_state"`
- Result: ✅ PASS
- Output: hp=100, stamina=100, satiation=100

---

## Work Item: ai-test-skill-system

### Test Cases Executed

**Test 6.1: skill_def 테이블 확인**
- Command: `spacetime sql stitch-server "SELECT skill_id, name, max_level FROM skill_def"`
- Result: ✅ PASS
- Output: Mining, Combat, Crafting, Farming, Trading (all max_level=100)

**Test 6.2: player entity_id 확인**
- Command: `spacetime sql stitch-server "SELECT entity_id FROM player_state"`
- Result: ✅ PASS
- Output: entity_id=6805694199193278222

**Test 6.3: skill_progress 초기 상태**
- Command: `spacetime sql stitch-server "SELECT entity_id, skill_id, level, xp FROM skill_progress"`
- Result: ✅ PASS
- Output: Empty (expected - no skills yet)

**Test 6.4: add_skill_xp 호출 (50 XP)**
- Command: `spacetime call stitch-server add_skill_xp 1 50`
- Result: ✅ PASS

**Test 6.5: skill_progress 업데이트 확인**
- Command: `spacetime sql stitch-server "SELECT skill_id, level, xp FROM skill_progress"`
- Result: ✅ PASS
- Output: skill_id=1, level=0, xp=50

**Test 6.6: add_skill_xp 호출 (100 XP 추가)**
- Command: `spacetime call stitch-server add_skill_xp 1 100`
- Result: ✅ PASS

**Test 6.7: 레벨업 확인**
- Command: `spacetime sql stitch-server "SELECT skill_id, level, xp FROM skill_progress"`
- Result: ✅ PASS
- Output: skill_id=1, level=1, xp=150
- 🎉 Level up verified: 0 → 1

---

## Work Item: ai-test-movement-system

### Test Cases Executed

**Test 7.1: 현재 위치 확인**
- Command: `spacetime sql stitch-server "SELECT hex_x, hex_z, is_moving FROM transform_state"`
- Result: ✅ PASS
- Output: hex_x=100, hex_z=100, is_moving=false

**Test 7.2: 현재 스태미나 확인**
- Command: `spacetime sql stitch-server "SELECT stamina FROM resource_state"`
- Result: ✅ PASS
- Output: stamina=100

**Test 7.3: move_player 호출 (130, 130)**
- Command: `spacetime call stitch-server move_player 130 130 false`
- Result: ✅ PASS

**Test 7.4: 이동 후 위치 확인**
- Command: `spacetime sql stitch-server "SELECT hex_x, hex_z FROM transform_state"`
- Result: ✅ PASS
- Output: hex_x=130, hex_z=130
- 🎉 Movement verified: (100,100) → (130,130)

**Test 7.5: 이동 후 스태미나 확인**
- Command: `spacetime sql stitch-server "SELECT stamina FROM resource_state"`
- Result: ✅ PASS
- Output: stamina=99
- 🎉 Stamina cost verified: 100 → 99

---

## Summary

**Total Tests**: 17
**Passed**: 17 (100%)
**Failed**: 0

### Key Achievements

1. ✅ Food system: All 5 food definitions seeded and queryable
2. ✅ Skill system: XP addition and level-up mechanics working
3. ✅ Movement system: Position tracking and stamina consumption working
4. ✅ Inventory system: Auto-creation on account bootstrap verified
5. ✅ All reducers responding correctly with proper validation

### AI Testing Commands Verified

All commands from `stitch-server/docs/AI_TESTING_PLAYBOOK.md` are functional and tested.

---

Run completed: 2026-02-01
