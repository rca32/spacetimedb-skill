use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::economy::{currency_txn, price_index, tax_policy, wallet};
use crate::tables::item_def::item_def;
use crate::tables::item_stack::item_stack;
use crate::tables::live_ops::{economy_metric, economy_params};
use crate::tables::{CurrencyTxn, EconomyMetric, PriceIndex, Wallet};

const DEFAULT_TRADE_FEE_BPS: u32 = 500; // 5%

pub(crate) fn slot_can_accept(
    ctx: &ReducerContext,
    slot_volume: i32,
    item_def_id: u64,
    current_item_instance_id: u64,
    incoming_qty: u32,
) -> Result<bool, String> {
    if slot_volume <= 0 {
        return Ok(true);
    }

    let item_def = ctx
        .db
        .item_def()
        .item_def_id()
        .find(item_def_id)
        .ok_or("item_def not found".to_string())?;

    let current_qty = if current_item_instance_id == 0 {
        0u32
    } else {
        ctx.db
            .item_stack()
            .item_instance_id()
            .find(current_item_instance_id)
            .map(|x| x.quantity)
            .unwrap_or(0)
    };

    let total = current_qty.saturating_add(incoming_qty);
    let used = (item_def.volume as i64) * (total as i64);
    Ok(used <= slot_volume as i64)
}

pub(crate) fn settle_market_fill(
    ctx: &ReducerContext,
    buyer_identity: Identity,
    seller_identity: Identity,
    item_def_id: u64,
    fill_qty: u32,
    unit_price: u64,
) -> Result<(), String> {
    let gross_i64 = trade_amount_i64(fill_qty, unit_price)?;
    let fee_bps = trade_fee_bps(ctx);
    let tax_bps = item_tax_bps(ctx, item_def_id);

    let (fee_amt, tax_amt, seller_net) = compute_trade_settlement(gross_i64, fee_bps, tax_bps);

    adjust_wallet(ctx, buyer_identity, -gross_i64, "market_buy")?;
    adjust_wallet(ctx, seller_identity, seller_net, "market_sell_net")?;

    upsert_price_index(ctx, item_def_id, fill_qty, unit_price);
    append_metric(ctx, "market_fill_gross", gross_i64 as f64);
    append_metric(ctx, "market_fill_fee", fee_amt as f64);
    append_metric(ctx, "market_fill_tax", tax_amt as f64);
    append_metric(ctx, "market_fill_qty", fill_qty as f64);

    Ok(())
}

fn adjust_wallet(
    ctx: &ReducerContext,
    identity: Identity,
    delta: i64,
    reason: &str,
) -> Result<(), String> {
    let mut wallet_row = ctx.db.wallet().identity().find(identity).unwrap_or(Wallet {
        identity,
        balance: 0,
        updated_at: ctx.timestamp,
    });

    let next_balance = wallet_row
        .balance
        .checked_add(delta)
        .ok_or("wallet balance overflow".to_string())?;
    if next_balance < 0 {
        return Err("insufficient wallet balance".to_string());
    }

    wallet_row.balance = next_balance;
    wallet_row.updated_at = ctx.timestamp;

    if ctx.db.wallet().identity().find(identity).is_some() {
        ctx.db.wallet().identity().update(wallet_row);
    } else {
        ctx.db.wallet().insert(wallet_row);
    }

    ctx.db.currency_txn().insert(CurrencyTxn {
        txn_id: 0,
        identity,
        amount: delta,
        reason: reason.to_string(),
        created_at: ctx.timestamp,
    });

    Ok(())
}

fn trade_fee_bps(ctx: &ReducerContext) -> u32 {
    let value = ctx
        .db
        .economy_params()
        .param_key()
        .find("trade_fee_bps".to_string())
        .map(|x| x.int_value)
        .unwrap_or(DEFAULT_TRADE_FEE_BPS as i64);

    value.clamp(0, 10_000) as u32
}

fn item_tax_bps(ctx: &ReducerContext, item_def_id: u64) -> u32 {
    ctx.db
        .tax_policy()
        .item_def_id()
        .find(item_def_id)
        .map(|x| x.tax_bps.min(10_000))
        .unwrap_or(0)
}

fn upsert_price_index(ctx: &ReducerContext, item_def_id: u64, fill_qty: u32, unit_price: u64) {
    let index_key = format!("item:{}", item_def_id);
    let prev = ctx.db.price_index().index_key().find(index_key.clone());

    let (new_avg, new_volume) = if let Some(existing) = prev {
        let total_volume = existing.volume.saturating_add(fill_qty as u64);
        if total_volume == 0 {
            (unit_price, fill_qty as u64)
        } else {
            let weighted = (existing.price_avg as u128)
                .saturating_mul(existing.volume as u128)
                .saturating_add((unit_price as u128).saturating_mul(fill_qty as u128));
            ((weighted / total_volume as u128) as u64, total_volume)
        }
    } else {
        (unit_price, fill_qty as u64)
    };

    let next = PriceIndex {
        index_key: index_key.clone(),
        item_def_id,
        price_avg: new_avg,
        volume: new_volume,
        recorded_at: ctx.timestamp,
    };

    if ctx.db.price_index().index_key().find(index_key).is_some() {
        ctx.db.price_index().index_key().update(next);
    } else {
        ctx.db.price_index().insert(next);
    }
}

fn append_metric(ctx: &ReducerContext, metric_key: &str, metric_value: f64) {
    ctx.db.economy_metric().insert(EconomyMetric {
        metric_id: 0,
        metric_key: metric_key.to_string(),
        metric_value,
        recorded_at: ctx.timestamp,
    });
}

fn trade_amount_i64(fill_qty: u32, unit_price: u64) -> Result<i64, String> {
    let gross_u128 = (fill_qty as u128).saturating_mul(unit_price as u128);
    if gross_u128 > i64::MAX as u128 {
        return Err("trade amount overflow".to_string());
    }
    Ok(gross_u128 as i64)
}

pub(crate) fn compute_trade_settlement(gross: i64, fee_bps: u32, tax_bps: u32) -> (i64, i64, i64) {
    let fee = gross.saturating_mul(fee_bps as i64) / 10_000;
    let tax = gross.saturating_mul(tax_bps as i64) / 10_000;
    let net = gross.saturating_sub(fee).saturating_sub(tax);
    (fee, tax, net.max(0))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_trade_settlement_applies_fee_and_tax() {
        let (fee, tax, net) = compute_trade_settlement(10_000, 500, 1000);
        assert_eq!(fee, 500);
        assert_eq!(tax, 1000);
        assert_eq!(net, 8500);
    }

    #[test]
    fn test_compute_trade_settlement_never_negative_net() {
        let (_, _, net) = compute_trade_settlement(100, 9000, 9000);
        assert_eq!(net, 0);
    }
}
