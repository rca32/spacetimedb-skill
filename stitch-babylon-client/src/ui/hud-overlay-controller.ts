import type { Scene } from '@babylonjs/core/scene'
import type { PresenterState } from '../runtime/types'
import type { NpcLogSnapshot } from '../world/mirror-store'

export class HudOverlayController {
  private readonly overlayRoot: HTMLDivElement
  private readonly hudPanel: HTMLElement
  private readonly hudText: HTMLPreElement
  private readonly promptText: HTMLDivElement
  private readonly dialoguePanel: HTMLElement
  private readonly statusStrip: HTMLDivElement
  private readonly dialogueTimeline: HTMLDivElement
  private readonly dialogueTextarea: HTMLTextAreaElement

  constructor(
    scene: Scene,
    root: HTMLElement,
    onSubmitDialogue: (utterance: string) => void,
  ) {
    void scene

    this.overlayRoot = document.createElement('div')
    this.overlayRoot.className = 'dom-overlay'
    root.appendChild(this.overlayRoot)

    this.hudPanel = document.createElement('section')
    this.hudPanel.className = 'hud-panel'
    this.overlayRoot.appendChild(this.hudPanel)

    this.hudText = document.createElement('pre')
    this.hudText.className = 'hud-panel__text'
    this.hudPanel.appendChild(this.hudText)

    this.promptText = document.createElement('div')
    this.promptText.className = 'world-prompt'
    this.overlayRoot.appendChild(this.promptText)

    this.dialoguePanel = document.createElement('section')
    this.dialoguePanel.className = 'dialogue-panel'
    this.overlayRoot.appendChild(this.dialoguePanel)

    const title = document.createElement('h2')
    title.textContent = 'NPC / Session'
    this.dialoguePanel.appendChild(title)

    this.dialogueTimeline = document.createElement('div')
    this.dialoguePanel.appendChild(this.dialogueTimeline)

    const form = document.createElement('form')
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      const utterance = this.dialogueTextarea.value.trim()
      if (!utterance) {
        return
      }
      onSubmitDialogue(utterance)
      this.dialogueTextarea.value = ''
    })
    this.dialoguePanel.appendChild(form)

    this.dialogueTextarea = document.createElement('textarea')
    this.dialogueTextarea.placeholder = 'Type dialogue or chat intent'
    form.appendChild(this.dialogueTextarea)

    const submitButton = document.createElement('button')
    submitButton.type = 'submit'
    submitButton.textContent = 'Send'
    form.appendChild(submitButton)

    this.statusStrip = document.createElement('div')
    this.statusStrip.className = 'status-strip'
    this.overlayRoot.appendChild(this.statusStrip)
  }

  render(state: PresenterState, npcLogs: NpcLogSnapshot[]): void {
    this.hudText.textContent = [
      'Stitch Babylon Client',
      `state: ${state.appState} | quality: ${state.qualityTier}`,
      `connection: ${state.connected ? 'connected' : 'disconnected'}`,
      `identity: ${state.identityHex ?? 'none'}`,
      `region/dimension: ${state.regionId.toString()}/${state.dimensionId} | fps: ${state.fps.toFixed(1)}`,
      `chunks: ${state.activeChunkCount} | assets: ${state.loadedAssetCount} loaded / ${state.pendingReviewAssetCount} review-pending`,
      `build: ${state.buildModeEnabled ? `on (facing ${state.buildFacing})` : 'off'} | preview: ${state.previewSummary}`,
      `target: ${state.targetSummary}`,
      `inventory: ${state.inventorySummary} | wallet: ${state.walletSummary}`,
      `diag: ${state.diagnosticsSummary}`,
    ].join('\n')

    this.promptText.textContent = state.prompt

    this.dialogueTimeline.innerHTML = [
      `<p><strong>Dialogue</strong>: ${escapeHtml(state.dialogueSummary)}</p>`,
      `<p><strong>Target</strong>: ${escapeHtml(state.targetSummary)}</p>`,
      `<p><strong>Preview</strong>: ${escapeHtml(state.previewSummary)}</p>`,
      ...npcLogs.slice(-6).map((entry) => {
        return `<p><strong>${escapeHtml(entry.interactionKey)}</strong> ${escapeHtml(entry.detail)}</p>`
      }),
    ].join('')

    this.statusStrip.innerHTML = ''
    const chips = [
      `state ${state.appState}`,
      `tier ${state.qualityTier}`,
      state.connected ? 'live connection' : 'recovering',
      `fps ${state.fps.toFixed(0)}`,
      `chunks ${state.activeChunkCount}`,
      state.buildModeEnabled ? 'build mode' : 'world mode',
    ]
    for (const label of chips) {
      const chip = document.createElement('span')
      chip.className = 'status-chip'
      chip.textContent = label
      this.statusStrip.appendChild(chip)
    }
  }

  dispose(): void {
    this.overlayRoot.remove()
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
