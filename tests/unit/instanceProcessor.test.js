import { describe, it, expect, vi } from 'vitest'

// Mock stores used by the module to avoid Pinia/runtime issues
vi.mock('@/stores/useJsonStore', () => {
  return {
    useJsonStore: () => ({
      itemRarityMap: { 1: 2 },
      priceMap: { 1: 100 },
      instancesBase: [{ id: 10, level: 1, loots: [], players: 4 }]
    })
  }
})

vi.mock('@/stores/useAppStore', () => {
  return { useAppStore: vi.fn(() => ({ config: {} })) }
})

import { _computeAdjustedRate, _calculateHopedQuantity, _filterAndSortItems } from '@/utils/instanceProcessor'
import { STASIS_BONUS_MODULATED, STASIS_BONUS_NON_MODULATED } from '@/constants'
import { useAppStore } from '@/stores/useAppStore'

const mockedUseAppStore = vi.mocked(useAppStore)

describe('instanceProcessor helpers', () => {
  it('_computeAdjustedRate returns a number in range', () => {
    const cfg = { isBooster: true, server: 'pandora', isModulated: true, stasis: 3 }
    const r = _computeAdjustedRate(0.5, cfg)
    expect(typeof r).toBe('number')
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThanOrEqual(1)
  })

  it('_calculateHopedQuantity handles special itemId 99999', () => {
    const loot = { itemId: 99999, quantity: 2 }
    expect(_calculateHopedQuantity(loot, 1, 4, 1)).toBe(2)
  })
})

describe('_computeAdjustedRate helpers', () => {
  it('applies wave bonus for non-ultimate rift without booster', () => {
    const cfg = { isRift: true, startingWave: 2, wavesCompleted: 3, isUltimate: false, isBooster: false, isModulated: true, stasis: 10}
    // finalWave = 2 + 3 = 5 => (finalWave -1) = 4 ; bonusPerWave = 8 => waveBonus = 1 + 32/100 = 1.32
    const baseRate = 0.1
    const expected = baseRate * 1.32
    const result = _computeAdjustedRate(baseRate, cfg)
    expect(result).toBeCloseTo(expected, 6)
  })

  it('applies larger wave bonus for ultimate rift', () => {
    const cfg = { isRift: true, startingWave: 1, wavesCompleted: 3, isUltimate: true, isBooster: false, isModulated: true, stasis: 10 }
    // finalWave = 1 + 3 = 4 => (4-1)=3 ; bonusPerWave = 18 => waveBonus = 1 + 54/100 = 1.54
    const baseRate = 0.2
    const expected = baseRate * 1.54
    const result = _computeAdjustedRate(baseRate, cfg)
    expect(result).toBeCloseTo(expected, 6)
  })

  it('modulated stasis yields below-1 rate', () => {
    const stasis = 3
    const cfg = { isRift: false, isModulated: true, stasis, isBooster: false }
    const baseRate = 0.2
    const stasisFactor = STASIS_BONUS_MODULATED[stasis]
    const expected = baseRate * stasisFactor
    const res = _computeAdjustedRate(baseRate, cfg)
    expect(res).toBeCloseTo(expected, 6)
  })

  it('non-modulated stasis yields below-1 rate', () => {
    const stasis = 5
    const cfg = { isRift: false, isModulated: false, stasis, isBooster: false }
    const baseRate = 0.2
    const stasisFactor = STASIS_BONUS_NON_MODULATED[stasis]
    const expected = Math.min(1, baseRate * stasisFactor)
    const res = _computeAdjustedRate(baseRate, cfg)
    expect(res).toBeCloseTo(expected, 6)
  })

  it('caps at 1 for both dungeon and rift scenarios', () => {
    // Dungeon (non-rift) should be capped by _computeAdjustedRate itself
    const dungeonCfg = { isRift: false, isModulated: true, stasis: 10, isBooster: true, server: 'pandora' }
    const baseRateDungeon = 0.99
    const resDungeon = _computeAdjustedRate(baseRateDungeon, dungeonCfg)
    expect(resDungeon).toBe(1)

    // Rift: compute adjusted rate, then simulate downstream bonusPPMultiplier application
    const riftCfg = { isRift: true, startingWave: 1, wavesCompleted: 10, isUltimate: false, isBooster: true, server: 'pandora' }
    const baseRateRift = 0.99
    const adjustedRift = _computeAdjustedRate(baseRateRift, riftCfg)
    expect(adjustedRift).toBe(1)
  })
})

