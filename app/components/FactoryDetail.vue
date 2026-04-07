<script setup lang="ts">
import { computed } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'
import FactoryChip from './FactoryChip.vue'
import GoodIcon from './GoodIcon.vue'

const props = defineProps<{ factoryId: string }>()
const emit = defineEmits<{ select: [factoryId: string] }>()

const { getFactory, getGood, getConsumers, findRoots } = useGameData()

const factory = computed(() => getFactory(props.factoryId))
const style = computed(() => (factory.value ? CATEGORY_STYLES[factory.value.category] : null))
const headerIcon = computed(() => factory.value?.outputs[0]?.goodId ?? '')

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
        <p class="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {{ style.label }}
        </p>
      </div>
    </header>

    <section>
      <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Входящие ресурсы
      </h3>
      <div
        v-if="!factory.inputs.length"
        class="text-xs text-muted-foreground italic"
      >Не требует входящих материалов</div>
      <div v-else class="rounded-lg border border-border bg-card p-3">
        <div class="flex flex-wrap items-center gap-1.5">
          <template v-for="(inp, i) in factory.inputs" :key="inp.goodId">
            <span v-if="i > 0" class="text-muted-foreground/60 text-xs">+</span>
            <FactoryChip :good-id="inp.goodId" :optional="inp.optional" @select="emit('select', $event)" />
          </template>
        </div>
      </div>
    </section>

    <section>
      <h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        Производит
      </h3>
      <div class="rounded-lg border border-border bg-card p-3 flex flex-wrap gap-1.5">
        <span
          v-for="o in factory.outputs"
          :key="o.goodId"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted text-xs font-medium"
        >
          <GoodIcon :good-id="o.goodId" class="w-4 h-4" />
          {{ getGood(o.goodId)?.name ?? o.goodId }}
        </span>
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
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/60 text-xs font-medium text-muted-foreground"
          title="У этого ресурса нет производителя — покупается у NPC"
        >
          <GoodIcon :good-id="gid" class="w-4 h-4" />
          ⚠ {{ getGood(gid)?.name ?? gid }} (у NPC)
        </span>
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
