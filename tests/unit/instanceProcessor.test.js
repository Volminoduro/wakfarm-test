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
  return { useAppStore: () => ({ config: {} }) }
})

import { _computeAdjustedRate, _calculateHopedQuantity } from '@/utils/instanceProcessor'

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
