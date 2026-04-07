<script setup lang="ts">
import { useGameData } from '~/composables/useGameData'
import { CATEGORY_STYLES } from '~/lib/categories'

useHead({ title: 'Factories · Avorion MFG' })

const { factories } = useGameData()
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold tracking-tight">Factories</h1>
    <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <li
        v-for="f in factories"
        :key="f.id"
        class="p-4 rounded-md border border-border bg-card"
      >
        <div class="flex items-center justify-between mb-2">
          <h2 class="font-medium">{{ f.name }}</h2>
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
            {{ CATEGORY_STYLES[f.category].label }}
          </span>
        </div>
        <p class="text-xs text-muted-foreground">
          Цикл: {{ f.cycleSeconds }}s · {{ f.inputs.length }} вход. / {{ f.outputs.length }} вых.
        </p>
      </li>
    </ul>
  </section>
</template>
