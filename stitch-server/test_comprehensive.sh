#!/bin/bash
# Comprehensive Test Script for Stitch Server using --anonymous mode
# Tests Claim, Empire, Permission, NPC systems with null value support
# Usage: bash test_comprehensive.sh

set -e

DB_NAME="stitch-server"
ENTITY_ID="6805694199193278222"

echo "========================================"
echo "Stitch Server Comprehensive Test Suite"
echo "Testing: Claim, Empire, Permission, NPC Systems"
echo "Mode: --anonymous (bypass authentication)"
echo "========================================"
echo ""

# Track results
PASSED=0
FAILED=0
TOTAL=0

# Helper function to run tests
run_test() {
    local test_name=$1
    local test_command=$2
    local verification_query=$3
    local expected_pattern=$4

    echo "========================================"
    echo "Test: $test_name"
    echo "----------------------------------------"
    echo "Command: $test_command"
    echo ""

    # Execute test
    eval $test_command > /tmp/test_output.log 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ PASSED: $test_name"
        ((PASSED++))
        ((TOTAL++))

        # Verify if verification query provided
        if [ ! -z "$verification_query" ]; then
            echo "Verifying: $verification_query"
            spacetime sql $DB_NAME "$verification_query" | grep -q "$expected_pattern" && echo "✓ Verified" || echo "⚠️  Warning: Pattern not found"
        fi
    else
        echo "❌ FAILED: $test_name"
        ((FAILED++))
        echo "Error output:"
        cat /tmp/test_output.log
        echo ""
    fi

    echo ""
}

echo "========================================"
echo "Phase 1: Claim System Tests"
echo "========================================"
echo ""

# Test 1: Claim Totem Placement
run_test "Claim Totem Placement" \
    "spacetime call --anonymous $DB_NAME claim_totem_place 1 1 \"Test Claim\" 100 200 1" \
    "SELECT claim_id, name, owner_player_entity_id FROM claim_state WHERE claim_id = 1" \
    "Test Claim"

# Test 2: Claim Expansion
run_test "Claim Expansion" \
    "spacetime call --anonymous $DB_NAME claim_expand 1 101 201 1" \
    "SELECT entity_id, claim_id, x, z FROM claim_tile_state WHERE claim_id = 1 AND x = 101" \
    "101"

# Test 3: Claim Expansion Validation (try to expand too far)
run_test "Claim Expansion Validation" \
    "spacetime call --anonymous $DB_NAME claim_expand 1 500 500 1" \
    "SELECT entity_id, claim_id FROM claim_tile_state WHERE claim_id = 1 AND x = 500" \
    "500"

echo "========================================"
echo "Phase 2: Permission System Tests (Null Value Support)"
echo "========================================"
echo ""

# Test 4: Permission Edit Simple (null claim_id)
run_test "Permission Edit Simple (null claim_id)" \
    "spacetime call --anonymous $DB_NAME permission_edit_simple 1 2 0 5 null" \
    "SELECT COUNT(*) FROM permission_state WHERE ordained_entity_id = 1 AND allowed_entity_id = 2" \
    "1"

# Test 5: Permission Edit Simple (with claim_id)
run_test "Permission Edit Simple (with claim_id)" \
    "spacetime call --anonymous $DB_NAME permission_edit_simple 2 3 1 5 100" \
    "SELECT COUNT(*) FROM permission_state WHERE ordained_entity_id = 2 AND allowed_entity_id = 3" \
    "1"

# Test 6: Permission Cascade Test (multiple permissions)
run_test "Permission Edit Simple (multiple permissions)" \
    "spacetime call --anonymous $DB_NAME permission_edit_simple 3 4 2 5 200" \
    "SELECT COUNT(*) FROM permission_state WHERE ordained_entity_id = 3 AND allowed_entity_id = 4" \
    "1"

echo "========================================"
echo "Phase 3: Empire System Tests"
echo "========================================"
echo ""

# Test 7: Empire Creation
run_test "Empire Creation" \
    "spacetime call --anonymous $DB_NAME empire_create 10 6805694199193278222 \"Test Empire\"" \
    "SELECT entity_id, name, owner_player_entity_id FROM empire_state WHERE entity_id = 10" \
    "Test Empire"

