<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_GROUPS, CATEGORY_STYLES } from '~/lib/categories'
import { goodIconUrl } from '~/lib/icons'
import type { Factory, FactoryCategory } from '~/types/factory'
import GoodIcon from '~/components/GoodIcon.vue'

/**
 * Left sidebar palette of all factories, grouped by category.
 *
 * Each row is draggable — `dragstart` sets a custom mime type that the
 * canvas reads on drop to know which factory to spawn. Drag is the only
 * way to add: clicks are intentionally inert so users don't accidentally
 * spawn nodes when scanning the list.
 */

const { factories, getGood } = useGameData()

/**
 * Rich popper tooltip listing a factory's input goods as a column with
 * an icon next to each name. Rendered as trusted HTML — all values here
 * come from bundled game data so there's no user input to escape beyond
 * a few characters for safety.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function goodRowHtml(goodId: string, optional?: boolean): string {
  const name = escapeHtml(getGood(goodId)?.name ?? goodId)
  const url = escapeHtml(goodIconUrl(goodId))
  const opt = optional
    ? '<span class="app-tooltip__muted">опц.</span>'
    : ''
  return `<li class="app-tooltip__row${optional ? ' is-optional' : ''}">` +
    `<img class="app-tooltip__icon" src="${url}" alt="" />` +
    `<span class="app-tooltip__name">${name}</span>${opt}</li>`
}

function columnHtml(title: string, emptyLabel: string, rowsHtml: string): string {
  const body = rowsHtml
    ? `<ul class="app-tooltip__list">${rowsHtml}</ul>`
    : `<div class="app-tooltip__muted">${emptyLabel}</div>`
  return `<div class="app-tooltip__col">` +
    `<div class="app-tooltip__title">${title}</div>${body}</div>`
}

function inputsTooltipHtml(factory: Factory): string {
  const inputsRows = factory.inputs
    .map(inp => goodRowHtml(inp.goodId, inp.optional))
    .join('')
  const outputsRows = factory.outputs
    .map(out => goodRowHtml(out.goodId))
    .join('')
  return '<div class="app-tooltip__cols">' +
    columnHtml('Входы', 'Без входов', inputsRows) +
    columnHtml('Выходы', 'Без выходов', outputsRows) +
    '</div>'
}

const query = ref('')

const byCategory = computed(() => {
  const q = query.value.trim().toLowerCase()
  const groups: { title: string; category: FactoryCategory; items: Factory[] }[] = []
  for (const group of CATEGORY_GROUPS) {
    const cat = group.categories[0]!
    const items = factories
      .filter(f => f.category === cat)
      .filter(f => !q || f.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    if (items.length > 0) {
      groups.push({ title: group.title, category: cat, items })
    }
  }
  return groups
})

function onDragStart(event: DragEvent, factoryId: string) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('application/x-avorion-factory', factoryId)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="w-72 shrink-0 h-full border-r border-border bg-card/40 backdrop-blur flex flex-col">
    <div class="px-3 py-3 border-b border-border space-y-2">
      <h2 class="text-xs font-mono uppercase tracking-wider text-muted-foreground">Фабрики</h2>
      <input
        v-model="query"
        type="search"
        placeholder="Поиск…"
        class="w-full h-8 px-2 rounded border border-border bg-background text-sm outline-none focus:border-ring"
      >
      <p class="text-[11px] text-muted-foreground leading-snug">
        Перетащите фабрику на холст или кликните по слоту входа/выхода существующей фабрики, чтобы добавить связанную.
      </p>
      <p class="text-[11px] text-muted-foreground/70 leading-snug">
        Двойной клик по связи или Delete удаляет её.
      </p>
    </div>

    <div class="flex-1 overflow-y-auto px-2 py-2 space-y-3">
      <div v-for="group in byCategory" :key="group.category">
        <div class="flex items-center gap-2 px-1 py-1">
          <span class="w-2 h-2 rounded-full" :class="CATEGORY_STYLES[group.category].dot" />
          <span class="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {{ group.title }}
          </span>
        </div>
        <ul class="space-y-0.5">
          <li
            v-for="f in group.items"
            :key="f.id"
            :draggable="true"
            v-tooltip="{ html: inputsTooltipHtml(f), placement: 'bottom' }"
            class="group px-2 py-1 rounded text-sm cursor-grab active:cursor-grabbing border border-transparent hover:border-border hover:bg-muted flex items-center gap-2"
            @dragstart="onDragStart($event, f.id)"
          >
            <GoodIcon
              v-if="f.outputs[0]"
              :good-id="f.outputs[0].goodId"
              class="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100"
            />
            <span class="truncate">{{ f.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>
