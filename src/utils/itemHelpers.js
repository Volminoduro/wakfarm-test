import { RARITY_COLORS } from '@/constants'

/**
 * Get stele information string for an item
 * @param {Object} item - Item with stele and steleIntervention properties
 * @returns {string} Formatted stele info (e.g., ", st. 2, st.i. 1") or empty string
 */
export function getSteleInfo(item) {
  const parts = []
  if (item.stele > 0) {
    parts.push(`st. ${item.stele}`)
  }
  if (item.steleIntervention > 0) {
    parts.push(`st.i. ${item.steleIntervention}`)
  }
  return parts.length > 0 ? ', ' + parts.join(', ') : ''
}

/**
 * Get rarity color for an item
 * @param {number} rarity - Rarity level (0-7)
 * @returns {string} Hex color code
 */
export function getRarityColor(rarity) {
  return RARITY_COLORS[rarity] || RARITY_COLORS[0]
}
