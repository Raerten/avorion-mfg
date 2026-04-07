<script setup lang="ts">
import { computed } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_GROUPS } from '~/lib/categories'
import GoodIcon from './GoodIcon.vue'

const props = defineProps<{ activeId?: string }>()
const emit = defineEmits<{ select: [factoryId: string] }>()

const { factories } = useGameData()

const groups = computed(() =>
  CATEGORY_GROUPS.map(g => ({
    ...g,
    items: factories.filter(f => g.categories.includes(f.category)),
  })).filter(g => g.items.length > 0),
)
</script>

<template>
  <aside class="w-56 shrink-0 border-r border-border bg-card/40 overflow-y-auto">
    <div v-for="group in groups" :key="group.title" class="py-1.5 border-b border-border">
      <div class="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {{ group.title }}
      </div>
      <button
        v-for="f in group.items"
        :key="f.id"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-muted-foreground border-l-2 border-transparent transition-colors hover:bg-muted hover:text-foreground hover:border-primary"
        :class="{ 'bg-muted text-foreground border-primary': props.activeId === f.id }"
        @click="emit('select', f.id)"
      >
        <GoodIcon :good-id="f.outputs[0]?.goodId ?? ''" class="w-4 h-4" />
        <span class="truncate">{{ f.name }}</span>
      </button>
    </div>
  </aside>
</template>
