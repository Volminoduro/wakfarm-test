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

describe('_calculateHopedQuantity helpers', () => {
  it('_calculateHopedQuantity handle 99999 item', () => {
    const loot = { itemId: 99999, quantity: 2 }
    expect(_calculateHopedQuantity(loot, 1, 4, 1)).toBe(2)
  })

  it('_calculateHopedQuantity rarity 5 only 1 per team', () => {
    let loot = { itemId: 1, quantity: 1, monsterQuantity : 1, rate : 1 }
    expect(_calculateHopedQuantity(loot, 5, 3, 2)).toBe(2)

    loot = { itemId: 1, quantity: 1, monsterQuantity : 2, rate : 1 }
    expect(_calculateHopedQuantity(loot, 5, 3, 1)).toBe(2)
  })

  it('_calculateHopedQuantity standard case', () => {
    let loot = { itemId: 1, quantity: 1, monsterQuantity : 2, rate : 1 }
    expect(_calculateHopedQuantity(loot, 1, 3, 2)).toBe(12)

    loot = { itemId: 1, quantity: 1, monsterQuantity : 2, rate : 0.5 }
    expect(_calculateHopedQuantity(loot, 1, 3, 2)).toBe(6)

    loot = { itemId: 1, quantity: 2, monsterQuantity : 2, rate : 0.5 }
    expect(_calculateHopedQuantity(loot, 1, 3, 2)).toBe(12)
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
