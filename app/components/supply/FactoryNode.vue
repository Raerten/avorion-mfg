<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useVueFlow, type Connection, type NodeProps } from '@vue-flow/core'
import { Info, Power, PowerOff, Trash2 } from 'lucide-vue-next'
import { useGameData } from '~/composables/useGameData'
import type { FactoryCategory } from '~/types/factory'
import type { FactoryNodeData } from '~/composables/useSupplyChain'
import GoodIcon from '~/components/GoodIcon.vue'

/**
 * Per-category framing for the supply-chain node. We keep the brand
 * color on the header strip + border only, so the recipe body sits on
 * a neutral dark surface where text is easy to read. Class strings are
 * written verbatim for the Tailwind v4 JIT scanner.
 */
const NODE_STYLES: Record<FactoryCategory, { border: string; header: string }> = {
  mine: { border: 'border-green-600/60', header: 'bg-green-900/70 text-green-50' },
  basic: { border: 'border-blue-600/60', header: 'bg-blue-900/70 text-blue-50' },
  mid: { border: 'border-amber-600/60', header: 'bg-amber-900/70 text-amber-50' },
  adv: { border: 'border-purple-600/60', header: 'bg-purple-900/70 text-purple-50' },
  end: { border: 'border-teal-600/60', header: 'bg-teal-900/70 text-teal-50' },
  hi: { border: 'border-red-600/60', header: 'bg-red-900/70 text-red-50' },
}

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

const props = defineProps<NodeProps<{ factoryId: string; lines: number; disabled?: boolean }>>()

const emit = defineEmits<{
  pick: [payload: { nodeId: string; direction: 'in' | 'out'; goodId: string }]
  remove: [nodeId: string]
  info: [factoryId: string]
}>()

const { getFactory, getGood } = useGameData()
const { edges: allEdges, nodes: allNodes } = useVueFlow()

const factory = computed(() => getFactory(props.data.factoryId))
const nodeStyle = computed(() => (factory.value ? NODE_STYLES[factory.value.category] : null))

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
 * Per-cycle breakdown tooltip: "N шт/цикл · 15с · ×lines линий".
 * Clarifies where the displayed /ч rate comes from when players question it.
 */
