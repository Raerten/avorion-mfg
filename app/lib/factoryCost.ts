/**
 * Factory build and size-upgrade cost math, ported from the Sovgut
 * avorion-tools project (src/pages/factories/componets/CurrentStation).
 *
 * Costs are derived at runtime from per-commodity prices — no cost value
 * is stored per factory. Everything flows from the per-cycle trade
 * margin (output value − input value).
 *
 *   margin       = Σ output.amount · price − Σ input.amount · price
 *   buildCost    = 2_500_000 + margin · 3500                (credits)
 *   upgradeCost  = margin · 1000 · size                     (credits, size 1..5)
 *
 * `upgradeCost(size)` is the cost to reach a given size tier, not the
 * incremental step from the previous one. Total credits to go from the
 * default size to size 5 is therefore Σ upgradeCost(1..5) = margin · 1000 · 15.
 */
import type { Factory, Good, GoodId } from '~/types/factory'

export type FactorySize = 1 | 2 | 3 | 4 | 5
export const FACTORY_SIZES: readonly FactorySize[] = [1, 2, 3, 4, 5] as const
export const FACTORY_SIZE_LABELS: Record<FactorySize, string> = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
  5: 'XXL',
}

/**
 * Per-cycle credit margin (outputs − inputs). Optional inputs are
 * ignored — they represent yield boosts, not required recipe slots,
 * and charging them here would understate profitability.
 */
export function cycleMargin(
  factory: Factory,
  getGood: (id: GoodId) => Good | undefined,
): number {
  const value = (amount: number, id: GoodId): number =>
    amount * (getGood(id)?.price ?? 0)

  const outputValue = factory.outputs.reduce(
    (sum, o) => sum + value(o.amount, o.goodId),
    0,
  )
  const inputValue = factory.inputs.reduce(
    (sum, i) => (i.optional ? sum : sum + value(i.amount, i.goodId)),
    0,
  )
  return outputValue - inputValue
}

/** Founding cost of a single factory instance (default size). */
export function buildCost(
  factory: Factory,
  getGood: (id: GoodId) => Good | undefined,
): number {
  return 2_500_000 + cycleMargin(factory, getGood) * 3500
}

/** Cost to upgrade the factory to a given size (1..5). */
export function upgradeCost(
  factory: Factory,
  size: FactorySize,
  getGood: (id: GoodId) => Good | undefined,
): number {
  return cycleMargin(factory, getGood) * 1000 * size
}

/** Sum of upgrade costs from size 1 through 5 inclusive. */
export function totalUpgradeCost(
  factory: Factory,
  getGood: (id: GoodId) => Good | undefined,
): number {
  // 1 + 2 + 3 + 4 + 5 = 15
  return cycleMargin(factory, getGood) * 1000 * 15
}

/**
 * Compact credit formatter. Avorion prices range from a few thousand
 * to hundreds of millions, so we switch units based on magnitude:
 *   < 10k     → 1 234 ¢
 *   < 1M      → 12.3k ¢
 *   < 1B      → 12.34M ¢
 *   ≥ 1B      → 1.23B ¢
 * Uses a narrow no-break space to keep the value and unit together.
 */
export function formatCredits(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  const nbsp = '\u202F'
  if (abs < 10_000) {
    return `${sign}${Math.round(abs).toLocaleString('ru-RU')}${nbsp}¢`
  }
  if (abs < 1_000_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}k${nbsp}¢`
  }
  if (abs < 1_000_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}M${nbsp}¢`
  }
  return `${sign}${(abs / 1_000_000_000).toFixed(2)}B${nbsp}¢`
}
