#!/usr/bin/env python3
"""Fix update calls to remove the key argument - comprehensive version."""

import re


def fix_update_calls(content):
    """Fix update calls that have 2 arguments to have only 1."""
    # Match .update(\n &var,\n RowType { or .update(&var, RowType {
    # Replace with .update(\n RowType { or .update(RowType {

    # Pattern 1: .update(\n &key,\n Row {
    pattern1 = r"(\.update\(\s*\n?\s*)&\w+\s*,\s*\n?\s*(\w+\s*\{)"
    replacement1 = r"\1\2"
    content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE)

    return content


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python fix_update_calls2.py <file>")
        sys.exit(1)

    filepath = sys.argv[1]

    with open(filepath, "r") as f:
        content = f.read()

    fixed_content = fix_update_calls(content)

    with open(filepath, "w") as f:
        f.write(fixed_content)

    print(f"Fixed update calls in {filepath}")
