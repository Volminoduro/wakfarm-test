import { STASIS_BONUS_MODULATED, STASIS_BONUS_NON_MODULATED, BOOSTER_BONUS, LEVEL_RANGES } from '@/constants'
import { useJsonStore } from '../stores/useJsonStore'
import { useAppStore } from '../stores/useAppStore'
import { formatConfigRun, getNbCyclesForConfig } from './runHelpers'


// module-level cache
const calculatedInstanceCache = new Map()
const calculatedInstanceWithPriceCache = new Map()

// Calculate final quantity for a loot entry
export function _calculateHopedQuantity(loot, itemRarity, players, totalIterations) {
  if (loot.itemId === 99999) return loot.quantity
  return itemRarity === 5 ? loot.quantity * loot.monsterQuantity * totalIterations * loot.rate : loot.quantity * players * loot.monsterQuantity * totalIterations * loot.rate
}

// Filter and sort items breakdown
export function _filterAndSortItems(perItem) {
  const appStore = useAppStore()
  const minProfit = appStore.config.minItemProfit || 0
  const minDropRate = (appStore.config.minDropRatePercent || 0) / 100

  return Array.from(perItem.values())
    .filter(it => it.subtotal >= minProfit && (it.rate || 0) >= minDropRate)
    .sort((a, b) => {
      if (b.subtotal !== a.subtotal) return b.subtotal - a.subtotal
      if ((b.rate || 0) !== (a.rate || 0)) return (b.rate || 0) - (a.rate || 0)
      return (b.quantity || 0) - (a.quantity || 0)
    })
}

// Compute adjusted drop rate based on config and constants
export function _computeAdjustedRate(baseRate, config) {
  const boosterBonus = config.isBooster ? (BOOSTER_BONUS[config.server] || 1.25) : 1

  if (config.isRift) {
    const finalWave = (config.startingWave || 1) + (config.wavesCompleted || 0)
    const bonusPerWave = config.isUltimate ? 18 : 8
    const waveBonus = 1 + ((finalWave - 1) * bonusPerWave) / 100
    return baseRate * waveBonus * boosterBonus
  }

  const bonusMap = config.isModulated ? STASIS_BONUS_MODULATED : STASIS_BONUS_NON_MODULATED
  const stasisFactor = bonusMap[config.stasis || 0] || 0
  return Math.min(1, baseRate * stasisFactor * boosterBonus)
}

// Check if loot should be included based on config
export function _isLootLegit(lootEntry, itemRarity, config) {
  if (config.isRift) {
    if (itemRarity >= 5) {
      const requiredWaves = config.isUltimate ? 4 : 9
      return (config.wavesCompleted || 0) >= requiredWaves
    }
    return true
  }

  const configSteles = config.steles || 0
  const configSteleIntervention = config.steleIntervention || 0
  const configStasis = config.stasis || 0
  const lootStele = lootEntry.stele || 0
  const lootSteleIntervention = lootEntry.steleIntervention || 0
  const lootStasis = lootEntry.stasis

  if (lootStele > configSteles) return false
  if (lootSteleIntervention > configSteleIntervention) return false
  if (configStasis < lootStasis) return false
  if (itemRarity > 3 && configStasis < 3) return false

  return true
}

// Process loots and build per-item breakdown
export function _processLoots(loots, config, itemRarityMap = {}, nbPlayers = 1, nbCycles = 1) {

  const bonusPPMultiplier = loots.reduce((acc, loot) => {
    if (loot.itemId === 99999) {
      const adjustedRate = _computeAdjustedRate(loot.rate || 0, config)
      return acc + adjustedRate * (loot.quantity / 100)
    }
    return acc
  }, 0)

  const perItem = new Map()
  loots.forEach(loot => {
    const itemId = loot.itemId
    if (itemId === 99999) return

    const itemRarity = itemRarityMap[loot.itemId] || 0

    let adjustedRate = _computeAdjustedRate(loot.rate || 0, config)
    adjustedRate = Math.min(adjustedRate * (1 + bonusPPMultiplier), 1.0)
    loot.rate = adjustedRate

    

    const finalQuantity = _calculateHopedQuantity(loot, itemRarity, nbPlayers, nbCycles)

    if (!perItem.has(itemId)) {
      perItem.set(itemId, {
        itemId,
        rate: adjustedRate,
        price: loot.price || 0,
        quantity: 0,
        stele: loot.stele || 0,
        steleIntervention: loot.steleIntervention || 0,
        rarity: itemRarity || 0
      })
    }

    const item = perItem.get(itemId)

    item.rate = Math.min(item.rate + adjustedRate, 1.0)
    item.quantity += finalQuantity
  })

  return perItem
}

