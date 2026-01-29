This page tracks the current state of issues, bugs, and community feedback for SpacetimeDB. As an actively evolving multiplayer database system, the project faces a mix of implementation challenges, architectural improvements, and feature gaps. Below is an analysis of recent issues, feedback patterns, and what they reveal about the system's maturity and development priorities.

## Current Issue Landscape

### Critical Bugs and Regressions

The open issues reveal several areas where users are encountering friction:

**Migration and Schema Issues**: [Removing or changing a `primary_key` table annotation breaks module updating](https://github.com/clockworklabs/SpacetimeDB/issues/3934) highlights a fundamental problem with how schema migrations handle primary key changes. The issue demonstrates that after removing a `#[primary_key]` annotation and successfully publishing, any subsequent update fails with a primary key mismatch error. This suggests the system tracks schema state internally in a way that doesn't cleanly handle certain annotation modifications—a problem for teams iterating on data models.

**Scheduler Timing Precision**: [Repeated reducer execution seems to be delayed by few `ms`](https://github.com/clockworklabs/SpacetimeDB/issues/2648) reports consistent 2-5ms delays in scheduled reducer execution. The investigation traces this to the `SchedulerActor` using a follow-up transaction for cleanup, which then schedules the next occurrence relative to "now" rather than the original scheduled time. While a few milliseconds might sound minor, for real-time multiplayer games where precise timing matters, this represents a systemic issue in how the scheduler handles temporal state.

**Conditional Compilation Gaps**: [Conditional compilation for field attributes does not work](https://github.com/clockworklabs/SpacetimeDB/issues/3929) shows that `#[cfg_attr(feature(x), unique)]` doesn't behave as expected—the derive macro for `SpacetimeType` appears to ignore conditional attributes. This limits developers' ability to maintain feature-agnostic schemas with optional constraints, a pattern common in libraries that support multiple deployment configurations.

### Architectural Concerns

**Async Locking Strategy**: [Use `async` locks in datastore, nix `asyncify`](https://github.com/clockworklabs/SpacetimeDB/issues/3939) calls out a fundamental design choice. The current approach uses non-async locks in the datastore, requiring `spawn_blocking` for every transaction acquisition. The author argues this is problematic because:
- `spawn_blocking` has non-zero overhead
- Database worker cores use single-threaded Tokio workers not configured for blocking threads

This represents a tension between SpacetimeDB's hybrid architecture (part database, part application server) and idiomatic async Rust patterns. Moving to async-aware locks would be a substantial refactor but aligns better with long-term scalability.

**SQL Compliance Roadmap**: [Proper SQL support roadmap](https://github.com/clockworklabs/SpacetimeDB/issues/3857) is arguably the most comprehensive tracking issue in the repository. It catalogs missing SQL features across three categories:

| Category | Missing Features | Status |
|----------|-----------------|--------|
| Syntax | Timestamp literals, tuples, arrays, enum literals, `NULL` literal | Partial PRs exist |
| Compliance | Mixed projections, option compatibility, `BYTEA` escapes, `SELECT` behavior vs PG | Multiple open PRs |
| Features | `FORMAT`, `EXPLAIN`, `ORDER BY`, foreign keys, `OUTER JOIN`, `ALTER`, `RETURNING`, `GROUP BY`, `CAST`, implicit joins, nested queries | Varied implementation status |

The issue author notes that SpacetimeDB [claims](https://spacetimedb.com/docs/sql) SQL compatibility, but the roadmap shows significant gaps. This isn't necessarily a criticism—building a full SQL engine is enormous—but it does set expectations for potential adopters evaluating whether SpacetimeDB's SQL subset meets their needs.

**Commitlog Inconsistency**: [Restore scheduled reducer inputs to the commitlog](https://github.com/clockworklabs/SpacetimeDB/issues/3942) indicates that a recent PR (#3816) inadvertently removed scheduled reducer inputs from the commitlog. This breaks auditability and replayability for scheduled operations—a serious concern for systems relying on the commitlog for debugging or migration purposes.

### Developer Experience Issues

**Tooling Gaps**: [Parallelize smoketests](https://github.com/clockworklabs/SpacetimeDB/issues/3678) and [CI - Run pre-commit format equivalent](https://github.com/clockworklabs/SpacetimeDB/issues/3931) reflect pain points in the development workflow itself. Smoketests are slow enough to warrant parallelization with isolated instances, and the lack of CI enforcement for formatting rules leads to unnecessary reformatting churn in PRs. These are quality-of-life issues that matter for contributor velocity but don't affect end users directly.

## Recent Resolutions and Improvements

The commit history and closed issues show an active team addressing problems quickly:

### SDK-Specific Fixes

**C# Runtime Improvements**: [Adds datastore_index_scan_point_bsatn to C# Runtime](https://github.com/clockworklabs/SpacetimeDB/commit/8a0cd87c4f0108b8a2d149c6cc56c0f109b1f94d) resolves [Find() inside of View returning default value?](https://github.com/clockworklabs/SpacetimeDB/issues/3875). Previously, unique index lookups in C# used range scans followed by `SingleOrDefault()`, which could return a default-initialized row instead of `null` for value types. The fix introduces `datastore_index_scan_point_bsatn` for exact-match lookups, returning proper nullable semantics. This is a thoughtful change that aligns C# behavior with Rust's expectations.

**Transaction Support**: [C# implementation of Transactions for Procedures](https://github.com/clockworklabs/SpacetimeDB/commit/39f01289e5f64a88e4d723d7027493d8fe8a01d0) brings transaction-level error handling to C#, mirroring Rust's `Result<T, E>` pattern but adapted for C#'s exception model. The implementation uses an `AbortGuard` pattern with `IDisposable` for cleanup—a pragmatic adaptation of Rust's ownership semantics to C#'s garbage-collected world.

**TypeScript Iterator Refactoring**: [Refactor typescript table iterators](https://github.com/clockworklabs/SpacetimeDB/commit/66f55471da60bf37eb8443f91ff34499573be9b) converts table iterators to generator functions, returning standard `Iterator` objects. This gives developers access to combinators like `filter()`, `find()`, and `reduce()` while fixing a resource leak where incompletely consumed iterators would never be collected. The commit message notes this leverages newer JavaScript APIs, but since module code runs in controlled environments, the tradeoff is acceptable.

### Core Database Fixes

**Replay System Reliability**: [Respect updates to `st_table` during replay](https://github.com/clockworklabs/SpacetimeDB/commit/41eec04ea6150114247ff4ae7cbd7a68b1144bd5) addresses a subtle bug in schema migration replay. The system previously only handled deletes from `st_table` during replay but ignored updates, causing migrations that changed `table_access` or `primary_key` to fail. The fix introduces a side table `replay_table_updated` to track the most recent `st_table` row for migrating tables. The author correctly identifies replay as "complicated and scary"—this is code where mistakes can corrupt databases in ways that only surface during disaster recovery.

**Deadlock Resolution**: [fix view deadlock](https://github.com/clockworklabs/SpacetimeDB/commit/10fd8b2cd0dc2a720a5e7b18f96c558a3536e1b) resolves a deadlock in subscription code and HTTP SQL handler caused by calling view methods on the module while holding transaction locks. The solution moves view method invocation into the module itself, avoiding the need for complex `Send` closures across V8's channel-based communication. This is the kind of concurrency bug that's notoriously difficult to diagnose, so the fix represents real progress in system stability.

**Performance Optimization**: [Reuse buffers in `ServerMessage<BsatnFormat>`](https://github.com/clockworklabs/SpacetimeDB/commit/8e3af49f64a75e5d8744dffe12b0ec4e99aa31a0) implements a buffer pool for subscription serialization, addressing [Add buffer pool for serializing subscription results](https://github.com/clockworklabs/SpacetimeDB/issues/2824). The benchmark results show substantial improvements:

```
footprint-scan:  -61.438% time
full-scan:       -36.497% time
```

This is exactly the kind of optimization that matters at scale—reducing allocation overhead in hot paths like subscription updates. The implementation follows existing patterns (`PagePool`) and integrates Prometheus metrics, showing attention to operational observability.

### Documentation and DX Improvements

The team has invested significantly in documentation:

[Refactor /docs to close in on the final form](https://github.com/clockworklabs/SpacetimeDB/commit/48b8a31fe02f0fdb71143fa383c3d4a3fbc1e6ba) closes [Refactor /docs - Phase 2](https://github.com/clockworklabs/SpacetimeDB/issues/3895), reorganizing content into a cleaner hierarchy with "Intro," "Core Concepts," and "Developer Resources." The restructure moves several documents to "How-To" sections to streamline core concepts and adds appropriate warnings (e.g., RLS recommending views). [Remove old documentation that was mistakenly left](https://github.com/clockworklabs/SpacetimeDB/commit/9daf51ea26d0016063088be6c8a22a5d1d629c7) cleaned up residual files from earlier refactor efforts.

These changes respond to feedback that the documentation was overwhelming for new users, suggesting the team is listening to onboarding friction reports.

## Recurring Themes and Patterns

### Complexity in Core Systems

Several issues and fixes reveal that SpacetimeDB's core systems—particularly replay, migrations, and subscription serialization—are operating at high complexity. The replay fix (`replay_table_updated` side table), the scheduler timing investigation, and the view deadlock resolution all hint at architectural brittleness. This isn't unexpected for a system combining database semantics with real-time game server logic, but it suggests that future development should prioritize simplification and testing infrastructure over rapid feature expansion.

### SDK Parity Challenges

The commits show ongoing work to maintain API consistency across Rust, C#, and TypeScript SDKs. The C# transaction implementation explicitly references the Rust equivalent, and the TypeScript iterator refactor notes API alignment concerns. This multi-language support is a strength but also a maintenance burden—each new core feature requires three implementations, and subtle behavioral differences (like the C# `Find()` default value bug) can slip through.

### CI Infrastructure Debt

Multiple recent commits address CI issues: [CI - Hackily fix V8 linker errors](https://github.com/clockworklabs/SpacetimeDB/commit/264e45eafc13254b98be9bd9d69a468d9e9ef455), [CI - No cache-on-failure](https://github.com/clockworklabs/SpacetimeDB/commit/c38b1350380b6d91b100764df7f32984c2cc56c3), and the open smoketest parallelization issue. The team is actively debugging mysterious `rusty_v8` linker problems, which suggests the build infrastructure has accumulated technical debt. This is common in rapidly growing projects but can slow contributor velocity if not addressed systematically.

## Community Feedback Sources

While the repository issues and commits provide one view of user experience, additional feedback surfaces in:

- **Discord**: The scheduler timing issue originated from [public Discord reports](https://discord.com/channels/1037340874172014652/1363060408285532253), indicating active community discussion.
- **Documentation Issues**: [Install link is broken](https://github.com/clockworklabs/SpacetimeDB/issues/3793) was a user-reported 404 on the official docs, suggesting monitoring of web infrastructure is needed.
- **Licensing Clarification**: [Patch licensing question](https://github.com/clockworklabs/SpacetimeDB/issues/3870) asked about contributor rights under the BSL-to-AGPL transition, indicating community interest in forking and long-term maintenance.

## Competitive Context

While direct comparisons aren't available in the provided data, SpacetimeDB's focus on real-time multiplayer games places it in competition with solutions like [Nakama](https://github.com/heroiclabs/nakama), [Colyseus](https://github.com/colyseus/colyseus), and [Photon](https://www.photonengine.com/). The SQL roadmap issue suggests SpacetimeDB aims to differentiate by offering query capabilities these competitors don't provide, but the implementation gaps indicate this differentiation is still in progress.

## Recommendations for Users

Based on the issue patterns:

1. **Test Schema Migrations Thoroughly**: The primary key issue (#3934) suggests schema migrations, especially constraint changes, should be validated in staging environments before production deployment.

2. **Consider Scheduler Tolerance**: If using scheduled reducers for game logic, account for the documented 2-5ms timing jitter in systems where sub-millisecond precision isn't critical.

3. **Leverage Supported SQL Subset**: Review the [SQL roadmap](https://github.com/clockworklabs/SpacetimeDB/issues/3857) before designing queries—many standard SQL features aren't yet implemented, and relying on them will require workarounds.

4. **Monitor SDK-Specific Behavior**: The C# `Find()` bug (#3875) shows that SDK implementations can diverge in edge cases. Test database operations in your chosen language's SDK, especially for nullable and value type semantics.

## Conclusion

SpacetimeDB's issue landscape reflects a system in active development with real users pushing its boundaries. The team is responsive—critical bugs like the C# view lookup and TypeScript iterator leaks were resolved quickly—but architectural issues like the async locking strategy and SQL compliance gaps will require sustained effort. The documentation refactor and performance optimizations suggest the project is maturing from experimental prototype to production-ready system, though the "complicated and scary" replay and scheduler code indicates there's still internal cleanup needed.

For developers evaluating SpacetimeDB, the pattern of fixes shows a capable team that's learning from real-world usage. The presence of comprehensive issues like the SQL roadmap suggests transparency about limitations rather than marketing overpromise. However, potential adopters should verify that the current feature set meets their needs and assess their tolerance for working through edge cases in a rapidly evolving system.