describe('_calculateHopedQuantity helpers', () => {
  it('handle 99999 item', () => {
    const loot = { itemId: 99999, quantity: 2 }
    expect(_calculateHopedQuantity(loot, 1, 4, 1)).toBe(2)
  })

  it('rarity 5 item only 1 per team', () => {
    let loot = { itemId: 1, quantity: 1, monsterQuantity : 1, rate : 1 }
    expect(_calculateHopedQuantity(loot, 5, 3, 2)).toBe(2)

    loot = { itemId: 1, quantity: 1, monsterQuantity : 2, rate : 1 }
    expect(_calculateHopedQuantity(loot, 5, 3, 1)).toBe(2)
  })

  it('standard case', () => {
    let loot = { itemId: 1, quantity: 1, monsterQuantity : 2, rate : 1 }
    expect(_calculateHopedQuantity(loot, 1, 3, 2)).toBe(12)

    loot = { itemId: 1, quantity: 1, monsterQuantity : 2, rate : 0.5 }
    expect(_calculateHopedQuantity(loot, 1, 3, 2)).toBe(6)

    loot = { itemId: 1, quantity: 2, monsterQuantity : 2, rate : 0.5 }
    expect(_calculateHopedQuantity(loot, 1, 3, 2)).toBe(12)
  })
})

describe('_filterAndSortItems helpers', () => {

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('filters items by minItemProfit', () => {
    mockedUseAppStore.mockReturnValue({ config: { minItemProfit: 50, minDropRatePercent: null } })

    const perItem = new Map()
    perItem.set(1, { itemId: 1, subtotal: 60, rate: 0.5, quantity: 2 })
    perItem.set(2, { itemId: 2, subtotal: 40, rate: 0.8, quantity: 1 })

    const expected = _filterAndSortItems(perItem)
    expect(expected.length).toBe(1)
    expect(expected[0].itemId).toBe(1)
  })

  it('filters items by minDropRatePercent', () => {
    mockedUseAppStore.mockReturnValue({ config: { minItemProfit: null, minDropRatePercent: 70 } })

    const perItem = new Map()
    perItem.set(1, { itemId: 1, subtotal: 60, rate: 0.5, quantity: 2 })
    perItem.set(2, { itemId: 2, subtotal: 40, rate: 0.8, quantity: 1 })

    const expected = _filterAndSortItems(perItem)
    expect(expected.length).toBe(1)
    expect(expected[0].itemId).toBe(2)
  })

  it('sorts items by subtotal, then rate, then quantity', () => {
    mockedUseAppStore.mockReturnValue({ config: { minItemProfit: null, minDropRatePercent: null } })

    const perItem = new Map()
    perItem.set(1, { itemId: 1, subtotal: 100, rate: 0.5, quantity: 1 })
    perItem.set(2, { itemId: 2, subtotal: 100, rate: 0.6, quantity: 1 })
    perItem.set(3, { itemId: 3, subtotal: 100, rate: 0.6, quantity: 2 })

    const expected = _filterAndSortItems(perItem)
    expect(expected.map(r => r.itemId)).toEqual([3, 2, 1])
  })

})



// Cas à tester :
// - Calcul de l'espérance sur plusieurs runs
//    - Addition des quantités pour un même item sur différents monstres (même taux de drop)
//    - Addition des espérances pour un même item sur différents monstres (différent taux de drop)
// - Calcul de l'espérance sur un run
//   - Cas simple
// - Gestion correct du l'item épique
// - Gestion du taux de loot par stèles bonusPP
// - Gestion du taux de loot par stasis / booster
// - Pour les rifts
// Gestion des items inéligibles au loot (pas bon stasis) :
//    - Items épiques nécessitant un certain nombre de vagues ou de stasis
//    - Items avec stasis spécifié
// - Filtrage des items par profit minimum et taux de drop minimum
// - Vérification du cache pour les instances déjà calculées
// - Vérification du cache pour les instances déjà calculées avec prix
