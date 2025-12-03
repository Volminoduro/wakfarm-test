/**
 * Formate un run config en string lisible et concis
 * Format: M S10 ST4 STI2 B (10min)
 * M = Modulé, S = Stasis, ST = Stèles, STI = Stèles Intervention, B = Booster
 */
export function formatRunConfig(run) {
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
