import { STASIS_BONUS_MODULATED, STASIS_BONUS_NON_MODULATED, BOOSTER_BONUS } from '@/constants'

// Calculate final quantity for a loot entry
export function calculateFinalQuantity(lootEntry, itemRarity, monsterNumber, players) {
  if (lootEntry.itemId === 99999) return lootEntry.quantity
  const baseQuantity = lootEntry.quantity * monsterNumber
  return itemRarity === 5 ? baseQuantity : baseQuantity * players
}

// Filter and sort items breakdown
export function filterAndSortItems(perItem, minProfit, minDropRate) {
  return Array.from(perItem.values())
    .filter(it => it.subtotal >= minProfit && (it.rate || 0) >= minDropRate)
    .sort((a, b) => {
      if (b.subtotal !== a.subtotal) return b.subtotal - a.subtotal
      if ((b.rate || 0) !== (a.rate || 0)) return (b.rate || 0) - (a.rate || 0)
      return (b.quantity || 0) - (a.quantity || 0)
    })
}

// Compute adjusted drop rate based on config and constants
export function computeAdjustedRate(baseRate, config) {
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
export function shouldIncludeLoot(lootEntry, itemRarity, config) {
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
export function processLoots(loots, config, priceMap = {}, itemRarityMap = {}, runConfig = null) {
  // Calculate BonusPP multiplier
  const bonusPPMultiplier = loots.reduce((acc, l) => {
    if (l.itemId === 99999) {
      const adjustedRate = computeAdjustedRate(l.rate || 0, config)
      return acc + adjustedRate * (l.quantity / 100)
    }
    return acc
  }, 0)

  const perItem = new Map()

  loots.forEach(l => {
    const itemId = l.itemId
    if (itemId === 99999) return

    const price = l.price || 0
    const qty = l.quantity || 0
    let adjustedRate = computeAdjustedRate(l.rate || 0, config)
    adjustedRate = Math.min(adjustedRate * (1 + bonusPPMultiplier), 1.0)
    const value = Math.floor(price * adjustedRate * qty)

    if (!perItem.has(itemId)) {
      perItem.set(itemId, {
        itemId,
        rate: adjustedRate,
        price,
        quantity: 0,
        subtotal: 0,
        stele: l.stele || 0,
        steleIntervention: l.steleIntervention || 0,
        rarity: itemRarityMap[itemId] || 0
      })
    }

    const item = perItem.get(itemId)
    item.quantity += qty
    item.subtotal += value
  })

  if (runConfig?.isRift) {
    const wavesCompleted = runConfig.wavesCompleted || 1
    perItem.forEach(item => {
      item.quantity *= wavesCompleted
      item.subtotal *= wavesCompleted
    })
  }

  return perItem
}