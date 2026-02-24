# Internal Orillusion Engine Source

This directory contains the project-local engine source integrated for direct modification.

## Baseline
- Core source: extracted from `orillusion` repository `HEAD:src`
- Plugin packages: copied from local working tree under `orillusion/packages/*`

## Import Contract
- Use `@engine/*` aliases from application code.
- Do not add new `@orillusion/*` imports.
