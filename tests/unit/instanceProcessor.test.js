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

import { _computeAdjustedRate, _calculateHopedQuantity, _filterAndSortItems, _isLootLegit, _processLoots } from '@/utils/instanceProcessor'
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

describe('_isLootLegit helpers', () => {
  it('returns true for rift non-epic items', () => {
    const loot = { itemId: 1 }
    const cfg = { isRift: true, isUltimate: false, wavesCompleted: 0 }
    expect(_isLootLegit(loot, 1, cfg)).toBe(true)
  })

  it('returns false for epic rift items when not enough waves', () => {
    const loot = { itemId: 2 }
    const cfg = { isRift: true, isUltimate: false, wavesCompleted: 8 }
    expect(_isLootLegit(loot, 5, cfg)).toBe(false)
  })

  it('returns true for epic rift items when enough waves (ultimate vs non-ultimate)', () => {
    // non-ultimate requires 9
    const cfg1 = { isRift: true, isUltimate: false, wavesCompleted: 9 }
    expect(_isLootLegit({ itemId: 3 }, 5, cfg1)).toBe(true)

    // ultimate requires 4
    const cfg2 = { isRift: true, isUltimate: true, wavesCompleted: 4 }
    expect(_isLootLegit({ itemId: 3 }, 5, cfg2)).toBe(true)
  })

  it('filters out by stele and steleIntervention in non-rift', () => {
    const cfg = { isRift: false, steles: 1, steleIntervention: 0, stasis: 3 }
    expect(_isLootLegit({ stele: 2 }, 1, cfg)).toBe(false)
    expect(_isLootLegit({ stele: 1, steleIntervention: 1 }, 1, cfg)).toBe(false)
  })

  it('filters out by loot stasis and rarity vs config stasis', () => {
    const cfg = { isRift: false, steles: 0, steleIntervention: 0, stasis: 2 }
    expect(_isLootLegit({ stasis: 3 }, 1, cfg)).toBe(false)
    // item rarity >3 requires config stasis >=3
    expect(_isLootLegit({ stasis: 0 }, 4, cfg)).toBe(false)
  })

  it('returns true when all conditions satisfied', () => {
    const cfg = { isRift: false, steles: 2, steleIntervention: 1, stasis: 5 }
    const loot = { stele: 1, steleIntervention: 1, stasis: 3 }
    expect(_isLootLegit(loot, 2, cfg)).toBe(true)
  })
})

describe('_instancePassesFilters helpers', () => {
  it('returns false for null/undefined instance', async () => {
    mockedUseAppStore.mockReturnValue({ config: { minInstanceTotal: 0, levelRanges: [0] } })
    const { _instancePassesFilters } = await import('@/utils/instanceProcessor')
    expect(_instancePassesFilters(null)).toBe(false)
    expect(_instancePassesFilters(undefined)).toBe(false)
  })

  it('fails when level not in active ranges', async () => {
    // choose active range index 1 (21-35) and level 10 which is outside
    mockedUseAppStore.mockReturnValue({ config: { minInstanceTotal: 0, levelRanges: [1] } })
    const { _instancePassesFilters } = await import('@/utils/instanceProcessor')
    const inst = { totalKamas: 1000, level: 10 }
    expect(_instancePassesFilters(inst)).toBe(false)
  })

  it('returns false when activeLevelRanges is empty', async () => {
    mockedUseAppStore.mockReturnValue({ config: { minInstanceTotal: 0, levelRanges: [] } })
    const { _instancePassesFilters } = await import('@/utils/instanceProcessor')
    const inst = { totalKamas: 100, level: 10 }
    expect(_instancePassesFilters(inst)).toBe(false)
  })

  it('returns false when totalKamas below minInstanceTotal', async () => {
    mockedUseAppStore.mockReturnValue({ config: { minInstanceTotal: 200, levelRanges: [0] } })
    const { _instancePassesFilters } = await import('@/utils/instanceProcessor')
    const inst = { totalKamas: 150, level: 10 }
    expect(_instancePassesFilters(inst)).toBe(false)
  })

  it('passes when totalKamas >= min and level in active ranges', async () => {
    mockedUseAppStore.mockReturnValue({ config: { minInstanceTotal: 50, levelRanges: [0] } })
    const { _instancePassesFilters } = await import('@/utils/instanceProcessor')
    const inst = { totalKamas: 100, level: 10 }
    expect(_instancePassesFilters(inst)).toBe(true)
  })


})

