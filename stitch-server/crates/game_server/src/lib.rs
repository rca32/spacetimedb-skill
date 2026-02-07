use spacetimedb::{Identity, ReducerContext, Table, Timestamp};

#[spacetimedb::table(name = account, public)]
pub struct Account {
    #[primary_key]
    pub identity: Identity,
    pub created_at: Timestamp,
    pub status: u8, // 0: active, 1: blocked
}

#[spacetimedb::table(name = item_def, public)]
pub struct ItemDef {
    #[primary_key]
    pub id: u64,
    pub code: String,
    pub name: String,
    pub stackable: bool,
    pub max_stack: u32,
}

#[spacetimedb::table(name = player_state, public)]
pub struct PlayerState {
    #[primary_key]
    pub player_id: Identity,
    pub display_name: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = session_state, private)]
pub struct SessionState {
    #[primary_key]
    pub identity: Identity,
    pub region_id: u64,
    pub last_active_at: Timestamp,
}

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    log::info!("stitch-server module initialized");
}

fn ensure_account_exists(ctx: &ReducerContext) {
    if ctx.db.account().identity().find(ctx.sender).is_none() {
        ctx.db.account().insert(Account {
            identity: ctx.sender,
            created_at: ctx.timestamp,
            status: 0,
        });
    }
}

fn ensure_player_state_exists(ctx: &ReducerContext, display_name: String) {
    if ctx.db.player_state().player_id().find(ctx.sender).is_none() {
        ctx.db.player_state().insert(PlayerState {
            player_id: ctx.sender,
            display_name,
            created_at: ctx.timestamp,
        });
    }
}

#[spacetimedb::reducer(client_connected)]
pub fn identity_connected(ctx: &ReducerContext) {
    ensure_account_exists(ctx);
    ensure_player_state_exists(ctx, "new-player".to_string());
}

#[spacetimedb::reducer]
pub fn seed_data(ctx: &ReducerContext) {
    if ctx.db.item_def().id().find(1).is_none() {
        ctx.db.item_def().insert(ItemDef {
            id: 1,
            code: "wood".to_string(),
            name: "Wood".to_string(),
            stackable: true,
            max_stack: 200,
        });
    }

    if ctx.db.item_def().id().find(2).is_none() {
        ctx.db.item_def().insert(ItemDef {
            id: 2,
            code: "stone".to_string(),
            name: "Stone".to_string(),
            stackable: true,
            max_stack: 200,
        });
    }

    log::info!("seed_data complete");
}

#[spacetimedb::reducer]
pub fn import_csv_data(ctx: &ReducerContext) {
    // Bootstrap stage: alias to seed path so CLI flow stays stable.
    seed_data(ctx);
}

#[spacetimedb::reducer]
pub fn import_csv_by_type(ctx: &ReducerContext, data_type: String) -> Result<(), String> {
    match data_type.as_str() {
        "items" => {
            seed_data(ctx);
            Ok(())
        }
        _ => Err(format!("unsupported import type: {data_type}")),
    }
}

#[spacetimedb::reducer]
pub fn account_bootstrap(ctx: &ReducerContext, display_name: String) -> Result<(), String> {
    let trimmed = display_name.trim();
    if trimmed.is_empty() {
        return Err("display_name must not be empty".to_string());
    }

    ensure_account_exists(ctx);
    ensure_player_state_exists(ctx, trimmed.to_string());
    Ok(())
}

#[spacetimedb::reducer]
pub fn sign_in(ctx: &ReducerContext, region_id: u64) -> Result<(), String> {
    ensure_account_exists(ctx);

    let account = ctx
        .db
        .account()
        .identity()
        .find(ctx.sender)
        .ok_or("account not found".to_string())?;

    if account.status != 0 {
        log::warn!("blocked sign_in attempt: identity={}", ctx.sender);
        return Err("account blocked".to_string());
    }

    let next_state = SessionState {
        identity: ctx.sender,
        region_id,
        last_active_at: ctx.timestamp,
    };

    if ctx.db.session_state().identity().find(ctx.sender).is_some() {
        ctx.db.session_state().identity().update(next_state);
    } else {
        ctx.db.session_state().insert(next_state);
    }

    ensure_player_state_exists(ctx, "new-player".to_string());
    Ok(())
}

#[spacetimedb::reducer]
pub fn sign_out(ctx: &ReducerContext) -> Result<(), String> {
    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active session not found".to_string())?;

    if session.identity != ctx.sender {
        log::warn!("unauthorized sign_out attempt: identity={}", ctx.sender);
        return Err("unauthorized".to_string());
    }

    ctx.db.session_state().identity().delete(ctx.sender);
    Ok(())
}
