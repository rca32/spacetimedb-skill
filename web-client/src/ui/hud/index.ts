export class HudLayer {
  private readonly root: HTMLDivElement
  private readonly statusLine: HTMLDivElement
  private readonly movementLine: HTMLDivElement
  private readonly combatLine: HTMLDivElement
  private readonly outcomeLine: HTMLDivElement

  constructor(container: HTMLElement) {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.inset = '0'
    this.root.style.pointerEvents = 'none'
    this.root.style.padding = '12px'

    const panel = document.createElement('div')
    panel.style.display = 'inline-flex'
    panel.style.flexDirection = 'column'
    panel.style.gap = '4px'
    panel.style.padding = '10px 12px'
    panel.style.borderRadius = '10px'
    panel.style.background = 'rgba(8, 12, 18, 0.72)'
    panel.style.border = '1px solid rgba(124, 170, 226, 0.35)'
    panel.style.color = '#d8e6ff'
    panel.style.fontSize = '12px'
    panel.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace'

    this.statusLine = document.createElement('div')
    this.movementLine = document.createElement('div')
    this.combatLine = document.createElement('div')
    this.outcomeLine = document.createElement('div')

    panel.appendChild(this.statusLine)
    panel.appendChild(this.movementLine)
    panel.appendChild(this.combatLine)
    panel.appendChild(this.outcomeLine)
    this.root.appendChild(panel)

    this.setStatus('booting')
    this.setMovement('n/a')
    this.setCombat('n/a')
    this.setAttackOutcome('n/a')
    container.appendChild(this.root)
  }

  setStatus(text: string): void {
    this.statusLine.textContent = `STATE: ${text}`
  }

  setMovement(text: string): void {
    this.movementLine.textContent = `MOVE: ${text}`
  }

  setCombat(text: string): void {
    this.combatLine.textContent = `COMBAT: ${text}`
  }

  setAttackOutcome(text: string): void {
    this.outcomeLine.textContent = `OUTCOME: ${text}`
  }

  destroy(): void {
    this.root.remove()
  }
}
