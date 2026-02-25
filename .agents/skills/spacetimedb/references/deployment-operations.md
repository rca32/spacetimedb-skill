# Deployment and CLI Operations

Use this file for publish/build/run/log/query workflow and server target decisions.

Primary docs:
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00200-reference/00100-cli-reference/00100-cli-reference.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00200-reference/00100-cli-reference/00200-standalone-config.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00100-databases/00300-spacetime-publish.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00100-how-to/00100-deploy/00100-maincloud.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00100-how-to/00100-deploy/00200-self-hosting.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00100-how-to/00500-reject-client-connections.md
- /home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00300-resources/00100-how-to/00300-logging.md

Command map:
- `spacetime login` and `spacetime logout`
- `spacetime start`
- `spacetime init`
- `spacetime dev`
- `spacetime build`
- `spacetime publish`
- `spacetime delete`
- `spacetime logs`
- `spacetime sql`
- `spacetime call`
- `spacetime subscribe`
- `spacetime describe`
- `spacetime generate`
- `spacetime version`

Always mention unstable behavior in commands marked unstable in the CLI reference.
For Maincloud, use URI `https://maincloud.spacetimedb.com` and the published database name/identity in clients.
