<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'
import GoodIcon from '~/components/GoodIcon.vue'
import type { Factory } from '~/types/factory'

/**
 * Modal-style popup listing factory candidates for a clicked socket.
 * - direction 'in'  → list producers of the good (they'll feed this input)
 * - direction 'out' → list consumers of the good (they'll eat this output)
 */

const props = defineProps<{
  goodId: string
  direction: 'in' | 'out'
}>()

const emit = defineEmits<{
  close: []
  select: [factoryId: string]
}>()

const { getGood, getProducers, getConsumers } = useGameData()

const good = computed(() => getGood(props.goodId))

const candidates = computed<Factory[]>(() =>
  props.direction === 'in' ? getProducers(props.goodId) : getConsumers(props.goodId),
)

const title = computed(() =>
  props.direction === 'in' ? 'Кто производит' : 'Кто потребляет',
)

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onEscape))
onUnmounted(() => window.removeEventListener('keydown', onEscape))
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="w-[min(480px,90vw)] max-h-[70vh] rounded-lg border border-border bg-popover shadow-2xl flex flex-col">
      <div class="px-4 py-3 border-b border-border flex items-center gap-2">
        <GoodIcon :good-id="goodId" class="w-5 h-5" />
        <div class="flex-1 min-w-0">
          <div class="text-xs text-muted-foreground">{{ title }}</div>
          <div class="font-semibold truncate">{{ good?.name ?? goodId }}</div>
        </div>
        <button
          type="button"
          class="w-7 h-7 rounded hover:bg-muted text-muted-foreground"
          @click="emit('close')"
        >✕</button>
      </div>

      <div class="flex-1 overflow-y-auto p-2">
        <p
          v-if="candidates.length === 0"
          class="p-4 text-sm text-muted-foreground text-center"
        >
          Нет подходящих фабрик. Этот товар покупается у NPC.
        </p>
        <ul v-else class="space-y-1">
          <li v-for="f in candidates" :key="f.id">
            <button
              type="button"
              class="w-full text-left px-3 py-2 rounded border border-border hover:border-ring bg-card hover:bg-muted flex items-center gap-2"
              @click="emit('select', f.id)"
            >
              <span class="w-2 h-2 rounded-full shrink-0" :class="CATEGORY_STYLES[f.category].dot" />
              <span class="flex-1 truncate text-sm">{{ f.name }}</span>
              <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
                {{ CATEGORY_STYLES[f.category].label }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
