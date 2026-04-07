<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { useProductionChain } from '~/composables/useProductionChain'

useHead({ title: 'Chain Calculator · Avorion MFG' })

const { goods } = useGameData()
const { resolve } = useProductionChain()

const selectedGoodId = ref(goods[0]?.id ?? '')
const ratePerHour = ref(60)

const chain = computed(() =>
  selectedGoodId.value ? resolve(selectedGoodId.value, ratePerHour.value) : null,
)
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-semibold tracking-tight">Chain Calculator</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      <label class="space-y-1.5">
        <span class="text-sm text-muted-foreground">Target good</span>
        <select
          v-model="selectedGoodId"
          class="w-full h-9 px-3 rounded-md bg-muted border border-border text-sm"
        >
          <option v-for="g in goods" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </label>

      <label class="space-y-1.5">
        <span class="text-sm text-muted-foreground">Units / hour</span>
        <input
          v-model.number="ratePerHour"
          type="number"
          min="1"
          class="w-full h-9 px-3 rounded-md bg-muted border border-border text-sm"
        >
      </label>
    </div>

    <pre class="text-xs font-mono p-4 rounded-md bg-card border border-border overflow-auto">{{ chain }}</pre>
  </section>
</template>
