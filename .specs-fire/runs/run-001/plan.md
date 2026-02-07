---
run: run-001
work_item: scaffold-domain-folder-structure-and-module-entrypoints
intent: stitch-full-game-server-development
generated: 2026-02-07T16:13:30Z
mode: validate
---

# Implementation Plan: 도메인 폴더 구조 및 모듈 엔트리포인트 스캐폴딩

Based on `DESIGN/DETAIL/stitch-server-folder-structure.md`.

## Implementation Checklist

- [x] `game_server/src` 하위에 핵심 도메인 디렉터리 골격 생성
- [x] `module.rs`/`init.rs`/각 `mod.rs` 엔트리포인트 추가
- [x] 기존 `lib.rs` 기능을 모듈 분리 후 공개 경계(`pub mod ...`) 정렬
- [x] 기존 reducer/테이블 동작이 깨지지 않도록 컴파일 검증

## Files to Create

- `stitch-server/crates/game_server/src/module.rs`
- `stitch-server/crates/game_server/src/init.rs`
- `stitch-server/crates/game_server/src/config/mod.rs`
- `stitch-server/crates/game_server/src/auth/mod.rs`
- `stitch-server/crates/game_server/src/agents/mod.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`
- `stitch-server/crates/game_server/src/services/mod.rs`
- `stitch-server/crates/game_server/src/subscriptions/mod.rs`
- `stitch-server/crates/game_server/src/validation/mod.rs`
- `stitch-server/crates/game_server/src/errors/mod.rs`
- `stitch-server/crates/game_server/src/utils/mod.rs`

## Files to Modify

- `stitch-server/crates/game_server/src/lib.rs`

## Verification

- `cargo check -p game_server`
- `cd stitch-server/crates/game_server && spacetime build`

## Risks and Mitigations

- 모듈 분리 시 매크로(`#[spacetimedb::table]`, `#[spacetimedb::reducer]`) 가시성/경로 이슈 가능
- 대응: 초기 단계는 `lib.rs`에서 공개 모듈 선언 중심으로 스캐폴딩하고, 기능 로직은 최소 이동으로 컴파일 안정 우선