function cycleTooltip(amount: number): string {
  if (!factory.value) return ''
  const lines = Math.max(1, Math.floor(props.data.lines ?? 1))
  const parts = [`${amount} шт/цикл`, `цикл ${factory.value.cycleSeconds}с`]
  if (lines > 1) parts.push(`×${lines} линий`)
  return parts.join(' · ')
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
    // Disabled upstream factories are offline — they deliver nothing.
    if (srcData.disabled) continue
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
  // A disabled node consumes nothing — skip the demand/supply comparison
  // entirely so its inputs don't light up red while it's offline.
  if (props.data.disabled) return 'none'
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

function toggleDisabled() {
  props.data.disabled = !props.data.disabled
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
    v-if="factory && nodeStyle"
    class="group relative rounded-sm border-2 shadow-2xl min-w-[260px] font-mono bg-zinc-900 text-zinc-100 transition-opacity"
    :class="[
      nodeStyle.border,
      props.data.disabled ? 'opacity-50 grayscale border-dashed' : '',
    ]"
  >
    <!--
      Floating action toolbar (n8n-style): sits above the node, hidden
      until the node (or the toolbar itself, since it lives inside the
      group) is hovered. `nodrag` so clicks don't initiate a drag.
    -->
    <div
      class="nodrag absolute left-1/2 -translate-x-1/2 -top-12 py-3 -mt-3 flex items-center gap-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10"
    >
      <button
        v-tooltip="'Подробнее'"
        type="button"
        class="w-10 h-10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        @click.stop="emit('info', props.data.factoryId)"
        @mousedown.stop
      ><Info class="w-[18px] h-[18px]" stroke-width="2" /></button>
      <button
        v-tooltip="props.data.disabled ? 'Включить' : 'Отключить'"
        type="button"
        class="w-10 h-10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        @click.stop="toggleDisabled"
        @mousedown.stop
      >
        <PowerOff v-if="props.data.disabled" class="w-[18px] h-[18px]" stroke-width="2" />
        <Power v-else class="w-[18px] h-[18px]" stroke-width="2" />
      </button>
      <button
        v-tooltip="'Удалить'"
        type="button"
        class="w-10 h-10 text-zinc-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
        @click.stop="emit('remove', props.id)"
        @mousedown.stop
      ><Trash2 class="w-[18px] h-[18px]" stroke-width="2" /></button>
    </div>

    <div class="overflow-hidden rounded-sm">
    <div
      class="px-3 py-1 flex items-center justify-between gap-2"
      :class="nodeStyle.header"
    >
      <div class="flex items-center gap-2 text-[15px] font-semibold min-w-0">
        <GoodIcon
          v-if="factory.outputs[0]"
          :good-id="factory.outputs[0].goodId"
          class="w-4 h-4 shrink-0"
        />
        <span class="truncate">{{ factory.name }}</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <label
          v-tooltip="'Линий производства'"
          class="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-80"
        >
          <span>×</span>
          <input
            type="number"
            min="1"
            step="1"
            :value="props.data.lines ?? 1"
            class="nodrag w-12 h-6 px-1 rounded bg-black/50 border border-white/20 text-sm text-right outline-none focus:border-white/60 text-white"
            @input="setLines(Number(($event.target as HTMLInputElement).value))"
            @click.stop
            @mousedown.stop
          >
        </label>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-x-4 py-2 text-[13px]">
      <div class="space-y-0.5">
        <div
          v-for="inp in factory.inputs"
          :key="inp.goodId"
          class="relative flex items-center gap-2 pl-4 pr-2 py-1"
        >
          <Handle
            :id="'in-' + inp.goodId"
            type="target"
            :position="Position.Left"
            :is-valid-connection="isValidConnection"
            class="!bg-white !border-0 !w-2.5 !h-2.5"
          />
          <button
            type="button"
            class="inline-flex items-center gap-1.5 hover:text-white truncate min-w-0 text-zinc-200"
            :class="{ 'opacity-60': inp.optional }"
            @click.stop="emit('pick', { nodeId: props.id, direction: 'in', goodId: inp.goodId })"
          >
            <GoodIcon :good-id="inp.goodId" class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate">{{ goodName(inp.goodId) }}</span>
            <span v-if="inp.optional" class="text-[9px] uppercase opacity-70">опц.</span>
          </button>
          <span
            class="ml-auto pl-2 text-[12px] tabular-nums shrink-0"
            :class="{
              'text-rose-400 font-semibold': !inp.optional && inputStatus(inp.goodId, inp.amount) === 'none',
              'text-rose-300/60': inp.optional && inputStatus(inp.goodId, inp.amount) === 'none',
              'text-emerald-300 font-semibold': inputStatus(inp.goodId, inp.amount) === 'ok',
              'text-rose-300 font-semibold': inputStatus(inp.goodId, inp.amount) === 'short',
              'text-amber-300 font-semibold': inputStatus(inp.goodId, inp.amount) === 'over',
            }"
            v-tooltip="{
              placement: 'top',
              content:
                cycleTooltip(inp.amount) + '\n' + (
                  inputStatus(inp.goodId, inp.amount) === 'short'
                    ? 'Не хватает: поступает ' + formatRate(suppliedRate(inp.goodId)) + '/ч'
                    : inputStatus(inp.goodId, inp.amount) === 'over'
                    ? 'Избыток: поступает ' + formatRate(suppliedRate(inp.goodId)) + '/ч'
                    : inputStatus(inp.goodId, inp.amount) === 'ok'
                    ? 'Покрыто'
                    : inp.optional
                    ? 'Опциональный вход не подключён'
                    : 'Нет поставщика'
                )
            }"
          >
            <span class="inline-block w-3 text-center mr-0.5">
              <template v-if="inputStatus(inp.goodId, inp.amount) === 'short'">⚠</template>
              <template v-else-if="inputStatus(inp.goodId, inp.amount) === 'over'">▲</template>
              <template v-else-if="inputStatus(inp.goodId, inp.amount) === 'ok'">✓</template>
              <template v-else-if="inp.optional">○</template>
              <template v-else>✕</template>
            </span>{{ formatRate(ratePerHour(inp.amount)) }}/ч
          </span>
        </div>
        <div
          v-if="factory.inputs.length === 0"
          class="pl-4 pr-2 py-1 text-zinc-500 italic text-[12px]"
        >нет входов</div>
      </div>


      <div class="space-y-0.5">
        <div
          v-for="out in factory.outputs"
          :key="out.goodId"
          class="relative flex items-center justify-end gap-2 pr-4 pl-2 py-1 text-right"
        >
          <span
            v-tooltip="{ content: cycleTooltip(out.amount), placement: 'top' }"
            class="mr-auto pr-2 text-[12px] tabular-nums shrink-0 text-sky-300 font-semibold"
          >
            {{ formatRate(ratePerHour(out.amount)) }}/ч
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 hover:text-white truncate min-w-0 text-zinc-200"
            @click.stop="emit('pick', { nodeId: props.id, direction: 'out', goodId: out.goodId })"
          >
            <span class="truncate">{{ goodName(out.goodId) }}</span>
            <GoodIcon :good-id="out.goodId" class="w-3.5 h-3.5 shrink-0" />
          </button>
          <Handle
            :id="'out-' + out.goodId"
            type="source"
            :position="Position.Right"
            :is-valid-connection="isValidConnection"
            class="!bg-white !border-0 !w-2.5 !h-2.5"
          />
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
