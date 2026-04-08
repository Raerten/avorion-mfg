/**
 * Parses Sovgut's avorion-tools TypeScript data files and emits
 * goods.json + factories.json in our project's shape.
 *
 * Reads from: /tmp/sovgut/{stations-metadata,commodities-metadata}.ts
 * Writes to:  app/data/{goods,factories}.json
 *
 * Key decisions:
 *  - IDs: kebab-case of the Sovgut enum name (e.g. SteelFactory -> steel-factory).
 *  - Variants: each StationVariation becomes its own Factory. First variant keeps
 *    the base id; subsequent variants get `-v2`, `-v3` suffix.
 *  - Cycle time: defaults to 60s (Sovgut source has no cycle data; Avorion's
 *    real cycle times vary but the wiki is behind Cloudflare).
 *  - Optional inputs/outputs: `isOptional` preserved via the existing `optional` field.
 *  - Infinity amounts: skipped (those are pure "consumer" stations — docks, habitats
 *    etc. — not real production and irrelevant to chain resolution).
 *  - Consumer-only stations (no ingredients/results with finite amounts): skipped entirely.
 *  - Consumables: skipped (they're "also needed" fluff for mine/consumer stations,
 *    not part of the production recipe our resolver models).
 *  - Russian names: preserved from existing data where IDs match; new items get
 *    a manual translation table plus an EN fallback for anything missed.
 *  - Categories: preserved from existing data where IDs match; new items assigned
 *    by topological depth from raw → end/hi.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(__dirname, '..')
const SOVGUT_DIR = process.env.SOVGUT_DIR || '/tmp/sovgut'

// ---------- parse stations-metadata.ts ----------

const stationsSrc = readFileSync(`${SOVGUT_DIR}/stations-metadata.ts`, 'utf8')

/** @returns {{ name: string, variations: Array<{ ingredients: any[], results: any[], consumables: any[] }> }[]} */
function parseStations(src) {
  const stations = []
  // Match each [Station.<Name>]: { ... variations: [ ... ], ... },
  const stationRe = /\[Station\.(\w+)\]:\s*\{([\s\S]*?)\n\s{2}\},/g
  let m
  while ((m = stationRe.exec(src))) {
    const name = m[1]
    const body = m[2]
    const variations = []
    // Each `new StationVariation({ ... })` call
    const varRe = /new StationVariation\(\{([\s\S]*?)\}\),?/g
    let v
    while ((v = varRe.exec(body))) {
      const vBody = v[1]
      variations.push({
        ingredients: parseCommodityArray(vBody, 'ingredients'),
        results: parseCommodityArray(vBody, 'results'),
        consumables: parseCommodityArray(vBody, 'consumables'),
        isConsumer: /isConsumer:\s*true/.test(vBody),
      })
    }
    stations.push({ name, variations })
  }
  return stations
}

