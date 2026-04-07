import type { FactoryCategory } from '~/types/factory'

/**
 * Display labels and Tailwind class strings for each factory category.
 *
 * The `chip` class is used for clickable factory pills (background + border
 * + text), `dot` for the legend swatches. Class strings are written out
 * verbatim so the Tailwind v4 JIT scanner picks them up at build time.
 */
export interface CategoryStyle {
  label: string
  chip: string
  dot: string
}

export const CATEGORY_STYLES: Record<FactoryCategory, CategoryStyle> = {
  mine: {
    label: 'Шахта',
    chip: 'bg-green-950 border-green-700 text-green-300 hover:bg-green-900',
    dot: 'bg-green-600',
  },
  basic: {
    label: 'Базовая',
    chip: 'bg-blue-950 border-blue-700 text-blue-300 hover:bg-blue-900',
    dot: 'bg-blue-600',
  },
  mid: {
    label: 'Средняя',
    chip: 'bg-amber-950 border-amber-700 text-amber-300 hover:bg-amber-900',
    dot: 'bg-amber-600',
  },
  adv: {
    label: 'Продвинутая',
    chip: 'bg-purple-950 border-purple-700 text-purple-300 hover:bg-purple-900',
    dot: 'bg-purple-600',
  },
  end: {
    label: 'Конечный',
    chip: 'bg-teal-950 border-teal-700 text-teal-300 hover:bg-teal-900',
    dot: 'bg-teal-600',
  },
  hi: {
    label: 'Хай-тек',
    chip: 'bg-red-950 border-red-700 text-red-300 hover:bg-red-900',
    dot: 'bg-red-600',
  },
}

/** Sidebar groups in display order. */
export const CATEGORY_GROUPS: { title: string; categories: FactoryCategory[] }[] = [
  { title: 'Шахты', categories: ['mine'] },
  { title: 'Базовые', categories: ['basic'] },
  { title: 'Средний уровень', categories: ['mid'] },
  { title: 'Продвинутые', categories: ['adv'] },
  { title: 'Конечные продукты', categories: ['end'] },
  { title: 'Хай-тек / Турели', categories: ['hi'] },
]
