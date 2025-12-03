import { ref } from 'vue'
import { useClickOutside } from './useClickOutside'

/**
 * Composable pour gérer un dropdown avec checkboxes multiples
 * @param {Ref} selectedItems - Tableau réactif des items sélectionnés
 * @param {Ref|ComputedRef} allItems - Liste complète des items disponibles
 * @param {Object} translations - Objets de traduction { all, none, selected }
 * @returns {Object} - Gestion complète du dropdown
 */
export function useCheckboxDropdown(selectedItems, allItems, translations) {
  const isOpen = ref(false)

  // Click outside pour fermer le dropdown
  const { elementRef } = useClickOutside(() => {
    isOpen.value = false
  })

  // Toggle un item dans la sélection
  const toggleItem = (item) => {
    const index = selectedItems.value.indexOf(item)
    if (index === -1) {
      selectedItems.value.push(item)
    } else {
      selectedItems.value.splice(index, 1)
    }
  }

  // Sélectionner/désélectionner tous les items
  const toggleAll = (selectAll) => {
    if (selectAll) {
      selectedItems.value = [...allItems.value]
    } else {
      selectedItems.value = []
    }
    isOpen.value = false
  }

  // Texte d'affichage du dropdown
  const getDisplayText = () => {
    const count = selectedItems.value.length
    const total = allItems.value.length

    if (count === 0) return translations.none
    if (count === total) return translations.all
    
    // Format: "X/Y" avec padding pour X
    const paddedCount = count.toString().padStart(2, ' ')
    return `${paddedCount}/${total}`
  }

  return {
    isOpen,
    elementRef,
    toggleItem,
    toggleAll,
    getDisplayText
  }
}
