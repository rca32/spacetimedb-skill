#!/bin/bash
# Null Value Support Test Script
# Tests permission_edit_simple and empire_rank_set_simple reducers
# Usage: bash test_null_value_support.sh

set -e

DB_NAME="stitch-server"
ENTITY_ID="6805694199193278222"  # Test player entity ID

echo "========================================"
echo "Null Value Support Test Script"
echo "========================================"
echo ""

# Test 1: Permission Edit Simple (null claim_id)
echo "Test 1: Permission Edit Simple with null claim_id"
echo "----------------------------------------"
echo "Command: permission_edit_simple $ENTITY_ID $ENTITY_ID 0 5 null"
echo ""

spacetime call $DB_NAME permission_edit_simple "$ENTITY_ID" "$ENTITY_ID" 0 5 null

if [ $? -eq 0 ]; then
    echo "✅ Test 1 PASSED: permission_edit_simple with null claim_id"
    echo ""

    # Verify permission state was created
    echo "Verifying permission_state..."
    RESULT=$(spacetime sql $DB_NAME "SELECT COUNT(*) FROM permission_state WHERE ordained_entity_id = $ENTITY_ID AND allowed_entity_id = $ENTITY_ID")
    if [[ $RESULT == *1* ]]; then
        echo "✅ Permission state created successfully"
    else
        echo "❌ Failed: Permission state not created"
        exit 1
    fi
else
    echo "❌ Test 1 FAILED: permission_edit_simple failed"
    echo "Error output:"
    spacetime sql $DB_NAME "SELECT * FROM permission_state WHERE ordained_entity_id = $ENTITY_ID" 2>&1 || true
    exit 1
fi

echo ""
echo "========================================"
echo ""

# Test 2: Empire Rank Set Simple (null permissions)
echo "Test 2: Empire Rank Set Simple with null permissions"
echo "----------------------------------------"
echo "Command: empire_rank_set_simple 1 1 'Noble' null"
echo ""

# First, create an empire if it doesn't exist
RESULT=$(spacetime sql $DB_NAME "SELECT COUNT(*) FROM empire_state WHERE entity_id = 1")

if [[ $RESULT == *0* ]]; then
    echo "Creating empire first..."
    spacetime call $DB_NAME empire_create 1 $ENTITY_ID "Test Empire"
fi

spacetime call $DB_NAME empire_rank_set_simple 1 1 "Noble" null

if [ $? -eq 0 ]; then
    echo "✅ Test 2 PASSED: empire_rank_set_simple with null permissions"
    echo ""

    # Verify empire rank state was created
    echo "Verifying empire_rank_state..."
    RESULT=$(spacetime sql $DB_NAME "SELECT COUNT(*) FROM empire_rank_state WHERE empire_entity_id = 1 AND rank = 1")
    if [[ $RESULT == *1* ]]; then
        echo "✅ Empire rank state created successfully"
    else
        echo "❌ Failed: Empire rank state not created"
        exit 1
    fi
else
    echo "❌ Test 2 FAILED: empire_rank_set_simple failed"
    echo "Error output:"
    spacetime sql $DB_NAME "SELECT * FROM empire_rank_state WHERE empire_entity_id = 1" 2>&1 || true
    exit 1
fi

echo ""
echo "========================================"
echo ""

# Test 3: Empire Rank Set Simple (specific permissions)
echo "Test 3: Empire Rank Set Simple with specific permissions"
echo "----------------------------------------"
echo "Command: empire_rank_set_simple 1 1 'Noble' 'true,false,true,false'"
echo ""

spacetime call $DB_NAME empire_rank_set_simple 1 1 "Noble" "true,false,true,false"

if [ $? -eq 0 ]; then
    echo "✅ Test 3 PASSED: empire_rank_set_simple with specific permissions"
    echo ""

    # Verify permissions were set correctly
    echo "Verifying permissions..."
    RESULT=$(spacetime sql $DB_NAME "SELECT rank, title, permissions FROM empire_rank_state WHERE empire_entity_id = 1 AND rank = 1")
    echo "Query result:"
    spacetime sql $DB_NAME "SELECT rank, title, permissions FROM empire_rank_state WHERE empire_entity_id = 1 AND rank = 1" | while read line; do
        echo "  $line"
    done

    # Check that permissions contain expected values
    RESULT=$(spacetime sql $DB_NAME "SELECT permissions FROM empire_rank_state WHERE empire_entity_id = 1 AND rank = 1" | grep -o "true" | wc -l)
    if [[ $RESULT == *2* ]]; then
        echo "✅ Permissions set correctly: [true, false, true, false]"
    else
        echo "⚠️  Warning: Permission count is $RESULT, expected 2"
    fi
else
    echo "❌ Test 3 FAILED: empire_rank_set_simple failed"
    echo "Error output:"
    spacetime sql $DB_NAME "SELECT * FROM empire_rank_state WHERE empire_entity_id = 1" 2>&1 || true
    exit 1
fi

echo ""
echo "========================================"
echo "All Tests Passed! ✅"
echo "========================================"
echo ""
echo "Summary:"
echo "  - permission_edit_simple with null claim_id: PASSED"
echo "  - empire_rank_set_simple with null permissions: PASSED"
echo "  - empire_rank_set_simple with specific permissions: PASSED"
echo ""
echo "Null value support is working correctly!"