describe('_processLoots helpers', () => {
  it('applies bonusPP multiplier and accumulates quantities and rates for same item', () => {
    const cfg = { isRift: false, isModulated: false, stasis: 2, isBooster: false }
    const loots = [
      { itemId: 99999, quantity: 50, rate: 1 }, // bonusPP 50%
      { itemId: 1, quantity: 2, monsterQuantity: 1, rate: 0.4, price: 10 },
      { itemId: 1, quantity: 1, monsterQuantity: 2, rate: 0.2, price: 10 }
    ]

    const perItem = _processLoots(loots, cfg, { 1: 1 }, 1, 1)
    const item = perItem.get(1)
    // first loot: adjustedRate=0.4 -> *1.5 = 0.6 -> qty = 2 * 1 * 1 * 0.6 = 1.2
    // second loot: adjustedRate=0.2 -> *1.5 = 0.3 -> qty = 1 * 2 * 1 * 0.3 = 0.6
    // total qty = 1.8, total rate = 0.6 + 0.3 = 0.9
    expect(item).toBeDefined()
    expect(item.itemId).toBe(1)
    expect(item.price).toBe(10)
    expect(item.rarity).toBe(1)
    expect(item.quantity).toBeCloseTo(1.8, 6)
    expect(item.rate).toBeCloseTo(0.9, 6)
  })

  it('caps aggregated rate at 1.0', () => {
    const cfg = { isRift: false, isModulated: false, stasis: 2, isBooster: false }
    const loots = [
      { itemId: 2, quantity: 1, monsterQuantity: 1, rate: 0.7 },
      { itemId: 2, quantity: 1, monsterQuantity: 1, rate: 0.6 }
    ]

    const perItem = _processLoots(loots, cfg, { 2: 1 }, 1, 1)
    const item = perItem.get(2)
    expect(item.rate).toBe(1)
    expect(item.quantity).toBeCloseTo(1.3, 6)
  })

  it('does not include itemId 99999 in the perItem map', () => {
    const cfg = { isRift: false, isModulated: false, stasis: 2, isBooster: false }
    const loots = [ { itemId: 99999, quantity: 100, rate: 1 } ]
    const perItem = _processLoots(loots, cfg, {}, 1, 1)
    expect(perItem.has(99999)).toBe(false)
  })
})


describe('_calculateInstanceForRun integration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when instance id not found', async () => {
    vi.resetModules()
    vi.doMock('@/stores/useJsonStore', () => ({ useJsonStore: () => ({ instancesBase: [], itemRarityMap: {}, priceMap: {} }) }))
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: {} })) }))

    const { _calculateInstanceForRun } = await import('@/utils/instanceProcessor')
    expect(_calculateInstanceForRun(9999, {})).toBeNull()
  })

  it('returns instance with empty items array when base has no loots', async () => {
    vi.resetModules()
    vi.doMock('@/stores/useJsonStore', () => ({ useJsonStore: () => ({ instancesBase: [{ id: 20, level: 5, loots: [], players: 2 }], itemRarityMap: {}, priceMap: {}, pricesLastUpdate: 'v1' }) }))
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: {} })) }))

    const { _calculateInstanceForRun } = await import('@/utils/instanceProcessor')
    const res = _calculateInstanceForRun(20, {})
    expect(res).toBeTruthy()
    expect(res.items).toBeInstanceOf(Array)
    expect(res.items.length).toBe(0)
  })

  it('processes loots and aggregates items (quantity and capped rate)', async () => {
    vi.resetModules()
    vi.doMock('@/stores/useJsonStore', () => {
      return {
        useJsonStore: () => ({
          instancesBase: [{ id: 30, level: 10, players: 3, loots: [
            { itemId: 5, quantity: 1, monsterQuantity: 1, rate: 0.5, price: 10 },
            { itemId: 5, quantity: 1, monsterQuantity: 1, rate: 0.7, price: 10 }
          ] }],
          itemRarityMap: { 5: 1 },
          priceMap: { 5: 10 },
          pricesLastUpdate: 'v2'
        })
      }
    })
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: {} })) }))

    const { _calculateInstanceForRun } = await import('@/utils/instanceProcessor')
    const res = _calculateInstanceForRun(30, { isRift: false, isModulated: false, stasis: 2, isBooster: false })
    expect(res).toBeTruthy()
    expect(res.items).toHaveLength(1)
    const item = res.items[0]
    // _processLoots sets loot.quantity = _calculateHopedQuantity(...)
    // For each loot: quantity = 1 * players(3) * monsterQuantity(1) * nbCycles(1) * rate
    // => first: 1 * 3 * 1 * 1 * 0.5 = 1.5 ; second: 1 * 3 * 1 * 1 * 0.7 = 2.1
    // total quantity = 3.6 ; total rate raw = 1.2 but capped to 1.0
    expect(item.rate).toBe(1)
    expect(item.quantity).toBeCloseTo(3.6, 6)
  })

  it('reuses cached instance on subsequent calls', async () => {
    vi.resetModules()
    const findSpy = vi.fn(() => ({ id: 40, level: 1, loots: [], players: 1 }))
    vi.doMock('@/stores/useJsonStore', () => ({
      useJsonStore: () => ({
        instancesBase: { find: findSpy },
        itemRarityMap: {},
        priceMap: {},
        pricesLastUpdate: 'v3'
      })
    }))
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: {} })) }))

    const { _calculateInstanceForRun } = await import('@/utils/instanceProcessor')
    const a = _calculateInstanceForRun(40, {})
    const b = _calculateInstanceForRun(40, {})
    expect(a).toBe(b)
    // ensure the underlying lookup was performed only once -> cache used
    expect(findSpy).toHaveBeenCalledTimes(1)
  })
})


