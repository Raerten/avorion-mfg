import type { Edge, GraphEdge, GraphNode, Node, ViewportTransform } from '@vue-flow/core'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

/**
 * Multi-canvas persistence for the supply chain builder.
 *
 * Each canvas is stored independently in localStorage under its own key.
 * A separate index key tracks the list of canvases and which one is active.
 *
 * Migration: the old single-canvas key (`avorion.supply.v1`) is automatically
 * imported as the first canvas when the index doesn't exist yet.
 */

const INDEX_KEY = 'avorion.supply.index'
const CANVAS_PREFIX = 'avorion.supply.canvas.'
const LEGACY_KEY = 'avorion.supply.v1'

export interface FactoryNodeData {
  factoryId: string
  /** Number of parallel production lines for this factory instance. */
  lines: number
  /**
   * When true, the node contributes nothing to the supply graph — it
   * produces no output and its input requirements are ignored.
   */
  disabled?: boolean
  /**
   * Optional user-authored label shown above the node, for tagging
   * instances ("Сектор 12", "Основная линия стали", etc.).
   */
  label?: string
}

export type FactoryFlowNode = Node<FactoryNodeData>

export const COMMENT_DEFAULT_WIDTH = 300
export const COMMENT_DEFAULT_HEIGHT = 200

export interface CommentNodeData {
  text: string
  width: number
  height: number
  color?: string
}

export type CommentFlowNode = Node<CommentNodeData>

export type AnyFlowNode = FactoryFlowNode | CommentFlowNode

export interface Persisted {
  nodes: AnyFlowNode[]
  edges: Edge[]
  counter: number
  viewport?: ViewportTransform
}

export interface CanvasMeta {
  id: string
  name: string
}

interface CanvasIndex {
  active: string
  list: CanvasMeta[]
}

let counter = 0

export function nextNodeId(): string {
  counter += 1
  return `n${counter}`
}

export function ensureCounterAtLeast(min: number) {
  counter = Math.max(counter, min)
}

// ---------------------------------------------------------------------------
// Index management
// ---------------------------------------------------------------------------

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function readIndex(): CanvasIndex | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CanvasIndex
  } catch {
    return null
  }
}

function writeIndex(index: CanvasIndex) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  } catch { /* quota */ }
}

/**
 * Ensure a canvas index exists, migrating legacy data if needed.
 * Returns the current index.
 */
export function ensureIndex(): CanvasIndex {
  let idx = readIndex()
  if (idx && idx.list.length > 0) return idx

  // Migrate legacy single-canvas data
  const defaultId = generateId()
  idx = { active: defaultId, list: [{ id: defaultId, name: 'Схема 1' }] }

  if (import.meta.client) {
    try {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        localStorage.setItem(CANVAS_PREFIX + defaultId, legacy)
        localStorage.removeItem(LEGACY_KEY)
      }
    } catch { /* ignore */ }
  }

  writeIndex(idx)
  return idx
}

export function getCanvasList(): CanvasMeta[] {
  return ensureIndex().list
}

export function getActiveCanvasId(): string {
  return ensureIndex().active
}

export function setActiveCanvas(id: string) {
  const idx = ensureIndex()
  if (idx.list.some(c => c.id === id)) {
    idx.active = id
    writeIndex(idx)
  }
}

export function createCanvas(name: string): string {
  const idx = ensureIndex()
  const id = generateId()
  idx.list.push({ id, name })
  idx.active = id
  writeIndex(idx)
  return id
}

export function renameCanvas(id: string, name: string) {
  const idx = ensureIndex()
  const entry = idx.list.find(c => c.id === id)
  if (entry) {
    entry.name = name
    writeIndex(idx)
  }
}

export function deleteCanvas(id: string) {
  const idx = ensureIndex()
  idx.list = idx.list.filter(c => c.id !== id)
  if (import.meta.client) {
    try { localStorage.removeItem(CANVAS_PREFIX + id) } catch { /* ignore */ }
  }
  // If we deleted the active canvas, switch to the first remaining
  if (idx.active === id) {
    if (idx.list.length === 0) {
      // Always keep at least one canvas
      const newId = generateId()
      idx.list.push({ id: newId, name: 'Схема 1' })
      idx.active = newId
    } else {
      idx.active = idx.list[0]!.id
    }
  }
  writeIndex(idx)
}

// ---------------------------------------------------------------------------
// Canvas data persistence
// ---------------------------------------------------------------------------

function parsePersistedNodes(nodes: AnyFlowNode[]): AnyFlowNode[] {
  return (nodes ?? []).map(n => {
    if (n.type === 'comment') {
      const d = n.data as CommentNodeData
      return {
        id: n.id,
        type: 'comment' as const,
        position: { x: n.position.x, y: n.position.y },
        zIndex: -1,
        data: {
          text: d?.text ?? '',
          width: d?.width ?? COMMENT_DEFAULT_WIDTH,
          height: d?.height ?? COMMENT_DEFAULT_HEIGHT,
          color: d?.color,
        },
      } as CommentFlowNode
    }
    return {
      id: n.id,
      type: n.type ?? 'factory',
      position: { x: n.position.x, y: n.position.y },
      data: {
        factoryId: (n.data as FactoryNodeData)?.factoryId ?? '',
        lines: Math.max(1, Math.floor((n.data as FactoryNodeData)?.lines ?? 1)),
        disabled: (n.data as FactoryNodeData)?.disabled === true,
        label: (n.data as FactoryNodeData)?.label,
      },
    } as FactoryFlowNode
  })
}

