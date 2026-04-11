<script setup lang="ts">
import { computed } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'
import {
  FACTORY_SIZE_LABELS,
  FACTORY_SIZES,
  buildCost,
  formatCredits,
  upgradeCost,
} from '~/lib/factoryCost'
import FactoryChip from './FactoryChip.vue'
import GoodIcon from './GoodIcon.vue'

const props = defineProps<{ factoryId: string }>()
const emit = defineEmits<{ select: [factoryId: string] }>()

const { getFactory, getGood, getConsumers, getProducers, findRoots } = useGameData()

const factory = computed(() => getFactory(props.factoryId))
const style = computed(() => (factory.value ? CATEGORY_STYLES[factory.value.category] : null))
const headerIcon = computed(() => factory.value?.outputs[0]?.goodId ?? '')

/**
 * Alternate recipes producing any of the same outputs as the current factory.
 * e.g. viewing `steel-factory` lists `steel-factory-v2` (scrap-metal variant).
 */
const alternates = computed(() => {
  if (!factory.value) return []
  const seen = new Set<string>([factory.value.id])
  const result = []
  for (const out of factory.value.outputs) {
    for (const p of getProducers(out.goodId)) {
      if (!seen.has(p.id)) {
        seen.add(p.id)
        result.push(p)
      }
    }
  }
  return result
})

/** Set of distinct downstream factories that consume any of our outputs. */
const consumers = computed(() => {
  if (!factory.value) return []
  const seen = new Set<string>()
  const result = []
  for (const out of factory.value.outputs) {
    for (const c of getConsumers(out.goodId)) {
      if (!seen.has(c.id)) {
        seen.add(c.id)
        result.push(c)
      }
    }
  }
  return result
})

/**
 * Roots are returned as factory ids, or `?<goodId>` for inputs that no
 * factory produces (NPC-only goods). Split so the template can render them
 * differently.
 */
const roots = computed(() => {
  if (!factory.value || factory.value.category === 'mine') return { factories: [], missing: [] }
  const all = [...findRoots(factory.value.id)]
  return {
    factories: all.filter(r => !r.startsWith('?')),
    missing: all.filter(r => r.startsWith('?')).map(r => r.slice(1)),
  }
})
</script>

<template>
  <div v-if="factory && style" class="max-w-3xl space-y-5">
    <header class="flex items-center gap-3">
      <GoodIcon :good-id="headerIcon" class="w-12 h-12" />
      <div>
        <h2 class="text-2xl font-bold text-foreground">{{ factory.name }}</h2>
        <div class="flex items-center gap-3 mt-0.5">
          <span class="text-[11px] uppercase tracking-wider text-muted-foreground">
            {{ style.label }}
          </span>
          <span class="text-xs text-muted-foreground">
            Цикл: {{ factory.cycleSeconds }}s
          </span>
        </div>
      </div>
    </header>

    <section class="rounded-lg border border-border bg-card p-3">
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        <div>
          <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Входы</div>
          <ul v-if="factory.inputs.length" class="space-y-0.5">
            <li
              v-for="inp in factory.inputs"
              :key="inp.goodId"
              class="flex items-center gap-1.5 min-w-0"
              :class="{ 'opacity-60': inp.optional }"
            >
              <GoodIcon :good-id="inp.goodId" class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate flex-1">{{ getGood(inp.goodId)?.name ?? inp.goodId }}</span>
              <span class="font-mono tabular-nums text-muted-foreground shrink-0">×{{ inp.amount }}</span>
            </li>
          </ul>
          <div v-else class="text-muted-foreground italic text-[11px]">—</div>
        </div>

        <div>
          <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Выходы</div>
          <ul v-if="factory.outputs.length" class="space-y-0.5">
            <li
              v-for="o in factory.outputs"
              :key="o.goodId"
              class="flex items-center gap-1.5 min-w-0"
            >
              <GoodIcon :good-id="o.goodId" class="w-3.5 h-3.5 shrink-0" />
              <span class="truncate flex-1">{{ getGood(o.goodId)?.name ?? o.goodId }}</span>
              <span class="font-mono tabular-nums text-sky-300 shrink-0">×{{ o.amount }}</span>
            </li>
          </ul>
          <div v-else class="text-muted-foreground italic text-[11px]">—</div>
        </div>
      </div>
    </section>

    <section v-if="alternates.length">
      <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Альтернативные рецепты
      </h3>
      <div class="flex flex-wrap gap-1.5">
        <FactoryChip
          v-for="a in alternates"
          :key="a.id"
          :factory-id="a.id"
          @select="emit('select', $event)"
        />
      </div>
    </section>

    <section v-if="roots.factories.length || roots.missing.length">
      <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Нужны шахты / источники
      </h3>
      <div class="flex flex-wrap gap-1.5">
        <FactoryChip
          v-for="rid in roots.factories"
          :key="rid"
          :factory-id="rid"
          @select="emit('select', $event)"
        />
        <span
          v-for="gid in roots.missing"
          :key="gid"
          v-tooltip="'У этого ресурса нет производителя — покупается у NPC'"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/60 text-xs font-medium text-muted-foreground"
        >
          <GoodIcon :good-id="gid" class="w-4 h-4" />
          ⚠ {{ getGood(gid)?.name ?? gid }} (у NPC)
        </span>
      </div>
    </section>

    <section>
      <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Стоимость
      </h3>
      <div class="rounded-lg border border-border bg-card p-3 space-y-2">
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground">Постройка</span>
          <span class="text-sm font-mono tabular-nums">{{ formatCredits(buildCost(factory, getGood)) }}</span>
        </div>
        <div>
          <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Размеры</div>
          <ul class="grid grid-cols-5 gap-1">
            <li
              v-for="size in FACTORY_SIZES"
              :key="size"
              class="px-1 py-1 rounded bg-muted/50 border border-border/60 text-center"
            >
              <div class="text-[9px] font-mono uppercase text-muted-foreground">{{ FACTORY_SIZE_LABELS[size] }}</div>
              <div class="text-[10px] font-mono tabular-nums">{{ formatCredits(upgradeCost(factory, size, getGood)) }}</div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Куда идёт продукт
      </h3>
      <div
        v-if="!consumers.length"
        class="text-xs text-muted-foreground italic"
      >Конечный продукт — не используется как сырьё</div>
      <div v-else class="flex flex-wrap gap-1.5">
        <FactoryChip
          v-for="c in consumers"
          :key="c.id"
          :factory-id="c.id"
          @select="emit('select', $event)"
        />
      </div>
    </section>
  </div>
</template>
