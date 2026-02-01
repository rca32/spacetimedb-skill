use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    npc_memory_long_trait, npc_memory_short_trait, npc_relation_trait, NpcMemoryLong,
    NpcMemoryShort, NpcRelation,
};

pub fn add_short_memory(ctx: &ReducerContext, npc_id: u64, summary: String) {
    ctx.db.npc_memory_short().insert(NpcMemoryShort {
        entry_id: ctx.random(),
        npc_id,
        summary,
        created_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
    });
}

pub fn add_long_memory(ctx: &ReducerContext, npc_id: u64, summary: String) {
    ctx.db.npc_memory_long().insert(NpcMemoryLong {
        entry_id: ctx.random(),
        npc_id,
        summary,
        created_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
    });
}

pub fn update_relation(ctx: &ReducerContext, npc_id: u64, player_entity_id: u64, delta: i32) {
    if let Some(mut relation) = ctx
        .db
        .npc_relation()
        .iter()
        .find(|r| r.npc_id == npc_id && r.player_entity_id == player_entity_id)
    {
        relation.affinity += delta;
        relation.trust += delta / 2;
        ctx.db.npc_relation().relation_id().update(relation);
    } else {
        ctx.db.npc_relation().insert(NpcRelation {
            relation_id: ctx.random(),
            npc_id,
            player_entity_id,
            affinity: delta,
            trust: delta / 2,
        });
    }
}
