/**
 * Formate un run config en string lisible et concis
 * Dungeon: M S10 ST4 STI2 B (10min)
 * Rift: V1+10→V11 +80% (10min)
 */
export function formatRunConfig(run) {
  // Rifts (brèches)
  if (run.isRift) {
    const startWave = run.startingWave || 1
    const wavesCompleted = run.wavesCompleted || 1
    const finalWave = startWave + wavesCompleted
    // Ultimate rifts: 18% per wave, normal rifts: 8% per wave
    const bonusPerWave = run.isUltimate ? 18 : 8
    const bonusPercent = (finalWave - 1) * bonusPerWave
    return `V${startWave}+${wavesCompleted}→V${finalWave} +${bonusPercent}%`
  }

  // Dungeons
  const parts = []
  
  // Modulé/Non-modulé
  parts.push(run.isModulated ? 'M' : 'NM')
  
  // Stasis
  parts.push(`S${run.stasis}`)
  
  // Stèles
  if (run.steles > 0) {
    parts.push(`ST${run.steles}`)
  }
  
  // Stèles Intervention
  if (run.steleIntervention > 0) {
    parts.push(`STI${run.steleIntervention}`)
  }
  
  // Booster
  if (run.isBooster) {
    parts.push('B')
  }
  
  return parts.join(' ')
}

/**
 * Calcule le nombre d'itérations possibles en 1 heure
 * Arrondi à l'inférieur
 */
export function calculateIterationsPerHour(timeInMinutes) {
  if (!timeInMinutes || timeInMinutes <= 0) return 0
  return Math.floor(60 / timeInMinutes)
}
