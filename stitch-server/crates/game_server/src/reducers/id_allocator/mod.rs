pub mod building_next_id;
pub mod claim_next_id;
pub mod dimension_desc_next_id;
pub mod dimension_network_next_id;
pub mod housing_next_id;

use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::id_lease_state::id_lease_state;
use crate::tables::IdLeaseState;

pub(super) const KIND_BUILDING: u8 = 1;
pub(super) const KIND_CLAIM: u8 = 2;
pub(super) const KIND_HOUSING: u8 = 3;
pub(super) const KIND_DIMENSION_NETWORK: u8 = 4;
pub(super) const KIND_DIMENSION_DESC: u8 = 5;

pub(super) fn ensure_nonce(request_nonce: String) -> Result<String, String> {
    let normalized = request_nonce.trim().to_string();
    if normalized.is_empty() {
        return Err("request_nonce is required".to_string());
    }
    Ok(normalized)
}

pub(super) fn upsert_lease(ctx: &ReducerContext, kind: u8, request_nonce: String, leased_id: u64) {
    let key = lease_key(ctx.sender(), kind);
    let next = IdLeaseState {
        lease_key: key.clone(),
        identity: ctx.sender(),
        kind,
        request_nonce,
        leased_id,
        updated_at: ctx.timestamp,
    };

    if ctx.db.id_lease_state().lease_key().find(key).is_some() {
        ctx.db.id_lease_state().lease_key().update(next);
    } else {
        ctx.db.id_lease_state().insert(next);
    }
}

fn lease_key(identity: Identity, kind: u8) -> String {
    format!("{identity}:{kind}")
}
