<script setup lang="ts">
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'
import {
  FACTORY_SIZE_LABELS,
  FACTORY_SIZES,
  buildCost,
  formatCredits,
  upgradeCost,
} from '~/lib/factoryCost'
import type { Factory } from '~/types/factory'
import GoodIcon from '~/components/GoodIcon.vue'

/**
 * Self-contained factory info card: header (icon + name + category),
 * cycle length, inputs/outputs columns, build cost, and the 5-cell
 * size upgrade grid. Used both as the tile on /factories and as the
 * body of the /supply info popup, so styling stays consistent.
 */
defineProps<{ factory: Factory }>()

const { getGood } = useGameData()

function goodName(id: string): string {
  return getGood(id)?.name ?? id
}
</script>

<template>
  <div class="p-4 rounded-md border border-border bg-card">
    <div class="flex items-center gap-2 mb-2">
      <GoodIcon
        v-if="factory.outputs[0]"
        :good-id="factory.outputs[0].goodId"
        class="w-5 h-5 shrink-0"
      />
      <h2 class="font-medium truncate flex-1">{{ factory.name }}</h2>
      <span class="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
        {{ CATEGORY_STYLES[factory.category].label }}
      </span>
    </div>
    <p class="text-xs text-muted-foreground">
      Цикл: {{ factory.cycleSeconds }}s
    </p>

    <div class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Входы
        </div>
        <ul v-if="factory.inputs.length" class="space-y-0.5">
          <li
            v-for="inp in factory.inputs"
            :key="inp.goodId"
            class="flex items-center gap-1.5 min-w-0"
            :class="{ 'opacity-60': inp.optional }"
          >
            <GoodIcon :good-id="inp.goodId" class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate flex-1">{{ goodName(inp.goodId) }}</span>
            <span class="font-mono tabular-nums text-muted-foreground shrink-0">
              ×{{ inp.amount }}
            </span>
          </li>
        </ul>
        <div v-else class="text-muted-foreground italic text-[11px]">—</div>
      </div>

      <div>
        <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Выходы
        </div>
        <ul v-if="factory.outputs.length" class="space-y-0.5">
          <li
            v-for="out in factory.outputs"
            :key="out.goodId"
            class="flex items-center gap-1.5 min-w-0"
          >
            <GoodIcon :good-id="out.goodId" class="w-3.5 h-3.5 shrink-0" />
            <span class="truncate flex-1">{{ goodName(out.goodId) }}</span>
            <span class="font-mono tabular-nums text-sky-300 shrink-0">
              ×{{ out.amount }}
            </span>
          </li>
        </ul>
        <div v-else class="text-muted-foreground italic text-[11px]">—</div>
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-border/60 space-y-1.5">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
          Постройка
        </span>
        <span class="text-sm font-mono tabular-nums">
          {{ formatCredits(buildCost(factory, getGood)) }}
        </span>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Размеры
        </div>
        <ul class="grid grid-cols-5 gap-1">
          <li
            v-for="size in FACTORY_SIZES"
            :key="size"
            class="px-1 py-1 rounded bg-muted/50 border border-border/60 text-center"
          >
            <div class="text-[9px] font-mono uppercase text-muted-foreground">
              {{ FACTORY_SIZE_LABELS[size] }}
            </div>
            <div class="text-[10px] font-mono tabular-nums">
              {{ formatCredits(upgradeCost(factory, size, getGood)) }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
