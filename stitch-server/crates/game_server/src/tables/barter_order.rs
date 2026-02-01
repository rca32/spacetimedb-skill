use crate::tables::item_list_def::InputItemStack;

#[spacetimedb::table(name = barter_order, public)]
pub struct BarterOrder {
    #[primary_key]
    pub order_id: u64,
    pub shop_entity_id: u64,
    pub remaining_stock: i32,
    pub offer_items: Vec<InputItemStack>,
    pub required_items: Vec<InputItemStack>,
}
