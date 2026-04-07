/**
 * Domain types for Avorion factory/production-chain data.
 *
 * A Good is any tradable resource (raw or produced).
 * A Factory defines a recipe: input goods -> output goods per production cycle.
 * Production chains are derived by walking Factory.inputs recursively until
 * every input is a raw Good (no factory produces it) or explicitly marked raw.
 */

export type GoodId = string
export type FactoryId = string

/**
 * Tech tier of a good or factory. Mirrors the in-game progression:
 *   raw → basic → mid → adv → end → hi (high-tech / weapons)
 *
 * Goods use `raw` for resources that come from mines / are not produced
 * by any processing factory. Factories use `mine` for the actual mining
 * structures that yield those raw goods.
 */
export type GoodCategory = 'raw' | 'basic' | 'mid' | 'adv' | 'end' | 'hi'
export type FactoryCategory = 'mine' | 'basic' | 'mid' | 'adv' | 'end' | 'hi'

export interface Good {
  id: GoodId
  name: string
  category: GoodCategory
}

export interface FactoryIO {
  goodId: GoodId
  /** Units consumed/produced per production cycle. */
  amount: number
  /** Optional inputs improve yield but are not strictly required. */
  optional?: boolean
}

export interface Factory {
  id: FactoryId
  name: string
  category: FactoryCategory
  /** Seconds per production cycle. */
  cycleSeconds: number
  inputs: FactoryIO[]
  outputs: FactoryIO[]
}

/** A node in a resolved production chain (see composables/useProductionChain). */
export interface ChainNode {
  good: Good
  /** Units per hour required at this node. */
  ratePerHour: number
  /** Factory chosen to produce this good, if any. */
  factory?: Factory
  /** Number of factory instances needed to sustain ratePerHour. */
  factoryCount?: number
  children: ChainNode[]
}
