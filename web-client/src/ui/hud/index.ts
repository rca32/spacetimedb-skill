export class HudLayer {
  private readonly root: HTMLDivElement
  private readonly statusLine: HTMLDivElement
  private readonly movementLine: HTMLDivElement
  private readonly syncErrorLine: HTMLDivElement
  private readonly syncDiagLine: HTMLDivElement
  private readonly combatLine: HTMLDivElement
  private readonly outcomeLine: HTMLDivElement
  private readonly regionLine: HTMLDivElement
  private readonly walletLine: HTMLDivElement
  private readonly priceLine: HTMLDivElement
  private readonly actionLine: HTMLDivElement
  private readonly chatLine: HTMLDivElement
  private readonly questLine: HTMLDivElement
  private readonly warningBanner: HTMLDivElement
  private readonly overlay: HTMLDivElement

  constructor(container: HTMLElement) {
    this.root = document.createElement('div')
    this.root.style.position = 'absolute'
    this.root.style.inset = '0'
    this.root.style.pointerEvents = 'none'
    this.root.style.setProperty('--hud-bg', 'rgba(6, 12, 20, 0.78)')
    this.root.style.setProperty('--hud-border', 'rgba(132, 173, 220, 0.35)')
    this.root.style.setProperty('--hud-text', '#dbe9ff')
    this.root.style.setProperty('--hud-accent', '#85b8ff')
    this.root.style.setProperty('--hud-warning', '#ffc36e')

    const topLeft = this.createBlock({ top: '12px', left: '12px' })
    this.statusLine = this.createLine(topLeft, 'STATE')
    this.movementLine = this.createLine(topLeft, 'MOVE')
    this.syncErrorLine = this.createLine(topLeft, 'SYNCERR')
    this.syncDiagLine = this.createLine(topLeft, 'SYNCDBG')
    this.combatLine = this.createLine(topLeft, 'COMBAT')

    const topRight = this.createBlock({ top: '12px', right: '12px' })
    this.regionLine = this.createLine(topRight, 'REGION')
    this.walletLine = this.createLine(topRight, 'WALLET')
    this.priceLine = this.createLine(topRight, 'PRICE')
    this.chatLine = this.createLine(topRight, 'CHAT')

    const bottomCenter = this.createBlock({ left: 'calc(50% - 160px)', bottom: '12px' })
    bottomCenter.style.width = '320px'
    this.actionLine = this.createLine(bottomCenter, 'ACTION')
    this.outcomeLine = this.createLine(bottomCenter, 'OUTCOME')

    const bottomLeft = this.createBlock({ left: '12px', bottom: '12px' })
    this.questLine = this.createLine(bottomLeft, 'QUEST')

    this.warningBanner = document.createElement('div')
    this.warningBanner.style.position = 'absolute'
    this.warningBanner.style.top = '12px'
    this.warningBanner.style.left = '50%'
    this.warningBanner.style.transform = 'translateX(-50%)'
    this.warningBanner.style.padding = '8px 12px'
    this.warningBanner.style.borderRadius = '10px'
    this.warningBanner.style.background = 'rgba(42, 24, 8, 0.9)'
    this.warningBanner.style.border = '1px solid rgba(255, 180, 92, 0.55)'
    this.warningBanner.style.color = 'var(--hud-warning)'
    this.warningBanner.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
    this.warningBanner.style.fontSize = '13px'
    this.warningBanner.style.display = 'none'

    this.overlay = document.createElement('div')
    this.overlay.style.position = 'absolute'
    this.overlay.style.inset = '0'
    this.overlay.style.display = 'none'
    this.overlay.style.placeItems = 'center'
    this.overlay.style.background = 'rgba(4, 8, 14, 0.55)'
    this.overlay.style.color = '#f0f6ff'
    this.overlay.style.fontFamily = 'IBM Plex Sans, Segoe UI, sans-serif'
    this.overlay.style.fontSize = '24px'
    this.overlay.style.fontWeight = '700'
    this.overlay.style.letterSpacing = '0.03em'

    this.root.appendChild(this.warningBanner)
    this.root.appendChild(this.overlay)
    container.appendChild(this.root)

    this.setStatus('booting')
    this.setRegion('unknown')
    this.setMovement('n/a')
    this.setSyncError('n/a')
    this.setSyncDiagnostics('n/a')
    this.setCombat('n/a')
    this.setAttackOutcome('n/a')
    this.setWallet('n/a')
    this.setPriceIndex('n/a')
    this.setActionBar('disabled')
    this.setChat('ready')
    this.setQuest('no objective')
  }

  setStatus(text: string): void {
    this.statusLine.textContent = `STATE  ${text}`
  }

  setRegion(text: string): void {
    this.regionLine.textContent = `REGION ${text}`
  }

  setMovement(text: string): void {
    this.movementLine.textContent = `MOVE   ${text}`
  }

  setWallet(text: string): void {
    this.walletLine.textContent = `WALLET ${text}`
  }

  setPriceIndex(text: string): void {
    this.priceLine.textContent = `PRICE  ${text}`
  }

  setSyncError(text: string): void {
    this.syncErrorLine.textContent = `SYNCERR ${text}`
  }

  setSyncDiagnostics(text: string): void {
    this.syncDiagLine.textContent = `SYNCDBG ${text}`
  }

  setCombat(text: string): void {
    this.combatLine.textContent = `COMBAT ${text}`
  }

  setAttackOutcome(text: string): void {
    this.outcomeLine.textContent = `OUTCOME ${text}`
  }

  setActionBar(text: string): void {
    this.actionLine.textContent = `ACTION ${text}`
  }

  setChat(text: string): void {
    this.chatLine.textContent = `CHAT   ${text}`
  }

  setQuest(text: string): void {
    this.questLine.textContent = `QUEST  ${text}`
  }

  setWarningBanner(message: string | null): void {
    if (!message) {
      this.warningBanner.style.display = 'none'
      this.warningBanner.textContent = ''
      return
    }
    this.warningBanner.style.display = 'block'
    this.warningBanner.textContent = message
  }

  setOverlay(message: string | null): void {
    if (!message) {
      this.overlay.style.display = 'none'
      this.overlay.textContent = ''
      return
    }
    this.overlay.style.display = 'grid'
    this.overlay.textContent = message
  }

  destroy(): void {
    this.root.remove()
  }

  private createBlock(options: { top?: string; right?: string; left?: string; bottom?: string }): HTMLDivElement {
    const block = document.createElement('div')
    block.style.position = 'absolute'
    if (options.top !== undefined) {
      block.style.top = options.top
    }
    if (options.right !== undefined) {
      block.style.right = options.right
    }
    if (options.left !== undefined) {
      block.style.left = options.left
    }
    if (options.bottom !== undefined) {
      block.style.bottom = options.bottom
    }
    block.style.display = 'flex'
    block.style.flexDirection = 'column'
    block.style.gap = '6px'
    block.style.padding = '10px 12px'
    block.style.borderRadius = '12px'
    block.style.background = 'var(--hud-bg)'
    block.style.border = '1px solid var(--hud-border)'
    block.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.24)'
    this.root.appendChild(block)
    return block
  }

  private createLine(parent: HTMLElement, label: string): HTMLDivElement {
    const line = document.createElement('div')
    line.textContent = `${label} ...`
    line.style.color = 'var(--hud-text)'
    line.style.fontSize = '12px'
    line.style.fontFamily = 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace'
    line.style.letterSpacing = '0.02em'
    parent.appendChild(line)
    return line
  }
}
