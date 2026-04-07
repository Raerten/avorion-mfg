<script setup lang="ts">
import { computed } from 'vue'
import { goodIconUrl } from '~/lib/icons'
import { useGameData } from '~/composables/useGameData'

const props = defineProps<{ goodId: string }>()

const { getGood } = useGameData()
const src = computed(() => goodIconUrl(props.goodId))
const alt = computed(() => getGood(props.goodId)?.name ?? props.goodId)
</script>

<template>
  <span class="inline-block shrink-0">
    <img :src="src" :alt="alt" class="w-full h-full object-contain" draggable="false" />
  </span>
</template>
