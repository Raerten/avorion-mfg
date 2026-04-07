<script setup lang="ts">
import { computed } from 'vue'
import { goodIcon } from '~/lib/icons'

const props = defineProps<{ goodId: string }>()
const html = computed(() => goodIcon(props.goodId))
</script>

<template>
  <span class="inline-block shrink-0 [&>svg]:w-full [&>svg]:h-full" v-html="html" />
</template>