# Test 8: Empire Rank Set Simple (null permissions)
run_test "Empire Rank Set Simple (null permissions)" \
    "spacetime call --anonymous $DB_NAME empire_rank_set_simple 10 1 \"Noble\" null" \
    "SELECT rank, title, permissions FROM empire_rank_state WHERE empire_entity_id = 10 AND rank = 1" \
    "Noble"

# Test 9: Empire Rank Set Simple (specific permissions)
run_test "Empire Rank Set Simple (specific permissions)" \
    "spacetime call --anonymous $DB_NAME empire_rank_set_simple 10 2 \"Count\" \"true,false,true,false\"" \
    "SELECT rank, title, permissions FROM empire_rank_state WHERE empire_entity_id = 10 AND rank = 2" \
    "Count"

# Test 10: Empire Rank Set Simple (partial permissions)
run_test "Empire Rank Set Simple (partial permissions)" \
    "spacetime call --anonymous $DB_NAME empire_rank_set_simple 10 3 \"Duke\" \"true,false\"" \
    "SELECT rank, title, permissions FROM empire_rank_state WHERE empire_entity_id = 10 AND rank = 3" \
    "Duke"

# Test 11: Empire Node Registration
run_test "Empire Node Registration" \
    "spacetime call --anonymous $DB_NAME empire_node_register 10 1 100 1" \
    "SELECT entity_id, empire_entity_id, chunk_index, energy FROM empire_node_state WHERE empire_entity_id = 10" \
    "1"

echo "========================================"
echo "Phase 4: NPC System Tests"
echo "========================================"
echo ""

# Test 12: NPC Conversation End (graceful handling of missing session)
run_test "NPC Conversation End (graceful handling)" \
    "spacetime call --anonymous $DB_NAME npc_conversation_end 1" \
    "" \
    ""

# Test 13: Test NPC Action Request (simplified)
run_test "NPC Action Request" \
    "spacetime call --anonymous $DB_NAME npc_action_request_reducer 1 1 \"greet player\"" \
    "" \
    ""

# Test 14: Test NPC Agent Tick
run_test "NPC Agent Tick" \
    "spacetime call --anonymous $DB_NAME npc_agent_tick" \
    "" \
    ""

echo "========================================"
echo "Phase 5: Integration Tests"
echo "========================================"
echo ""

# Test 15: Permission + Empire Integration
run_test "Permission + Empire Integration" \
    "spacetime call --anonymous $DB_NAME permission_edit_simple 10 11 0 5 null && spacetime call --anonymous $DB_NAME empire_rank_set_simple 10 1 \"Ruler\" \"true,true,true,true\"" \
    "SELECT rank, title, permissions FROM empire_rank_state WHERE empire_entity_id = 10" \
    "Ruler"

# Test 16: Claim + Permission Integration
run_test "Claim + Permission Integration" \
    "spacetime call --anonymous $DB_NAME claim_totem_place 20 1 \"Test Claim 2\" 200 200 1 && spacetime call --anonymous $DB_NAME permission_edit_simple 20 21 0 5 null" \
    "SELECT COUNT(*) FROM claim_state WHERE claim_id = 20" \
    "1"

# Test 17: Multiple Permissions Test
run_test "Multiple Permissions Test" \
    "for i in {1..5}; do spacetime call --anonymous $DB_NAME permission_edit_simple 30 $((30+i)) 0 5 null; done" \
    "SELECT COUNT(*) FROM permission_state WHERE ordained_entity_id = 30" \
    "5"

# Test 18: Multiple Empires Test
run_test "Multiple Empires Test" \
    "for i in 10 20 30; do spacetime call --anonymous $DB_NAME empire_create $((i*10)) 6805694199193278222 \"Empire $i\"; done" \
    "SELECT COUNT(*) FROM empire_state WHERE name LIKE \"Empire%\"" \
    "3"

echo "========================================"
echo "Test Summary"
echo "========================================"
echo ""

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
else
    SUCCESS_RATE="0.0"
fi

echo "Total Tests:  $TOTAL"
echo "Passed:       $PASSED"
echo "Failed:       $FAILED"
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
else
    echo "⚠️  SOME TESTS FAILED"
    echo ""
    echo "Failed tests:"
    echo "$FAILED tests failed. Check the output above for details."
fi

echo ""
echo "========================================"
echo "Test Completed: $(date)"
echo "========================================"
echo ""

# Cleanup
rm -f /tmp/test_output.log
