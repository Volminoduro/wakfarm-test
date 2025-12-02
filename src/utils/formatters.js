/**
 * Formate un nombre avec séparateurs de milliers (format français)
 */
export function formatNumber(num) {
  if (num === null || num === undefined || num === '') return ''
  return new Intl.NumberFormat('fr-FR').format(num)
}

/**
 * Formate un nombre pour l'input (affiche 0 ou vide si nécessaire)
 */
export function formatInputNumber(num) {
  if (num === 0) return '0'
  if (num === null || num === undefined || num === '') return ''  
  return new Intl.NumberFormat('fr-FR').format(num)
}

/**
 * Formate un taux/pourcentage avec virgule comme séparateur décimal
 */
export function formatRateInput(num) {
  if (num === 0) return '0'
  if (num === null || num === undefined || num === '') return ''  
  return num.toString().replace('.', ',')
}

/**
 * Parse un input numérique formaté (retire les espaces et séparateurs)
 */
export function parseFormattedNumber(value) {
  return value.replace(/\s/g, '').replace(/\u202F/g, '')
}
