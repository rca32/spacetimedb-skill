export interface SpacetimeContractDefinition {
  revision: number
  tables: string[]
  reducers: string[]
  errorCodes: string[]
}

export const SPACETIME_CONTRACT: SpacetimeContractDefinition = {
  revision: 2,
  tables: [
    'player_state',
    'player_session_view',
    'transform_state',
    'physics_state',
    'combat_state',
    'resource_node',
    'building_state',
    'npc_state',
    'terrain_chunk',
    'chat_message',
    'player_inventory_item_view',
    'quest_chain_state',
    'aoi_stream',
    'client_frame',
    'collision_proxy',
    'combat_hit',
    'combat_intent',
    'motion_intent',
    'server_correction',
  ],
  reducers: [
    'sign_in',
    'sign_out',
    'sync_client_frame',
    'submit_motion_intent',
    'submit_combat_intent',
    'ack_server_correction',
    'set_active_dimension',
    'chat_send_message',
    'request_path_in_dimension',
    'request_chunks_for_aoi',
  ],
  errorCodes: [
    'AUTH_INVALID_TOKEN',
    'AUTH_VERSION_MISMATCH',
    'INPUT_INVALID_FRAME',
    'ACTION_INVALID_TARGET',
    'ACTION_INVALID_STATE',
    'SUBSCRIPTION_DENIED',
    'RUNTIME_BACKPRESSURE',
  ],
}

export const CONTRACT_CATEGORY_TABLES = 'contract_catalog_tables'
export const CONTRACT_CATEGORY_REDUCERS = 'contract_catalog_reducers'
export const CONTRACT_CATEGORY_ERRORS = 'contract_catalog_errors'
