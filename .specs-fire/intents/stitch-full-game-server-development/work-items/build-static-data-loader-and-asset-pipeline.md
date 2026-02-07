---
id: build-static-data-loader-and-asset-pipeline
title: 정적 데이터 로더 및 에셋 파이프라인 구축
intent: stitch-full-game-server-development
complexity: medium
mode: confirm
status: pending
depends_on: [scaffold-domain-folder-structure-and-module-entrypoints]
created: 2026-02-07T16:08:40Z
---

# Work Item: 정적 데이터 로더 및 에셋 파이프라인 구축

## Description

`crates/data_loader`와 `assets/static_data`를 연결해 CSV/JSON 정적 데이터 import 경로를 만들고 schema validation을 적용한다.

## Acceptance Criteria

- [ ] 도메인별 static_data 파일 구조가 문서 기준으로 정렬된다.
- [ ] 최소 item/building/combat/quest 데이터가 import 가능하다.
- [ ] 잘못된 스키마 데이터는 validation 단계에서 차단된다.

## Technical Notes

- 기준 문서: `DESIGN/DETAIL/stitch-server-folder-structure.md`

## Dependencies

- scaffold-domain-folder-structure-and-module-entrypoints
