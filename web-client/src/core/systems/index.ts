import { CoreWorld } from '../world'

export function runCoreSystems(world: CoreWorld): void {
  // Phase 1에서는 no-op. Phase 3부터 domain system을 연결한다.
  void world
}
