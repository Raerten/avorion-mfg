<script setup lang="ts">
const nav = [
  { to: '/factories', label: '⛏ Фабрики' },
  { to: '/supply', label: '🔗 Цепь поставок' },
]
</script>

<template>
  <header class="h-12 shrink-0 border-b border-border bg-card/40 backdrop-blur flex items-center gap-6 px-4">
    <NuxtLink to="/" class="font-mono text-sm tracking-wider text-primary">
      AVORION/MFG
    </NuxtLink>
    <nav class="flex items-center gap-1 text-sm">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        active-class="text-foreground bg-muted"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>
    <div class="flex-1" />
    <slot />
  </header>
</template>
