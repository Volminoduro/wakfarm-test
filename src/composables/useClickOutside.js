import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable pour gérer la détection de clic en dehors d'un élément
 * @param {Function} callback - Fonction à appeler lors du clic extérieur
 * @returns {Object} - { elementRef }
 */
export function useClickOutside(callback) {
  const elementRef = ref(null)

  const handleClickOutside = (event) => {
    if (elementRef.value && !elementRef.value.contains(event.target)) {
      callback(event)
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return { elementRef }
}
