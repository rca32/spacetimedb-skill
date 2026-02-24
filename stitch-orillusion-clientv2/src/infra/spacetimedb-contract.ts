export interface SpacetimeV2ContractDefinition {
  revision: number
  tables: string[]
  reducers: string[]
  errorCodes: string[]
}

export const SPACETIME_V2_CONTRACT: SpacetimeV2ContractDefinition = {
  revision: 2,
  tables: [
    'player_profile_v2',
    'player_session_v2',
    'transform_state_v2',
    'physics_state_v2',
    'combat_state_v2',
    'animation_state_v2',
    'expression_state_v2',
    'resource_node_v2',
    'building_state_v2',
    'npc_state_v2',
    'terrain_chunk_v2',
    'world_time_state_v2',
    'weather_state_v2',
    'fx_event_v2',
    'audio_event_v2',
    'chat_message_v2',
    'inventory_item_v2',
    'quest_state_v2',
  ],
  reducers: [
    'client_hello_v2',
    'client_heartbeat_v2',
    'submit_input_frame_v2',
    'submit_action_intent_v2',
    'interact_entity_v2',
    'start_skill_v2',
    'cancel_skill_v2',
    'ack_server_correction_v2',
    'request_respawn_v2',
    'set_ui_preference_v2',
  ],
  errorCodes: [
    'AUTH_INVALID_TOKEN',
    'AUTH_VERSION_MISMATCH',
    'INPUT_OUT_OF_ORDER',
    'ACTION_INVALID_TARGET',
    'ACTION_COOLDOWN',
    'SUBSCRIPTION_DENIED',
    'RUNTIME_BACKPRESSURE',
  ],
}

export const CONTRACT_CATEGORY_TABLES = 'contract_catalog_tables'
export const CONTRACT_CATEGORY_REDUCERS = 'contract_catalog_reducers'
export const CONTRACT_CATEGORY_ERRORS = 'contract_catalog_errors'
