#!/usr/bin/env python3
"""Fix SpacetimeDB table API calls from static methods to ctx.db pattern."""

import re


def fix_table_calls(content):
    """Fix various table call patterns."""

    # Pattern 1: TableName::filter_by_column_name(&value) -> ctx.db.table_name().column_name().find(&value)
    # This works for both unique and non-unique indexes
    content = re.sub(
        r"(\w+)::filter_by_(\w+)\(&([^)]+)\)",
        lambda m: f"ctx.db.{snake_case(m.group(1))}().{m.group(2)}().find(&{m.group(3)})",
        content,
    )

    # Pattern 2: TableName::insert(TableName { -> ctx.db.table_name().insert(TableName {
    content = re.sub(
        r"(\w+)::insert\((\w+)\s*\{",
        lambda m: f"ctx.db.{snake_case(m.group(1))}().insert({m.group(2)} {{",
        content,
    )

    # Pattern 3: TableName::update_by_column_name(&value, -> ctx.db.table_name().column_name().update(
    content = re.sub(
        r"(\w+)::update_by_(\w+)\(&[^)]+\),?",
        lambda m: f"ctx.db.{snake_case(m.group(1))}().{m.group(2)}().update(",
        content,
    )

    # Pattern 4: TableName::delete_by_column_name(&value) -> ctx.db.table_name().column_name().delete(&value)
    content = re.sub(
        r"(\w+)::delete_by_(\w+)\(&([^)]+)\)",
        lambda m: f"ctx.db.{snake_case(m.group(1))}().{m.group(2)}().delete(&{m.group(3)})",
        content,
    )

    # Pattern 5: TableName::iter() -> ctx.db.table_name().iter()
    content = re.sub(
        r"(\w+)::iter\(\)",
        lambda m: f"ctx.db.{snake_case(m.group(1))}().iter()",
        content,
    )

    return content


def snake_case(name):
    """Convert CamelCase or PascalCase to snake_case."""
    # Handle acronyms like NPC -> npc
    result = []
    for i, char in enumerate(name):
        if char.isupper():
            if i > 0 and name[i - 1].islower():
                result.append("_")
            result.append(char.lower())
        else:
            result.append(char)
    return "".join(result)


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python fix_spacetimedb_api.py <file>")
        sys.exit(1)

    filepath = sys.argv[1]

    with open(filepath, "r") as f:
        content = f.read()

    fixed_content = fix_table_calls(content)

    with open(filepath, "w") as f:
        f.write(fixed_content)

    print(f"Fixed {filepath}")
