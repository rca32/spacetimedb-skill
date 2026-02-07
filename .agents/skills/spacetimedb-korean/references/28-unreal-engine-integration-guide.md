This guide provides comprehensive documentation for integrating SpacetimeDB with Unreal Engine projects. The SpacetimeDB Unreal SDK enables real-time database connectivity through a WebSocket-based architecture, offering seamless synchronization between your game state and a distributed database backend.

## Architecture Overview

The Unreal SDK follows a modular design that mirrors SpacetimeDB's architecture while leveraging Unreal Engine's type system and Blueprint integration. The core components work together to maintain a synchronized local cache of remote database tables, enabling real-time gameplay driven by database events.

The architecture implements a **producer-consumer pattern** where WebSocket messages are queued on background threads and processed on the game thread, ensuring thread-safe integration with Unreal's rendering and game logic pipelines.

Sources: [README.md](sdks/unreal/README.md#L1-L46), [DbConnectionBase.h](sdks/unreal/src/SpacetimeDbSdk/Source/SpacetimeDbSdk/Public/Connection/DbConnectionBase.h#L1-L200)

## Plugin Installation and Setup
