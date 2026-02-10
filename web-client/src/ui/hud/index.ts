export class HudLayer {
  private readonly root: HTMLDivElement

  constructor(container: HTMLElement) {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.inset = '0'
    this.root.style.pointerEvents = 'none'
    this.root.style.padding = '12px'
    this.root.textContent = 'HUD: booting'
    container.appendChild(this.root)
  }

  setStatus(text: string): void {
    this.root.textContent = `HUD: ${text}`
  }

  destroy(): void {
    this.root.remove()
  }
}
