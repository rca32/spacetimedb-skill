export class PanelLayer {
  private readonly root: HTMLDivElement

  constructor(container: HTMLElement) {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.right = '12px'
    this.root.style.bottom = '12px'
    this.root.style.padding = '8px 10px'
    this.root.style.background = 'rgba(12, 18, 28, 0.66)'
    this.root.style.border = '1px solid rgba(120, 162, 214, 0.4)'
    this.root.style.borderRadius = '8px'
    this.root.style.fontSize = '12px'
    this.root.textContent = 'Panels: inactive'
    container.appendChild(this.root)
  }

  setText(text: string): void {
    this.root.textContent = `Panels: ${text}`
  }

  destroy(): void {
    this.root.remove()
  }
}
