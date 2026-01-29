Welcome to the BitCraftPublic repository, the server-side codebase for BitCraft—a community sandbox MMORPG developed by Clockwork Labs. This repository represents the first phase of an open source initiative, making the game's server architecture available for public inspection, experimentation, and contribution.

BitCraft blends cooperative gameplay, city-building, crafting, exploration, and survival in a single seamless world shared by players globally. The server is built on **SpacetimeDB**, a real-time reactive backend platform designed specifically for multiplayer game development, with all data stored in SpacetimeDB tables and logic executed through reducers.

Sources: [README.md](README.md#L1-L60)

## About This Repository

This repository contains the complete server-side implementation for running a BitCraft server, including game logic, state management, procedural world generation, and server-side systems. It does **not** include the client code or tools required to connect to the official game. The codebase is organized into two primary modules that work together to deliver the complete MMORPG experience.

**BitCraft** is a community-driven MMORPG where players collaborate to shape a procedurally generated world without fixed classes or roles. Players build, craft, explore, trade, and govern together to shape their civilizations in a persistent, shared world.

Sources: [README.md](README.md#L30-L42), [BitCraftServer/packages/game/Cargo.toml](BitCraftServer/packages/game/Cargo.toml#L1-L33)

## Repository Architecture
