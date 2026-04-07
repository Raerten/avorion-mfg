<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useVueFlow, type Connection, type NodeProps } from '@vue-flow/core'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'
import type { FactoryNodeData } from '~/composables/useSupplyChain'
import GoodIcon from '~/components/GoodIcon.vue'

/**
 * Custom vue-flow node that renders a factory's recipe: inputs on the
 * left (target handles) and outputs on the right (source handles).
 *
 * Each handle id is `in-<goodId>` / `out-<goodId>` so edges carry the
 * semantic of which good flows across the connection.
 *
 * Clicking any input/output label emits `pick` to let the parent open
 * a contextual picker that adds a connected factory for that good.
 */

const props = defineProps<NodeProps<{ factoryId: string; lines: number }>>()

const emit = defineEmits<{
  pick: [payload: { nodeId: string; direction: 'in' | 'out'; goodId: string }]
  remove: [nodeId: string]
}>()

const { getFactory, getGood } = useGameData()
const { edges: allEdges, nodes: allNodes } = useVueFlow()

const factory = computed(() => getFactory(props.data.factoryId))
const style = computed(() => (factory.value ? CATEGORY_STYLES[factory.value.category] : null))

// Strip the hover: classes from the shared chip style — we don't want
// the whole node to shift colors on hover like a small pill does.
const frameClass = computed(() =>
  style.value ? style.value.chip.replace(/hover:[^\s]+/g, '').trim() : '',
)

function goodName(id: string) {
  return getGood(id)?.name ?? id
}

/**
 * Per-hour rate for a recipe slot, scaled by the configured number of
 * production lines. Avorion's real cycle time depends on assembly block
 * capacity; we model the JSON `cycleSeconds` as the baseline.
 */
function ratePerHour(amount: number): number {
  if (!factory.value) return 0
  const lines = Math.max(1, Math.floor(props.data.lines ?? 1))
  return (amount * 3600 / factory.value.cycleSeconds) * lines
}

function formatRate(n: number): string {
  if (n >= 100) return n.toFixed(0)
  if (n >= 10) return n.toFixed(1)
  return n.toFixed(2)
}

/**
 * Sum the per-hour rate of all upstream factories feeding `goodId` into
 * this node. Walks the edges that target our matching `in-<goodId>`
 * handle, and uses each source node's factory + line count to compute
 * what it actually delivers.
 */
function suppliedRate(goodId: string): number {
  const handle = 'in-' + goodId
  let total = 0
  for (const e of allEdges.value) {
    if (e.target !== props.id || e.targetHandle !== handle) continue
    const src = allNodes.value.find(n => n.id === e.source)
    if (!src) continue
    const srcData = src.data as FactoryNodeData | undefined
    if (!srcData) continue
    const srcFactory = getFactory(srcData.factoryId)
    if (!srcFactory) continue
    const out = srcFactory.outputs.find(o => o.goodId === goodId)
    if (!out) continue
    const lines = Math.max(1, Math.floor(srcData.lines ?? 1))
    total += (out.amount * 3600 / srcFactory.cycleSeconds) * lines
  }
  return total
}

/**
 * Compares this node's required input rate against what upstream
 * factories actually deliver. Returns:
 *   'none'  — no incoming edges yet, no judgement
 *   'short' — supply is below demand (red)
 *   'over'  — supply exceeds demand (yellow)
 *   'ok'    — supply matches demand within rounding (green)
 */
function inputStatus(goodId: string, amount: number): 'none' | 'short' | 'over' | 'ok' {
  const handle = 'in-' + goodId
  const hasConnection = allEdges.value.some(
    e => e.target === props.id && e.targetHandle === handle,
  )
  if (!hasConnection) return 'none'
  const need = ratePerHour(amount)
  const have = suppliedRate(goodId)
  const eps = Math.max(need * 0.005, 0.01)
  if (have + eps < need) return 'short'
  if (have - eps > need) return 'over'
  return 'ok'
}

function setLines(value: number) {
  const n = Math.max(1, Math.floor(value || 1))
  // Mutating props.data is the documented way to update vue-flow node data;
  // the store reacts and our autosave watcher picks it up.
  props.data.lines = n
}

/**
 * A connection is only valid when both ends carry the *same* good.
 * Handle ids are `out-<goodId>` / `in-<goodId>`, so we extract and
 * compare the goodId portion. Reject self-loops while we're at it.
 */
function isValidConnection(connection: Connection): boolean {
  if (connection.source === connection.target) return false
  const src = connection.sourceHandle?.startsWith('out-')
    ? connection.sourceHandle.slice(4)
    : null
  const tgt = connection.targetHandle?.startsWith('in-')
    ? connection.targetHandle.slice(3)
    : null
  return !!src && !!tgt && src === tgt
}
</script>

