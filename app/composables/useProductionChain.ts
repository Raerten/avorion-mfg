import type { ChainNode, Factory, FactoryId, GoodId } from '~/types/factory'
import { useGameData } from './useGameData'

/**
 * Caller-supplied overrides: when resolving a chain, use the given factory id
 * for the named good instead of the default (first) producer. Lets the UI let
 * players pick between variant recipes (e.g. steel from ore vs scrap).
 */
export type ProducerChoices = Readonly<Record<GoodId, FactoryId>>

/**
 * Resolve the production chain required to sustain `targetRatePerHour`
 * units/hour of `targetGoodId`.
 *
 * Strategy: depth-first walk. For each good pick the producer named in
 * `choices` if present, otherwise the first producer. A visited set prevents
 * infinite recursion on cyclic recipes.
 */
export function useProductionChain() {
  const { getGood, getFactory, getProducers } = useGameData()

  function resolve(
    targetGoodId: GoodId,
    targetRatePerHour: number,
    choices: ProducerChoices = {},
    visited: Set<GoodId> = new Set(),
  ): ChainNode | null {
    const good = getGood(targetGoodId)
    if (!good) return null

    const node: ChainNode = {
      good,
      ratePerHour: targetRatePerHour,
      children: [],
    }

    if (good.category === 'raw' || visited.has(targetGoodId)) return node

    const producers = getProducers(targetGoodId)
    const chosenId = choices[targetGoodId]
    const factory: Factory | undefined =
      (chosenId ? getFactory(chosenId) : undefined) ?? producers[0]
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
      const child = resolve(input.goodId, inputRatePerHour, choices, nextVisited)
      if (child) node.children.push(child)
    }

    return node
  }

  return { resolve }
}
