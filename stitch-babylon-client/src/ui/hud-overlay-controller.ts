import type { Scene } from '@babylonjs/core/scene'
import { Control, Rectangle, StackPanel, TextBlock, AdvancedDynamicTexture } from '@babylonjs/gui'
import type { PresenterState } from '../runtime/types'
import type { NpcLogSnapshot } from '../world/mirror-store'

export class HudOverlayController {
  private readonly advancedTexture: AdvancedDynamicTexture
  private readonly hudPanel: Rectangle
  private readonly hudText: TextBlock
  private readonly promptText: TextBlock
  private readonly overlayRoot: HTMLDivElement
  private readonly dialoguePanel: HTMLElement
  private readonly statusStrip: HTMLDivElement
  private readonly dialogueTimeline: HTMLDivElement
  private readonly dialogueTextarea: HTMLTextAreaElement

  constructor(
    scene: Scene,
    root: HTMLElement,
    onSubmitDialogue: (utterance: string) => void,
  ) {
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('StitchHud', true, scene)
    this.hudPanel = new Rectangle('hudPanel')
    this.hudPanel.width = '360px'
    this.hudPanel.height = '220px'
    this.hudPanel.cornerRadius = 18
    this.hudPanel.color = 'rgba(255,255,255,0.14)'
    this.hudPanel.thickness = 1
    this.hudPanel.background = 'rgba(12,16,22,0.52)'
    this.hudPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
    this.hudPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    this.hudPanel.left = '18px'
    this.hudPanel.top = '18px'
    this.advancedTexture.addControl(this.hudPanel)

    const stack = new StackPanel('hudStack')
    stack.paddingLeft = '14px'
    stack.paddingRight = '14px'
    stack.paddingTop = '14px'
    stack.paddingBottom = '14px'
    stack.spacing = 10
    this.hudPanel.addControl(stack)

    this.hudText = new TextBlock('hudText')
    this.hudText.textWrapping = true
    this.hudText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT
    this.hudText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    this.hudText.color = '#f4ead7'
    this.hudText.fontSize = 16
    this.hudText.height = '176px'
    stack.addControl(this.hudText)

    this.promptText = new TextBlock('promptText')
    this.promptText.textWrapping = true
    this.promptText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
    this.promptText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
    this.promptText.color = '#f8d983'
    this.promptText.fontSize = 18
    this.promptText.height = '48px'
    this.promptText.top = '-22px'
    this.advancedTexture.addControl(this.promptText)

    this.overlayRoot = document.createElement('div')
    this.overlayRoot.className = 'dom-overlay'
    root.appendChild(this.overlayRoot)

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
    this.hudText.text = [
      'Stitch Babylon Client',
      `state: ${state.appState}`,
      `quality: ${state.qualityTier}`,
      `connection: ${state.connected ? 'connected' : 'disconnected'}`,
      `identity: ${state.identityHex ?? 'none'}`,
      `region/dimension: ${state.regionId.toString()}/${state.dimensionId}`,
      `fps: ${state.fps.toFixed(1)}`,
      `chunks: ${state.activeChunkCount}`,
      `assets: ${state.loadedAssetCount} loaded / ${state.pendingReviewAssetCount} review-pending`,
      `build: ${state.buildModeEnabled ? `on (facing ${state.buildFacing})` : 'off'}`,
      `preview: ${state.previewSummary}`,
      `target: ${state.targetSummary}`,
      `inventory: ${state.inventorySummary}`,
      `wallet: ${state.walletSummary}`,
      `diag: ${state.diagnosticsSummary}`,
    ].join('\n')

    this.promptText.text = state.prompt

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
    this.advancedTexture.dispose()
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
