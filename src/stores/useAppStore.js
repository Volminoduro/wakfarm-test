import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { STORAGE_KEYS, DEFAULT_CONFIG } from '@/constants'
import { useJsonStore } from './useJsonStore'
import { useNameStore } from './useNameStore'

export const useAppStore = defineStore('app', () => {
  const LS_KEY = STORAGE_KEYS.CONFIG
  const LANG_KEY = STORAGE_KEYS.LANGUAGE

  // Load persisted config or fallback to defaults
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    } catch (e) {
      console.error('Erreur lecture localStorage:', e)
    }
    return { ...DEFAULT_CONFIG }
  }

  const config = ref(loadConfig())

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

  // Persist changes
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

  watch(language, (newVal) => {
    try {
      localStorage.setItem(LANG_KEY, newVal)
    } catch (e) {
      console.error('Erreur écriture language localStorage:', e)
    }
  })

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