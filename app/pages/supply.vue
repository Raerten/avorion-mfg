<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VueFlow, useVueFlow, type Connection, type GraphNode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { CATEGORY_HEX } from '~/lib/categories'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import FactoryNode from '~/components/supply/FactoryNode.vue'
import FactoryPalette from '~/components/supply/FactoryPalette.vue'
import FactoryPicker from '~/components/supply/FactoryPicker.vue'
import FactoryCard from '~/components/FactoryCard.vue'
import { useGameData } from '~/composables/useGameData'
import {
  type FactoryFlowNode,
  clearSupplyChainStorage,
  loadSupplyChain,
  nextNodeId,
  saveSupplyChain,
} from '~/composables/useSupplyChain'

definePageMeta({ layout: false })
useHead({ title: 'Supply Chain · Avorion MFG' })

const { getFactory } = useGameData()

// VueFlow's internal store is the source of truth — we drive it via the
// composable's API rather than two-way binding.
const {
  nodes,
  edges,
  addNodes,
  addEdges,
  removeNodes,
  removeEdges,
  setNodes,
  setEdges,
  setViewport,
  getViewport,
  screenToFlowCoordinate,
  onConnect,
  onPaneReady,
  onNodeDragStop,
  onViewportChangeEnd,
  onEdgeDoubleClick,
  fitView,
  setCenter,
} = useVueFlow()

/**
 * MiniMap node fill = the factory's category color, so the preview
 * mirrors what the user sees on the canvas instead of vue-flow's
 * default uniform grey.
 */
function miniMapNodeColor(node: GraphNode): string {
  const data = node.data as { factoryId?: string } | undefined
  const factory = data?.factoryId ? getFactory(data.factoryId) : undefined
  return factory ? CATEGORY_HEX[factory.category] : '#3f3f46'
}

/**
 * Treat MiniMap nodes as links: clicking one centers the canvas on
 * that factory at a comfortable zoom, like jumping to an anchor.
 */
function onMiniMapNodeClick({ node }: { node: GraphNode }) {
  const x = node.position.x + (node.dimensions?.width ?? 0) / 2
  const y = node.position.y + (node.dimensions?.height ?? 0) / 2
  setCenter(x, y, { zoom: 1, duration: 400 })
}

onEdgeDoubleClick(({ edge }) => {
  removeEdges([edge.id])
})

// --- Persistence: hydrate once VueFlow is ready, then autosave on change ----

const hydrated = ref(false)

onPaneReady(() => {
  const saved = loadSupplyChain()
  if (saved) {
    setNodes(saved.nodes)
    setEdges(saved.edges)
    if (saved.viewport) {
      // Restore the exact pan/zoom the user left the canvas at.
      setViewport(saved.viewport)
    } else if (saved.nodes.length > 0) {
      // First time after older save without viewport — fit to content.
      setTimeout(() => fitView({ padding: 0.2 }), 0)
    }
  }
  hydrated.value = true
})

watch(
  [nodes, edges],
  () => {
    if (!hydrated.value) return
    saveSupplyChain(nodes.value, edges.value, getViewport())
  },
  { deep: true },
)

onNodeDragStop(() => {
  if (hydrated.value) saveSupplyChain(nodes.value, edges.value, getViewport())
})

onViewportChangeEnd(() => {
  if (hydrated.value) saveSupplyChain(nodes.value, edges.value, getViewport())
})

// --- Adding factories ---------------------------------------------------------

function addFactoryAt(factoryId: string, position: { x: number; y: number }): string {
  const id = nextNodeId()
  const node: FactoryFlowNode = {
    id,
    type: 'factory',
    position,
    data: { factoryId, lines: 1 },
  }
  addNodes([node])
  return id
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const factoryId = event.dataTransfer?.getData('application/x-avorion-factory')
  if (!factoryId) return
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  addFactoryAt(factoryId, position)
}

// --- Connections --------------------------------------------------------------

onConnect((connection: Connection) => {
  if (!connection.source || !connection.target) return
  if (connection.source === connection.target) return
  // Goods must match — handle ids are `out-<goodId>` and `in-<goodId>`.
  const srcGood = connection.sourceHandle?.startsWith('out-')
    ? connection.sourceHandle.slice(4)
    : null
  const tgtGood = connection.targetHandle?.startsWith('in-')
    ? connection.targetHandle.slice(3)
    : null
  if (!srcGood || !tgtGood || srcGood !== tgtGood) return
  const id = `${connection.source}:${connection.sourceHandle}->${connection.target}:${connection.targetHandle}`
  if (edges.value.some(e => e.id === id)) return
  addEdges([
    {
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      animated: true,
    },
  ])
})

// --- Socket-click picker ------------------------------------------------------

interface PickerState {
  nodeId: string
  goodId: string
  direction: 'in' | 'out'
}
const picker = ref<PickerState | null>(null)

function onNodePick(payload: PickerState) {
  picker.value = payload
}