export function _calculateInstanceForRun(instanceId, runConfig) {
  const key = _makeCalculatedInstanceCacheKey(instanceId, runConfig)
  if (calculatedInstanceCache.has(key)) {
    console.info('Using cached instance for key', key)
    return calculatedInstanceCache.get(key)
  }

  const jsonStore = useJsonStore()
  const baseInstance = jsonStore.instancesBase.find(i => i.id === instanceId)
  if (!baseInstance) return null

  const itemRarityMap = jsonStore.itemRarityMap
  const priceMap = jsonStore.priceMap

  // Filtrer et recalculer les loots selon la config du run
  const allLoots = (baseInstance.loots || []).filter(l => {
    const itemRarity = itemRarityMap[l.itemId] || 0
    return _isLootLegit(l, itemRarity, runConfig)
  }).map(l => {
    return { ...l, price: priceMap[l.itemId] || 0 }
  })

  const perItem = _processLoots(allLoots, runConfig, itemRarityMap, baseInstance.players, getNbCyclesForConfig(runConfig))

  const itemsArray = Array.from(perItem.values())

  const result = {
    id: baseInstance.id,
    level: baseInstance.level,
    bossId: baseInstance.bossId || null,
    players: baseInstance.players,
    isDungeon: baseInstance.isDungeon,
    isUltimate: baseInstance.isUltimate,
    items: itemsArray
  }

  calculatedInstanceCache.set(key, result)
  return result
}

export function calculateInstanceForRunWithPricesAndPassFilters(instanceId, runConfig, priceMap) {
  const calculatedInstance = _calculateInstanceForRun(instanceId, runConfig)
  if (!calculatedInstance) return null
  const key = _makeCalculatedInstanceWithPricesCacheKey(instanceId, runConfig)
  
  let result = null

  if (calculatedInstanceWithPriceCache.has(key)) {
    console.info('Using cached instance with prices for key', key)
    result = calculatedInstanceWithPriceCache.get(key)
  } else {
    const itemsWithPrices = (calculatedInstance.items || []).map(it => {
      const price = (priceMap && priceMap[it.itemId]) || 0
      const quantity = it.quantity || 0
      const subtotal = Math.floor(price * quantity)

      return { ...it, price, subtotal }
    })

    result = { ...calculatedInstance, items: itemsWithPrices }
    calculatedInstanceWithPriceCache.set(key, result)
  }

  const itemsBreakdown = _filterAndSortItems(result.items)
  const totalKamas = itemsBreakdown.reduce((sum, it) => sum + (it.subtotal || 0), 0)

  result = { ...result, items: itemsBreakdown, totalKamas: Math.floor(totalKamas) }

  if (!_instancePassesFilters(result)) return null
  return result
}

export function _instancePassesFilters(instanceData) {
  if (!instanceData) return false

  const appStore = useAppStore()
  const minInstanceTotal = appStore.config.minInstanceTotal || 0
  const activeLevelRanges = appStore.config.levelRanges || []  

  if (activeLevelRanges.length === 0) return false
  if ((instanceData.totalKamas || 0) < minInstanceTotal) return false

  if (activeLevelRanges.length < LEVEL_RANGES.length) {
    const level = instanceData.level || 0
    const inRange = activeLevelRanges.some(rangeIndex => {
      const range = LEVEL_RANGES[rangeIndex]
      if (!range) return false
      return level >= range.min && level <= range.max
    })
    if (!inRange) return false
  }

  return true
}

function _makeCalculatedInstanceCacheKey(instanceId, config) {
  const relevant = {
    formatConfigRun: formatConfigRun(config),
    nbCycles: getNbCyclesForConfig(config)
  }
  return `${instanceId}|${JSON.stringify(relevant)}`
}

function _makeCalculatedInstanceWithPricesCacheKey(instanceId, config) {
  const jsonStore = useJsonStore()
  const relevant = {
    formatConfigRun: formatConfigRun(config),
    nbCycles: getNbCyclesForConfig(config),
    // include price version so cache invalidates when prices change
    priceVersion: jsonStore.pricesLastUpdate || 'none'
  }

  return `${instanceId}|${JSON.stringify(relevant)}|${useAppStore().config.server || 'default'}`
}


export function clearCalculatedInstanceCacheWithPricesForInstance(instanceId) {
  for (const k of calculatedInstanceWithPriceCache.keys()) {
    if (k.startsWith(`${instanceId}|`)) calculatedInstanceWithPriceCache.delete(k)
  }
}

// invalidation helpers
export function clearCalculatedInstanceWithPricesCache() {
  calculatedInstanceWithPriceCache.clear()
}