# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Client-side web tool that helps Avorion players plan **manufactories**: compute production chains for a target output rate, and visualize factory dependency graphs. All game data is curated in-repo as JSON — there is no backend.

## Stack

- **Nuxt 4** (`app/` srcDir layout), `ssr: false` — pure SPA
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (NOT the Nuxt Tailwind module; v4 uses the Vite plugin directly)
- **shadcn-nuxt** generating components into `app/components/ui/` on top of **reka-ui**
- **TypeScript strict**, Vue 3 `<script setup lang="ts">`
- **pnpm**
- No RxJS, no Pinia yet — Vue reactivity (`ref`/`computed`) is the default. Only reach for a store if state genuinely needs to be shared across unrelated routes.
- **In-game data and all user-facing copy is in Russian.** `goods.json` / `factories.json` names, page titles, and UI labels are RU. Keep new strings in Russian.

## Commands

```bash
pnpm dev              # dev server on http://localhost:3000
pnpm build            # production build
pnpm generate         # static site build (for hosting on any static host)
pnpm preview          # preview production build
pnpm nuxt prepare     # regenerate .nuxt types after config/module changes
pnpm exec tsc --noEmit  # typecheck (vue-tsc is NOT installed; plain tsc works fine)

# shadcn-vue component scaffolding (writes into app/components/ui/)
pnpm dlx shadcn-vue@latest add button
```

No tests or ESLint yet — only `tsc --noEmit` for type safety. If you add Vitest or ESLint, update this file.

## Architecture

### Source layout (Nuxt 4 `app/` srcDir)

```
app/
  assets/css/tailwind.css   # Tailwind v4 entrypoint + @theme tokens (single source of design tokens)
  components/ui/            # shadcn-vue generated components (do not hand-edit)
  components/               # app-specific components
  composables/              # useGameData, useProductionChain, ...
  data/                     # goods.json, factories.json — curated game data, bundled at build time
  layouts/default.vue       # shell with top nav
  lib/utils.ts              # cn() helper (clsx + tailwind-merge) — required by shadcn-vue components
  lib/icons.ts              # SVG icon strings keyed by Good id — render via <GoodIcon :good-id>
  lib/categories.ts         # Tailwind class maps + RU labels for the 6 factory categories
  pages/                    # file-based routing: /, /calculator, /chains, /visualizer, /factories, /supply
  types/factory.ts          # Good, Factory, ChainNode domain types
  app.vue                   # <NuxtLayout><NuxtPage/></NuxtLayout>
```

### Data model (`app/types/factory.ts`)

The domain is small and deliberate — keep it that way:

- **`Good`** — a tradable resource. `raw: true` means no factory produces it (mined/looted); chain resolution terminates at raw goods.
- **`Factory`** — a recipe: `inputs[]` and `outputs[]` measured in *units per cycle*, plus `cycleSeconds`. Production rate is derived (`amount * 3600 / cycleSeconds`), never stored.
- **`ChainNode`** — a resolved node in a production chain, carrying `ratePerHour`, the chosen `factory`, the fractional `factoryCount` needed to sustain that rate, and `children` for its inputs.

### Data layer (`app/composables/useGameData.ts`)

`goods.json` and `factories.json` are imported statically (bundled at build time) and exposed through `useGameData()`, which precomputes:

- `goodsById` / `factoriesById` — O(1) lookup
- `producersByGood` — reverse index: which factories output a given good

**Always go through `useGameData()`** instead of importing the JSON directly, so indices stay consistent and callers don't each rebuild maps.

### Chain resolution (`app/composables/useProductionChain.ts`)

`resolve(goodId, ratePerHour)` does a depth-first walk:

1. Look up the good. If raw or already visited (cycle guard), return a leaf node.
2. Pick the first producer from `getProducers()`. *TODO: when a good has multiple producers, the user should be able to pick.*
3. Compute `factoryCount = targetRate / (outputAmount * cyclesPerHour)` — fractional is intentional; it tells the player "you need 1.5 steel factories".
4. For each input, recurse with `inputRate = inputAmount * cyclesPerHour * factoryCount`.

The resolver is pure and stateless — all inputs come from `useGameData()`, so it's safe to call inside `computed()`.

### Styling

Tailwind v4 uses the **`@theme` block** in `app/assets/css/tailwind.css` as the single source of design tokens (colors, fonts, radii). There is no `tailwind.config.ts`. Dark is the default and only theme for now (`:root { color-scheme: dark }`), with a `dark` custom variant already wired up if/when a light mode is added. Prefer semantic token classes (`bg-card`, `text-muted-foreground`, `border-border`) over raw color utilities so theme changes stay centralized.

### Adding a shadcn-vue component

```bash
pnpm dlx shadcn-vue@latest add <component>
```

The `shadcn-nuxt` module (configured in `nuxt.config.ts` with `componentDir: './app/components/ui'` and empty `prefix`) makes them auto-imported as `<Button>`, `<Dialog>`, etc. Don't hand-edit generated files — re-run the CLI to update.

## Conventions

- **Rates are always per hour** in UI and `ChainNode`. Factory JSON stores per-cycle amounts + `cycleSeconds`; conversion happens in the resolver.
- **IDs are kebab-case strings** (`"iron-ore"`, `"steel-factory"`) and must be unique within their file. Referential integrity between `goods.json` and `factories.json` is not validated at build time yet — if you break it, the resolver will silently drop nodes. Consider adding a validation step before committing data changes.
- **JSON data is the product, not an afterthought** — when editing `goods.json` / `factories.json`, double-check amounts and cycle times against the source (Avorion wiki or game files). Bad data looks identical to bad code to the user. Reference manufactory database: https://github.com/Sovgut/avorion-tools
- **No SSR**. Don't reach for `useAsyncData`/`useFetch` for the bundled JSON — just `import` it. `useState` is fine for cross-component client state.
- **Keep components and pages small.** Big SFCs are a smell — split them. A page should mostly compose smaller components from `app/components/`, not own large `<template>` trees or fat `<script setup>` blocks. Extract:
  - distinct UI sections into their own components
  - non-trivial logic into composables (`app/composables/`)
  - pure helpers into `app/lib/`

  Rough guideline: if a `.vue` file is pushing past ~150 lines or its template has more than 2–3 logical sections, split it before adding more.
- **Full-screen pages** (own header, no app chrome) use `definePageMeta({ layout: false })` to bypass `layouts/default.vue`. See `pages/chains.vue`.
- **Tailwind v4 class scanning**: when storing class strings in `.ts` files (e.g. `lib/categories.ts`), write them as complete literals — the JIT scanner does substring matching, not template evaluation, so `` `bg-${color}-950` `` won't be picked up.

## Preview / dev server

`.claude/launch.json` defines a `nuxt-dev` configuration. Use `preview_start` with that name (not Bash + `pnpm dev`) when verifying UI changes — the existing process is reused if already running.
