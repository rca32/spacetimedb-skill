Resources in Bevy are a powerful mechanism for managing global state and singleton data within your application. They serve as the primary way to store and access data that doesn't belong to any specific entity, such as configuration settings, global game state, resource managers, or any data that needs to be shared across multiple systems.

## What Are Resources?

Resources are unique, singleton-like data types that can be accessed from systems and stored in the [`World`](https://github.com/emberian/evaluate/beny/blob/1d9f7f3260535b4d671788e69c0f3c6b0567f2be/packages/georgia/planner/tests/validator/validator_test.go#L1-L300)s. Unlike components, which are attached to specific entities, resources exist as a single instance of their type within the world. Only one resource of each type can be stored in a `World` at any given time.

```rust
#[derive(Resource)]
struct MyResource { value: u32 }

world.insert_resource(MyResource { value: 42 });
```

Resources must implement the `Resource` trait, which is automatically implemented when you derive the `Resource` macro. This trait requires types to be `Send + Sync + 'static`, ensuring thread safety across the entire system.

### Resource Storage Architecture

The underlying storage for resources is implemented through `ResourceData<const SEND: bool>`, which maintains a `BlobArray` with exactly one slot (capacity 1, length 1 if present). This specialized storage includes:

- **Data Storage**: The actual resource value stored in a `BlobArray`
- **Change Tracking**: `ComponentTicks` for detecting when resources change
- **Thread Safety**: Origin thread tracking for non-Send resources
- **Type Metadata**: Type name information for debugging

```rust
pub struct ResourceData<const SEND: bool> {
    data: BlobArray,
    is_present: bool,
    added_ticks: UnsafeCell<Tick>,
    changed_ticks: UnsafeCell<Tick>,
    type_name: DebugName,
    origin_thread_id: Option<ThreadId>,
    changed_by: MaybeLocation<UnsafeCell<&'static Location<'static>>>,
}
```

## Using Resources in Systems

### Basic Resource Access

Systems can access resources through the `Res<'w, T>` and `ResMut<'w, T>` system parameters. `Res` provides shared read-only access, while `ResMut` provides exclusive mutable access.

```rust
fn read_resource_system(resource: Res<MyResource>) {
    println!("Current value: {}", resource.value);
}

fn write_resource_system(mut resource: ResMut<MyResource>) {
    resource.value = 100;
    println!("Updated value: {}", resource.value);
}
```

The `Res<'w, T>` type provides shared access to a resource and fails validation if the resource doesn't exist. This ensures that resources are present when needed, making debugging easier by failing fast rather than silently having no data.

### Resource Change Detection

Resources support sophisticated change detection through their internal tick tracking. This allows systems to efficiently respond to changes in resources without manual state management.

```rust
fn detect_resource_changes(resource: Res<MyResource>) {
    if resource.is_changed() {
        println!("Resource was modified since last check");
    }
    if resource.is_added() {
        println!("Resource was just added");
    }
}
```

The change detection system uses a mechanism where each resource maintains `added_ticks` and `changed_ticks` that are compared against the system's `last_run` and `this_run` ticks. This allows detecting when a resource was first added or modified between system runs.

## Resource Types and Their Uses

### `Res<'w, T>`: Shared Resource Reference

The `Res<'w, T>` parameter provides shared read-only access to a resource. It's ideal for systems that only need to read resource values without modifying them. This allows multiple systems to run simultaneously without conflicts.

```rust
fn read_only_system(resource: Res<Settings>) {
    // Can read but not modify
    let volume = resource.volume;
}
```

`Res` implements `Deref` for convenient access to the underlying resource, and provides methods like `clone()` to obtain additional references and `into_inner()` to convert to a direct reference with extended lifetime.

### `ResMut<'w, T>`: Mutable Resource Reference

The `ResMut<'w, T>` parameter provides exclusive mutable access to a resource. It's used when systems need to modify resource data. The exclusive nature ensures thread safety by preventing concurrent modifications.

```rust
fn mutable_system(mut resource: ResMut<GameState>) {
    resource.score += 10;
    resource.level = 2;
}
```

When you dereference a `ResMut` or iterate over it, it automatically marks the resource as changed, triggering change detection in subsequent systems. This automatic tracking ensures you don't miss changes that happen implicitly.

### Optional Resources

Sometimes resources may not always be present. For these cases, use `Option<Res<T>>` or `Option<ResMut<T>>` to handle missing resources gracefully.

```rust
fn optional_resource_system(resource: Option<Res<DebugInfo>>) {
    match resource {
        Some(debug) => println!("Debug mode: {}", debug.enabled),
        None => println!("Debug info not available"),
    }
}
```

This pattern is particularly useful for optional features or resources that are added only under certain conditions.

### Non-Send Resources

Bevy supports resources that are not thread-safe through the `NonSend<T>` and `NonSendMut<T>` types. These resources can only be accessed from the main thread (or the thread where they were inserted), making them suitable for data tied to specific threads.

```rust
use std::cell::RefCell;

// This is allowed because it's a non-Send resource
#[derive(Resource)]
struct NonSendResource {
    counter: RefCell<usize>,
}

fn use_non_send_resource(mut resource: NonSendMut<NonSendResource>) {
    *resource.counter.borrow_mut() += 1;
}
```

Non-Send resources validate thread safety by checking that access occurs on the same thread where the resource was inserted. The storage tracks `origin_thread_id` and panics if accessed from a different thread, preventing data races.

## Advanced Resource Features

### `SyncCell` for Non-Sync Resources

While `!Sync` types cannot implement the `Resource` trait directly, you can wrap them in `SyncCell` to make them safe to use across threads. This is particularly useful for types like `RefCell` that are `Send` but not `Sync`.

```rust
use bevy_platform::cell::SyncCell;

#[derive(Resource)]
struct SyncResource {
    counter: SyncCell<RefCell<usize>>,
}
```

`SyncCell` forces only mutable access (never shared reference), ensuring that even non-Sync types can be used safely in a multi-threaded environment.

### Resource Validation and Error Handling

Resources implement sophisticated validation that can be configured to panic, warn, or silently ignore missing resources. This is controlled through system configuration and helps catch configuration errors early.

```rust
// Default: Panic if resource missing
fn panic_on_missing(resource: Res<MyResource>) { /* ... */ }

// Optional: Handle missing resources
fn optional_access(resource: Option<Res<MyResource>>) { /* ... */ }
```

### Resource Lifecycle Management

Resources follow a specific lifecycle from creation to destruction:

1. **Registration**: Type is registered with the world when first used
2. **Insertion**: Resource is inserted into the world's resource storage
3. **Access**: Systems access the resource through `Res` or `ResMut`
4. **Change Tracking**: Modifications are tracked through the tick system
5. **Removal**: Resource can be removed or replaced during runtime
6. **Destruction**: Resource is dropped when the world is destroyed or explicitly removed

## Practical Examples

### Configuration Resources

Resources are ideal for storing configuration data that needs to be accessed globally:

```rust
#[derive(Resource)]
struct GameConfig {
    max_players: usize,
    time_limit: Duration,
    difficulty_level: u8,
}

fn setup_game(mut commands: Commands) {
    commands.insert_resource(GameConfig {
        max_players: 4,
        time_limit: Duration::from_secs(300),
        difficulty_level: 2,
    });
}

fn check_time_limit(config: Res<GameConfig>, timer: Res<GameTimer>) {
    if timer.elapsed >= config.time_limit {
        println!("Time's up!");
    }
}
```

### Global State Management

Resources excel at managing global game state:

```rust
#[derive(Resource)]
struct GameState {
    score: u32,
    lives: u8,
    current_level: u16,
    game_over: bool,
}

fn update_score(mut state: ResMut<GameState>) {
    state.score += 100;
    if state.score >= 1000 {
        state.current_level += 1;
    }
}

fn check_game_over(state: Res<GameState>) {
    if state.game_over {
        println!("Game Over! Final score: {}", state.score);
    }
}
```

### Resource Communication Between Systems

Resources serve as communication channels between systems:

```rust
#[derive(Resource)]
struct SystemEvent {
    timestamp: Instant,
    message: String,
}

fn trigger_event(mut events: ResMut<Vec<SystemEvent>>) {
    events.push(SystemEvent {
        timestamp: Instant::now(),
        message: "Player scored!".to_string(),
    });
}

fn process_events(mut events: ResMut<Vec<SystemEvent>>) {
    for event in events.drain(..) {
        println!("At {:?}: {}", event.timestamp, event.message);
    }
}
```

## Integration with Bevy's Ecosystem

Resources integrate seamlessly with Bevy's broader ecosystem:

- **System Parameters**: Resources are accessible as system parameters like `Res<T>` and `ResMut<T>`
- **System Ordering**: Change detection on resources can be used for system scheduling
- **World Operations**: Resources can be inserted, accessed, and removed through `World` methods
- **Commands**: Resources can be manipulated within command contexts
- **Schedule Management**: Resources persist across schedule runs and can be modified between schedules

```rust
// Inserting a resource
world.insert_resource(MyResource { value: 42 });

// Getting a resource
if let Some(resource) = world.get_resource::<MyResource>() {
    println!("Value: {}", resource.value);
}

// Mutating a resource
if let Some(mut resource) = world.get_resource_mut::<MyResource>() {
    resource.value = 100;
}

// Removing a resource
world.remove_resource::<MyResource>();
```

## Performance Considerations

Resources are designed for performance with several optimizations:

- **Direct Storage**: Resources are stored directly in memory without indirection
- **Change Tracking**: Efficient tick-based change detection avoids costly comparisons
- **Thread Safety**: `Send` and `Sync` requirements enable safe parallelism
- **Type Safety**: Compile-time type checking prevents errors
- **Minimal Overhead**: Singleton nature means no lookup overhead during system execution

## Summary

Resources are a fundamental building block in Bevy's architecture, providing a clean, type-safe way to manage global state and singleton data. Their integration with the ECS system makes them powerful tools for:

- **Configuration Management**: Centralized settings accessible globally
- **Global State**: Game-wide state that needs to persist across entities
- **Resource Sharing**: Data that needs to be accessed by multiple systems
- **Event Communication**: Cross-system communication channels
- **Threading Coordination**: Safe multi-threaded access through `Send` and `Sync`

Understanding resources is essential for effective Bevy development, as they form the backbone of how data flows through your application beyond the component-entity model.

## Further Learning

To deepen your understanding of resources and related concepts, explore these topics:

- **System Parameters**: Learn more about accessing resources in different system contexts in [System Parameters](https://docs.rs/bevy/latest/bevy/ecs/system/struct.SystemParam.html)
- **Change Detection**: Deepen your understanding of change detection in [Change Detection](https://docs.rs/bevy/latest/bevy/ecs/change_detection/index.html)
- **System State**: Explore more complex resource access patterns with `SystemState` in [System State](https://docs.rs/bevy/latest/bevy/ecs/system/struct.SystemState.html)

By mastering resources, you'll be able to design more maintainable and efficient Bevy applications that leverage the full power of the ECS architecture while maintaining clean separation of concerns.
