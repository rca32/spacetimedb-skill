---
name: zread-docs-fetcher
description: Fetch and convert zread.ai documentation to markdown using a local toc.html. Use when the user provides a zread.ai docs base URL plus a toc file (or asks to follow toc links) and wants the docs saved as .md files via a Python script.
---

# Zread Docs Fetcher

## Overview

Fetch zread.ai docs listed in a local `toc.html` and save each doc as a markdown file. Use the bundled script to follow the TOC links, request each page, and extract full markdown from Next.js Flight data (with HTML fallback).

## Workflow

1. If you already have a TOC, pass it via `--toc`.
2. If you only have a base page, use `--toc-url` or `--crawl-url` to generate `top.htm` automatically.
3. Run the script to fetch docs and save markdown files to a target directory.
4. Re-run with `--force` or `--only` if you need specific files refreshed.

## Script

Use `scripts/fetch_zread_docs.py`.

Basic usage:

```bash
python3 scripts/fetch_zread_docs.py --toc /path/to/toc.html --output-dir /path/to/output
```

Generate TOC from a page:

```bash
python3 scripts/fetch_zread_docs.py \
  --toc-url https://zread.ai/owner/repo \
  --output-dir zread \
  --base-url https://zread.ai
```

Crawl a site to build a fuller TOC:

```bash
python3 scripts/fetch_zread_docs.py \
  --crawl-url https://zread.ai/owner/repo \
  --output-dir zread \
  --base-url https://zread.ai \
  --crawl-max 200
```

Common options:

```bash
python3 scripts/fetch_zread_docs.py \
  --toc zread/toc.html \
  --output-dir zread \
  --base-url https://zread.ai \
  --force \
  --timeout 30 \
  --retries 3
```

Fetch a single doc:

```bash
python3 scripts/fetch_zread_docs.py --toc zread/toc.html --output-dir zread --only 1-overview --force
```

## Notes

- zread.ai pages embed full markdown in `self.__next_f.push` payloads; use that when available.
- If pages return 504, re-run with a higher `--timeout` and `--retries`.
- When a base page hides doc links, `--crawl-url` discovers `/owner/repo/<slug>` links from each doc and builds a better TOC.
- The script prints hints when using `--toc-url` or `--crawl-url`, including 504 retry advice and `--crawl-max` tuning.
