// Clés localStorage
export const STORAGE_KEYS = {
  CONFIG: 'wakfarm_config_v1',
  LANGUAGE: 'wakfarm_language',
  EXPANDED_INSTANCES: 'expandedInstances_v1'
}

// Couleurs de rareté Wakfu
export const RARITY_COLORS = {
  0: '#FFFFFF',  // Commun
  1: '#FFFFFF',  // Commun
  2: '#00EE8C',  // Inhabituel (vert)
  3: '#FF913C',  // Rare (orange)
  4: '#FFDF78',  // Mythique (jaune)
  5: '#6A42A2',  // Légendaire (violet)
  6: '#8DC6E1',  // Relique (cyan)
  7: '#FF88B8'   // Souvenir (rose)
}

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
  server: 'pandora'
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
