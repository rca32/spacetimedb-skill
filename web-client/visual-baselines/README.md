# Visual Baselines

Captured: 2026-02-18 (KST)

## Baseline sets

- `baseline-overlay-off/`
  - `baseline-overlay-off-near.png`
  - `baseline-overlay-off-mid.png`
  - `baseline-overlay-off-far.png`
- `baseline-overlay-on/`
  - `baseline-overlay-on-near.png`
  - `baseline-overlay-on-mid.png`
  - `baseline-overlay-on-far.png`

Each folder includes a `*.manifest` file with capture metadata and SHA-256 hashes.

## Re-capture commands

```bash
cd /home/rca32/workspaces/spacetimedb-skill/web-client
bun run dev --host 127.0.0.1 --port 5175
```

Overlay off:

```bash
cd /home/rca32/workspaces/spacetimedb-skill
web-client/scripts/visual_regression_capture.sh \
  --url http://127.0.0.1:5175 \
  --out-dir web-client/visual-baselines \
  --tag baseline-overlay-off
```

Overlay on:

```bash
cd /home/rca32/workspaces/spacetimedb-skill
VITE_DEBUG_PATH_OVERLAY=1 bun run dev --host 127.0.0.1 --port 5175
web-client/scripts/visual_regression_capture.sh \
  --url http://127.0.0.1:5175 \
  --out-dir web-client/visual-baselines \
  --tag baseline-overlay-on
```

## Compare command

```bash
cd /home/rca32/workspaces/spacetimedb-skill
web-client/scripts/visual_regression_compare.sh \
  --base web-client/visual-baselines/baseline-overlay-off \
  --candidate web-client/visual-baselines/<candidate-tag> \
  --threshold 0
```
