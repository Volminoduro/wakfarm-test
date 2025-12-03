/**
 * Formate un run config en string lisible et concis
 * Format: M3 B St10 S4 SI2 (10min)
 * M = Modulé, B = Booster, St = Stasis, S = Stèles, SI = Stèles Intervention
 */
export function formatRunConfig(run) {
  const parts = []
  
  // Modulé/Non-modulé
  parts.push(run.isModulated ? 'M' : 'NM')
  
  // Booster
  if (run.isBooster) {
    parts.push('B')
  }
  
  // Stasis
  parts.push(`St${run.stasis}`)
  
  // Stèles
  if (run.steles > 0) {
    parts.push(`S${run.steles}`)
  }
  
  // Stèles Intervention
  if (run.steleIntervention > 0) {
    parts.push(`SI${run.steleIntervention}`)
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
