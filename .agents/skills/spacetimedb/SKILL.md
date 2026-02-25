---
name: spacetimedb
description: Use this skill when working with SpacetimeDB server modules, client SDK integration, schema design, real-time subscriptions, CLI workflows, authentication, SQL, and deployment. Trigger for implementation, debugging, migration, and rollout tasks using SpacetimeDB docs.
---

# SpacetimeDB Workflow Skill

Use this skill for any SpacetimeDB request that requires implementation or operational guidance.

## Core Flow

1. Classify the task as module, client, auth, CLI operations, SQL, or deployment.
2. Open only the most relevant reference file first.
3. Apply exact command syntax and behavior guarantees from the linked source docs.
4. Verify edge cases such as unstable CLI commands, migration impact, and subscription consistency.

## Reference Selection

For module design and schema work read `references/module-development.md`.
For app bootstrap and project setup read `references/getting-started.md`.
For client cache/subscriptions and connection flows read `references/client-integration.md`.
For publish/login/start/logs/CLI operations read `references/deployment-operations.md`.
For identity and auth flows read `references/authentication.md`.
For SQL and consistency behavior read `references/sql-and-behavior.md`.
For incident checks and fast triage read `references/diagnostics.md`.

## Mandatory Working Rules

Always check and mention `spacetime` command stability when using a command marked unstable in CLI docs.
If reducer logic mutates state, ensure access and identity checks are explicit before writes.
If a table schema changes, evaluate migration compatibility before publish.
If using subscriptions, use selective query shapes and explain callback ordering guarantees.
If C#, Unity, or Unreal is involved, verify whether explicit frame pumping (`FrameTick`) is required.

## Useful Start Patterns

Use `spacetime login` before publish-style operations.
Use `spacetime start` for local testing.
Use `spacetime dev --template <template>` for fast scaffolding.
Use `spacetime publish` for Maincloud or target server deployment.
