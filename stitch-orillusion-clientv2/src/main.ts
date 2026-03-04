import { CoreApp } from './core/core-app'
import './styles.css'
import type { TestReport } from './verification/verification-runtime'

declare global {
  interface Window {
    __testHarness?: {
      startScenario: (scenarioId: 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07') => Promise<void>
      runScenario: (scenarioId: 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07') => Promise<unknown>
      getReport: () => TestReport
      captureFrame: (tag: string) => Promise<{ path: string; kind: 'frame'; mime: string }>
      runSuite: (suiteId: 'all' | 'core') => Promise<unknown>
      exportArtifacts: () => Promise<void>
    }
    __testReport?: TestReport
    __stitchOrillusionClientV2BootId?: number
    __stitchOrillusionClientV2Dispose?: () => void
  }
}

let bootId = 0
const disposePrevious = window.__stitchOrillusionClientV2Dispose
disposePrevious?.()
bootId += 1
window.__stitchOrillusionClientV2BootId = bootId

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (window.__stitchOrillusionClientV2BootId === bootId) {
      window.__stitchOrillusionClientV2BootId = bootId + 1
    }
    window.__stitchOrillusionClientV2Dispose?.()
    window.__stitchOrillusionClientV2Dispose = undefined
  })
}

void CoreApp.boot(document.getElementById('app')).then((app) => {
  window.__stitchOrillusionClientV2Dispose = () => {
    void CoreApp.shutdown('hot-reload').catch(() => {})
  }
}).catch((error: unknown) => {
  console.error('[stitch-orillusion-clientv2] boot failed', error)
  const root = document.getElementById('app')
  if (!root) {
    return
  }
  root.innerHTML = `<pre style="color:#ff7a7a;padding:12px;font-family:monospace">boot failed\n\n${String(error)}</pre>`
})
