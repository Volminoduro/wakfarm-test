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

/**
 * Formate une quantité avec jusqu'à 2 décimales (sans zéros inutiles)
 */
export function formatQuantity(num) {
  if (num === null || num === undefined) return ''
  return Number(num.toFixed(2)).toString()
}

/**
 * Formate un taux en pourcentage avec jusqu'à 2 décimales (sans zéros inutiles)
 */
export function formatRate(rate) {
  if (rate === null || rate === undefined) return ''
  if(rate < 1) return Number((rate * 100).toFixed(4)).toString()
  return Number((rate * 100).toFixed(2)).toString()
}
