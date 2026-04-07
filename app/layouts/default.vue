<script setup lang="ts">
const nav = [
  { to: '/', label: 'Overview' },
  { to: '/calculator', label: 'Chain Calculator' },
  { to: '/chains', label: 'Chain Browser' },
  { to: '/visualizer', label: 'Chain Visualizer' },
  { to: '/supply', label: 'Supply Chain' },
  { to: '/factories', label: 'Factories' },
]
</script>

<template>
  <div class="min-h-full flex flex-col">
    <header class="border-b border-border bg-card/40 backdrop-blur">
      <div class="mx-auto max-w-7xl px-6 h-14 flex items-center gap-8">
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
      </div>
    </header>

    <main class="flex-1">
      <div class="mx-auto max-w-7xl px-6 py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
