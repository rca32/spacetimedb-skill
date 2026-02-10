export type WebClientAppState =
  | 'Boot'
  | 'LoadingAssets'
  | 'Connecting'
  | 'Authenticating'
  | 'CharacterReady'
  | 'InWorld'
  | 'Reconnecting'
  | 'Disconnected'

const validTransitions: Record<WebClientAppState, WebClientAppState[]> = {
  Boot: ['LoadingAssets', 'Disconnected'],
  LoadingAssets: ['Connecting', 'Disconnected'],
  Connecting: ['Authenticating', 'Reconnecting', 'Disconnected'],
  Authenticating: ['CharacterReady', 'Disconnected', 'Reconnecting'],
  CharacterReady: ['InWorld', 'Disconnected', 'Reconnecting'],
  InWorld: ['Reconnecting', 'Disconnected'],
  Reconnecting: ['InWorld', 'Disconnected'],
  Disconnected: ['Connecting'],
}

export class AppStateStore {
  private current: WebClientAppState = 'Boot'

  get value(): WebClientAppState {
    return this.current
  }

  transition(next: WebClientAppState): void {
    if (!validTransitions[this.current].includes(next)) {
      throw new Error(`Invalid state transition: ${this.current} -> ${next}`)
    }
    this.current = next
  }
}
