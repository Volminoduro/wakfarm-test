/**
 * Formate un run config en string lisible et concis
 * Dungeon: M S10 ST4 STI2 B (10min)
 * Rift: V1+10→V11 +80% (10min)
 */
export function formatRunConfig(run) {
  if (run.isRift) {
    const startWave = run.startingWave || 1
    const wavesCompleted = run.wavesCompleted || 1
    return `V${startWave}+${wavesCompleted}`
  }

  // Dungeons
  const parts = []
  parts.push(run.isModulated ? 'M' : 'NM')
  parts.push(`S${run.stasis}`)
  if (run.steles > 0) {
    parts.push(`ST${run.steles}`)
  }
  if (run.steleIntervention > 0) {
    parts.push(`STI${run.steleIntervention}`)
  }
  if (run.isBooster) {
    parts.push('B')
  }
  
  return parts.join(' ')
}