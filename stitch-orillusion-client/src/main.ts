import { bootstrap } from './app/bootstrap'
import './styles.css'

declare global {
  interface Window {
    __stitchOrillusionDispose?: () => void
    __stitchOrillusionBootId?: number
  }
}

window.__stitchOrillusionDispose?.()
window.__stitchOrillusionDispose = undefined

const bootId = (window.__stitchOrillusionBootId ?? 0) + 1
window.__stitchOrillusionBootId = bootId

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (window.__stitchOrillusionBootId === bootId) {
      window.__stitchOrillusionBootId = bootId + 1
    }
    window.__stitchOrillusionDispose?.()
    window.__stitchOrillusionDispose = undefined
  })
}

void bootstrap(document.getElementById('app'))
  .then((dispose) => {
    if (window.__stitchOrillusionBootId !== bootId) {
      dispose()
      return
    }
    window.__stitchOrillusionDispose = dispose
  })
  .catch((error: unknown) => {
    console.error('[stitch-orillusion-client] bootstrap failed', error)

    const root = document.getElementById('app')
    if (!root) {
      return
    }

    const panel = document.createElement('pre')
    panel.className = 'hud'
    panel.textContent = `bootstrap failed\\n\\n${toErrorMessage(error)}`
    root.appendChild(panel)
  })

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  return String(error)
}
