import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Consolidated tests for useJsonStore: caching, index.json fallback, and directory listing parsing

const setupLocalStorageMock = () => {
  const store = {}
  global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    _store: store
  }
}

describe('useJsonStore - prices cache & discovery', () => {
  let originalLocalStorage

  beforeEach(() => {
    vi.resetModules()
    originalLocalStorage = global.localStorage
    setupLocalStorageMock()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    global.localStorage = originalLocalStorage
    vi.restoreAllMocks()
  })

  describe('price caching behavior', () => {
    it('reuses cached prices when cached timestamp >= filename timestamp', async () => {
      const axiosMock = { get: vi.fn((url) => {
        // Return an index pointing to an older file than the cached one
        if (url.endsWith('/data/prices/price_index.json')) {
          return Promise.resolve({ data: { Pandora: ['Pandora_20251209_1200.json'] } })
        }
        throw new Error('Should not fetch ' + url)
      }) }
      vi.doMock('axios', () => ({ default: axiosMock }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      store.servers = [{ id: 'Pandora' }]

      const parsedTs = Date.parse('2025-12-10T12:00:00Z')
      const cacheKey = 'wakfarm_prices_Pandora'
      const cached = { filename: 'Pandora_20251210_1200.json', pricesLastUpdate: '10.12.2025 12:00', data: { 1: 100 } }
      localStorage.setItem(cacheKey, JSON.stringify(cached))

      const res = await store.loadPricesWithLatestDate('Pandora')

      expect(res).toEqual({ 1: 100 })
      expect(store._rawPrices).toEqual({ 1: 100 })
      expect(store.pricesLastUpdate).toBe('10.12.2025 12:00')
    })

    it('stores fetched prices in cache when no cache exists', async () => {
      // simulate discovery via an HTML directory listing (no index.json) and then a price file fetch; ensure no pre-existing cache
      // Simulate price_index.json listing the available files for servers
      const indexData = { Pandora: ['Pandora_20251211_0800.json'] }
      const axiosMock = { get: vi.fn((url) => {
        if (url.endsWith('/data/prices/price_index.json')) {
          return Promise.resolve({ data: indexData })
        }
        if (url.includes('Pandora_20251211_0800.json')) {
          return Promise.resolve({ data: { 2: 200 } })
        }
        return Promise.reject(new Error('Unexpected URL ' + url))
      }) }
      vi.doMock('axios', () => ({ default: axiosMock }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      store.servers = [{ id: 'Pandora' }]

      const cacheKey = 'wakfarm_prices_Pandora'
      localStorage.removeItem(cacheKey)

      const res = await store.loadPricesWithLatestDate('Pandora')

      expect(axiosMock.get).toHaveBeenCalled()
      expect(res).toEqual({ 2: 200 })
      const raw = JSON.parse(localStorage.getItem(cacheKey))
      expect(raw.data).toEqual({ 2: 200 })
      expect(raw.filename).toBe('Pandora_20251211_0800.json')
    })

    it('updates cache when remote filename is newer than cached one', async () => {
      // existing cache with older timestamp
      const cacheKey = 'wakfarm_prices_Pandora'
      const cached = { filename: 'Pandora_20251210_0800.json', pricesLastUpdate: '10.12.2025 08:00', data: { 1: 100 } }
      localStorage.setItem(cacheKey, JSON.stringify(cached))

      const indexData = { Pandora: ['Pandora_20251211_0800.json'] }
      const axiosMock = { get: vi.fn((url) => {
        if (url.endsWith('/data/prices/price_index.json')) {
          return Promise.resolve({ data: indexData })
        }
        if (url.includes('Pandora_20251211_0800.json')) {
          return Promise.resolve({ data: { 2: 200 } })
        }
        return Promise.reject(new Error('Unexpected URL ' + url))
      }) }
      vi.doMock('axios', () => ({ default: axiosMock }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()
      store.servers = [{ id: 'Pandora' }]

      const res = await store.loadPricesWithLatestDate('Pandora')

      expect(axiosMock.get).toHaveBeenCalled()
      expect(res).toEqual({ 2: 200 })
      const raw = JSON.parse(localStorage.getItem(cacheKey))
      expect(raw.data).toEqual({ 2: 200 })
      expect(raw.filename).toBe('Pandora_20251211_0800.json')
    })

    it('uses cache if filename matches and file has no date info', async () => {
      const axiosMock = { get: vi.fn(() => { throw new Error('Should not fetch') }) }
      vi.doMock('axios', () => ({ default: axiosMock }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      store.servers = [{ id: 'Legacy' }]

      const cacheKey = 'wakfarm_prices_Legacy'
      const cached = { filename: 'legacy_prices.json', pricesLastUpdate: null, data: { 3: 300 } }
      localStorage.setItem(cacheKey, JSON.stringify(cached))

      const res = await store.loadPricesWithLatestDate('Legacy')

      expect(res).toEqual({ 3: 300 })
      expect(store._rawPrices).toEqual({ 3: 300 })
    })

    it('keeps separate caches per server and reuses each independently', async () => {
      const axiosMock = { get: vi.fn(() => { throw new Error('Should not fetch') }) }
      vi.doMock('axios', () => ({ default: axiosMock }))

      const { useJsonStore } = await import('@/stores/useJsonStore')
      const store = useJsonStore()

      store.servers = [
        { id: 'Pandora' },
        { id: 'Other' }
      ]

      const cacheP = { filename: 'Pandora_20251210_1200.json', pricesLastUpdate: '10.12.2025 12:00', data: { 1: 100 } }
      const cacheO = { filename: 'Other_20251209_0900.json', pricesLastUpdate: '09.12.2025 09:00', data: { 5: 500 } }
      localStorage.setItem('wakfarm_prices_Pandora', JSON.stringify(cacheP))
      localStorage.setItem('wakfarm_prices_Other', JSON.stringify(cacheO))

      const resP = await store.loadPricesWithLatestDate('Pandora')
      const resO = await store.loadPricesWithLatestDate('Other')

      expect(resP).toEqual({ 1: 100 })
      expect(resO).toEqual({ 5: 500 })
    })
  })

})
