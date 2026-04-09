# Avorion Manufactory Helper

A web tool for [Avorion](https://store.steampowered.com/app/445220/Avorion/) players to plan manufactories — compute production chains, browse factory recipes, and visually design supply networks.

**[Live](https://raerten.github.io/avorion-mfg/)**

All game data is curated in-repo as JSON. No backend required — the app runs entirely in the browser.

## Features

- **Factory Catalog** — browse and search all factories with detailed input/output info, filterable by category
- **Supply Chain Designer** — drag-and-drop visual editor to design factory networks, auto-connect inputs/outputs, and see resource flow at a glance

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm generate    # static site — deploy to any static host
```

## Tech Stack

- **Nuxt 4** (SPA mode)
- **Vue 3** with TypeScript
- **Tailwind CSS v4**
- **shadcn-vue** + **reka-ui** for UI components
- **Vue Flow** for the visual graph editor

## Game Data

Factory and goods data lives in `app/data/` as JSON files. When editing, verify amounts and cycle times against the [Avorion wiki](https://avorion.fandom.com/wiki/Avorion_Wiki) or game files. Reference database: [avorion-tools](https://github.com/Sovgut/avorion-tools).

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Open a pull request

## License

This project is not affiliated with or endorsed by Boxelware, the developers of Avorion.