function onPickerSelect(factoryId: string) {
  const p = picker.value
  if (!p) return
  const sourceNode = nodes.value.find(n => n.id === p.nodeId)
  if (!sourceNode) return

  const dx = p.direction === 'in' ? -340 : 340
  const position = {
    x: sourceNode.position.x + dx,
    y: sourceNode.position.y,
  }
  const newId = addFactoryAt(factoryId, position)

  const newFactory = getFactory(factoryId)
  if (newFactory) {
    if (p.direction === 'in') {
      const out = newFactory.outputs.find(o => o.goodId === p.goodId)
      if (out) {
        addEdges([
          {
            id: `${newId}:out-${p.goodId}->${p.nodeId}:in-${p.goodId}`,
            source: newId,
            target: p.nodeId,
            sourceHandle: 'out-' + p.goodId,
            targetHandle: 'in-' + p.goodId,
            animated: true,
          },
        ])
      }
    } else {
      const inp = newFactory.inputs.find(i => i.goodId === p.goodId)
      if (inp) {
        addEdges([
          {
            id: `${p.nodeId}:out-${p.goodId}->${newId}:in-${p.goodId}`,
            source: p.nodeId,
            target: newId,
            sourceHandle: 'out-' + p.goodId,
            targetHandle: 'in-' + p.goodId,
            animated: true,
          },
        ])
      }
    }
  }

  picker.value = null
}

// --- Node delete --------------------------------------------------------------

function onNodeRemove(id: string) {
  // Drop both the node and any edges it touches.
  const dead = edges.value.filter(e => e.source === id || e.target === id)
  if (dead.length > 0) removeEdges(dead.map(e => e.id))
  removeNodes([id])
}

// --- Node info popup ----------------------------------------------------------

const infoFactoryId = ref<string | null>(null)
const infoFactory = computed(() =>
  infoFactoryId.value ? getFactory(infoFactoryId.value) : null,
)

function onNodeInfo(factoryId: string) {
  infoFactoryId.value = factoryId
}

// --- Clear all ----------------------------------------------------------------

function onClear() {
  if (!confirm('Очистить весь холст?')) return
  setNodes([])
  setEdges([])
  clearSupplyChainStorage()
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-background text-foreground">
    <AppHeader>
      <button
        type="button"
        class="text-xs px-3 py-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
        @click="onClear"
      >Очистить</button>
    </AppHeader>

    <div class="flex-1 flex min-h-0">
      <FactoryPalette />

      <div class="flex-1 relative" @drop="onDrop" @dragover="onDragOver">
        <VueFlow
          :default-edge-options="{ animated: true }"
          :min-zoom="0.2"
          :max-zoom="2"
          :delete-key-code="['Delete', 'Backspace']"
          class="supply-flow"
        >
          <template #node-factory="nodeProps">
            <FactoryNode
              v-bind="nodeProps"
              @pick="onNodePick"
              @remove="onNodeRemove"
              @info="onNodeInfo"
            />
          </template>

          <Background pattern-color="#2a2f3a" :gap="18" />
          <Controls position="bottom-right" />
          <MiniMap
            pannable
            zoomable
            :node-color="miniMapNodeColor"
            :node-stroke-color="miniMapNodeColor"
            :node-stroke-width="3"
            :node-border-radius="2"
            class="!bg-card/60 !border !border-border supply-minimap"
            @node-click="onMiniMapNodeClick"
          />
        </VueFlow>

        <div
          v-if="hydrated && nodes.length === 0"
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <p class="text-muted-foreground text-sm">
            Перетащите фабрику из списка слева, чтобы начать.
          </p>
        </div>
      </div>
    </div>

    <FactoryPicker
      v-if="picker"
      :good-id="picker.goodId"
      :direction="picker.direction"
      @close="picker = null"
      @select="onPickerSelect"
    />

    <div
      v-if="infoFactory"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      @click.self="infoFactoryId = null"
    >
      <div class="relative w-[min(420px,95vw)]">
        <button
          type="button"
          aria-label="Закрыть"
          class="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-card border border-border shadow-md text-muted-foreground hover:text-foreground hover:border-ring flex items-center justify-center text-sm leading-none z-10 cursor-pointer"
          @click="infoFactoryId = null"
        >✕</button>
        <div class="max-h-[90vh] overflow-y-auto rounded-md">
          <FactoryCard :factory="infoFactory" />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* VueFlow ships light-theme defaults — tune for the app's dark UI. */
.supply-flow {
  --vf-node-bg: transparent;
  --vf-node-text: inherit;
  --vf-connection-path: hsl(190 85% 55%);
  --vf-handle: hsl(190 85% 55%);
  background: transparent;
}
.supply-flow .vue-flow__node {
  cursor: default;
}
.supply-flow .vue-flow__node.dragging {
  cursor: grabbing;
}
.supply-flow .vue-flow__edge-path {
  stroke: hsl(190 85% 55% / 0.7);
  stroke-width: 1.5;
}
.supply-flow .vue-flow__minimap {
  border-radius: 6px;
}
.supply-flow .supply-minimap .vue-flow__minimap-node {
  cursor: pointer;
  transition: opacity 120ms ease;
}
.supply-flow .supply-minimap .vue-flow__minimap-node:hover {
  opacity: 0.75;
}
</style>
