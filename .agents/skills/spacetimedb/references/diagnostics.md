# Diagnostics and Troubleshooting

Use this file first when behavior is broken or mismatch is reported.

Primary docs:
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00100-how-to/00300-logging.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00200-reference/00100-cli-reference/00100-cli-reference.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00400-sdk-api.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00400-subscriptions/00200-subscription-semantics.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00200-functions/00300-reducers/00600-error-handling.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00500-authentication/00500-usage.md

Fast checks:
- inspect logs with `spacetime logs`
- verify subscription lifecycle with `onApplied` and callback order
- verify SQL state with `spacetime sql`
- validate reducer behavior with controlled `spacetime call` inputs
- check identity and auth token paths when access is unexpectedly denied
