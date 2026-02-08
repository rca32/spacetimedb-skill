Bevy ECS 是为 Bevy 游戏引擎定制的数据驱动架构，基于实体、组件与系统三大核心概念，提供类型安全、高性能的并行执行能力。本页面面向高级开发者，阐述 Bevy ECS 的设计原理、存储与查询机制、系统参数与执行调度，以及常见的高级用法与最佳实践。

## 核心概念

### World
World 是 ECS 的中央容器，管理实体、组件、资源及元数据。World 通过 Entities 统一分配与追踪实体，由 Components 维护组件注册与信息，由 Archetypes 组织具有相同组件组合的实体，并由 Storages 提供 Table 与 SparseSet 两种存储后端。World 初始化时会引导组件与资源注册，并变更 change_tick，用于变更检测与并发控制。

Sources: [crates/bevy_ecs/src/lib.rs](crates/bevy_ecs/src/lib.rs#L1-L100), [crates/bevy_ecs/src/world/mod.rs](crates/bevy_ecs/src/world/mod.rs#L1-L100)

### Entity
Entity 是分配于实体分配器的唯一标识符，经历未分配、已分配、已生成、已销毁、已释放等生命周期阶段。生成阶段通过 World::spawn 或 Commands::spawn 创建实体并返回 Entity ID，更新阶段通过 Query 或 World::entity_mut/EntityCommands 进行读写，销毁阶段通过 despawn 清除实体及其组件。generation 机制避免 ID 冲突与悬垂引用，但访问已销毁实体将触发 EntityNotSpawnedError。

Sources: [crates/bevy_ecs/src/entity/mod.rs](crates/bevy_ecs/src/entity/mod.rs#L1-L100)

### Component
Component 指任何实现 Component trait 的 Rust 数据类型，默认存储于 Table，可通过 #[component(storage = "SparseSet")] 优化插入与删除性能。组件支持不可变与可变两种变体，并可通过 #[require(B)] 指定必需组件，在插入 A 时自动插入 B（默认使用 Default 构造）。组件注册与存储由 Components 元数据管理，用于检索与调度。

Sources: [crates/bevy_ecs/src/component/mod.rs](crates/bevy_ecs/src/component/mod.rs#L1-L150)

### Resource
Resource 是全局唯一、不属于实体的单例类型，通过 Resource trait 标记，要求 Send + Sync + 'static。使用 Res<T> 与 ResMut<T> 在系统中只读/读写访问，World 提供 insert_resource 与 get_resource/get_resource_mut 等方法操作。Resource 常用于配置、全局状态、资产容器、消息通道等场景。

Sources: [crates/bevy_ecs/src/resource.rs](crates/bevy_ecs/src/resource.rs#L1-L76)

### System
System 是以数据为中心的执行单元，通常为带有 SystemParam 参数的 Rust 函数。系统参数包括 Query、Res/ResMut、Commands、Local 等，调度器根据系统的数据访问类型构建依赖图，以实现最大程度的并行执行。系统可以通过显式依赖关系（.before/.after）或系统集（SystemSet.chain）来保证确定性与顺序。

Sources: [crates/bevy_ecs/src/system/mod.rs](crates/bevy_ecs/src/system/mod.rs#L1-L150)

## 存储与查询

### Archetype 与 Table 存储
Archetype 按实体组件组合分组，每个 Archetype 对应一种独特的组件集并指向一个 Table。Table 组件按列组织，适合快速迭代，而 SparseSet 组件按哈希组织，适合频繁的增删。ArchetypeEdges 缓存 Bundle 插入后的转换关系，加速动态迁移。实体生成与组件增删导致实体在 Archetype 与 Table 之间迁移，此过程由调度器与存储后端协同完成。

Sources: [crates/bevy_ecs/src/archetype.rs](crates/bevy_ecs/src/archetype.rs#L1-L150)

### Query 与 QueryFilter
Query 提供基于类型的数据检索，QueryData 定义访问组件（如 &T/&mut T），QueryFilter 定义过滤条件（如 With<T>、Without<T>、Changed<T>、Added<T>）。可通过 QueryState 与 QueryBuilder 构建查询，并由 par_iter 并行迭代。查询会在编译期验证数据访问安全性，并生成访问图以供调度器使用。

Sources: [crates/bevy_ecs/src/query/mod.rs](crates/bevy_ecs/src/query/mod.rs#L1-L150)

### Bundle
Bundle 代表一组静态组件集合，可通过 derive(Bundle) 生成。spawn 或 insert 可将 Bundle 的组件一次性插入实体，插入时自动处理必需组件的初始化与迁移。Bundle 的 insert/removal 会触发相应的生命周期钩子与消息事件，并更新实体所属 Archetype。

Sources: [crates/bevy_ecs/src/bundle/mod.rs](crates/bevy_ecs/src/bundle/mod.rs#L1-L100)

## 系统参数与执行

### SystemParam 与 ParamSet
SystemParam 是系统参数的抽象，包含 Query、Res/ResMut、Commands、Local、MessageReader/Writer、NonSend/NonSendMut 等。ParamSet 允许在同一线程内交错访问可能冲突的参数（例如同时读取两种 Query）。SystemParam 可自定义，封装查询与资源以重用复杂访问模式。

Sources: [examples/ecs/system_param.rs](examples/ecs/system_param.rs#L1-L48)

### 系统调度与执行顺序
Schedule 将系统按执行策略（如并行 executor）组织，系统可加入多个 SystemSet 并通过 chain/before/after 构建偏序关系。在并行执行时，若两个系统读写相同数据，则它们被视为不兼容且必须顺序执行。系统顺序的不确定性会导致调度器报告歧义，可通过显式依赖解决。

Sources: [crates/bevy_ecs/src/system/mod.rs](crates/bevy_ecs/src/system/mod.rs#L1-L150), [crates/bevy_ecs/README.md](crates/bevy_ecs/README.md#L1-L200)

### 并行查询与迭代
Query 提供串行与并行迭代（par_iter）。在多线程环境下，系统内部可通过 par_iter 分割数据到任务池，提升大数据集的处理吞吐。并行查询依赖任务池配置（如 ComputeTaskPool）与无冲突的数据访问模式。

Sources: [crates/bevy_ecs/src/query/mod.rs](crates/bevy_ecs/src/query/mod.rs#L1-L150)

## 高级用法

### 变更检测
World 维护 change_tick 与 last_change_tick，用于检测组件与资源的变更。Query 可通过 Changed<T>、Added<T> 过滤器选取最近变更的实体，Mut<T> 与 Ref<T> 提供 is_changed/ set_changed 方法。变更检测被广泛应用于增量更新与事件驱动逻辑。

Sources: [crates/bevy_ecs/src/lib.rs](crates/bevy_ecs/src/lib.rs#L1-L100), [crates/bevy_ecs/README.md](crates/bevy_ecs/README.md#L1-L200)

### 生命周期钩子
Component 提供 on_add、on_insert、on_replace、on_remove 四种生命周期钩子，通过 register_component_hooks<T> 注册。钩子接收 DeferredWorld 与 HookContext，可在组件生命周期的特定阶段执行自定义逻辑，如维护索引或发送消息。钩子应谨慎使用，在可使用事件或变更检测时优先采用后者。

Sources: [examples/ecs/component_hooks.rs](examples/ecs/component_hooks.rs#L1-L100)

### Commands 与 CommandQueue
Commands 提供世界变更的延迟队列，可在并行系统中安全调度实体生成、销毁、组件增删、资源插入等操作。Commands 内部通过 CommandQueue 收集操作，在系统运行结束后由调度器统一应用到 World。Commands 是并发环境下修改世界的标准方式，ExclusiveSystem 会阻塞并行执行，应谨慎使用。

Sources: [crates/bevy_ecs/src/system/mod.rs](crates/bevy_ecs/src/system/mod.rs#L1-L150)

### Local 与 SystemState
Local<T> 为系统提供生命周期内的私有状态，在系统首次运行时通过 FromWorld 初始化。SystemState 允许以更细粒度的访问模式手动构造参数，在重复访问场景下提升性能。Local 与 SystemState 是构建有状态系统与优化复杂数据访问的基础工具。

Sources: [examples/ecs/ecs_guide.rs](examples/ecs/ecs_guide.rs#L1-L200)

## 最佳实践

- 尽量以数据驱动的设计组织逻辑，将复杂拆解为小型系统与独立组件，借助并行 executor 获得性能提升。
- 对于高频变更的组件使用 SparseSet 存储，对于查询密集的场景使用 Table 存储。
- 明确系统间的显式依赖，避免调度歧义；必要时使用 SystemSet 组织系统并配合 chain/before/after。
- 在能使用事件与变更检测时优先选择它们，减少生命周期钩子的使用以避免性能瓶颈与可维护性下降。
- 使用 Commands 实现世界变更的延迟与安全执行，慎用 ExclusiveSystem 避免阻塞并行性。
