#!/bin/bash

# NPC Auto-Wandering Test Script
# This script runs SQL queries to verify NPCs are moving automatically
# Run this multiple times to see positions change

echo "======================================"
echo "NPC Auto-Wandering Test"
echo "======================================"
echo ""
echo "Run this script multiple times to see NPC movement!"
echo "Example: watch -n 3 './test_npc_wandering.sh'"
echo ""

# Get timestamp
TIMESTAMP=$(date '+%H:%M:%S')
echo "Test Time: $TIMESTAMP"
echo ""

echo "NPC Positions (Compare with previous run to see movement):"
echo "   Name              |  Q   |  R   "
echo "   ------------------|------|------"

# Run SQL query (spacetime sql doesn't support ORDER BY)
spacetime sql cozy-mmo "SELECT name, hex_q, hex_r FROM npc_state" 2>&1 | \
    grep -v "WARNING\|UNSTABLE" | \
    awk -F'|' 'NR>3 && NF>=3 {name=$1; gsub(/^ *"|" *$/, "", name); q=$2; r=$3; gsub(/^ *| *$/, "", q); gsub(/^ *| *$/, "", r); printf "   %-17s | %4s | %4s\n", name, q, r}'

echo ""
echo "======================================"
echo "Test Complete!"
echo "======================================"
echo ""
echo "📊 TIPS:"
echo "   - Run this script again in 3-6 seconds"
echo "   - Compare Q and R columns to see movement"
echo "   - NPCs have 30% chance to move every 3 seconds"
echo ""
echo "🔧 Commands:"
echo "   ./test_npc_wandering.sh               # Run once"
echo "   watch -n 3 './test_npc_wandering.sh'  # Auto-run every 3 sec"
echo ""
