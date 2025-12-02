import { ref, computed, watch } from 'vue'

/**
 * Composable pour gérer l'état d'expansion/réduction des éléments
 * @param {string} storageKey - Clé pour localStorage
 * @param {Array} items - Liste des items (ref ou computed)
 * @returns {Object} - { expanded, toggleExpand, allExpanded, toggleAll, expandAll, collapseAll }
 */
export function useExpandableItems(storageKey, items) {
  // Charger depuis localStorage
  const initial = JSON.parse(localStorage.getItem(storageKey) || '[]')
  const expanded = ref(new Set(initial))

  // Toggle individuel
  function toggleExpand(id) {
    if (expanded.value.has(id)) {
      expanded.value.delete(id)
    } else {
      expanded.value.add(id)
    }
    expanded.value = new Set(expanded.value)
  }

  // Vérifier si tous sont expanded
  const allExpanded = computed(() => {
    if (!items.value || items.value.length === 0) return false
    const ids = items.value.map(i => i.id)
    if (ids.length === 0) return false
    return ids.every(id => expanded.value.has(id))
  })

  // Toggle tous
  function toggleAll() {
    if (allExpanded.value) collapseAll()
    else expandAll()
  }

  // Expand tous
  function expandAll() {
    const ids = items.value.map(i => i.id)
    expanded.value = new Set(ids)
  }

  // Collapse tous
  function collapseAll() {
    expanded.value = new Set()
  }

  // Sauvegarder dans localStorage
  watch(expanded, (val) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...val]))
    } catch (e) {
      console.error('Erreur sauvegarde expanded state:', e)
    }
  }, { deep: true })

  return {
    expanded,
    toggleExpand,
    allExpanded,
    toggleAll,
    expandAll,
    collapseAll
  }
}
