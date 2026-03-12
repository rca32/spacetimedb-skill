# stitch-babylon-client

Babylon.js + SpacetimeDB based Stitch web client.

## Commands

```bash
cd stitch-babylon-client
bun install
bun run assets:sync
bun run test
bun run dev
```

## Build

```bash
bun run typecheck
bun run build
```

## Spacetime Bindings

Regenerate client bindings from the current `stitch-server` source:

```bash
bun run spacetime:regenerate
```

This uses `spacetime generate --module-path`, so it requires a local Rust toolchain with the `wasm32-unknown-unknown` target installed.

If you already have an up-to-date built module artifact and want to generate from the wasm directly:

```bash
bun run spacetime:generate:from-wasm
```

`src/module_bindings` is a generated client artifact. The source of truth for table and reducer names is `stitch-server/crates/game_server`.
