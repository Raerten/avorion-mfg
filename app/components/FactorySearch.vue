<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'
import GoodIcon from './GoodIcon.vue'

const emit = defineEmits<{ select: [factoryId: string] }>()

const { factories } = useGameData()

const query = ref('')
const open = ref(false)

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return factories.filter(f => f.name.toLowerCase().includes(q)).slice(0, 12)
})

function pick(id: string) {
  emit('select', id)
  query.value = ''
  open.value = false
}
</script>

<template>
  <div class="relative w-full max-w-sm" @focusout="open = false">
    <input
      v-model="query"
      type="text"
      placeholder="Найти ресурс или фабрику..."
      class="w-full h-9 px-3 rounded-md bg-muted border border-border text-sm outline-none focus:border-primary"
      @focus="open = true"
      @input="open = true"
    >
    <div
      v-if="open && matches.length"
      class="absolute left-0 right-0 top-full mt-1 rounded-md border border-border bg-card shadow-lg z-50 max-h-72 overflow-y-auto"
    >
      <button
        v-for="m in matches"
        :key="m.id"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted"
        @mousedown.prevent="pick(m.id)"
      >
        <GoodIcon :good-id="m.outputs[0]?.goodId ?? ''" class="w-5 h-5" />
        <span class="flex-1 truncate">{{ m.name }}</span>
        <span class="text-[10px] text-muted-foreground">{{ CATEGORY_STYLES[m.category].label }}</span>
      </button>
    </div>
  </div>
</template>
