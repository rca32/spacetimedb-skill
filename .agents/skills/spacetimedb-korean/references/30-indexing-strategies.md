SpacetimeDB implements a sophisticated multi-tier indexing system designed for high-performance in-memory operations. The indexing architecture leverages type specialization and algorithmic selection to optimize both memory usage and query performance across different access patterns and data distributions.

## Index Architecture Overview

SpacetimeDB indexes are organized around a **type-specialized** approach that hoists enum variants out of key structures to eliminate unnecessary comparisons and reduce memory overhead. This design represents a deliberate trade-off: more complex code generation for substantially improved runtime performance, particularly for integer key types where direct native comparisons replace generic value-based dispatch.

## BTree-Based Indexes

BTree indexes form the foundation of SpacetimeDB's indexing strategy, providing balanced performance across various access patterns. The system maintains separate implementations for unique and non-unique constraints, each optimized for their specific use case.
