import { bootstrap } from './app/bootstrap'
import './styles.css'

declare global {
  interface Window {
    __stitchOrillusionDispose?: () => void
  }
}

window.__stitchOrillusionDispose?.()
window.__stitchOrillusionDispose = undefined

void bootstrap(document.getElementById('app'))
  .then((dispose) => {
    window.__stitchOrillusionDispose = dispose

    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        window.__stitchOrillusionDispose?.()
        window.__stitchOrillusionDispose = undefined
      })
    }
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
