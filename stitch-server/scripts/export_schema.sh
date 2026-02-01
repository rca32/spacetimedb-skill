#!/usr/bin/env sh
set -e

output_path="${1:-docs/schema_tables.txt}"
python3 - <<'PY'
from pathlib import Path

root = Path(__file__).resolve().parents[1]
tables_mod = root / "crates" / "game_server" / "src" / "tables" / "mod.rs"
output = root / output_path

tables = []
for line in tables_mod.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if line.startswith("pub mod ") and line.endswith(";"):
        name = line.removeprefix("pub mod ").removesuffix(";")
        tables.append(name)

output.parent.mkdir(parents=True, exist_ok=True)
output.write_text("\n".join(tables) + "\n", encoding="utf-8")
print(f"Exported {len(tables)} table modules to {output}")
PY
