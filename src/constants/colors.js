/**
 * Constantes de couleurs utilisées dans l'application
 * Correspond aux variables CSS définies dans styles/colors.css
 */

// Couleurs personnalisées réutilisées
export const WAKFU_BEIGE = '#625946'
export const WAKFU_GRAY = '#363634'
export const WAKFU_TEXT = '#dadada'
export const WAKFU_TEXT_ALT = '#edd299'
export const TAB_SEPARATOR = '#4e483a'

// Styles réutilisables
export const ACTIVE_TAB_TEXT_SHADOW = '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)'

// Classes Tailwind pré-définies pour éviter la répétition
export const COLOR_CLASSES = {
  // Textes
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-400',
  textLight: 'text-slate-100',
  textNormal: 'text-slate-200',
  textKamas: 'text-[#f4d89e]',
  textAccent: 'text-amber-400',
  textAccentLight: 'text-amber-300',
  textLoading: 'text-orange-400',
  
  // Backgrounds
  bgPrimary: 'bg-slate-900',
  bgSecondary: 'bg-[#1e2026]',
  bgTertiary: 'bg-slate-700',
  bgSecondaryOpacity: 'bg-[#1e2026]',
  bgTertiaryOpacity: 'bg-slate-900',
  
  // Bordures
  borderPrimary: 'border-slate-700',
  borderCard: 'border border-[#625946] rounded-lg',
  
  tabSeparator: 'border-r-2 border-[#4e483a]',
  
  // Boutons/États actifs
  buttonToggle: 'text-slate-300 hover:bg-slate-700',
  
  // Boutons/États actifs (navigation)
  activeTab: 'bg-[#625946] text-[#dadada]',
  inactiveTab: 'bg-[#363634] text-[#edd299] hover:bg-[#625946]',
  activeMainTab: 'bg-[#625946] text-[#dadada]',
  inactiveMainTab: 'bg-[#363634] text-[#edd299] hover:bg-[#625946]',
  
  // Inputs/Select
  input: 'bg-slate-700 text-slate-100 focus:border-[#625946] focus:ring-1 focus:ring-[#625946] outline-none',
  select: 'bg-slate-700 text-slate-100 px-3 py-1 rounded focus:border-[#625946] focus:ring-1 focus:ring-[#625946] outline-none',
  selectRunConfigCard: 'bg-slate-700 text-slate-100 px-2 py-1 rounded focus:border-[#625946] focus:ring-1 focus:ring-[#625946] outline-none',
  
  // Cards
  card: 'border-2 border-[#363634] rounded-lg shadow-lg hover:shadow-xl transition bg-[#1e2026] overflow-hidden hover:border-[#625946]',
  
  // Titres
  titlePrimary: 'text-slate-200',
  titleHeader: 'text-slate-100',
  
  // Header
  headerBg: 'bg-gradient-to-b from-cyan-700 to-cyan-800',
  
  // Footer
  footerBg: 'bg-[#1e2026]',
  footerText: 'text-slate-400',
  
  // Config panel
  configBg: 'bg-[#1e2026] shadow-xl',
}

// Couleurs de rareté Wakfu (extrait depuis constants/index.js)
export const RARITY_COLORS = {
  0: '#BEBEBE',  // Commun
  1: '#FFFFFF',  // Inhabituel
  2: '#00EE8C',  // Rare (vert)
  3: '#FF913C',  // Mythique (orange)
  4: '#FFDF78',  // Légendaire (jaune)
  5: '#6A42A2',  // Relique (violet)
  6: '#8DC6E1',  // Souvenir (cyan)
  7: '#FF88B8'   // Epique (rose)
}
