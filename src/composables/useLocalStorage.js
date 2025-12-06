import { ref, watch } from 'vue'

// Cache pour retourner la même référence pour une clé donnée
const storageCache = new Map()

/**
 * Composable pour gérer la persistance localStorage avec watch automatique
 * Retourne une référence partagée par clé pour que plusieurs appels restent synchronisés
 * @param {string} key - Clé localStorage
 * @param {*} defaultValue - Valeur par défaut
 * @param {Object} options - Options { deep: boolean }
 * @returns {Ref} - Référence réactive synchronisée avec localStorage
 */
export function useLocalStorage(key, defaultValue, options = {}) {
  const { deep = false } = options

  if (storageCache.has(key)) return storageCache.get(key)

  // Charger la valeur depuis localStorage
  const loadValue = () => {
    try {
      const saved = localStorage.getItem(key)
      return saved !== null ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  }

  const value = ref(loadValue())

  // Sauvegarder automatiquement lors des changements
  watch(
    value,
    (newVal) => {
      try {
        localStorage.setItem(key, JSON.stringify(newVal))
      } catch (error) {
        console.error(`Erreur sauvegarde localStorage [${key}]:`, error)
      }
    },
    { deep }
  )

  // Écoute les changements provenant d'autres onglets/fenêtres
  const onStorage = (e) => {
    if (!e) return
    try {
      if (e.key === key) {
        value.value = e.newValue !== null ? JSON.parse(e.newValue) : defaultValue
      }
    } catch {
      // ignore parse errors
    }
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', onStorage)
  }

  storageCache.set(key, value)
  return value
}
