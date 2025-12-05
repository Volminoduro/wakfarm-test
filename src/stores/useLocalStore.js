import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../constants'

export const useLocalStore = defineStore('local', () => {
  const LS_KEY = STORAGE_KEYS.CONFIG
  const LANG_KEY = STORAGE_KEYS.LANGUAGE

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

  const config = ref(loadConfig())
  // Language persisted separately
  const loadLanguage = () => {
    try {
      const saved = localStorage.getItem(LANG_KEY)
      if (saved) return saved
    } catch (e) {
      console.error('Erreur lecture language localStorage:', e)
    }
    return 'fr'
  }

  const language = ref(loadLanguage())
  const userRotations = ref([])

  function updateConfig(newConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  function updateLanguage(lang) {
    language.value = lang
  }

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

  watch(
    language,
    (newVal) => {
      try {
        localStorage.setItem(LANG_KEY, newVal)
      } catch (e) {
        console.error('Erreur écriture language localStorage:', e)
      }
    }
  )

  return { config, userRotations, updateConfig, language, updateLanguage }
})
