import { describe, it, expect, vi } from 'vitest'

// Mock useLocalStorage to control the returned period for getNbCyclesForConfig
vi.mock('@/composables/useLocalStorage', () => {
  return {
    useLocalStorage: (key, defaultValue) => {
      return { value: 60 }
    }
  }
})

import { formatConfigRun, getNbCyclesForConfig } from '@/utils/runHelpers'

describe('formatConfigRun', () => {
  it('formats rift config', () => {
    const cfg = { isRift: true, startingWave: 2, wavesCompleted: 3 }
    expect(formatConfigRun(cfg)).toBe('V2+3')
  })

  it('formats dungeon config with optional flags', () => {
    const cfg = { isModulated: true, stasis: 4, steles: 2, steleIntervention: 1, isBooster: true }
    const s = formatConfigRun(cfg)
    expect(s).toContain('M')
    expect(s).toContain('S4')
    expect(s).toContain('ST2')
    expect(s).toContain('STI1')
    expect(s).toContain('B')
  })
})

describe('getNbCyclesForConfig', () => {
  it('computes cycles from period and config.time', () => {
    const cfg = { time: 10 } // local period mocked to 60 => 6 cycles
    expect(getNbCyclesForConfig(cfg)).toBe(6)
  })

  it('multiplies cycles for rift wavesCompleted', () => {
    const cfg = { time: 10, isRift: true, wavesCompleted: 2 }
    expect(getNbCyclesForConfig(cfg)).toBe(12) // 6 * 2
  })
})
