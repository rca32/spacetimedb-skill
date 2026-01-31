# Cozy MMO Game

A cozy survival/crafting MMO with AI-powered NPCs using SpacetimeDB.

## Project Structure

```
Game/
├── server/          # SpacetimeDB backend (Rust)
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── client/          # Web frontend (React + TypeScript)
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        └── App.css
```

## Quick Start

### Server (SpacetimeDB)

```bash
cd Game/server
spacetime build
spacetime publish
```

### Client (Web)

```bash
cd Game/client
npm install
npm run dev
```

## Tech Stack

- **Backend**: SpacetimeDB (Rust)
- **Frontend**: React 18 + TypeScript + Vite
- **State Sync**: SpacetimeDB real-time subscriptions
- **AI**: LLM-powered NPC conversations

## Features (MVP)

- [x] Account system with SpacetimeDB Identity
- [x] Hex grid player movement
- [x] Inventory and item management
- [x] Crafting system
- [x] AI NPC conversations

## License

MIT
