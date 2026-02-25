# Client Integration

Use this file for client-side tasks, subscriptions, connection lifecycle, and SDK references.

Primary docs:
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00200-codegen.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00300-connection.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00400-sdk-api.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00500-rust-reference.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00600-csharp-reference.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00700-typescript-reference.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00800-unreal-reference.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00400-subscriptions/00200-subscription-semantics.md

Connection defaults:
- generate bindings before coding calls: `spacetime generate --lang <lang> ...`
- wait for subscription apply before reading local cache assumptions
- use `conn.subscriptionBuilder()` and `onApplied` patterns
- in C#/Unity/Unreal, call frame advancement hooks to process messages
- keep subscription queries selective and query-by-query
