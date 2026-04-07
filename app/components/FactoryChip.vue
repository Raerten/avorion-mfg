<script setup lang="ts">
import { computed } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'
import GoodIcon from './GoodIcon.vue'

/**
 * Clickable colored chip representing a factory. Click emits `select`
 * with the factory id so the parent can navigate the detail view.
 *
 * If `goodId` is supplied with no producing factory, renders a neutral
 * "good" pill instead (used to render NPC-only inputs).
 */
const props = defineProps<{
  factoryId?: string
  goodId?: string
  optional?: boolean
}>()
const emit = defineEmits<{ select: [factoryId: string] }>()

const { getFactory, getGood, getProducers } = useGameData()

const factory = computed(() => {
  if (props.factoryId) return getFactory(props.factoryId)
  if (props.goodId) return getProducers(props.goodId)[0]
  return undefined
})

const iconGoodId = computed(() => {
  if (factory.value) return factory.value.outputs[0]?.goodId ?? ''
  return props.goodId ?? ''
})

const label = computed(() => {
  if (factory.value) return factory.value.name
  if (props.goodId) return getGood(props.goodId)?.name ?? props.goodId
  return ''
})

const style = computed(() => (factory.value ? CATEGORY_STYLES[factory.value.category] : null))
</script>

<template>
  <button
    v-if="factory && style"
    type="button"
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition hover:-translate-y-px"
    :class="style.chip"
    @click="emit('select', factory.id)"
  >
    <GoodIcon :good-id="iconGoodId" class="w-4 h-4" />
    <span>{{ label }}</span>
    <span
      v-if="optional"
      class="text-[9px] uppercase tracking-wider px-1 py-px rounded bg-black/40 border border-white/10"
    >необяз.</span>
  </button>
  <span
    v-else
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted text-xs font-medium text-muted-foreground"
  >
    <GoodIcon :good-id="iconGoodId" class="w-4 h-4" />
    <span>{{ label }}</span>
    <span
      v-if="optional"
      class="text-[9px] uppercase tracking-wider px-1 py-px rounded bg-black/40 border border-white/10"
    >необяз.</span>
  </span>
</template>
