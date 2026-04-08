<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameData } from '~/composables/useGameData'
import { useProductionChain } from '~/composables/useProductionChain'
import type { ChainNode } from '~/types/factory'
import {
  buildCost,
  formatCredits,
  totalUpgradeCost,
} from '~/lib/factoryCost'

useHead({ title: 'Chain Calculator · Avorion MFG' })

const { goods, getGood, getFactory } = useGameData()
const { resolve } = useProductionChain()

const selectedGoodId = ref(goods[0]?.id ?? '')
const ratePerHour = ref(60)

const chain = computed(() =>
  selectedGoodId.value ? resolve(selectedGoodId.value, ratePerHour.value) : null,
)

interface CostRow {
  factoryId: string
  factoryName: string
  count: number
  instances: number
  build: number
  upgrade: number
}

/**
 * Flatten the chain into a deduplicated list of factories with accumulated
 * fractional factory counts. Real build cost uses ceiled instances — you
 * can't buy half a factory — while the count column keeps the fractional
 * sizing hint from the resolver.
 */
function collectCosts(root: ChainNode | null): CostRow[] {
  if (!root) return []
  const acc = new Map<string, { name: string; count: number }>()
  const walk = (node: ChainNode) => {
    if (node.factory && node.factoryCount && node.factoryCount > 0) {
      const entry = acc.get(node.factory.id) ?? { name: node.factory.name, count: 0 }
      entry.count += node.factoryCount
      acc.set(node.factory.id, entry)
    }
    for (const child of node.children) walk(child)
  }
  walk(root)

  const rows: CostRow[] = []
  for (const [factoryId, { name, count }] of acc) {
    const factory = getFactory(factoryId)
    if (!factory) continue
    const instances = Math.max(1, Math.ceil(count))
    const build = buildCost(factory, getGood) * instances
    const upgrade = totalUpgradeCost(factory, getGood) * instances
    rows.push({ factoryId, factoryName: name, count, instances, build, upgrade })
  }
  return rows.sort((a, b) => b.build - a.build)
}

const costRows = computed(() => collectCosts(chain.value))

const totalBuild = computed(() =>
  costRows.value.reduce((s, r) => s + r.build, 0),
)
const totalFull = computed(() =>
  costRows.value.reduce((s, r) => s + r.build + r.upgrade, 0),
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

    <div v-if="costRows.length" class="rounded-md border border-border bg-card">
      <div class="px-4 py-3 border-b border-border flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div class="flex items-baseline gap-2">
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
            Стоимость постройки
          </span>
          <span class="text-lg font-mono tabular-nums">
            {{ formatCredits(totalBuild) }}
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
            С апгрейдом до 5
          </span>
          <span class="text-lg font-mono tabular-nums text-muted-foreground">
            {{ formatCredits(totalFull) }}
          </span>
        </div>
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[10px] uppercase tracking-wider text-muted-foreground">
            <th class="text-left font-medium px-4 py-2">Фабрика</th>
            <th class="text-right font-medium px-4 py-2">Нужно</th>
            <th class="text-right font-medium px-4 py-2">Шт.</th>
            <th class="text-right font-medium px-4 py-2">Постройка</th>
            <th class="text-right font-medium px-4 py-2">Апгрейд 1→5</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in costRows"
            :key="row.factoryId"
            class="border-t border-border/60"
          >
            <td class="px-4 py-2">{{ row.factoryName }}</td>
            <td class="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">
              {{ row.count.toFixed(2) }}
            </td>
            <td class="px-4 py-2 text-right font-mono tabular-nums">
              {{ row.instances }}
            </td>
            <td class="px-4 py-2 text-right font-mono tabular-nums">
              {{ formatCredits(row.build) }}
            </td>
            <td class="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">
              {{ formatCredits(row.upgrade) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <pre class="text-xs font-mono p-4 rounded-md bg-card border border-border overflow-auto">{{ chain }}</pre>
  </section>
</template>
