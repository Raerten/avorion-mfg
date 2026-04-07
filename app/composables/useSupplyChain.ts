import type { Edge, GraphEdge, GraphNode, Node, Viewport } from '@vue-flow/core'

/**
 * Persistence helpers for the supply chain builder.
 *
 * VueFlow's internal store (accessed via `useVueFlow()`) is the single
 * source of truth for nodes and edges — `<VueFlow>` does not honor
 * two-way `v-model` bindings, it just consumes `:nodes` / `:edges` once
 * for initialization. So this composable only deals with serialization
 * to/from localStorage; the page wires it into VueFlow lifecycle hooks.
 *
 * Persisted shape is intentionally minimal so reloading produces clean
 * nodes/edges without the dozens of computed fields VueFlow accretes
 * on its in-memory objects (computedPosition, dimensions, handleBounds, …).
 */
const STORAGE_KEY = 'avorion.supply.v1'

export interface FactoryNodeData {
  factoryId: string
  /** Number of parallel production lines for this factory instance. */
  lines: number
}

export type FactoryFlowNode = Node<FactoryNodeData>

interface Persisted {
  nodes: FactoryFlowNode[]
  edges: Edge[]
  counter: number
  viewport?: Viewport
}

let counter = 0

export function nextNodeId(): string {
  counter += 1
  return `n${counter}`
}

export function loadSupplyChain(): Persisted | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Persisted
    counter = Math.max(counter, s.counter ?? 0)
    return {
      nodes: (s.nodes ?? []).map(n => ({
        id: n.id,
        type: n.type ?? 'factory',
        position: { x: n.position.x, y: n.position.y },
        data: {
          factoryId: n.data?.factoryId ?? '',
          lines: Math.max(1, Math.floor(n.data?.lines ?? 1)),
        },
      })),
      edges: (s.edges ?? []).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        animated: true,
      })),
      counter: s.counter ?? 0,
      viewport: s.viewport,
    }
  } catch {
    return null
  }
}

export function saveSupplyChain(
  nodes: GraphNode[],
  edges: GraphEdge[],
  viewport?: Viewport,
) {
  if (!import.meta.client) return
  try {
    const payload: Persisted = {
      nodes: nodes.map(n => {
        const d = n.data as FactoryNodeData | undefined
        return {
          id: n.id,
          type: n.type ?? 'factory',
          position: { x: n.position.x, y: n.position.y },
          data: {
            factoryId: d?.factoryId ?? '',
            lines: Math.max(1, Math.floor(d?.lines ?? 1)),
          },
        }
      }),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        animated: true,
      })),
      counter,
      viewport,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // quota / serialization — drop silently
  }
}

export function clearSupplyChainStorage() {
  if (!import.meta.client) return
  counter = 0
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
