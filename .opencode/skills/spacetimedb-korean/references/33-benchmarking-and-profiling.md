Comprehensive performance measurement and analysis infrastructure for SpacetimeDB, supporting both micro-benchmarks and realistic workload simulation. This documentation covers the benchmarking framework, profiling tools, and continuous integration for performance regression detection.

## Architecture Overview

SpacetimeDB provides a multi-layered performance measurement ecosystem designed to capture metrics at different levels of the database stack. The infrastructure is built around three core benchmarking approaches, each targeting specific performance characteristics: timing-based benchmarks using Criterion.rs, instruction-count benchmarks via Valgrind/Callgrind, and workload benchmarks simulating real-world scenarios.

The benchmarking framework operates across multiple database backends—SQLite for baseline comparison, SpacetimeRaw for direct backend testing, and SpacetimeModule for full reducer invocation through both Rust and C

## Benchmarking Infrastructure
