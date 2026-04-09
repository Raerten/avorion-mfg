<script setup lang="ts">
useHead({ title: 'Avorion Manufactory Helper' })

const tools = [
  {
    to: '/factories',
    icon: '⛏',
    title: 'Фабрики',
    description: 'Каталог фабрик с поиском, фильтрацией и подробной информацией о входах/выходах.',
  },
  {
    to: '/supply',
    icon: '🔗',
    title: 'Цепь поставок',
    description: 'Рассчитайте полную производственную цепочку — количество фабрик, ресурсы и зависимости.',
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

    <!-- Tool cards with previews -->
    <div class="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.to"
        :to="tool.to"
        class="group relative flex flex-col rounded-lg border border-border bg-card/60 overflow-hidden transition-all hover:border-primary/40 hover:bg-card"
      >
        <!-- Preview mockup -->
        <div class="relative h-44 bg-muted/30 border-b border-border overflow-hidden">
          <!-- Factories mockup -->
          <template v-if="tool.to === '/factories'">
            <div class="absolute inset-0 flex">
              <!-- Sidebar -->
              <div class="w-2/5 border-r border-border/60 p-3 space-y-2">
                <div class="h-4 w-full rounded bg-muted/60" />
                <div class="space-y-1.5 mt-3">
                  <div class="h-2.5 w-3/5 rounded bg-primary/15" />
                  <div v-for="n in 5" :key="n" class="flex items-center gap-1.5">
                    <div class="size-2 rounded-sm bg-muted-foreground/20" />
                    <div class="h-2 rounded bg-muted-foreground/15" :style="{ width: `${50 + Math.random() * 40}%` }" />
                  </div>
                  <div class="h-2.5 w-3/5 rounded bg-accent/15 mt-2" />
                  <div v-for="n in 3" :key="'b' + n" class="flex items-center gap-1.5">
                    <div class="size-2 rounded-sm bg-muted-foreground/20" />
                    <div class="h-2 rounded bg-muted-foreground/15" :style="{ width: `${40 + Math.random() * 50}%` }" />
                  </div>
                </div>
              </div>
              <!-- Main area -->
              <div class="flex-1 p-4 flex flex-col items-center justify-center gap-3">
                <div class="w-4/5 rounded-md border border-border/60 bg-card/80 p-3 space-y-2">
                  <div class="h-3 w-2/3 rounded bg-foreground/15" />
                  <div class="flex gap-4">
                    <div class="flex-1 space-y-1">
                      <div class="h-1.5 w-1/3 rounded bg-muted-foreground/20" />
                      <div class="h-2 w-4/5 rounded bg-primary/20" />
                      <div class="h-2 w-3/5 rounded bg-primary/15" />
                    </div>
                    <div class="flex-1 space-y-1">
                      <div class="h-1.5 w-1/3 rounded bg-muted-foreground/20" />
                      <div class="h-2 w-3/5 rounded bg-accent/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Supply chain mockup -->
          <template v-if="tool.to === '/supply'">
            <div class="absolute inset-0 flex">
              <!-- Sidebar -->
              <div class="w-1/3 border-r border-border/60 p-3 space-y-2">
                <div class="h-4 w-full rounded bg-muted/60" />
                <div class="space-y-1.5 mt-3">
                  <div v-for="n in 6" :key="n" class="flex items-center gap-1.5">
                    <div class="size-2 rounded-sm bg-muted-foreground/20" />
                    <div class="h-2 rounded bg-muted-foreground/15" :style="{ width: `${40 + Math.random() * 50}%` }" />
                  </div>
                </div>
              </div>
              <!-- Canvas -->
              <div class="flex-1 relative">
                <!-- Nodes -->
                <div class="absolute top-5 right-6 w-28 rounded border border-primary/30 bg-card/80 p-2 space-y-1">
                  <div class="h-2.5 w-4/5 rounded bg-foreground/15" />
                  <div class="h-1.5 w-full rounded bg-primary/20" />
                  <div class="h-1.5 w-3/4 rounded bg-primary/15" />
                </div>
                <!-- Connection lines -->
                <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <line x1="45%" y1="55%" x2="72%" y2="30%" stroke="hsl(190 85% 55% / 0.15)" stroke-width="1.5" />
                  <line x1="45%" y1="55%" x2="72%" y2="75%" stroke="hsl(190 85% 55% / 0.15)" stroke-width="1.5" />
                </svg>
                <div class="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-24 rounded border border-accent/30 bg-card/80 p-2 space-y-1">
                  <div class="h-2.5 w-3/4 rounded bg-foreground/15" />
                  <div class="h-1.5 w-full rounded bg-accent/20" />
                </div>
                <div class="absolute bottom-5 right-6 w-24 rounded border border-border/60 bg-card/80 p-2 space-y-1">
                  <div class="h-2.5 w-4/5 rounded bg-foreground/15" />
                  <div class="h-1.5 w-full rounded bg-muted-foreground/20" />
                </div>
              </div>
            </div>
          </template>

          <!-- Hover overlay -->
          <div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
        </div>

        <!-- Card text -->
        <div class="p-5">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ tool.icon }}</span>
            <h2 class="text-lg font-semibold group-hover:text-primary transition-colors">
              {{ tool.title }}
            </h2>
          </div>
          <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
            {{ tool.description }}
          </p>
        </div>

        <!-- Arrow -->
        <div class="absolute bottom-5 right-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </NuxtLink>
    </div>

  </div>
</template>
