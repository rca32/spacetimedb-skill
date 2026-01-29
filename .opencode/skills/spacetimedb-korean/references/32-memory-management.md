SpacetimeDB implements a sophisticated memory management architecture designed for high-performance, in-memory database operations with built-in durability guarantees. This documentation explores the core memory management patterns, tracking systems, and optimization strategies that power SpacetimeDB's efficient resource utilization.

## Core Memory Tracking System

SpacetimeDB's memory management begins with a comprehensive trait-based system for tracking heap memory usage across all data structures. The `MemoryUsage` trait provides a unified interface for measuring heap allocations, enabling precise memory accounting throughout the system. The trait focuses specifically on heap memory measurement, with the option to include stack memory by adding `mem::size_of_val()` for the outermost type in a hierarchy [Sources: crates/memory-usage/src/lib.rs#L4-L14](https://github.com/clockworklabs/SpacetimeDB/blob/master/crates/memory-usage/src/lib.rs#L4-L14).

The system includes implementations for all primitive types (primitives return 0 as they have no heap usage), smart pointers, collections, and custom data structures:

Smart pointer implementations account for both the pointer overhead and the contained object's memory usage. For , the heap usage includes the size of the value plus any nested heap allocations.  and  additionally track reference count overhead (two  values) .