function parsePersistedEdges(edges: Edge[]): Edge[] {
  return (edges ?? []).map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    animated: true,
  }))
}

function serializeNodes(nodes: GraphNode[]): AnyFlowNode[] {
  return nodes.map(n => {
    if (n.type === 'comment') {
      const d = n.data as CommentNodeData
      return {
        id: n.id,
        type: 'comment' as const,
        position: { x: n.position.x, y: n.position.y },
        zIndex: -1,
        data: {
          text: d.text ?? '',
          width: d.width ?? COMMENT_DEFAULT_WIDTH,
          height: d.height ?? COMMENT_DEFAULT_HEIGHT,
          color: d.color,
        },
      } as CommentFlowNode
    }
    const d = n.data as FactoryNodeData
    return {
      id: n.id,
      type: n.type ?? 'factory',
      position: { x: n.position.x, y: n.position.y },
      data: {
        factoryId: d.factoryId ?? '',
        lines: Math.max(1, Math.floor(d.lines ?? 1)),
        disabled: d.disabled === true,
        label: d.label,
      },
    } as FactoryFlowNode
  })
}

function serializeEdges(edges: GraphEdge[]): Edge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    animated: true,
  }))
}

export function loadSupplyChain(canvasId?: string): Persisted | null {
  if (!import.meta.client) return null
  const id = canvasId ?? getActiveCanvasId()
  try {
    const raw = localStorage.getItem(CANVAS_PREFIX + id)
    if (!raw) return null
    const s = JSON.parse(raw) as Persisted
    counter = Math.max(counter, s.counter ?? 0)
    return {
      nodes: parsePersistedNodes(s.nodes),
      edges: parsePersistedEdges(s.edges),
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
  viewport?: ViewportTransform,
  canvasId?: string,
) {
  if (!import.meta.client) return
  const id = canvasId ?? getActiveCanvasId()
  try {
    const payload: Persisted = {
      nodes: serializeNodes(nodes),
      edges: serializeEdges(edges),
      counter,
      viewport,
    }
    localStorage.setItem(CANVAS_PREFIX + id, JSON.stringify(payload))
  } catch { /* quota / serialization */ }
}

export function clearSupplyChainStorage(canvasId?: string) {
  if (!import.meta.client) return
  counter = 0
  const id = canvasId ?? getActiveCanvasId()
  try {
    localStorage.removeItem(CANVAS_PREFIX + id)
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

export interface ExportedCanvas {
  version: 1
  name: string
  data: Persisted
}

export function exportCanvas(canvasId?: string): ExportedCanvas | null {
  const idx = ensureIndex()
  const id = canvasId ?? idx.active
  const meta = idx.list.find(c => c.id === id)
  const data = loadSupplyChain(id)
  if (!meta || !data) return null
  return { version: 1, name: meta.name, data }
}

export function importCanvas(json: string): string {
  const parsed = JSON.parse(json) as ExportedCanvas
  if (!parsed.data || !Array.isArray(parsed.data.nodes)) {
    throw new Error('Неверный формат файла')
  }

  const name = parsed.name || 'Импорт'
  const id = createCanvas(name)

  // Rebuild counter from imported node IDs to avoid collisions
  let maxCounter = 0
  for (const n of parsed.data.nodes) {
    const match = n.id?.match(/^n(\d+)$/)
    if (match) maxCounter = Math.max(maxCounter, Number(match[1]))
  }
  counter = Math.max(counter, maxCounter)

  const payload: Persisted = {
    nodes: parsePersistedNodes(parsed.data.nodes),
    edges: parsePersistedEdges(parsed.data.edges),
    counter: maxCounter,
    viewport: parsed.data.viewport,
  }

  try {
    localStorage.setItem(CANVAS_PREFIX + id, JSON.stringify(payload))
  } catch { /* quota */ }

  return id
}

// ---------------------------------------------------------------------------
// Share via URL
// ---------------------------------------------------------------------------

/**
 * Compress current canvas state into a URL-safe string for the `?s=` param.
 */
export function encodeCanvasForUrl(canvasId?: string): string | null {
  const exported = exportCanvas(canvasId)
  if (!exported) return null
  // Strip viewport — the recipient doesn't need our camera position
  const { viewport: _, ...data } = exported.data
  const minimal = { n: exported.name, d: data }
  return compressToEncodedURIComponent(JSON.stringify(minimal))
}

/**
 * Decode a `?s=` param back into an ExportedCanvas-like object.
 * Returns null if the string is invalid.
 */
export function decodeCanvasFromUrl(encoded: string): { name: string; data: Persisted } | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json) as { n: string; d: Omit<Persisted, 'viewport'> }
    if (!parsed.d || !Array.isArray(parsed.d.nodes)) return null
    return {
      name: parsed.n || 'Общая Схема',
      data: {
        nodes: parsePersistedNodes(parsed.d.nodes),
        edges: parsePersistedEdges(parsed.d.edges),
        counter: parsed.d.counter ?? 0,
      },
    }
  } catch {
    return null
  }
}
