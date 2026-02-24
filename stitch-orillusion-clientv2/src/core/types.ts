import type { Logger } from '../infra/logger'
import type { ClientV2Config } from '../infra/config'
import type { VerificationRuntime } from '../verification/verification-runtime'
import type { EventBus } from './event-bus'

export type RuntimeModuleName =
  | 'input'
  | 'net'
  | 'world'
  | 'physics'
  | 'animation'
  | 'fx'
  | 'audio'
  | 'render'
  | 'ui'
  | 'entity'

export type RuntimeFrameStage =
  | 'input'
  | 'net'
  | 'world'
  | 'physics'
  | 'animation'
  | 'fx'
  | 'audio'
  | 'ui'
  | 'render'

export interface RuntimeContext {
  root: HTMLElement
  logger: Logger
  config: ClientV2Config
  bus: EventBus
  verification: VerificationRuntime
  frameMs: number
}

export interface DomainRuntime {
  name: string
  init(ctx: RuntimeContext): Promise<void>
  update(dtMs: number, ctx: RuntimeContext): void
  dispose(): Promise<void>
}

export interface RuntimePerfSample {
  stage: RuntimeFrameStage
  dtMs: number
}
