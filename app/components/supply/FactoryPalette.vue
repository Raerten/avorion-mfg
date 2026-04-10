<script setup lang="ts">
import { computed, ref } from 'vue'
import Fuse from 'fuse.js'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_GROUPS, CATEGORY_STYLES } from '~/lib/categories'
import { goodIconUrl } from '~/lib/icons'
import type { Factory, FactoryCategory } from '~/types/factory'
import {
  FACTORY_SIZES,
  buildCost,
  formatCredits,
  upgradeCost,
} from '~/lib/factoryCost'
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

function costSectionHtml(factory: Factory): string {
  const build = formatCredits(buildCost(factory, getGood))
  return (
    '<div class="app-tooltip__costs">' +
    '<div class="app-tooltip__cost-row">' +
    '<span class="app-tooltip__title">Постройка</span>' +
    `<span class="app-tooltip__cost-value">${escapeHtml(build)}</span>` +
    '</div>'
  )
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
    '</div>' +
    costSectionHtml(factory)
}

const query = ref('')
const searchFocused = ref(false)
const searchInput = ref<HTMLInputElement>()

interface PaletteItem {
  factory: Factory
  matchName: boolean
  matchedInputGoodId: string | null
  matchedOutputGoodId: string | null
}

/**
 * Flattened search record per factory so Fuse can score name / input /
 * output matches independently. `inputGoodIds` / `outputGoodIds` keep
 * positional parity with the name arrays so we can map a matched index
 * back to the actual good id.
 */
interface SearchRecord {
  factory: Factory
  name: string
  inputNames: string[]
  outputNames: string[]
  inputGoodIds: string[]
  outputGoodIds: string[]
}

const searchRecords = computed<SearchRecord[]>(() =>
  factories.map(f => {
    const inputGoodIds = f.inputs.map(i => i.goodId)
    const outputGoodIds = f.outputs.map(o => o.goodId)
    return {
      factory: f,
      name: f.name,
      inputNames: inputGoodIds.map(id => getGood(id)?.name ?? id),
      outputNames: outputGoodIds.map(id => getGood(id)?.name ?? id),
      inputGoodIds,
      outputGoodIds,
    }
  }),
)

const fuse = computed(
  () =>
    new Fuse(searchRecords.value, {
      includeMatches: true,
      ignoreLocation: true,
      threshold: 0.2,
      minMatchCharLength: 2,
      keys: [
        { name: 'name', weight: 2 },
        { name: 'outputNames', weight: 1 },
        { name: 'inputNames', weight: 0.8 },
      ],
    }),
)

/**
 * Run fuzzy search and fold results into `PaletteItem`s. The Fuse match
 * metadata tells us *which* key hit (name / inputNames / outputNames)
 * and — for array keys — the index, which we use to recover the exact
 * good id that matched.
 */
const matchedItems = computed<PaletteItem[]>(() => {
  const q = query.value.trim()
  if (!q) {
    return searchRecords.value.map(r => ({
      factory: r.factory,
      matchName: false,
      matchedInputGoodId: null,
      matchedOutputGoodId: null,
    }))
  }
  return fuse.value.search(q).map(result => {
    let matchName = false
    let matchedInputGoodId: string | null = null
    let matchedOutputGoodId: string | null = null
    for (const m of result.matches ?? []) {
      if (m.key === 'name') {
        matchName = true
      } else if (m.key === 'inputNames' && typeof m.refIndex === 'number') {
        matchedInputGoodId ??= result.item.inputGoodIds[m.refIndex] ?? null
      } else if (m.key === 'outputNames' && typeof m.refIndex === 'number') {
        matchedOutputGoodId ??= result.item.outputGoodIds[m.refIndex] ?? null
      }
    }
    return {
      factory: result.item.factory,
      matchName,
      matchedInputGoodId,
      matchedOutputGoodId,
    }
  })
})

const byCategory = computed(() => {
  const hasQuery = query.value.trim().length > 0
  const groups: { title: string; category: FactoryCategory; items: PaletteItem[] }[] = []
  for (const group of CATEGORY_GROUPS) {
    const cat = group.categories[0]!
    const items = matchedItems.value.filter(item => item.factory.category === cat)
    if (!hasQuery) {
      items.sort((a, b) => a.factory.name.localeCompare(b.factory.name, 'ru'))
    }
    // When a query is active we keep Fuse's score-based order.
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
      <div class="group/search relative">
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Поиск…"
          class="w-full h-8 px-2 pr-7 rounded border border-border bg-background text-sm outline-none focus:border-ring"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
        >
        <button
          v-if="query"
          type="button"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover/search:opacity-100 transition-opacity"
          :class="{ 'opacity-100': searchFocused }"
          @click="query = ''; searchInput?.focus()"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        </button>
      </div>
      <p class="text-[11px] text-muted-foreground leading-snug">
        Перетащите фабрику на схему или кликните по слоту входа/выхода существующей фабрики, чтобы добавить связанную.
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
            v-for="item in group.items"
            :key="item.factory.id"
            :draggable="true"
            v-tooltip="{ html: inputsTooltipHtml(item.factory), placement: 'bottom' }"
            :class="[
              'group px-2 py-1 rounded text-sm cursor-grab active:cursor-grabbing border border-transparent hover:border-border hover:bg-muted flex items-center gap-2',
              item.matchName ? 'font-bold' : '',
              !item.matchName && (item.matchedInputGoodId || item.matchedOutputGoodId) ? 'opacity-70 hover:opacity-100' : '',
            ]"
            @dragstart="onDragStart($event, item.factory.id)"
          >
            <GoodIcon
              v-if="item.factory.outputs[0]"
              :good-id="item.factory.outputs[0].goodId"
              class="w-4 h-4 shrink-0 opacity-80 group-hover:opacity-100"
            />
            <span class="truncate flex-1">{{ item.factory.name }}</span>
            <span
              v-if="!item.matchName && item.matchedInputGoodId"
              class="shrink-0 inline-flex items-center gap-1 h-5 pl-1 pr-1.5 rounded bg-cyan-500/10 ring-1 ring-cyan-500/40 text-[9px] font-mono uppercase tracking-wider text-cyan-300"
              :title="`Используется как вход: ${getGood(item.matchedInputGoodId)?.name ?? item.matchedInputGoodId}`"
            >
              <GoodIcon :good-id="item.matchedInputGoodId" class="w-3.5 h-3.5" />
              вх
            </span>
            <span
              v-if="!item.matchName && item.matchedOutputGoodId"
              class="shrink-0 inline-flex items-center gap-1 h-5 pl-1 pr-1.5 rounded bg-amber-500/10 ring-1 ring-amber-500/40 text-[9px] font-mono uppercase tracking-wider text-amber-300"
              :title="`Производится как выход: ${getGood(item.matchedOutputGoodId)?.name ?? item.matchedOutputGoodId}`"
            >
              <GoodIcon :good-id="item.matchedOutputGoodId" class="w-3.5 h-3.5" />
              вых
            </span>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>
