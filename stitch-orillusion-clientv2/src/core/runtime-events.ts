export type BusEventCode =
  | 'CLIENT_INPUT'
  | 'INPUT_FRAME'
  | 'INPUT_APPLIED'
  | 'SCENARIO_MARK'
  | 'CHANNEL_STATE'
  | 'NET_SUB_OK'
  | 'NET_SUB_FAIL'
  | 'WORLD_SPAWN_ENTITY'
  | 'WORLD_DESPAWN_ENTITY'
  | 'WORLD_TICK'
  | 'WORLD_STATE_APPLIED'
  | 'WORLD_DELTA'
  | 'WORLD_DIMENSION_CHANGE'
  | 'WORLD_PROFILE'
  | 'PHYSICS_STEP'
  | 'PHYSICS_COLLISION'
  | 'PHYSICS_COLLISION_ENTER'
  | 'PHYSICS_COLLISION_EXIT'
  | 'ANIMATION_STATE'
  | 'ANIMATION_ACTION'
  | 'FX_TRIGGER'
  | 'FX_EMIT'
  | 'AUDIO_PLAY_REQUEST'
  | 'AUDIO_PLAY'
  | 'UI_PANEL_STATE'
  | 'UI_PANEL_VISIBILITY'
  | 'UI_WORLD_MARKER'
  | 'UI_FOCUS_SET'
  | 'UI_FOCUS_RELEASE'
  | 'UI_PANEL_ORDER'
  | 'RENDER_PROFILE'
  | 'RENDER_WORLD_TIME'
  | 'RENDER_WEATHER'
  | string

export interface EventPayloadRecord {
  [key: string]: unknown
}

export interface InputFramePayload extends EventPayloadRecord {
  frameNo: number
  move: { x: number; y: number; z: number }
  look: { yaw: number; pitch: number }
  actions: string[]
}

export interface ChannelStatePayload extends EventPayloadRecord {
  channel: 'baseline' | 'session' | 'aoi' | 'feature'
  state: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export interface WorldStatePayload extends EventPayloadRecord {
  frameNo: number
  dimensionId: number
  timeOfDaySec: number
  dayIndex: number
  weather: 'clear' | 'windy' | 'rain' | 'storm'
  profile: 'low' | 'medium' | 'high' | 'ultra'
  source?: string
}

export interface WorldEntityPayload extends EventPayloadRecord {
  entityId: number
  entityType?: 'player' | 'npc' | 'building' | 'resource' | 'projectile' | 'effect'
  position: { x: number; y: number; z: number }
  quaternion?: { x: number; y: number; z: number; w: number }
  velocity?: { x: number; y: number; z: number }
  reason?: string
}

export interface PhysicsStepPayload extends EventPayloadRecord {
  frameNo: number
  bodyId: number
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  grounded: boolean
}

export interface AnimationStatePayload extends EventPayloadRecord {
  state: 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'cast' | 'react' | 'emote'
  detail?: string
  frameNo?: number
  entityId?: number
}

export interface FxEventPayload extends EventPayloadRecord {
  eventType:
    | 'combat.hit'
    | 'combat.crit'
    | 'skill.cast'
    | 'skill.impact'
    | 'ambient.loop'
    | 'ui.alert'
    | string
  sourceEntityId: number
  targetEntityId?: number
  position?: { x: number; y: number; z: number }
  normal?: { x: number; y: number; z: number }
  intensity?: number
  ttlMs?: number
}

export interface AudioRequestPayload extends EventPayloadRecord {
  key: string
  bus: 'master' | 'bgm' | 'sfx' | 'ui' | 'ambient' | 'voice'
  gain?: number
  options?: Record<string, unknown>
}

export interface UiPanelPayload extends EventPayloadRecord {
  panel: 'HUD' | 'Inventory' | 'Quest' | 'Chat' | 'Map' | 'Settings' | 'Modal' | 'Toast'
  visible?: boolean
  owner?: string | null
  reason?: string
}

export interface UiMarkerPayload extends EventPayloadRecord {
  entityId: number
  markerType: string
  state?: 'attached' | 'detached' | 'updated'
  reason?: string
}

export interface ChannelStatePayloadWithTs extends ChannelStatePayload {
  ts: number
}
