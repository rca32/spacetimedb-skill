---
name: spacetimedb-korean
description: SpacetimeDB 한국어 종합 가이드. SpacetimeDB 모듈/테이블/리듀서/구독/SQL/인증/성능/클라이언트 SDK( Rust/C#/TypeScript )/Unity/Unreal 통합 작업을 설계, 구현, 디버깅, 문서화할 때 사용. SpacetimeDB 아키텍처 설명, 스키마 설계, 자동 마이그레이션, 실시간 동기화, 오류 처리, 성능 최적화, 클라이언트 연결/구독/리듀서 호출 패턴이 필요할 때 트리거.
---

# SpacetimeDB 한국어 스킬

SpacetimeDB 작업 요청을 받으면 먼저 요구사항(언어, 런타임, 클라이언트 유형, 성능 제약)을 요약한 뒤 해당 레퍼런스를 선택해 읽는다. SKILL.md에는 흐름과 선택 가이드만 두고, 상세 지식은 references/ 파일을 읽어 적용한다.

## Best Practices (통합)

SpacetimeDB 설계/구현/리팩터링 시 아래 베스트 프랙티스 규칙을 함께 적용한다.

### SpacetimeDB Best Practices (Reference)

Comprehensive development guide for SpacetimeDB applications, covering both TypeScript server modules and client SDK integration with React. Contains rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

**Package:** `spacetimedb` (v1.4.0+)

#### When to Apply

Reference these guidelines when:
- Writing SpacetimeDB server modules in TypeScript
- Designing table schemas and indexes
- Implementing reducers for state mutations
- Setting up client subscriptions and queries
- Integrating SpacetimeDB with React applications
- Optimizing real-time sync performance

#### Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Module Design | CRITICAL | `module-` |
| 2 | Table Schema & Indexing | CRITICAL | `table-` |
| 3 | Reducer Patterns | HIGH | `reducer-` |
| 4 | Subscription Optimization | HIGH | `subscription-` |
| 5 | Client State Management | MEDIUM-HIGH | `client-` |
| 6 | React Integration | MEDIUM | `react-` |
| 7 | TypeScript Patterns | MEDIUM | `ts-` |
| 8 | Real-time Sync | LOW-MEDIUM | `sync-` |

#### Quick Reference

##### Server Module API (TypeScript)

```typescript
import { spacetimedb, table, t, ReducerContext } from 'spacetimedb';

// Define tables with the table builder
const Player = table(
  { name: 'player', public: true },
  {
    identity: t.identity().primaryKey(),
    name: t.string(),
    score: t.u64().index(),
    isOnline: t.bool().index(),
  }
);

// Define reducers
spacetimedb.reducer('create_player', { name: t.string() }, (ctx: ReducerContext, { name }) => {
  ctx.db.player.insert({
    identity: ctx.sender,
    name,
    score: 0n,
    isOnline: true,
  });
});

// Lifecycle hooks
spacetimedb.init((ctx: ReducerContext) => { /* module init */ });
spacetimedb.clientConnected((ctx: ReducerContext) => { /* client connected */ });
spacetimedb.clientDisconnected((ctx: ReducerContext) => { /* client disconnected */ });
```

##### Client SDK API (TypeScript)

```typescript
import { DbConnection } from './generated';

// Build connection
const conn = DbConnection.builder()
  .withUri('ws://localhost:3000')
  .withModuleName('my-module')
  .onConnect((ctx, identity, token) => {
    // Setup subscriptions
    conn.subscription(['SELECT * FROM player WHERE isOnline = true']);
  })
  .onDisconnect((ctx, error) => { /* handle disconnect */ })
  .build();

// Call reducers
await conn.reducers.createPlayer('Alice');

// Access tables
const player = conn.db.player.identity.find(identity);
```

##### React Integration

```typescript
import { useTable, where, eq } from 'spacetimedb/react';
import { DbConnection, Player } from './generated';

function OnlinePlayers() {
  const { rows: players } = useTable<DbConnection, Player>(
    'player',
    where(eq('isOnline', true))
  );

  return players.map(p => <div key={p.identity.toHexString()}>{p.name}</div>);
}
```

#### Rule Categories

##### 1. Module Design (CRITICAL)

- `module-single-responsibility` - One module per domain concept
- `module-lifecycle` - Use lifecycle hooks appropriately (init, clientConnected, clientDisconnected)
- `module-error-handling` - Handle errors gracefully in module code
- `module-type-exports` - Export types for client consumption

##### 2. Table Schema & Indexing (CRITICAL)

- `table-primary-keys` - Choose appropriate primary key strategies
- `table-indexing` - Add `.index()` for frequently queried columns
- `table-relationships` - Model relationships between tables correctly
- `table-column-types` - Use appropriate SpacetimeDB types

##### 3. Reducer Patterns (HIGH)

- `reducer-atomicity` - Keep reducers atomic and focused
- `reducer-validation` - Validate inputs at reducer entry
- `reducer-authorization` - Check caller identity for sensitive operations
- `reducer-batch-operations` - Batch related mutations in single reducer

##### 4. Subscription Optimization (HIGH)

- `subscription-selective` - Subscribe only to needed data
- `subscription-filters` - Use subscription filters to reduce data transfer
- `subscription-cleanup` - Clean up subscriptions when no longer needed
- `subscription-batching` - Batch subscription setup on client connect

##### 5. Client State Management (MEDIUM-HIGH)

- `client-connection-lifecycle` - Handle connection/reconnection properly
- `client-optimistic-updates` - Use optimistic updates for responsive UI
- `client-error-recovery` - Handle reducer errors gracefully
- `client-identity` - Manage identity tokens securely

##### 6. React Integration (MEDIUM)

- `react-use-subscription` - Use subscription hooks correctly
- `react-table-hooks` - Use `useTable<DbConnection, Type>()` for reactive data
- `react-reducer-hooks` - Call `conn.reducers.*` with proper error handling
- `react-connection-status` - Display connection status to users

##### 7. TypeScript Patterns (MEDIUM)

- `ts-generated-types` - Use generated types from SpacetimeDB CLI
- `ts-strict-mode` - Enable strict TypeScript for better type safety
- `ts-discriminated-unions` - Use discriminated unions for state
- `ts-type-guards` - Implement type guards for runtime validation

##### 8. Real-time Sync (LOW-MEDIUM)

- `sync-conflict-resolution` - Handle concurrent modifications
- `sync-offline-support` - Design for offline-first when needed
- `sync-debounce-updates` - Debounce rapid UI updates
- `sync-presence` - Implement user presence efficiently

#### How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/module-single-responsibility.md
rules/table-primary-keys.md
rules/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

#### Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

## References

### Core Docs

- [overview](references/1-overview.md)
- [quick-start](references/2-quick-start.md)
- [installing-spacetimedb-cli](references/3-installing-spacetimedb-cli.md)
- [running-with-docker](references/4-running-with-docker.md)
- [building-from-source](references/5-building-from-source.md)
- [latest-updates](references/6-latest-updates.md)
- [issues-and-feedbacks](references/7-issues-and-feedbacks.md)
- [about-contributors](references/8-about-contributors.md)
- [understanding-the-database-server-hybrid-architecture](references/9-understanding-the-database-server-hybrid-architecture.md)
- [tables-and-data-modeling](references/10-tables-and-data-modeling.md)
- [reducers-server-side-logic](references/11-reducers-server-side-logic.md)
- [lifecycle-reducers](references/12-lifecycle-reducers.md)
- [public-vs-private-tables](references/13-public-vs-private-tables.md)
- [automatic-schema-migrations](references/14-automatic-schema-migrations.md)
- [rust-module-development-guide](references/15-rust-module-development-guide.md)
- [c-module-development-guide](references/16-c-module-development-guide.md)
- [scheduled-reducers-and-timers](references/17-scheduled-reducers-and-timers.md)
- [identity-and-authentication](references/18-identity-and-authentication.md)
- [error-handling-and-validation](references/19-error-handling-and-validation.md)
- [understanding-subscriptions](references/20-understanding-subscriptions.md)
- [sql-queries-for-real-time-data](references/21-sql-queries-for-real-time-data.md)
- [subscription-optimization-strategies](references/22-subscription-optimization-strategies.md)
- [conflict-resolution-and-consistency](references/23-conflict-resolution-and-consistency.md)
- [rust-client-sdk-reference](references/24-rust-client-sdk-reference.md)
- [c-client-sdk-reference](references/25-c-client-sdk-reference.md)
- [typescript-client-sdk-reference](references/26-typescript-client-sdk-reference.md)
- [unity-integration-guide](references/27-unity-integration-guide.md)
- [unreal-engine-integration-guide](references/28-unreal-engine-integration-guide.md)
- [in-memory-architecture-and-wal](references/29-in-memory-architecture-and-wal.md)
- [indexing-strategies](references/30-indexing-strategies.md)
- [query-optimization](references/31-query-optimization.md)
- [memory-management](references/32-memory-management.md)
- [benchmarking-and-profiling](references/33-benchmarking-and-profiling.md)

### Best Practices Rules

- [module-single-responsibility](references/module-single-responsibility.md)
- [module-lifecycle](references/module-lifecycle.md)
- [module-error-handling](references/module-error-handling.md)
- [table-primary-keys](references/table-primary-keys.md)
- [table-indexing](references/table-indexing.md)
- [reducer-atomicity](references/reducer-atomicity.md)
- [reducer-validation](references/reducer-validation.md)
- [reducer-authorization](references/reducer-authorization.md)
- [subscription-selective](references/subscription-selective.md)
- [client-connection-lifecycle](references/client-connection-lifecycle.md)
- [react-table-hooks](references/react-table-hooks.md)
- [react-reducer-hooks](references/react-reducer-hooks.md)
- [ts-generated-types](references/ts-generated-types.md)
- [sync-debounce-updates](references/sync-debounce-updates.md)
