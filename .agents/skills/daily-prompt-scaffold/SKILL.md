---
name: daily-prompt-scaffold
description: Create same-day prompt task files under `prompts/` using the `YYYYMMDD_작업명.md` pattern, plus linked `_plan.md`, `_progress.md`, and `_workbook.md` companion files. Use when Codex needs to start a new task prompt, scaffold daily worklog files, or standardize prompt/task note filenames in this repository.
---

# Daily Prompt Scaffold

Use this skill to create a new prompt entry and its companion tracking files for today's date.

## Workflow

1. Pick the task title exactly as it should appear in the filename.
2. Run the scaffold script from the repository root.

```bash
python .agents/skills/daily-prompt-scaffold/scripts/new_prompt_task.py --task-name "작업명"
```

3. Open the generated main prompt file in `prompts/`.
4. Fill in `[참조파일]` and `[요청사항]` immediately so the task starts with concrete context.

## Behavior

- Default date is the local current day in `yyyyMMdd`.
- Invalid Windows filename characters are replaced with `_`.
- Existing files are preserved unless `--force` is passed.
- Use `--date` when backfilling or preparing a future-dated prompt intentionally.

## Script

- `scripts/new_prompt_task.py`: Create the main prompt file and `_plan.md`, `_progress.md`, `_workbook.md` companions.
