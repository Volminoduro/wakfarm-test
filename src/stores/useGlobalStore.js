import { useLocalStore } from './useLocalStore'
import { computed } from 'vue'
import { useJsonStore } from './useJsonStore'
import { useRunsStore } from './useRunsStore'

// Facade/global accessor that composes the local persisted store and the data store.
// It also centralizes cross-store actions like language changes and initial data loading.
export const useGlobalStore = () => {
  const local = useLocalStore()
  const data = useJsonStore()
  const runs = useRunsStore()

  // Create a reactive proxy for language that always forwards to the local store's ref
  const language = computed(() => {
    const l = local.language
    return (l && (l.value ?? l)) || 'fr'
  })

  // Set language globally: update persisted value and load names from json store
  async function setLanguage(lang) {
    if (local.updateLanguage) local.updateLanguage(lang)
    try {
      await data.loadNames(lang)
    } catch (e) {
      console.error('Erreur chargement noms pour la langue', lang, e)
    }
  }

  // Initialize data (used on app mount): load all main JSON + names using persisted language
  async function initData(server) {
    // `language` computed proxy already returns a default ('fr') when missing,
    // so rely on `language.value` here to avoid duplicating fallback logic.
    const lang = language.value
    try {
      await data.loadAllData(server, lang)
    } catch (e) {
      console.error('Erreur initData', e)
    }
  }

  return {
    ...local,
    language,
    jsonStore: data,
    runsStore: runs,
    setLanguage,
    initData
  }
}
