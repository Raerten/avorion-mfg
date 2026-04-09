<script setup lang="ts">
import { ref } from 'vue'
import FactoryDetail from '~/components/FactoryDetail.vue'
import FactorySidebar from '~/components/FactorySidebar.vue'

useHead({ title: 'Фабрики · Avorion MFG' })
definePageMeta({ layout: false })

const selectedId = ref<string>('')
function select(id: string) {
  selectedId.value = id
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background text-foreground">
    <header class="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/40">
      <NuxtLink to="/" class="font-mono text-sm text-primary tracking-wider">AVORION/MFG</NuxtLink>
      <h1 class="text-base font-semibold">⛏ Фабрики</h1>
    </header>

    <div class="flex flex-1 min-h-0">
      <FactorySidebar :active-id="selectedId" @select="select" />
      <main class="flex-1 overflow-y-auto p-6">
        <FactoryDetail v-if="selectedId" :factory-id="selectedId" @select="select" />
        <div v-else class="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 text-center">
          <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
            <circle cx="27" cy="27" r="24" stroke="currentColor" stroke-width="2" />
            <path d="M17 27h20M27 17v20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <p>Выбери фабрику или шахту слева</p>
          <small class="text-xs opacity-75">или воспользуйся поиском</small>
        </div>
      </main>
    </div>
  </div>
</template>
