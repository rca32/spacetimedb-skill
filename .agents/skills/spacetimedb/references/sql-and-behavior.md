# SQL and Runtime Behavior

Use this file for query language, subscription semantics, and SQL edge behavior.

Primary docs:
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00200-reference/00400-sql-reference.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00400-subscriptions/00200-subscription-semantics.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00400-subscriptions.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00100-databases/00100-transactions-atomicity.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00200-reference/00300-internals/00200-sats-json.md

Query decisions:
- for SDK subscriptions, keep `SELECT` query on a single relation with full row projection
- for CLI/server SQL, allow more SQL features but still verify exact supported subset
- avoid assumptions about join cardinality and ordering without checking docs for limits
- treat transaction boundaries and ordering guarantees as API-level constraints
