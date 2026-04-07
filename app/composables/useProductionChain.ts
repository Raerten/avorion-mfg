import type { ChainNode, Factory, GoodId } from '~/types/factory'
import { useGameData } from './useGameData'

/**
 * Resolve the production chain required to sustain `targetRatePerHour`
 * units/hour of `targetGoodId`.
 *
 * Strategy: depth-first walk. For each node pick the first producer
 * (future: allow user-selected producer per good). A visited set prevents
 * infinite recursion on cyclic recipes (shouldn't exist, but safe).
 */
export function useProductionChain() {
  const { getGood, getProducers } = useGameData()

  function resolve(
    targetGoodId: GoodId,
    targetRatePerHour: number,
    visited: Set<GoodId> = new Set(),
  ): ChainNode | null {
    const good = getGood(targetGoodId)
    if (!good) return null

    const node: ChainNode = {
      good,
      ratePerHour: targetRatePerHour,
      children: [],
    }

    if (good.raw || visited.has(targetGoodId)) return node

    const producers = getProducers(targetGoodId)
    const factory: Factory | undefined = producers[0]
    if (!factory) return node

    const output = factory.outputs.find(o => o.goodId === targetGoodId)
    if (!output) return node

    const cyclesPerHour = 3600 / factory.cycleSeconds
    const outputPerFactoryPerHour = output.amount * cyclesPerHour
    const factoryCount = targetRatePerHour / outputPerFactoryPerHour

    node.factory = factory
    node.factoryCount = factoryCount

    const nextVisited = new Set(visited)
    nextVisited.add(targetGoodId)

    for (const input of factory.inputs) {
      const inputPerFactoryPerHour = input.amount * cyclesPerHour
      const inputRatePerHour = inputPerFactoryPerHour * factoryCount
      const child = resolve(input.goodId, inputRatePerHour, nextVisited)
      if (child) node.children.push(child)
    }

    return node
  }

  return { resolve }
}
