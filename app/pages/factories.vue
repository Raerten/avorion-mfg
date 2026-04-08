<script setup lang="ts">
import { useGameData } from '~/composables/useGameData'
import FactoryCard from '~/components/FactoryCard.vue'

useHead({ title: 'Factories · Avorion MFG' })

const { factories } = useGameData()
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold tracking-tight">Factories</h1>
    <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <li v-for="f in factories" :key="f.id">
        <FactoryCard :factory="f" />
      </li>
    </ul>
  </section>
</template>
