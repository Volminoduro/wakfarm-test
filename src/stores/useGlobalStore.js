import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../constants'

export const useGlobalStore = defineStore('global', () => {
  const LS_KEY = STORAGE_KEYS.CONFIG

  // Load from localStorage or use defaults
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error('Erreur lecture localStorage:', e)
    }
    return DEFAULT_CONFIG
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