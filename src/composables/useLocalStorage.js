import { ref, watch } from 'vue'

/**
 * Composable pour gérer la persistance localStorage avec watch automatique
 * @param {string} key - Clé localStorage
 * @param {*} defaultValue - Valeur par défaut
 * @param {Object} options - Options { deep: boolean }
 * @returns {Ref} - Référence réactive synchronisée avec localStorage
 */
export function useLocalStorage(key, defaultValue, options = {}) {
  const { deep = false } = options

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

  return value
}
