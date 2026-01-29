This guide provides comprehensive documentation for integrating SpacetimeDB with Unity, enabling real-time multiplayer game development with the SpacetimeDB database-server hybrid architecture. The Unity SDK shares a common codebase with the C
 Sources: [README.md](sdks/csharp/README.md#L1-L17), [DEVELOP.md](sdks/csharp/DEVELOP.md#L1-L103)

## Architecture Overview

The Unity integration follows a layered architecture that bridges SpacetimeDB's core networking with Unity's game loop. The SDK uses the C# client implementation as its foundation, adding Unity-specific components for lifecycle management, logging, and platform compatibility.

![SpacetimeDB Unity Architecture](<clockworklabs/SpacetimeDB_github_url>/blob/master/images/basic-architecture-diagram.png?raw=true)

The architecture demonstrates how generated bindings extend SDK base classes to create a type-safe client interface. The `DbConnection` serves as the central coordination point, managing WebSocket communication, subscription state, and event dispatch.

Sources: , ,
