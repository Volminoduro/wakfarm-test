// Clés localStorage
export const STORAGE_KEYS = {
  CONFIG: 'wakfarm_config_v1',
  LANGUAGE: 'wakfarm_language',
  EXPANDED_INSTANCES: 'expandedInstances_v1'
}

// Couleurs de rareté Wakfu
export { RARITY_COLORS } from './colors'

// Tranches de niveau (20, puis de 15 en 15 jusqu'à 245)
export const LEVEL_RANGES = [
  { min: 1, max: 20, label: '1-20' },
  { min: 21, max: 35, label: '21-35' },
  { min: 36, max: 50, label: '36-50' },
  { min: 51, max: 65, label: '51-65' },
  { min: 66, max: 80, label: '66-80' },
  { min: 81, max: 95, label: '81-95' },
  { min: 96, max: 110, label: '96-110' },
  { min: 111, max: 125, label: '111-125' },
  { min: 126, max: 140, label: '126-140' },
  { min: 141, max: 155, label: '141-155' },
  { min: 156, max: 170, label: '156-170' },
  { min: 171, max: 185, label: '171-185' },
  { min: 186, max: 200, label: '186-200' },
  { min: 201, max: 215, label: '201-215' },
  { min: 216, max: 230, label: '216-230' },
  { min: 231, max: 245, label: '231-245' }
]

// Configuration par défaut
export const DEFAULT_CONFIG = {
  stasis: 3,
  steles: 0,
  steleIntervention: 0,
  isBooster: true,
  isModulated: true,
  minItemProfit: null,
  minDropRatePercent: null,
  minInstanceTotal: null,
  server: 'pandora',
  levelRanges: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] // Tous activés par défaut
}

// Bonus stasis modulé
export const STASIS_BONUS_MODULATED = {
  1: 0.60,
  2: 1.00,
  3: 1.40,
  4: 2.50,
  5: 4.00,
  6: 5.50,
  7: 6.00,
  8: 6.50,
  9: 6.80,
  10: 7.10
}

// Bonus stasis non modulé
export const STASIS_BONUS_NON_MODULATED = {
  1: 0.60,
  2: 1.00,
  3: 1.20,
  4: 1.60,
  5: 1.88,
  6: 2.00,
  7: 2.05,
  8: 2.10,
  9: 2.15,
  10: 2.20
}

// Bonus booster par serveur
export const BOOSTER_BONUS = {
  ogrest: 1.50,
  'neo-ogrest': 1.50,
  pandora: 1.25,
  'neo-pandora': 1.25
}
