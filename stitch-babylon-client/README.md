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

Regenerate client bindings after deleting the generated directory:

```bash
bun run spacetime:regenerate
```

If your local environment has `rustup` and the `wasm32-unknown-unknown` target installed, you can generate directly from module source:

```bash
bun run spacetime:generate:from-source
```

`src/module_bindings` is a generated client artifact. The source of truth for table and reducer names is `stitch-server/crates/game_server`.
