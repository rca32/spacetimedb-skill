export class PanelLayer {
  private readonly root: HTMLDivElement
  private readonly summaryLine: HTMLDivElement
  private readonly modeLine: HTMLDivElement

  constructor(container: HTMLElement) {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.right = '12px'
    this.root.style.bottom = '12px'
    this.root.style.padding = '10px 12px'
    this.root.style.background = 'rgba(8, 14, 24, 0.78)'
    this.root.style.border = '1px solid rgba(126, 169, 216, 0.45)'
    this.root.style.borderRadius = '12px'
    this.root.style.backdropFilter = 'blur(2px)'
    this.root.style.pointerEvents = 'none'

    this.summaryLine = document.createElement('div')
    this.summaryLine.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
    this.summaryLine.style.color = '#dce9fb'
    this.summaryLine.style.fontSize = '12px'

    this.modeLine = document.createElement('div')
    this.modeLine.style.marginTop = '4px'
    this.modeLine.style.fontFamily = 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    this.modeLine.style.color = '#89b9ff'
    this.modeLine.style.fontSize = '11px'

    this.root.appendChild(this.summaryLine)
    this.root.appendChild(this.modeLine)
    container.appendChild(this.root)

    this.setText('inactive')
    this.setReadOnly(true)
  }

  setText(text: string): void {
    this.summaryLine.textContent = `Panels: ${text}`
  }

  setReadOnly(readOnly: boolean): void {
    this.modeLine.textContent = readOnly ? 'MODE: READ-ONLY' : 'MODE: INTERACTIVE'
    this.modeLine.style.color = readOnly ? '#f4bf68' : '#89d6a4'
  }

  destroy(): void {
    this.root.remove()
  }
}
