import { createPopper, type Instance, type Placement } from '@popperjs/core'

/**
 * `v-tooltip` — lightweight Popper-backed tooltip directive.
 *
 * Usage:
 *   <button v-tooltip="'Удалить'">✕</button>
 *   <span v-tooltip="{ content: multiLine, placement: 'top' }">…</span>
 *   <li v-tooltip="{ html: '<b>Rich</b>', placement: 'bottom' }">…</li>
 *
 * The bubble element is created lazily on first hover/focus and reused
 * for the lifetime of the host. `content` is plain text with `\n` line
 * breaks; `html` is trusted HTML (caller is responsible for escaping).
 *
 * Styling lives in `app/assets/css/tailwind.css` under `.app-tooltip`.
 */

type TooltipObject = {
  content?: string
  html?: string
  placement?: Placement
}
type TooltipValue = string | TooltipObject | null | undefined

interface Resolved {
  content: string
  html: string | null
  placement: Placement
}

interface TooltipState extends Resolved {
  bubble: HTMLElement
  popper: Instance | null
  onEnter: () => void
  onLeave: () => void
}

const states = new WeakMap<HTMLElement, TooltipState>()

function resolve(value: TooltipValue): Resolved {
  if (value == null) return { content: '', html: null, placement: 'top' }
  if (typeof value === 'string') return { content: value, html: null, placement: 'top' }
  return {
    content: value.content ?? '',
    html: value.html ?? null,
    placement: value.placement ?? 'top',
  }
}

function buildBubble(): HTMLElement {
  const bubble = document.createElement('div')
  bubble.className = 'app-tooltip'
  bubble.setAttribute('role', 'tooltip')
  const inner = document.createElement('div')
  inner.className = 'app-tooltip__content'
  bubble.appendChild(inner)
  const arrow = document.createElement('div')
  arrow.className = 'app-tooltip__arrow'
  arrow.setAttribute('data-popper-arrow', '')
  bubble.appendChild(arrow)
  return bubble
}

function show(el: HTMLElement) {
  const state = states.get(el)
  if (!state) return
  if (!state.content && !state.html) return
  const inner = state.bubble.firstElementChild as HTMLElement
  if (state.html != null) {
    inner.innerHTML = state.html
  } else {
    inner.textContent = state.content
  }
  document.body.appendChild(state.bubble)
  state.bubble.setAttribute('data-show', '')
  state.popper = createPopper(el, state.bubble, {
    placement: state.placement,
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'preventOverflow', options: { padding: 8 } },
      { name: 'flip', options: { padding: 8 } },
      { name: 'arrow', options: { padding: 6 } },
    ],
  })
}

function hide(el: HTMLElement) {
  const state = states.get(el)
  if (!state) return
  state.bubble.removeAttribute('data-show')
  if (state.popper) {
    state.popper.destroy()
    state.popper = null
  }
  if (state.bubble.parentElement) {
    state.bubble.parentElement.removeChild(state.bubble)
  }
}

function bind(el: HTMLElement, value: TooltipValue) {
  const resolved = resolve(value)
  const bubble = buildBubble()
  const state: TooltipState = {
    ...resolved,
    bubble,
    popper: null,
    onEnter: () => show(el),
    onLeave: () => hide(el),
  }
  states.set(el, state)
  el.addEventListener('mouseenter', state.onEnter)
  el.addEventListener('mouseleave', state.onLeave)
  el.addEventListener('focus', state.onEnter)
  el.addEventListener('blur', state.onLeave)
}

function update(el: HTMLElement, value: TooltipValue) {
  const state = states.get(el)
  if (!state) {
    bind(el, value)
    return
  }
  const resolved = resolve(value)
  state.content = resolved.content
  state.html = resolved.html
  state.placement = resolved.placement
  if (state.popper) {
    const inner = state.bubble.firstElementChild as HTMLElement
    if (resolved.html != null) inner.innerHTML = resolved.html
    else inner.textContent = resolved.content
    state.popper.setOptions(opts => ({ ...opts, placement: resolved.placement }))
    void state.popper.update()
  }
}

function unbind(el: HTMLElement) {
  const state = states.get(el)
  if (!state) return
  hide(el)
  el.removeEventListener('mouseenter', state.onEnter)
  el.removeEventListener('mouseleave', state.onLeave)
  el.removeEventListener('focus', state.onEnter)
  el.removeEventListener('blur', state.onLeave)
  states.delete(el)
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive<HTMLElement, TooltipValue>('tooltip', {
    mounted(el, binding) {
      bind(el, binding.value)
    },
    updated(el, binding) {
      update(el, binding.value)
    },
    beforeUnmount(el) {
      unbind(el)
    },
  })
})
