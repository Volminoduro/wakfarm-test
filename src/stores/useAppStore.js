import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS, DEFAULT_CONFIG } from '@/constants'
import { useJsonStore } from './useJsonStore'
import { useNameStore } from './useNameStore'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useAppStore = defineStore('app', () => {
  const LS_KEY = STORAGE_KEYS.CONFIG
  const LANG_KEY = STORAGE_KEYS.LANGUAGE

  // Persisted config (merge with defaults)
  const config = useLocalStorage(LS_KEY, { ...DEFAULT_CONFIG }, { deep: true })
  // Ensure missing default keys are present (in case stored value is partial)
  try {
    config.value = { ...DEFAULT_CONFIG, ...config.value }
  } catch (e) {
    config.value = { ...DEFAULT_CONFIG }
  }

  const language = useLocalStorage(LANG_KEY, 'fr')
  const userRotations = ref([])

  function updateConfig(newConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  // persistence handled by useLocalStorage

  // Compose other stores
  const jsonStore = useJsonStore()
  const nameStore = useNameStore()

  // Change language globally and reload names
  async function setLanguage(lang) {
    language.value = lang
    try {
      await nameStore.loadNames(lang)
    } catch (e) {
      console.error('Erreur chargement noms pour la langue', lang, e)
    }
  }

  // Initialize main data on app start
  async function initData(server) {
    const lang = language.value || 'fr'
    try {
      await Promise.all([
        jsonStore.loadAllData(server),
        nameStore.loadNames(lang)
      ])
      // Ensure persisted config.server is valid; if not, set to DEFAULT_CONFIG.server or first available
      try {
        const configured = config.value?.server
        const valid = jsonStore.servers && jsonStore.servers.find(s => s.id === configured)
        if (!valid) {
          const defaultFromConfig = DEFAULT_CONFIG && DEFAULT_CONFIG.server
          const fallback = defaultFromConfig || (jsonStore.servers && jsonStore.servers[0] && jsonStore.servers[0].id)
          if (fallback) {
            config.value = { ...config.value, server: fallback }
          }
        }
      } catch (e) {
        // Non-fatal: if servers not present or check fails, don't block init
        console.warn('Could not ensure default server in config', e)
      }
    } catch (e) {
      console.error('Erreur initData', e)
    }
  }

  return {
    // persisted app-level state
    config,
    updateConfig,
    language,
    userRotations,

    // composed stores and actions
    setLanguage,
    initData
  }
})