function parseCommodityArray(body, key) {
  const re = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\]`)
  const m = body.match(re)
  if (!m) return []
  const inner = m[1]
  const items = []
  const itemRe = /\{\s*type:\s*Commodity\.(\w+),\s*amount:\s*([\w.]+)(?:\s*,\s*isOptional:\s*(true|false))?\s*\}/g
  let it
  while ((it = itemRe.exec(inner))) {
    const commodity = it[1]
    const amountRaw = it[2]
    const isOptional = it[3] === 'true'
    if (amountRaw === 'Infinity') continue // skip consumer-infinity entries
    const amount = Number(amountRaw)
    if (!Number.isFinite(amount)) continue
    items.push({ commodity, amount, isOptional })
  }
  return items
}

const stations = parseStations(stationsSrc)

// ---------- ID + name helpers ----------

/** PascalCase -> kebab-case. Special-cases embedded caps like "IO". */
function kebab(s) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

const commodityId = (c) => kebab(c)
// SteelFactory -> steel-factory; drop trailing "factory"/"manufacturer" etc? No — keep full, users expect it.
const stationBaseId = (s) => kebab(s)

// ---------- load existing data to preserve RU names + cycleSeconds + categories ----------

const existingGoods = JSON.parse(readFileSync(`${REPO}/app/data/goods.json`, 'utf8'))
const existingFactories = JSON.parse(readFileSync(`${REPO}/app/data/factories.json`, 'utf8'))
const existingGoodById = new Map(existingGoods.map((g) => [g.id, g]))
const existingFactoryById = new Map(existingFactories.map((f) => [f.id, f]))

// ---------- manual RU translations for items not in existing data ----------

/** @type {Record<string, string>} */
const RU = {
  // commodities
  acid: 'Кислота',
  'acron-drug': 'Акрон (наркотик)',
  adhesive: 'Клей',
  aluminum: 'Алюминий',
  ammunition: 'Боеприпасы',
  'ammunition-l': 'Боеприпасы (крупные)',
  'ammunition-m': 'Боеприпасы (средние)',
  'ammunition-s': 'Боеприпасы (малые)',
  'antigrav-generator': 'Антигравитационный генератор',
  'antigrav-unit': 'Антигравитационный блок',
  'avorion-ore': 'Аворионовая руда',
  beer: 'Пиво',
  'bio-gas': 'Биогаз',
  'body-armor': 'Бронежилет',
  book: 'Книга',
  carbon: 'Углерод',
  cattle: 'Скот',
  chemicals: 'Химикаты',
  chlorine: 'Хлор',
  clothes: 'Одежда',
  coal: 'Уголь',
  cocoa: 'Какао',
  coffee: 'Кофе',
  'computation-mainframe': 'Вычислительный мейнфрейм',
  conductor: 'Проводник',
  coolant: 'Охладитель',
  copper: 'Медь',
  corn: 'Кукуруза',
  crystal: 'Кристаллы',
  dairy: 'Молочные продукты',
  diamond: 'Алмаз',
  display: 'Дисплей',
  drill: 'Бур',
  drone: 'Дрон',
  'electro-magnet': 'Электромагнит',
  'electromagnetic-charge': 'Электромагнитный заряд',
  'electron-accelerator': 'Электронный ускоритель',
  'energy-cell': 'Энергоячейки',
  'energy-container': 'Энергоконтейнер',
  'energy-generator': 'Энергогенератор',
  'energy-inverter': 'Энергоинвертор',
  'energy-tube': 'Энерготрубка',
  'explosive-charge': 'Взрывной заряд',
  fabric: 'Ткань',
  fertilizer: 'Удобрение',
  fish: 'Рыба',
  fluorine: 'Фтор',
  food: 'Пища',
  'food-bar': 'Пищевой брикет',
  'force-generator': 'Силовой генератор',
  fruit: 'Фрукты',
  fuel: 'Топливо',
  fungus: 'Грибы',
  'fusion-core': 'Термоядерное ядро',
  'fusion-generator': 'Термоядерный генератор',
  'gauss-rail': 'Рельс Гаусса',
  gem: 'Самоцвет',
  glass: 'Стекло',
  gold: 'Золото',
  gun: 'Оружие',
  helium: 'Гелий',
  'high-capacity-lens': 'Линза высокой ёмкости',
  'high-pressure-tube': 'Труба высокого давления',
  hydrogen: 'Водород',
  'industrial-tesla-coil': 'Промышленная катушка Тесла',
  'iron-ore': 'Железная руда',
  jewelry: 'Ювелирные изделия',
  'laser-compressor': 'Лазерный компрессор',
  'laser-head': 'Лазерная головка',
  'laser-modulator': 'Лазерный модулятор',
  lead: 'Свинец',
  leather: 'Кожа',
  liquor: 'Ликёр',
  'luxury-food': 'Деликатесы',
  meat: 'Мясо',
  'medical-supplies': 'Медикаменты',
  'metal-plate': 'Металлопластина',
  microchip: 'Микросхема',
  'military-tesla-coil': 'Военная катушка Тесла',
  mineral: 'Минералы',
  'mining-robot': 'Горный робот',
  'morn-drug': 'Морн (наркотик)',
  nanobot: 'Нанобот',
  'naonite-ore': 'Наонитовая руда',
  neon: 'Неон',
  'neutron-accelerator': 'Нейтронный ускоритель',
  nitrogen: 'Азот',
  'ogonite-ore': 'Огонитовая руда',
  oil: 'Нефть',
  ore: 'Руда',
  oxygen: 'Кислород',
  paint: 'Краска',
  paper: 'Бумага',
  plankton: 'Планктон',
  plant: 'Растения',
  'plasma-cell': 'Плазменная ячейка',
  plastic: 'Пластик',
  platinum: 'Платина',
  potato: 'Картофель',
  'power-unit': 'Энергоблок',
  processor: 'Процессор',
  protein: 'Белок',
  'proton-accelerator': 'Протонный ускоритель',
  'raw-oil': 'Сырая нефть',
  rice: 'Рис',
  'rift-avorion-ore': 'Аворионовая руда (разлом)',
  'rift-iron-ore': 'Железная руда (разлом)',
  'rift-naonite-ore': 'Наонитовая руда (разлом)',
  'rift-ogonite-ore': 'Огонитовая руда (разлом)',
  'rift-research-data': 'Данные исследований разлома',
  'rift-titanium-ore': 'Титановая руда (разлом)',
  'rift-trinium-ore': 'Триниевая руда (разлом)',
  'rift-xanion-ore': 'Ксанионовая руда (разлом)',
  rocket: 'Ракета',
  rubber: 'Резина',
  satellite: 'Спутник',
  'scrap-avorion': 'Аворионовый лом',
  'scrap-iron': 'Железный лом',
  'scrap-metal': 'Металлолом',
  'scrap-naonite': 'Наонитовый лом',
  'scrap-ogonite': 'Огонитовый лом',
  'scrap-titanium': 'Титановый лом',
  'scrap-trinium': 'Триниевый лом',
  'scrap-xanion': 'Ксанионовый лом',
  'semi-conductor': 'Полупроводник',
  servo: 'Сервопривод',
  sheep: 'Овцы',
  silicon: 'Кремний',
  silver: 'Серебро',
  slave: 'Рабы',
  'solar-cell': 'Солнечный элемент',
  'solar-panel': 'Солнечная панель',
  solvent: 'Растворитель',
  spices: 'Специи',
  steel: 'Сталь',
  'steel-tube': 'Стальная труба',
  'targeting-card': 'Карта наведения',
  'targeting-system': 'Система наведения',
  tea: 'Чай',
  teleporter: 'Телепортер',
  'titanium-ore': 'Титановая руда',
  tools: 'Инструменты',
  'toxic-waste': 'Токсичные отходы',
  transformator: 'Трансформатор',
  'trinium-ore': 'Триниевая руда',
  turbine: 'Турбина',
  vegetable: 'Овощи',
  vehicle: 'Транспорт',
  'war-robot': 'Боевой робот',
  warhead: 'Боеголовка',
  water: 'Вода',
  wheat: 'Пшеница',
  wine: 'Вино',
  wire: 'Провода',
  wood: 'Древесина',
  'xanion-ore': 'Ксанионовая руда',
  zinc: 'Цинк',

  // stations
  'accelerator-factory': 'Завод ускорителей',
  'aluminum-mine': 'Алюминиевая шахта',
  'ammunition-factory': 'Завод боеприпасов',
  'antigrav-generator-factory': 'Завод антигравитационных генераторов',
  'antigrav-unit-factory': 'Завод антигравитационных блоков',
  'body-armor-factory': 'Завод бронежилетов',
  'book-factory': 'Типография',
  brewery: 'Пивоварня',
  'carbon-extractor': 'Экстрактор углерода',
  'cattle-ranch': 'Ранчо (скот)',
  'chemical-factory': 'Химический завод',
  'clothes-factory': 'Швейная фабрика',
  'coal-mine': 'Угольная шахта',
  'cocoa-farm': 'Какао-плантация',
  'coffee-farm': 'Кофейная плантация',
  'computation-mainframe-factory': 'Завод вычислительных мейнфреймов',
  'computer-component-factory': 'Завод компьютерных компонентов',
  'conductor-factory': 'Завод проводников',
  'copper-mine': 'Медная шахта',
  'corn-farm': 'Кукурузная ферма',
  'crystal-farm': 'Кристаллическая ферма',
  'dairy-farm': 'Молочная ферма',
  'display-factory': 'Завод дисплеев',
  distillery: 'Дистиллерия',
  'drill-factory': 'Завод буров',
  'drone-factory': 'Завод дронов',
  'electro-magnet-factory': 'Завод электромагнитов',
  'electromagnetic-charge-factory': 'Завод электромагнитных зарядов',
  'energy-container-factory': 'Завод энергоконтейнеров',
  'energy-generator-factory': 'Завод энергогенераторов',
  'energy-inverter-factory': 'Завод энергоинверторов',
  'energy-tube-factory': 'Завод энерготрубок',
  'explosive-charge-factory': 'Завод взрывных зарядов',
  'fabric-factory': 'Текстильная фабрика',
  'fertilizer-factory': 'Завод удобрений',
  'fish-farm': 'Рыбная ферма',
  'food-bar-factory': 'Завод пищевых брикетов',
  'food-factory': 'Пищевой завод',
  'force-generator-factory': 'Завод силовых генераторов',
  'fruit-farm': 'Фруктовая ферма',
  'fuel-factory': 'Топливный завод',
  'fungus-farm': 'Грибная ферма',
  'fusion-core-factory': 'Завод термоядерных ядер',
  'fusion-generator-factory': 'Завод термоядерных генераторов',
  'gas-collector': 'Газосборник',
  'gauss-rail-factory': 'Завод рельсов Гаусса',
  'glass-manufacturer': 'Стекольный завод',
  'gun-factory': 'Оружейный завод',
  'high-capacity-lens-factory': 'Завод линз высокой ёмкости',
  'high-pressure-tube-factory': 'Завод труб высокого давления',
  'ice-mine': 'Ледяная шахта',
  'jewelry-manufacturer': 'Ювелирная мастерская',
  'laser-compressor-factory': 'Завод лазерных компрессоров',
  'laser-head-factory': 'Завод лазерных головок',
  'laser-modulator-factory': 'Завод лазерных модуляторов',
  'lead-mine': 'Свинцовая шахта',
  'luxury-food-factory': 'Завод деликатесов',
  'meat-factory': 'Мясокомбинат',
  'medical-supplies-factory': 'Завод медикаментов',
  'metal-plate-factory': 'Завод металлопластин',
  'microchip-factory': 'Завод микросхем',
  'mineral-extractor': 'Добыча минералов',
  'mining-robot-factory': 'Завод горных роботов',
  'nanobot-factory': 'Завод наноботов',
  'noble-metal-mine': 'Рудник благородных металлов',
  'oil-refinery': 'Нефтеперерабатывающий завод',
  'oil-rig': 'Нефтяная платформа',
  'ore-mine': 'Рудник',
  'paint-manufacturer': 'Завод краски',
  'paper-factory': 'Бумажная фабрика',
  'plankton-collector': 'Сборщик планктона',
  'plant-farm': 'Плантация',
  'plasma-cell-factory': 'Завод плазменных ячеек',
  'plastic-manufacturer': 'Завод пластика',
  'potato-farm': 'Картофельная ферма',
  'power-unit-factory': 'Завод энергоблоков',
  'processor-factory': 'Завод процессоров',
  'protein-factory': 'Завод белков',
  'rice-farm': 'Рисовая ферма',
  'rocket-factory': 'Ракетный завод',
  'rubber-factory': 'Завод резины',
  'satellite-factory': 'Спутниковый завод',
  'scrap-metal-trader': 'Торговец металлоломом',
  'semi-conductor-manufacturer': 'Завод полупроводников',
  'servo-factory': 'Завод сервоприводов',
  'sheep-ranch': 'Ранчо овец',
  'silicon-mine': 'Кремниевая шахта',
  'solar-cell-factory': 'Завод солнечных элементов',
  'solar-panel-factory': 'Завод солнечных панелей',
  'solar-power-plant': 'Солнечная электростанция',
  'spices-farm': 'Плантация специй',
  'steel-factory': 'Сталелитейный завод',
  'steel-tube-factory': 'Завод стальных труб',
  'targeting-card-factory': 'Завод карт наведения',
  'targeting-system-factory': 'Завод систем наведения',
  'tea-farm': 'Чайная плантация',
  'teleporter-factory': 'Завод телепортеров',
  'tesla-coil-factory': 'Завод катушек Тесла',
  'tools-factory': 'Завод инструментов',
  'transformator-factory': 'Трансформаторный завод',
  'turbine-factory': 'Турбинный завод',
  'turret-factory': 'Фабрика турелей',
  'vegetable-farm': 'Овощная ферма',
  'vehicle-factory': 'Завод транспортных средств',
  'war-robot-factory': 'Завод боевых роботов',
  'warhead-factory': 'Завод боеголовок',
  'water-collector': 'Сборщик воды',
  'wheat-farm': 'Ферма пшеницы',
  'wine-factory': 'Винодельня',
  'wire-manufacturer': 'Завод проводов',
  'wood-farm': 'Лесная ферма',
  'zinc-mine': 'Цинковая шахта',
}

function pickName(id, fallbackEn) {
  return existingGoodById.get(id)?.name || existingFactoryById.get(id)?.name || RU[id] || fallbackEn
}

// ---------- build commodities set from stations (only goods actually referenced) ----------

const referencedGoods = new Set()
for (const s of stations) {
  for (const v of s.variations) {
    for (const i of v.ingredients) referencedGoods.add(i.commodity)
    for (const r of v.results) referencedGoods.add(r.commodity)
  }
}

// Also keep the raw goods that have mines producing them.
// (They'll already be in referencedGoods via mine results.)

// ---------- filter stations: drop pure-consumer / empty ----------

const productiveStations = stations.filter(
  (s) => s.variations.length > 0 && s.variations.some((v) => v.results.length > 0 && !v.isConsumer),
)

// ---------- emit factories with variant splitting ----------

const factories = []
for (const s of productiveStations) {
  const baseId = stationBaseId(s.name)
  const variants = s.variations.filter((v) => v.results.length > 0)
  variants.forEach((v, idx) => {
    const id = idx === 0 ? baseId : `${baseId}-v${idx + 1}`
    const baseName = pickName(baseId, s.name)
    const name = idx === 0 ? baseName : `${baseName} (вариант ${idx + 1})`
    const inputs = v.ingredients.map((i) => ({
      goodId: commodityId(i.commodity),
      amount: i.amount,
      ...(i.isOptional ? { optional: true } : {}),
    }))
    const outputs = v.results.map((r) => ({
      goodId: commodityId(r.commodity),
      amount: r.amount,
      ...(r.isOptional ? { optional: true } : {}),
    }))
    // Use existing cycleSeconds if we had this factory before
    const existing = existingFactoryById.get(id) || existingFactoryById.get(baseId)
    const cycleSeconds = existing?.cycleSeconds ?? 60
    factories.push({
      id,
      name,
      category: existing?.category ?? 'basic', // refined below
      cycleSeconds,
      inputs,
      outputs,
    })
  })
}

// ---------- categorise goods + factories by topological depth ----------

// Build producers-by-good from the generated factories
const producersByGood = new Map()
for (const f of factories) {
  for (const o of f.outputs) {
    if (!producersByGood.has(o.goodId)) producersByGood.set(o.goodId, [])
    producersByGood.get(o.goodId).push(f)
  }
}

const depthCache = new Map()
function goodDepth(goodId, stack = new Set()) {
  if (depthCache.has(goodId)) return depthCache.get(goodId)
  if (stack.has(goodId)) return 0 // cycle guard
  const producers = producersByGood.get(goodId) || []
  if (producers.length === 0) {
    depthCache.set(goodId, 0) // raw
    return 0
  }
  // Pick producer with min-depth (most direct recipe wins the category)
  stack.add(goodId)
  let best = Infinity
  for (const f of producers) {
    if (f.inputs.length === 0) {
      best = Math.min(best, 1) // mine-like: direct producer with no recipe inputs
      continue
    }
    let maxInput = 0
    for (const i of f.inputs) {
      if (i.optional) continue
      maxInput = Math.max(maxInput, goodDepth(i.goodId, stack))
    }
    best = Math.min(best, maxInput + 1)
  }
  stack.delete(goodId)
  if (!Number.isFinite(best)) best = 1
  depthCache.set(goodId, best)
  return best
}

function depthToGoodCategory(d) {
  if (d === 0) return 'raw'
  if (d === 1) return 'basic'
  if (d <= 3) return 'mid'
  if (d <= 5) return 'adv'
  if (d <= 6) return 'end'
  return 'hi'
}
function depthToFactoryCategory(d) {
  if (d === 0) return 'mine'
  if (d === 1) return 'basic'
  if (d <= 3) return 'mid'
  if (d <= 5) return 'adv'
  if (d <= 6) return 'end'
  return 'hi'
}

// ---------- emit goods ----------

const goods = []
for (const commodity of referencedGoods) {
  const id = commodityId(commodity)
  const depth = goodDepth(id)
  const existing = existingGoodById.get(id)
  goods.push({
    id,
    name: existing?.name || RU[id] || commodity,
    category: existing?.category ?? depthToGoodCategory(depth),
  })
}
goods.sort((a, b) => {
  const order = ['raw', 'basic', 'mid', 'adv', 'end', 'hi']
  const d = order.indexOf(a.category) - order.indexOf(b.category)
  return d !== 0 ? d : a.id.localeCompare(b.id)
})

// Assign factory categories from the depth of their primary output
for (const f of factories) {
  const existing = existingFactoryById.get(f.id)
  if (existing?.category) {
    f.category = existing.category
    continue
  }
  // Mine-like: no inputs
  if (f.inputs.length === 0) {
    f.category = 'mine'
    continue
  }
  // Use max depth across outputs (most advanced recipe wins)
  const primary = f.outputs[0]
  const d = primary ? goodDepth(primary.goodId) : 1
  f.category = depthToFactoryCategory(d)
}
factories.sort((a, b) => {
  const order = ['mine', 'basic', 'mid', 'adv', 'end', 'hi']
  const d = order.indexOf(a.category) - order.indexOf(b.category)
  return d !== 0 ? d : a.id.localeCompare(b.id)
})

// ---------- validation: every input must resolve to a known good ----------

const goodIds = new Set(goods.map((g) => g.id))
const warnings = []
for (const f of factories) {
  for (const io of [...f.inputs, ...f.outputs]) {
    if (!goodIds.has(io.goodId)) warnings.push(`${f.id}: unknown good ${io.goodId}`)
  }
}
for (const g of goods) {
  if (g.category !== 'raw' && !producersByGood.has(g.id)) {
    // basic but no producer? flag
    // (common for raw-ish things the script didn't mark raw)
  }
}
if (warnings.length) console.error('WARNINGS:\n' + warnings.join('\n'))

// ---------- write files ----------

writeFileSync(`${REPO}/app/data/goods.json`, JSON.stringify(goods, null, 2) + '\n')
writeFileSync(`${REPO}/app/data/factories.json`, JSON.stringify(factories, null, 2) + '\n')

console.log(`Wrote ${goods.length} goods and ${factories.length} factories.`)
console.log(
  `Variant splits: ${factories.filter((f) => /-v\d+$/.test(f.id)).length} alternate recipes.`,
)
