/**
 * Constantes de couleurs utilisées dans l'application
 * Correspond aux variables CSS définies dans styles/colors.css
 */

export const COLORS = {
  // Couleurs principales (orange)
  primary: {
    DEFAULT: '#f97316',    // orange-500
    light: '#fb923c',      // orange-400
    dark: '#ea580c',       // orange-600
    lighter: '#fdba74',    // orange-300
  },
  
  // Couleurs d'accent (cyan pour header)
  accent: {
    DEFAULT: '#0e7490',    // cyan-700
    dark: '#155e75',       // cyan-800
    light: '#06b6d4',      // cyan-500
    lighter: '#22d3ee',    // cyan-400
  },
  
  // Backgrounds
  bg: {
    primary: '#0f172a',    // slate-900
    secondary: '#1e293b',  // slate-800
    tertiary: '#334155',   // slate-700
  },
  
  // Texte
  text: {
    primary: '#f1f5f9',    // slate-100
    secondary: '#e2e8f0',  // slate-200
    muted: '#cbd5e1',      // slate-300
    subtle: '#94a3b8',     // slate-400
  },
  
  // Bordures
  border: {
    primary: '#334155',    // slate-700
    accent: 'rgba(249, 115, 22, 0.3)',      // orange-500/30
    accentHover: 'rgba(249, 115, 22, 0.4)', // orange-500/40
  }
}

// Classes Tailwind pré-définies pour éviter la répétition
export const COLOR_CLASSES = {
  // Textes
  textPrimary: 'text-orange-400',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-400',
  textLight: 'text-slate-100',
  textNormal: 'text-slate-200',
  textKamas: 'text-[#f4d89e]',
  
  // Backgrounds
  bgPrimary: 'bg-slate-900',
  bgSecondary: 'bg-[#1e2026]',
  bgTertiary: 'bg-slate-700',
  bgSecondaryOpacity: 'bg-[#1e2026]/50',
  bgTertiaryOpacity: 'bg-slate-900/50',
  
  // Bordures
  borderPrimary: 'border-slate-700',
  borderAccent: 'border-orange-500/30',
  borderAccentFull: 'border-orange-400',
  borderAccentHover: 'hover:border-orange-400',
  
  // Boutons/États actifs
  activeTab: 'bg-[#625946] text-[#dadada]',
  inactiveTab: 'bg-[#363634] text-[#edd299] hover:bg-[#625946]',
  activeMainTab: 'bg-[#625946] text-[#dadada]',
  inactiveMainTab: 'bg-[#363634] text-[#edd299] hover:bg-[#625946]',
  
  // Inputs/Select
  input: 'bg-slate-700 text-slate-100 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none',
  select: 'bg-slate-700 text-slate-100 px-3 py-1 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-400 outline-none',
  
  // Cards
  card: 'border-2 border-orange-500/40 rounded-lg shadow-lg hover:shadow-xl transition bg-[#1e2026] overflow-hidden hover:border-orange-400',
  
  // Titres
  titlePrimary: 'text-slate-200',
  titleHeader: 'text-slate-100',
  
  // Header
  headerBg: 'bg-gradient-to-b from-cyan-700 to-cyan-800',
  headerBorder: 'border-b-2 border-orange-400',
  
  // Footer
  footerBg: 'bg-[#1e2026]',
  footerBorder: 'border-t-2 border-orange-500/30',
  footerText: 'text-slate-400',
  
  // Config panel
  configBg: 'bg-[#1e2026] shadow-xl',
}
