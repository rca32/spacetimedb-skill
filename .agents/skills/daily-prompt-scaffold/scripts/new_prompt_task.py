from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path


INVALID_FILENAME_CHARS = '<>:"/\\|?*'


def sanitize_task_name(task_name: str) -> str:
    sanitized = "".join(
        "_" if ch in INVALID_FILENAME_CHARS or ord(ch) < 32 else ch
        for ch in task_name
    ).strip()
    if not sanitized:
        raise ValueError("TaskName must contain at least one valid filename character.")
    return sanitized


def write_text(path: Path, content: str, force: bool) -> None:
    if path.exists() and not force:
        print(f"SKIP {path}")
        return
    path.write_text(content, encoding="utf-8-sig")
    print(f"WRITE {path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--task-name", required=True)
    parser.add_argument("--date", default=datetime.now().strftime("%Y%m%d"))
    parser.add_argument("--root", default=".")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if len(args.date) != 8 or not args.date.isdigit():
        raise ValueError("Date must use yyyyMMdd format.")

    root_path = Path(args.root).resolve()
    prompts_dir = root_path / "prompts"
    prompts_dir.mkdir(parents=True, exist_ok=True)

    safe_task_name = sanitize_task_name(args.task_name)
    base_name = f"{args.date}_{safe_task_name}"

    main_content = (
        f"[작업진행:작업 진행 기록]\n"
        f"prompts/{base_name}_progress.md\n\n"
        f"[작업로그:작업후 기록]\n"
        f"prompts/{base_name}_workbook.md\n\n"
        f"[반드시 참조파일]\n"
        f"AGENTS.md\n\n"
        f"[참조파일]\n\n\n"
        f"[요청사항]\n"
    )

    files = {
        prompts_dir / f"{base_name}.md": main_content
    }

    for path, content in files.items():
        write_text(path, content, force=args.force)


if __name__ == "__main__":
    main()
