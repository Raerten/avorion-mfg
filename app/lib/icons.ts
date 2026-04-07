/**
 * Mapping from Good id to its icon filename in `public/icons/`.
 *
 * The PNGs are sourced from https://github.com/Sovgut/avorion-tools (CC-BY).
 * They live under `public/icons/{file}.png` and are served at `/icons/{file}.png`
 * by Nuxt's static asset pipeline. Several goods intentionally share the same
 * file (e.g. gold/silver/platinum all use `metal-bar`) — that mirrors the
 * upstream choice.
 *
 * Use {@link goodIconUrl} to resolve a URL with a generic fallback.
 */
const ICON_FILES: Record<string, string> = {
  // raw
  'iron-ore': 'rock',
  'coal': 'fossil-fuel',
  'raw-oil': 'oil-drum',
  'silicon': 'silicium',
  'copper': 'copper',
  'lead': 'lead',
  'zinc': 'zinc',
  'aluminium': 'aluminium',
  'gold': 'metal-bar',
  'silver': 'metal-bar',
  'platinum': 'metal-bar',

  // basic
  'water': 'water',
  'energy-cell': 'battery-pack-alt',
  'hydrogen': 'hydrogen',
  'helium': 'helium',
  'neon': 'neon',
  'chlorine': 'chlorine',
  'fluorine': 'fluorine',
  'nitrogen': 'nitrogen',
  'oxygen': 'oxygen',
  'wheat': 'wheat',
  'bio-gas': 'bio-gas',
  'livestock': 'cattle',
  'sheep': 'sheep',
  'glass': 'metal-disc',
  'steel': 'i-beam',
  'oil': 'oil-drum',
  'plastic': 'cargo-hold',
  'rubber': 'cubes',
  'chemicals': 'chemical',
  'carbon': 'carbon',
  'fabric': 'fabric',
  'paint': 'paint',
  'adhesive': 'adhesive',
  'scrap-metal': 'scrap-metal',
  'crystal': 'crystal',
  'fuel': 'fuel',
  'ammunition': 'ammo-box',

  // mid
  'conductor': 'conductor',
  'wire': 'wire',
  'semi-conductor': 'semi-conductor',
  'transformator': 'grenade',
  'servo': 'servo',
  'steel-tube': 'steel-tube',
  'high-pressure-tube': 'high-pressure-tube',
  'metal-plate': 'metal-scales',
  'electromagnet': 'electro-magnet',
  'microchip': 'microchip',
  'nanobot': 'nanobots',
  'energy-container': 'electric',
  'plasma-cell': 'plasma-cell',
  'energy-tube': 'energy-tube',
  'power-unit': 'power-unit',
  'turbine': 'turbine',
  'gauss-rail': 'gauss-rail',
  'ammunition-1': 'ammunition-s',
  'ammunition-2': 'ammunition-l',
  'solar-cell': 'solar-cell',
  'solar-panel': 'satellite-solarpanel',
  'computer-component': 'microchip',
  'laser-head': 'laser-head',
  'gun': 'bolter-gun',
  'warhead': 'warhead',

  // adv
  'laser-compressor': 'laser-compressor',
  'laser-modulator': 'laser-modulator',
  'energy-invertor': 'energy-inverter',
  'anti-grav-unit': 'antigrav-unit',
  'targeting-system': 'targeting-system',
  'processor': 'processor',

  // end
  'medical-supplies': 'medical-supplies',
  'tools': 'tools',
  'liquor': 'martini',
  'body-armor': 'kevlar-vest',
  'vehicle': 'apc',
  'war-robot': 'missile-mech',
  'mining-robot': 'robot-golem',
  'accelerator': 'electron-accelerator',
  'satellite': 'satellite',

  // hi
  'turret': 'turret',
  'rocket': 'rocket',
  'tesla-coil': 'industrial-tesla-coil',
}

const FALLBACK = '/icons/rock.png'

export function goodIconUrl(id: string): string {
  const file = ICON_FILES[id]
  return file ? `/icons/${file}.png` : FALLBACK
}
