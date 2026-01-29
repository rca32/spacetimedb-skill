SpacetimeDB's query optimizer transforms SQL queries and subscription expressions into efficient physical execution plans through a systematic rewrite-rule based approach. The optimizer operates on a tree of physical plan operators, applying semantic-preserving transformations to minimize I/O operations, leverage indexes, and optimize join strategies.

Sources: [crates/physical-plan/src/rules.rs](crates/physical-plan/src/rules.rs#L1-L28), [crates/physical-plan/src/plan.rs](crates/physical-plan/src/plan.rs#L382-L399)

## Physical Plan Architecture

The optimizer operates on a hierarchical physical plan structure where query operators form a tree with projections at the root. The core physical plan operators include:

- **TableScan**: Sequential scan through table rows
- **IxScan**: Index-based scan with search arguments (SARGs)
- **HashJoin**: Hash-based join with optional semijoin optimization
- **IxJoin**: Index-based join using indexed lookup
- **NLJoin**: Nested loop join for cross products
- **Filter**: Tuple-at-a-time predicate evaluation

Physical plans are wrapped in projection operators that handle field selection and aggregation. The `ProjectPlan` type returns physical row IDs, while `ProjectListPlan` handles virtual row projections including LIMIT and aggregate operations.

Sources: [crates/physical-plan/src/plan.rs](crates/physical-plan/src/plan.rs#L199-L212), [crates/physical-plan/src/plan.rs](crates/physical-plan/src/plan.rs#L118-L127)
