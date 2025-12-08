import { useLocalStorage } from '@/composables/useLocalStorage'

/**
 * Formate un run config en string lisible et concis
 * Dungeon: M S10 ST4 STI2 B (10min)
 * Rift: V1+10→V11 +80% (10min)
 */
export function formatConfigRun(config) {
  if (config.isRift) {
    const startWave = config.startingWave || 1
    const wavesCompleted = config.wavesCompleted || 1
    return `V${startWave}+${wavesCompleted}`
  }

  // Dungeons
  const parts = []
  parts.push(config.isModulated ? 'M' : 'NM')
  parts.push(`S${config.stasis}`)
  if (config.steles > 0) {
    parts.push(`ST${config.steles}`)
  }
  if (config.steleIntervention > 0) {
    parts.push(`STI${config.steleIntervention}`)
  }
  if (config.isBooster) {
    parts.push('B')
  }
  
  return parts.join(' ')
}

export function getNbCyclesForConfig(config) {
  let nbCycles = config?.time ? Math.floor(useLocalStorage('wakfarm_time_period', 60).value / config.time) : 1
  if (config?.isRift) {
    const wavesCompleted = config.wavesCompleted || 1
    nbCycles *= wavesCompleted
  }
  return nbCycles
}