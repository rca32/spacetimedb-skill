import type { NpcActionRequestState, NpcDialogueTimelineEntry } from '../npc/types'

interface NpcDialoguePanelRenderData {
  readonly nearestNpcId: string | null
  readonly nearestNpcDistance: number | null
  readonly states: readonly NpcActionRequestState[]
  readonly timeline: readonly NpcDialogueTimelineEntry[]
  readonly canInteract: boolean
  readonly systemMessage: string | null
}

interface NpcDialoguePanelOptions {
  readonly onSubmitDialogue: (utterance: string) => void
}

const MAX_STATE_PREVIEW = 8

export class NpcDialoguePanel {
  private readonly root: HTMLDivElement
  private readonly nearestEl: HTMLDivElement
  private readonly statusEl: HTMLDivElement
  private readonly statesList: HTMLUListElement
  private readonly timelineList: HTMLUListElement
  private readonly form: HTMLFormElement
  private readonly input: HTMLInputElement
  private readonly button: HTMLButtonElement
  private readonly onSubmitDialogue: (utterance: string) => void

  private currentSystemMessage: string | null = null
  private currentCanInteract = false

  constructor(root: HTMLElement, options: NpcDialoguePanelOptions) {
    this.onSubmitDialogue = options.onSubmitDialogue

    this.root = document.createElement('div')
    this.root.className = 'npc-dialogue-panel'

    const title = document.createElement('div')
    title.className = 'npc-dialogue-panel-title'
    title.textContent = 'NPC Interaction'

    this.nearestEl = document.createElement('div')
    this.nearestEl.className = 'npc-dialogue-panel-nearest'

    this.statusEl = document.createElement('div')
    this.statusEl.className = 'npc-dialogue-panel-status'

    const stateBlock = document.createElement('div')
    stateBlock.className = 'npc-dialogue-panel-block'
    const stateTitle = document.createElement('div')
    stateTitle.className = 'npc-dialogue-panel-section-title'
    stateTitle.textContent = '최근 요청'
    this.statesList = document.createElement('ul')
    this.statesList.className = 'npc-dialogue-panel-list'
    stateBlock.appendChild(stateTitle)
    stateBlock.appendChild(this.statesList)

    const timelineBlock = document.createElement('div')
    timelineBlock.className = 'npc-dialogue-panel-block'
    const timelineTitle = document.createElement('div')
    timelineTitle.className = 'npc-dialogue-panel-section-title'
    timelineTitle.textContent = '대화 패널'
    this.timelineList = document.createElement('ul')
    this.timelineList.className = 'npc-dialogue-panel-list'
    timelineBlock.appendChild(timelineTitle)
    timelineBlock.appendChild(this.timelineList)

    this.form = document.createElement('form')
    this.form.className = 'npc-dialogue-panel-form'
    this.form.addEventListener('submit', this.handleSubmit)

    this.input = document.createElement('input')
    this.input.type = 'text'
    this.input.placeholder = '대화 내용을 입력하고 Enter'
    this.input.autocomplete = 'off'
    this.input.maxLength = 200

    this.button = document.createElement('button')
    this.button.type = 'submit'
    this.button.textContent = 'Send'

    this.form.append(this.input, this.button)

    const hint = document.createElement('div')
    hint.className = 'npc-dialogue-panel-hint'
    hint.textContent = 'T:대화, Y:거래, U:퀘스트, Enter:대화 입력'

    this.root.append(
      title,
      this.nearestEl,
      this.statusEl,
      stateBlock,
      timelineBlock,
      this.form,
      hint,
    )

    root.appendChild(this.root)
  }

  render(data: NpcDialoguePanelRenderData): void {
    this.currentCanInteract = data.canInteract
    this.currentSystemMessage = data.systemMessage

    this.nearestEl.textContent = data.nearestNpcId
      ? `근접 NPC: ${data.nearestNpcId} / 거리 ${data.nearestNpcDistance?.toFixed(2) ?? '-'} `
      : '근접 NPC: 없음'

    this.statusEl.textContent = data.systemMessage ?? (data.canInteract
      ? '입력: T/Talk, Y/Trade, U/Quest, Enter 대화'
      : '요청을 사용할 수 없습니다. 연결/거리/권한을 확인하세요.')

    const states = [...data.states]
      .slice(0, MAX_STATE_PREVIEW)

    this.statesList.textContent = ''
    for (const state of states) {
      const item = document.createElement('li')
      const statusClass = `npc-status-${state.status}`
      const text = `${state.kind} [${state.status}] npc=${state.npcId.toString()}`
      const detail = state.detail ? ` - ${state.detail}` : ''
      item.className = `npc-dialogue-panel-item ${statusClass}`
      item.textContent = `${text}${detail}`
      this.statesList.appendChild(item)
    }
    if (states.length === 0) {
      const item = document.createElement('li')
      item.className = 'npc-dialogue-panel-item'
      item.textContent = '요청 기록 없음'
      this.statesList.appendChild(item)
    }

    this.timelineList.textContent = ''
    for (const event of data.timeline) {
      const item = document.createElement('li')
      const statusClass = `npc-status-${event.status}`
      item.className = `npc-dialogue-panel-item ${statusClass}`
      item.textContent = `[${event.speaker}] ${event.text}`
      this.timelineList.appendChild(item)
    }
    if (data.timeline.length === 0) {
      const item = document.createElement('li')
      item.className = 'npc-dialogue-panel-item'
      item.textContent = '타임라인 없음'
      this.timelineList.appendChild(item)
    }

    this.setInteractionEnabled(data.canInteract)
  }

  setInteractionEnabled(enabled: boolean): void {
    this.form.toggleAttribute('aria-disabled', !enabled)
    this.input.disabled = !enabled
    this.button.disabled = !enabled
    this.currentCanInteract = enabled
  }

  dispose(): void {
    this.form.removeEventListener('submit', this.handleSubmit)
    this.root.remove()
  }

  private readonly handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    if (!this.currentCanInteract) {
      return
    }

    const utterance = this.input.value.trim()
    if (!utterance) {
      return
    }

    this.onSubmitDialogue(utterance)
    this.input.value = ''
  }
}
