import { LEVEL_RANGES } from '../constants'

export function instancePassesFilters(instanceData, globalStore) {
  if (!instanceData || !globalStore) return false

  const minInstanceTotal = globalStore.config.minInstanceTotal || 0
  const activeLevelRanges = globalStore.config.levelRanges || []

  // If no level ranges selected, exclude everything
  if (activeLevelRanges.length === 0) return false

  if ((instanceData.totalKamas || 0) < minInstanceTotal) return false

  // If not all ranges selected, ensure instance level is inside one selected range
  if (activeLevelRanges.length < LEVEL_RANGES.length) {
    const level = instanceData.level || 0
    const inRange = activeLevelRanges.some(rangeIndex => {
      const range = LEVEL_RANGES[rangeIndex]
      if (!range) return false
      return level >= range.min && level <= range.max
    })
    if (!inRange) return false
  }

  return true
}
