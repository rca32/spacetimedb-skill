# Authentication and Identity

Use this file for auth and access control questions.

Primary docs:
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00500-authentication.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00500-authentication/00100-spacetimeauth/index.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00500-authentication/00100-spacetimeauth/00200-creating-a-project.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00500-authentication/00100-spacetimeauth/00300-configuring-a-project.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00500-authentication/00100-spacetimeauth/00400-testing.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00500-authentication/00500-usage.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00200-reference/00200-http-api/00100-authorization.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00200-reference/00200-http-api/00200-identity.md

Use these in order:
- first model the token and identity flow in module code
- then wire claims usage in reducers and views
- finally validate server/client side connection token paths

If tokens are passed via HTTP endpoints, require standard bearer auth header format.
