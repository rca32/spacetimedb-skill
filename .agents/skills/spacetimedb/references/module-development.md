# Module Design and Functions

Use this file when the request includes schema changes, data model design, reducers, procedures, views, or migrations.

Primary docs:
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00100-databases/00200-spacetime-dev.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00100-databases/00300-spacetime-publish.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00100-databases/00500-migrations/00200-automatic-migrations.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00100-databases/00500-migrations/00300-incremental-migrations.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00300-tables.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00300-tables/00240-constraints.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00300-tables/00300-indexes.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00300-tables/00230-auto-increment.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions/00300-reducers/00300-reducers.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions/00400-procedures.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions/00500-views.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions/00300-reducers/00400-reducer-context.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions/00300-reducers/00500-lifecycle.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions/00300-reducers/00600-error-handling.md

Key defaults:
- reducers are transactional by design and are the only default path to state mutation
- procedures are available for external side effects but do not run in auto-transactions
- views are read-only and query-related
- use `--delete-data` on publish only with explicit intent
- evaluate migration impact from automatic and incremental migration docs before data-shape changes