describe('calculateInstanceForRunWithPricesAndPassFilters integration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when no base instance exists', async () => {
    vi.resetModules()
    vi.doMock('@/stores/useJsonStore', () => ({ useJsonStore: () => ({ instancesBase: [], itemRarityMap: {}, priceMap: {}, pricesLastUpdate: 'pv1' }) }))
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: {} })) }))

    const { calculateInstanceForRunWithPricesAndPassFilters } = await import('@/utils/instanceProcessor')
    const res = calculateInstanceForRunWithPricesAndPassFilters(12345, {}, { 1: 10 })
    expect(res).toBeNull()
  })

  it('attaches prices, computes subtotals and totalKamas', async () => {
    vi.resetModules()
    vi.doMock('@/stores/useJsonStore', () => ({
      useJsonStore: () => ({
        instancesBase: [{ id: 60, level: 1, players: 2, loots: [
          { itemId: 7, quantity: 1, monsterQuantity: 1, rate: 0.4, price: 50 },
          { itemId: 7, quantity: 1, monsterQuantity: 1, rate: 0.3, price: 50 },
          { itemId: 11, quantity: 1, monsterQuantity: 1, rate: 1},
        ] }],
        itemRarityMap: { 7: 1 },
        priceMap: { 7: 50, 11: 50 },
        pricesLastUpdate: 'pv2'
      })
    }))
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: { minInstanceTotal: 0, levelRanges: [0], minItemProfit: null, minDropRatePercent: null } })) }))

    const { calculateInstanceForRunWithPricesAndPassFilters } = await import('@/utils/instanceProcessor')
    const priceArg = { 7: 50, 11: 50 }
    const res = calculateInstanceForRunWithPricesAndPassFilters(60, { isRift: false, isModulated: true, stasis: 2, isBooster: false }, priceArg)
    expect(res).toBeTruthy()
    expect(res.items).toHaveLength(2)
    const it = res.items[1]
    expect(it.price).toBe(50)
    // Two loots from different monsters with rates 0.4 and 0.3 and players=2
    // quantity per loot = 1 * 2 * 1 * 1 * rate -> 0.8 and 0.6 => total 1.4
    expect(it.quantity).toBeCloseTo(1.4, 6)
    // aggregated rate = 0.4 + 0.3 = 0.7
    expect(it.rate).toBeCloseTo(0.7, 6)
    // subtotal = floor(price * quantity) = floor(50 * 1.4) = 70
    expect(it.subtotal).toBe(70)
    expect(res.totalKamas).toBe(170)
  })

  it('returns null when instance filtered out by _instancePassesFilters', async () => {
    vi.resetModules()
    vi.doMock('@/stores/useJsonStore', () => ({ useJsonStore: () => ({ instancesBase: [{ id: 70, level: 1, players: 1, loots: [] }], itemRarityMap: {}, priceMap: {}, pricesLastUpdate: 'pv3' }) }))
    // Set minInstanceTotal high so it will be filtered out
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: { minInstanceTotal: 10000, levelRanges: [0] } })) }))

    const { calculateInstanceForRunWithPricesAndPassFilters } = await import('@/utils/instanceProcessor')
    const res = calculateInstanceForRunWithPricesAndPassFilters(70, {}, {})
    expect(res).toBeNull()
  })

  it('reuses priced cache on subsequent calls (console.info spy)', async () => {
    vi.resetModules()
    const findSpy = vi.fn(() => ({ id: 80, level: 1, players: 1, loots: [] }))
    vi.doMock('@/stores/useJsonStore', () => ({
      useJsonStore: () => ({
        instancesBase: { find: findSpy },
        itemRarityMap: {},
        priceMap: {},
        pricesLastUpdate: 'pv4'
      })
    }))
    vi.doMock('@/stores/useAppStore', () => ({ useAppStore: vi.fn(() => ({ config: { server: 'pandora', minInstanceTotal: 0, levelRanges: [0], minItemProfit: null, minDropRatePercent: null } })) }))

    const { calculateInstanceForRunWithPricesAndPassFilters } = await import('@/utils/instanceProcessor')

    const first = calculateInstanceForRunWithPricesAndPassFilters(80, {}, {})
    const second = calculateInstanceForRunWithPricesAndPassFilters(80, {}, {})
    // The returned payloads should be deeply equal (cache semantics)
    expect(first).toStrictEqual(second)
    // ensure underlying lookup was only performed once -> priced cache used
    expect(findSpy).toHaveBeenCalledTimes(1)
  })

})



// Cas à tester :
// - Vérification du cache pour les instances déjà calculées
// - Vérification du cache pour les instances déjà calculées avec prix
