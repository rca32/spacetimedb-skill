#!/usr/bin/env python3
"""Comprehensive fix for SpacetimeDB API migration."""

import re


def fix_code(content):
    # Fix 1: UniqueColumn (primary_key/unique) should use .find(), not .filter().next()
    # Account.identity is primary_key
    content = re.sub(
        r"ctx\.db\.account\(\)\.identity\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.account().identity().find(\1)",
        content,
    )

    # SessionState.session_id is primary_key
    content = re.sub(
        r"ctx\.db\.session_state\(\)\.session_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.session_state().session_id().find(\1)",
        content,
    )

    # PlayerState.entity_id is primary_key
    content = re.sub(
        r"ctx\.db\.player_state\(\)\.entity_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.player_state().entity_id().find(\1)",
        content,
    )

    # ItemDef.item_def_id is primary_key
    content = re.sub(
        r"ctx\.db\.item_def\(\)\.item_def_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.item_def().item_def_id().find(\1)",
        content,
    )

    # Recipe.recipe_id is primary_key
    content = re.sub(
        r"ctx\.db\.recipe\(\)\.recipe_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.recipe().recipe_id().find(\1)",
        content,
    )

    # NpcState.npc_id is primary_key
    content = re.sub(
        r"ctx\.db\.npc_state\(\)\.npc_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.npc_state().npc_id().find(\1)",
        content,
    )

    # WorldItem.world_item_id is primary_key
    content = re.sub(
        r"ctx\.db\.world_item\(\)\.world_item_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.world_item().world_item_id().find(\1)",
        content,
    )

    # InventoryContainer.container_id is primary_key
    content = re.sub(
        r"ctx\.db\.inventory_container\(\)\.container_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.inventory_container().container_id().find(\1)",
        content,
    )

    # InventorySlot.slot_id is primary_key
    content = re.sub(
        r"ctx\.db\.inventory_slot\(\)\.slot_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.inventory_slot().slot_id().find(\1)",
        content,
    )

    # ItemInstance.instance_id is primary_key
    content = re.sub(
        r"ctx\.db\.item_instance\(\)\.instance_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.item_instance().instance_id().find(\1)",
        content,
    )

    # RecipeIngredient.ingredient_id is primary_key
    content = re.sub(
        r"ctx\.db\.recipe_ingredient\(\)\.ingredient_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.recipe_ingredient().ingredient_id().find(\1)",
        content,
    )

    # NpcMemoryShort.memory_id is primary_key
    content = re.sub(
        r"ctx\.db\.npc_memory_short\(\)\.memory_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.npc_memory_short().memory_id().find(\1)",
        content,
    )

    # NpcConversationSession.session_id is primary_key
    content = re.sub(
        r"ctx\.db\.npc_conversation_session\(\)\.session_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.npc_conversation_session().session_id().find(\1)",
        content,
    )

    # NpcConversationTurn.turn_id is primary_key
    content = re.sub(
        r"ctx\.db\.npc_conversation_turn\(\)\.turn_id\(\)\.filter\(&([^)]+)\)\.next\(\)",
        r"ctx.db.npc_conversation_turn().turn_id().find(\1)",
        content,
    )

    # Fix 2: RangedIndex (btree) should use .filter(), not .find()
    # PlayerState.identity is btree index
    content = re.sub(
        r"ctx\.db\.player_state\(\)\.identity\(\)\.find\(&([^)]+)\)",
        r"ctx.db.player_state().identity().filter(\1).next()",
        content,
    )

    # SessionState.identity is btree index
    content = re.sub(
        r"ctx\.db\.session_state\(\)\.identity\(\)\.find\(&([^)]+)\)",
        r"ctx.db.session_state().identity().filter(\1).next()",
        content,
    )

    # InventorySlot.container_id is btree index
    content = re.sub(
        r"ctx\.db\.inventory_slot\(\)\.container_id\(\)\.find\(&([^)]+)\)",
        r"ctx.db.inventory_slot().container_id().filter(\1).next()",
        content,
    )

    # InventorySlot.slot_index is btree index
    content = re.sub(
        r"ctx\.db\.inventory_slot\(\)\.slot_index\(\)\.find\(&([^)]+)\)",
        r"ctx.db.inventory_slot().slot_index().filter(\1).next()",
        content,
    )

    # RecipeIngredient.recipe_id is btree index
    content = re.sub(
        r"ctx\.db\.recipe_ingredient\(\)\.recipe_id\(\)\.find\(&([^)]+)\)",
        r"ctx.db.recipe_ingredient().recipe_id().filter(\1).next()",
        content,
    )

    # RecipeIngredient.item_def_id is btree index
    content = re.sub(
        r"ctx\.db\.recipe_ingredient\(\)\.item_def_id\(\)\.find\(&([^)]+)\)",
        r"ctx.db.recipe_ingredient().item_def_id().filter(\1).next()",
        content,
    )

    # NpcMemoryShort.npc_id is btree index
    content = re.sub(
        r"ctx\.db\.npc_memory_short\(\)\.npc_id\(\)\.find\(&([^)]+)\)",
        r"ctx.db.npc_memory_short().npc_id().filter(\1).next()",
        content,
    )

    # NpcMemoryShort.player_identity is btree index
    content = re.sub(
        r"ctx\.db\.npc_memory_short\(\)\.player_identity\(\)\.find\(&([^)]+)\)",
        r"ctx.db.npc_memory_short().player_identity().filter(\1).next()",
        content,
    )

    # NpcConversationSession.npc_id is btree index
    content = re.sub(
        r"ctx\.db\.npc_conversation_session\(\)\.npc_id\(\)\.find\(&([^)]+)\)",
        r"ctx.db.npc_conversation_session().npc_id().filter(\1).next()",
        content,
    )

    # NpcConversationSession.player_identity is btree index
    content = re.sub(
        r"ctx\.db\.npc_conversation_session\(\)\.player_identity\(\)\.find\(&([^)]+)\)",
        r"ctx.db.npc_conversation_session().player_identity().filter(\1).next()",
        content,
    )

    # NpcConversationTurn.session_id is btree index
    content = re.sub(
        r"ctx\.db\.npc_conversation_turn\(\)\.session_id\(\)\.find\(&([^)]+)\)",
        r"ctx.db.npc_conversation_turn().session_id().filter(\1).next()",
        content,
    )

    # InventoryContainer.owner_entity_id is btree index
    content = re.sub(
        r"ctx\.db\.inventory_container\(\)\.owner_entity_id\(\)\.find\(&([^)]+)\)",
        r"ctx.db.inventory_container().owner_entity_id().filter(\1).next()",
        content,
    )

    # Fix 3: Update calls with 2 arguments -> 1 argument
    # Pattern: .column().update(&key, Row { -> .column().update(Row {
    content = re.sub(
        r"(\.[\w_]+\(\)\.update\(\s*)\n?\s*&[\w_\.]+\s*,\s*\n?\s*(\w+\s*\{)",
        r"\1\2",
        content,
    )

    return content


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python fix_all.py <file>")
        sys.exit(1)

    filepath = sys.argv[1]

    with open(filepath, "r") as f:
        content = f.read()

    fixed_content = fix_code(content)

    with open(filepath, "w") as f:
        f.write(fixed_content)

    print(f"Fixed {filepath}")