<template>
  <div
    v-if="factory && style"
    class="rounded-md border shadow-xl min-w-[240px] font-sans"
    :class="frameClass"
  >
    <div class="px-3 py-2 border-b border-black/40 flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5 text-sm font-semibold min-w-0">
        <GoodIcon
          v-if="factory.outputs[0]"
          :good-id="factory.outputs[0].goodId"
          class="w-4 h-4 shrink-0"
        />
        <span class="truncate">{{ factory.name }}</span>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <label class="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-70" title="Линий производства">
          <span>×</span>
          <input
            type="number"
            min="1"
            step="1"
            :value="props.data.lines ?? 1"
            class="nodrag w-10 h-5 px-1 rounded bg-black/40 border border-white/10 text-xs text-right outline-none focus:border-white/40"
            @input="setLines(Number(($event.target as HTMLInputElement).value))"
            @click.stop
            @mousedown.stop
          >
        </label>
        <button
          type="button"
          class="text-xs leading-none w-5 h-5 rounded hover:bg-black/40 opacity-60 hover:opacity-100"
          title="Удалить"
          @click.stop="emit('remove', props.id)"
        >✕</button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-x-3 py-2 text-xs">
      <div class="space-y-1">
        <div
          v-for="inp in factory.inputs"
          :key="inp.goodId"
          class="relative flex items-center gap-1.5 pl-3 pr-1 py-0.5"
        >
          <Handle
            :id="'in-' + inp.goodId"
            type="target"
            :position="Position.Left"
            :is-valid-connection="isValidConnection"
            class="!bg-white/70 !border-0 !w-2 !h-2"
          />
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-white truncate min-w-0"
            :class="{ 'opacity-60': inp.optional }"
            @click.stop="emit('pick', { nodeId: props.id, direction: 'in', goodId: inp.goodId })"
          >
            <GoodIcon :good-id="inp.goodId" class="w-3 h-3 shrink-0" />
            <span class="truncate">{{ goodName(inp.goodId) }}</span>
            <span v-if="inp.optional" class="text-[9px] uppercase">опц.</span>
          </button>
          <span
            class="ml-auto pl-1 text-[10px] tabular-nums shrink-0"
            :class="{
              'text-rose-400 font-semibold': inp.optional ? false : inputStatus(inp.goodId, inp.amount) === 'none',
              'text-rose-300/60': inp.optional && inputStatus(inp.goodId, inp.amount) === 'none',
              'text-emerald-300': inputStatus(inp.goodId, inp.amount) === 'ok',
              'text-rose-300 font-semibold': inputStatus(inp.goodId, inp.amount) === 'short',
              'text-amber-300': inputStatus(inp.goodId, inp.amount) === 'over',
            }"
            :title="
              inputStatus(inp.goodId, inp.amount) === 'short'
                ? 'Не хватает: поступает ' + formatRate(suppliedRate(inp.goodId)) + '/ч'
                : inputStatus(inp.goodId, inp.amount) === 'over'
                ? 'Избыток: поступает ' + formatRate(suppliedRate(inp.goodId)) + '/ч'
                : inputStatus(inp.goodId, inp.amount) === 'ok'
                ? 'Покрыто'
                : inp.optional
                ? 'Опциональный вход не подключён'
                : 'Нет поставщика'
            "
          >
            <span v-if="inputStatus(inp.goodId, inp.amount) === 'short'">⚠ </span>
            <span v-else-if="inputStatus(inp.goodId, inp.amount) === 'none' && !inp.optional">✕ </span>
            <span v-else-if="inputStatus(inp.goodId, inp.amount) === 'none' && inp.optional">○ </span>
            {{ formatRate(ratePerHour(inp.amount)) }}/ч
          </span>
        </div>
        <div
          v-if="factory.inputs.length === 0"
          class="pl-3 pr-1 py-0.5 text-muted-foreground/70 italic"
        >нет входов</div>
      </div>

      <div class="space-y-1">
        <div
          v-for="out in factory.outputs"
          :key="out.goodId"
          class="relative flex items-center justify-end gap-1.5 pr-3 pl-1 py-0.5 text-right"
        >
          <span class="mr-auto pr-1 text-[10px] tabular-nums opacity-70 shrink-0">
            {{ formatRate(ratePerHour(out.amount)) }}/ч
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-1 hover:text-white truncate min-w-0"
            @click.stop="emit('pick', { nodeId: props.id, direction: 'out', goodId: out.goodId })"
          >
            <span class="truncate">{{ goodName(out.goodId) }}</span>
            <GoodIcon :good-id="out.goodId" class="w-3 h-3 shrink-0" />
          </button>
          <Handle
            :id="'out-' + out.goodId"
            type="source"
            :position="Position.Right"
            :is-valid-connection="isValidConnection"
            class="!bg-white/70 !border-0 !w-2 !h-2"
          />
        </div>
      </div>
    </div>
  </div>
</template>
