import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useGlobalStore = defineStore('global', () => {
  const LS_KEY = 'wakfarm_config_v1'
  
  // Default configuration
  const defaultConfig = {
    stasis: 3,
    steles: 0,
    steleIntervention: 0,
    isBooster: true,
    isModulated: true,
    // Filters
    minItemProfit: null,
    minDropRatePercent: null,
    minInstanceTotal: null,
    server: 'pandora'
  }

  // Load from localStorage or use defaults
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        return { ...defaultConfig, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error('Erreur lecture localStorage:', e)
    }
    return defaultConfig
  }

  // Configuration du bandeau
  const config = ref(loadConfig())

  // Configuration locale (pour l'onglet "Kamas par heure")
  // On chargera ça depuis le localStorage au montage
  const userRotations = ref([]) 

  function updateConfig(newConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  // Persist to localStorage whenever config changes
  watch(
    config,
    (newVal) => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(newVal))
      } catch (e) {
        console.error('Erreur écriture localStorage:', e)
      }
    },
    { deep: true }
  )

  return { config, userRotations, updateConfig }
})