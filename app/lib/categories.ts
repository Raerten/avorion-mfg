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
  consumer: {
    label: 'Потребитель',
    chip: 'bg-fuchsia-950 border-fuchsia-700 text-fuchsia-300 hover:bg-fuchsia-900',
    dot: 'bg-fuchsia-600',
  },
}

/**
 * Hex colors per category, mirroring the Tailwind `*-600` swatches used
 * in `CATEGORY_STYLES.dot`. Used where Tailwind classes can't reach —
 * e.g. the vue-flow MiniMap which paints `<rect>`s via JS props.
 */
export const CATEGORY_HEX: Record<FactoryCategory, string> = {
  mine: '#16a34a',     // green-600
  basic: '#2563eb',    // blue-600
  mid: '#d97706',      // amber-600
  adv: '#9333ea',      // purple-600
  end: '#0d9488',      // teal-600
  hi: '#dc2626',       // red-600
  consumer: '#c026d3', // fuchsia-600
}

/** Sidebar groups in display order. */
export const CATEGORY_GROUPS: { title: string; categories: FactoryCategory[] }[] = [
  { title: 'Шахты', categories: ['mine'] },
  { title: 'Базовые', categories: ['basic'] },
  { title: 'Средний уровень', categories: ['mid'] },
  { title: 'Продвинутые', categories: ['adv'] },
  { title: 'Конечные продукты', categories: ['end'] },
  { title: 'Хай-тек / Турели', categories: ['hi'] },
  { title: 'Станции-потребители', categories: ['consumer'] },
]
