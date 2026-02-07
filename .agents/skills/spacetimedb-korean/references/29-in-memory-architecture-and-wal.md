SpacetimeDB's storage architecture combines high-performance in-memory operations with Write-Ahead Logging (WAL) for durability. This hybrid design enables fast reads and writes while maintaining strong consistency guarantees through persistent commit logs and periodic snapshots. The architecture separates the memory-oriented table operations from the durability layer, allowing the system to persist transactions asynchronously without blocking user operations.

Sources: [lib.rs](crates/durability/src/lib.rs#L1-L100), [local.rs](crates/durability/src/imp/local.rs#L1-L200)

## Architecture Overview

SpacetimeDB's storage system is built around three core components that work together to provide both performance and durability: the in-memory table layer, the Write-Ahead Log (WAL), and the snapshot system. The tables store all data in memory for fast access, while every transaction is simultaneously written to the commitlog on disk. Periodic snapshots capture the complete database state at specific transaction offsets, enabling fast recovery by minimizing the amount of commitlog that needs to be replayed.

The architecture follows a non-blocking design where user operations interact with in-memory structures while background tasks handle durability. This separation allows SpacetimeDB to maintain low-latency operations while ensuring no data is lost through the WAL mechanism. The durability layer provides a `Durability` trait that abstracts the persistence mechanism, with a `Local` implementation backed by the commitlog for standard deployments.

Sources: [local.rs](crates/durability/src/imp/local.rs#L50-L120), [lib.rs](crates/commitlog/src/lib.rs#L60-L100)
