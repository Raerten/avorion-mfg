<script setup lang="ts">
import { changelog } from '~/data/changelog'

useHead({ title: 'Журнал изменений — Avorion MFG' })

const { dismiss } = useVersionNotice()
dismiss()
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-8">Журнал изменений</h1>

    <div class="space-y-8">
      <article
        v-for="entry in changelog"
        :key="entry.date"
        class="relative pl-6 border-l-2 border-border"
      >
        <div
          class="absolute -left-[7px] top-[7px] size-3 rounded-full bg-primary"
        />
        <div class="mb-2">
          <span class="font-mono text-lg font-semibold text-primary">
            {{ entry.date }}
          </span>
        </div>
        <ul class="space-y-1 text-sm text-muted-foreground">
          <li
            v-for="(change, i) in entry.changes"
            :key="i"
            class="flex items-start gap-2"
          >
            <span class="text-muted-foreground/50 mt-0.5">—</span>
            <span>{{ change }}</span>
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>
