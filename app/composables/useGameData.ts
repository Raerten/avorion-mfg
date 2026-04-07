import goodsJson from '~/data/goods.json'
import factoriesJson from '~/data/factories.json'
import type { Factory, FactoryId, Good, GoodId } from '~/types/factory'

/**
 * Single source of truth for static game data.
 * JSON files in app/data/ are bundled at build time and exposed as
 * readonly maps for O(1) lookup by id.
 */
const goods = goodsJson as Good[]
const factories = factoriesJson as Factory[]

const goodsById = new Map<GoodId, Good>(goods.map(g => [g.id, g]))
const factoriesById = new Map<FactoryId, Factory>(factories.map(f => [f.id, f]))

/** Factories producing a given good. A good may have more than one producer. */
const producersByGood = new Map<GoodId, Factory[]>()
/** Factories that consume a given good as an input. */
const consumersByGood = new Map<GoodId, Factory[]>()

for (const f of factories) {
  for (const out of f.outputs) {
    const list = producersByGood.get(out.goodId) ?? []
    list.push(f)
    producersByGood.set(out.goodId, list)
  }
  for (const inp of f.inputs) {
    const list = consumersByGood.get(inp.goodId) ?? []
    list.push(f)
    consumersByGood.set(inp.goodId, list)
  }
}

/**
 * Walk up the input tree of a factory to find every "root" — either a mine
 * factory or a missing producer (returned as `?<goodId>` so the UI can flag
 * goods that have no in-game source and must be bought from NPC).
 */
function findRoots(factoryId: FactoryId, visited = new Set<FactoryId>()): Set<string> {
  if (visited.has(factoryId)) return new Set()
  visited.add(factoryId)
  const f = factoriesById.get(factoryId)
  if (!f) return new Set()
  if (f.category === 'mine' || f.inputs.length === 0) return new Set([factoryId])

  const roots = new Set<string>()
  for (const inp of f.inputs) {
    if (inp.optional) continue
    const producers = producersByGood.get(inp.goodId) ?? []
    if (producers.length === 0) {
      roots.add('?' + inp.goodId)
    } else {
      // pick first producer (matches the rest of the resolver convention)
      for (const r of findRoots(producers[0]!.id, new Set(visited))) {
        roots.add(r)
      }
    }
  }
  return roots
}

export function useGameData() {
  return {
    goods,
    factories,
    getGood: (id: GoodId) => goodsById.get(id),
    getFactory: (id: FactoryId) => factoriesById.get(id),
    getProducers: (id: GoodId): Factory[] => producersByGood.get(id) ?? [],
    getConsumers: (id: GoodId): Factory[] => consumersByGood.get(id) ?? [],
    findRoots,
  }
}
