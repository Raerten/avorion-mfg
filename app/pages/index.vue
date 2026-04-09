<script setup lang="ts">
useHead({ title: 'Avorion Manufactory Helper' })

const tools = [
  {
    to: '/factories',
    icon: '⛏',
    title: 'Фабрики',
    description: 'Полный каталог фабрик с поиском, фильтрацией по категориям и подробной информацией о входах/выходах.',
  },
  {
    to: '/supply',
    icon: '🔗',
    title: 'Цепь поставок',
    description: 'Рассчитайте полную производственную цепочку для нужного товара — количество фабрик, ресурсы и зависимости.',
  },
]
</script>

<template>
  <div class="flex flex-col items-center pt-16 pb-12">
    <!-- Hero -->
    <div class="text-center max-w-2xl">
      <h1 class="text-5xl font-bold tracking-tight">
        Manufactory
        <span class="text-primary">Helper</span>
      </h1>
      <p class="mt-4 text-lg text-muted-foreground leading-relaxed">
        Планируйте производственные цепочки и визуализируйте зависимости фабрик
        в&nbsp;<span class="text-foreground font-medium">Avorion</span>.
      </p>
    </div>

    <!-- Tool cards -->
    <div class="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.to"
        :to="tool.to"
        class="group relative rounded-lg border border-border bg-card/60 p-6 transition-all hover:border-primary/40 hover:bg-card"
      >
        <div class="text-3xl mb-3">{{ tool.icon }}</div>
        <h2 class="text-lg font-semibold group-hover:text-primary transition-colors">
          {{ tool.title }}
        </h2>
        <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
          {{ tool.description }}
        </p>
        <div class="absolute top-6 right-6 text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </NuxtLink>
    </div>

    <!-- Footer hint -->
    <p class="mt-16 text-xs text-muted-foreground/60 tracking-wide">
      Данные актуальны для версии Avorion 2.x
    </p>
  </div>
</template>
