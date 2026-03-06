import { bootstrap } from './app/bootstrap'
import './styles.css'

declare global {
  interface Window {
    __stitchBabylonDispose?: () => void
    __stitchBabylonBootId?: number
  }
}

window.__stitchBabylonDispose?.()
window.__stitchBabylonDispose = undefined

const bootId = (window.__stitchBabylonBootId ?? 0) + 1
window.__stitchBabylonBootId = bootId

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (window.__stitchBabylonBootId === bootId) {
      window.__stitchBabylonBootId = bootId + 1
    }
    window.__stitchBabylonDispose?.()
    window.__stitchBabylonDispose = undefined
  })
}

void bootstrap(document.getElementById('app'))
  .then((dispose) => {
    if (window.__stitchBabylonBootId !== bootId) {
      dispose()
      return
    }
    window.__stitchBabylonDispose = dispose
  })
  .catch((error: unknown) => {
    console.error('[stitch-babylon-client] bootstrap failed', error)
    const root = document.getElementById('app')
    if (!root) {
      return
    }
    const panel = document.createElement('pre')
    panel.className = 'fatal-panel'
    panel.textContent = `bootstrap failed\n\n${toErrorMessage(error)}`
    root.appendChild(panel)
  })

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  return String(error)
}
