-- NPC Auto-Wandering Test Queries
-- SpacetimeDB SQL supports basic SELECT with simple filters
-- Complex features (CASE, GROUP BY, HAVING) are not supported

-- 1. Check all NPCs and their positions (ORDER BY works)
SELECT name, hex_q, hex_r FROM npc_state ORDER BY name;

-- 2. Check NPC by specific type (1=Merchant, 2=Villager, 3=Quest Giver)
SELECT npc_id, name, hex_q, hex_r FROM npc_state WHERE npc_type = 1;
SELECT npc_id, name, hex_q, hex_r FROM npc_state WHERE npc_type = 2;
SELECT npc_id, name, hex_q, hex_r FROM npc_state WHERE npc_type = 3;

-- 3. Find NPCs at origin (0,0) - should be empty usually
SELECT name FROM npc_state WHERE hex_q = 0 AND hex_r = 0;

-- 4. Count total NPCs (simple count)
SELECT COUNT(*) FROM npc_state;

-- 5. Check for a specific NPC
SELECT hex_q, hex_r FROM npc_state WHERE name = 'Alice';
SELECT hex_q, hex_r FROM npc_state WHERE name = 'Trader Joe';

-- 6. Find NPCs in a region (range query)
SELECT name, hex_q, hex_r FROM npc_state WHERE hex_q > -5 AND hex_q < 5 AND hex_r > -5 AND hex_r < 5;
