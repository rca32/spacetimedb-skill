pub mod housing_change_entrance;
pub mod housing_create;
pub mod housing_enter;
pub mod housing_propagate_permissions;
pub mod interior_collapse_rebuild;
pub mod interior_mark_empty;
pub mod rent_set_whitelist;

use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::housing::rent_whitelist_entry;
use crate::tables::RentWhitelistEntry;

pub(super) fn sync_rent_whitelist_entries(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    white_list: &[Identity],
) {
    let stale_keys: Vec<String> = ctx
        .db
        .rent_whitelist_entry()
        .iter()
        .filter(|row| row.housing_entity_id == housing_entity_id)
        .map(|row| row.entry_key.clone())
        .collect();

    for entry_key in stale_keys {
        ctx.db.rent_whitelist_entry().entry_key().delete(entry_key);
    }

    for identity in white_list {
        ctx.db.rent_whitelist_entry().insert(RentWhitelistEntry {
            entry_key: format!("{housing_entity_id}:{identity}"),
            housing_entity_id,
            identity: *identity,
        });
    }
}
