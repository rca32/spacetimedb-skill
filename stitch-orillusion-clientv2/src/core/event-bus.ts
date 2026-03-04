export interface RuntimeEvent<T = Record<string, unknown>> {
  ts: number
  level: 'debug' | 'info' | 'warn' | 'error'
  event_code:
    | 'NET_SUB_OK'
    | 'NET_SUB_FAIL'
    | 'AOI_SWAP'
    | 'AOI_STABLE'
    | 'UI_FOCUS_SET'
    | 'UI_FOCUS_RELEASE'
    | 'FX_EMIT'
    | 'AUDIO_PLAY_REQUEST'
    | 'AUDIO_PLAY'
    | 'ASSERT_PASS'
    | 'ASSERT_FAIL'
    | 'GATE_VERDICT'
    | 'CONTRACT_CATALOG'
    | 'CONTRACT_REDUCER_CALL'
    | string
  scenario_id?: string
  payload?: T
}

export type RuntimeEventListener = (event: RuntimeEvent) => void

export class EventBus {
  private readonly listeners = new Set<RuntimeEventListener>()
  private readonly channelListeners = new Map<string, Set<RuntimeEventListener>>()

  on(listener: RuntimeEventListener): () => void
  on(eventCode: string, listener: RuntimeEventListener): () => void
  on(arg1: RuntimeEventListener | string, arg2?: RuntimeEventListener): () => void {
    if (typeof arg1 === 'function') {
      this.listeners.add(arg1)
      return () => {
        this.listeners.delete(arg1)
      }
    }

    const listener = arg2
    if (!listener) {
      return () => {}
    }
    let group = this.channelListeners.get(arg1)
    if (!group) {
      group = new Set()
      this.channelListeners.set(arg1, group)
    }
    group.add(listener)
    return () => {
      group?.delete(listener)
      if (group && group.size === 0) {
        this.channelListeners.delete(arg1)
      }
    }
  }

  offAll(): void {
    this.listeners.clear()
    this.channelListeners.clear()
  }

  emit(event: RuntimeEvent): void {
    this.listeners.forEach((listener) => listener(event))
    const channelListeners = this.channelListeners.get(event.event_code)
    if (channelListeners) {
      channelListeners.forEach((listener) => listener(event))
    }
  }
}
