import { defineStore } from 'pinia'
import axios from 'axios'
import { useAppStore } from './useAppStore'
import { watch } from 'vue'

export const useJsonStore = defineStore('data', {
  state: () => ({
    servers: [],
    loaded: false,
    pricesLastUpdate: null,
    rawInstances: [],
    rawItems: [],
    _rawMapping: [],
    _rawLoots: [],
    _rawPrices: {},
    _bossMapping: {},
    _hasConfigWatcher: false,
    instancesBase: []
  }),
  getters: {
    priceMap() {
      if (Array.isArray(this._rawPrices)) {
        const map = {}
        this._rawPrices.forEach(p => {
          map[p.itemId] = p.price
        })
        return map
      }
      return this._rawPrices && typeof this._rawPrices === 'object' ? this._rawPrices : {}
    },

    itemRarityMap() {
      const map = {}
      if (Array.isArray(this.rawItems)) {
        this.rawItems.forEach(item => {
          map[item.id] = item.rarity || 0
        })
      }
      return map
    },

    itemToInstancesMap() {
      const loots = Array.isArray(this._rawLoots) ? this._rawLoots : []
      const mapping = Array.isArray(this._rawMapping) ? this._rawMapping : []

      if (loots.length === 0 || mapping.length === 0) return {}

      const monsterToInstances = new Map()
      mapping.forEach(m => {
        const monsters = Array.isArray(m && m.monsters) ? m.monsters : []
        monsters.forEach(monster => {
          const existing = monsterToInstances.get(monster.monsterId) || []
          existing.push(m.instanceId)
          monsterToInstances.set(monster.monsterId, existing)
        })
      })

      const itemMap = new Map()
      loots.forEach(loot => {
        const instanceIds = monsterToInstances.get(loot.monsterId) || []
        const lootList = Array.isArray(loot && loot.loots) ? loot.loots : []
        lootList.forEach(drop => {
          const existing = itemMap.get(drop.itemId) || new Set()
          instanceIds.forEach(instId => existing.add(instId))
          itemMap.set(drop.itemId, existing)
        })
      })

      const result = {}
      itemMap.forEach((instanceSet, itemId) => {
        result[itemId] = Array.from(instanceSet)
      })
      return result
    }
  },
  actions: {
    async loadAllData(server) {
      try {
        const basePath = import.meta.env.BASE_URL
        const [instRes, itemRes, mappingRes, lootRes, serversRes, bossMappingRes] = await Promise.all([
          axios.get(`${basePath}data/instances.json`),
          axios.get(`${basePath}data/items.json`),
          axios.get(`${basePath}data/mapping.json`),
          axios.get(`${basePath}data/loots.json`),
          axios.get(`${basePath}data/servers.json`),
          axios.get(`${basePath}data/boss-mapping.json`)
        ])

        this.servers = serversRes.data || []
        
        // Store raw fetched data so we can recompute when global config changes
        this.rawInstances = instRes.data
        this.rawItems = itemRes.data
        this._rawMapping = mappingRes.data
        this._rawLoots = lootRes.data
        await this.loadPricesWithLatestDate(server)
        this._bossMapping = bossMappingRes.data

        this.rawInstances = this.rawInstances.map(inst => ({
          ...inst,
          bossId: this._bossMapping[inst.id] || null
        }))

        // Setup a watcher to reload prices when server changes.
        const appStore = useAppStore()
        if (!this._hasConfigWatcher) {
          this._hasConfigWatcher = true
          // Watch server separately to reload prices and recompute price-dependent data
          watch(
            () => appStore.config.server,
            async (newServer, oldServer) => {
              if (newServer !== oldServer) {
                await this.loadPricesWithLatestDate(newServer)
              }
            }
          )
        }

        // Process and store only _instancesBase (pass raw data)
        this._initiateInstancesBase()
        this.loaded = true
      } catch (e) {
        console.error("Erreur chargement données", e)
      }
    },

    _initiateInstancesBase(){
      // Préparer un mapping instanceId -> mapping
      const mappingMap = new Map(this._rawMapping.map(m => [m.instanceId, m]))

      // Préparer un mapping monsterId -> loots
      const lootMap = new Map()
      this._rawLoots.forEach(loot => {
        lootMap.set(loot.monsterId, loot.loots || [])
      })

      // Construction optimisée des instances
      const instancesBase = this.rawInstances.map(inst => {
        const instanceMapping = mappingMap.get(inst.id)
        let baseLoots = []
        if (instanceMapping?.monsters) {
          baseLoots = instanceMapping.monsters.flatMap(monster => {
            const monsterLoots = lootMap.get(monster.monsterId) || []
            return monsterLoots.map(lootEntry => ({
              ...lootEntry,
              monsterQuantity: monster.number || 1
            }))
          })
        }
        const players = inst.players || (inst.isDungeon ? 3 : 4)
        return {
          id: inst.id,
          level: inst.level,
          isDungeon: inst.isDungeon,
          isUltimate: inst.isUltimate || false,
          bossId: inst.bossId || null,
          loots: baseLoots,
          players
        }
      })
      this.instancesBase = instancesBase
    },

    async _selectLatestPriceFilename(server, serverInfo, basePath) {
      try {
        const indexRes = await axios.get(`${basePath}data/prices/price_index.json`)
        const indexData = indexRes.data
        let fileList = []

        if (Array.isArray(indexData)) {
          fileList = indexData.slice()
        } else if (indexData && typeof indexData === 'object') {
          if (Array.isArray(indexData[server])) {
            fileList = indexData[server].slice()
          } else if (serverInfo && serverInfo.name && Array.isArray(indexData[serverInfo.name])) {
            fileList = indexData[serverInfo.name].slice()
          } else {
            fileList = Object.keys(indexData)
          }
        }

        fileList = fileList.map(f => (typeof f === 'string' ? f.split('/').pop() : '')).filter(Boolean)

        const serverPrefix = serverInfo?.price_prefix || `${server}_`
        const filtered = fileList.filter(f => f.startsWith(serverPrefix) || f.includes(`${server}_`) || f === `${server}.json`)
        const candidates = filtered.length ? filtered : fileList

        if (candidates.length) {
          const parseKey = f => {
            const m = f.match(/(\d{8})_(\d{4})/)
            if (m) return `${m[1]}${m[2]}`
            return f
          }
          candidates.sort((a, b) => {
            const ka = parseKey(a)
            const kb = parseKey(b)
            if (ka < kb) return 1
            if (ka > kb) return -1
            return 0
          })
          return candidates[0]
        }

        return null
      } catch (err) {
        return null
      }
    },

    async loadPricesWithLatestDate(server) {
      try {
        const basePath = import.meta.env.BASE_URL
        const serverInfo = this.servers.find(s => s.id === server)

        // Default fallback filename
        let priceFilename = serverInfo?.price_file || `${server}.json`

        // Try to select latest filename from index
        try {
          const selected = await this._selectLatestPriceFilename(server, serverInfo, basePath)
          if (selected) priceFilename = selected
        } catch (err) {
          // ignore and keep fallback
        }

        // localStorage key for this server
        const storageKey = `wakfarm_prices_${server}`
        const cachedRaw = (() => {
          try {
            const raw = localStorage.getItem(storageKey)
            return raw ? JSON.parse(raw) : null
          } catch (err) {
            return null
          }
        })()

        const getFilenameDateKey = (fn) => {
          if (!fn || typeof fn !== 'string') return null
          const m = fn.match(/(\d{8})_(\d{4})/)
          if (!m) return null
          return `${m[1]}${m[2]}` // YYYYMMDDHHMM as string
        }

        // If we have a cached entry, and it's the exact same filename, use it
        if (cachedRaw && cachedRaw.filename === priceFilename && cachedRaw.data) {
          console.info(`Using cached prices for server ${server} (filename ${priceFilename})`)
          this._rawPrices = cachedRaw.data
          this.pricesLastUpdate = cachedRaw.pricesLastUpdate || null
          return cachedRaw.data
        }

        // If cache exists and its date is newer or equal than the selected filename, use cache
        const selectedDateKey = getFilenameDateKey(priceFilename)
        const cachedDateKey = cachedRaw && cachedRaw.filename ? getFilenameDateKey(cachedRaw.filename) : null
        if (cachedRaw && cachedRaw.data && cachedDateKey && selectedDateKey && cachedDateKey >= selectedDateKey) {
          console.info(`Using cached prices for server ${server} because cache is newer or equal (cached ${cachedRaw.filename} >= selected ${priceFilename})`)
          this._rawPrices = cachedRaw.data
          this.pricesLastUpdate = cachedRaw.pricesLastUpdate || null
          return cachedRaw.data
        }

        // Otherwise attempt to fetch the selected file. If fetch fails and cache exists, fall back to cache.
        try {
          const priceRes = await axios.get(`${basePath}data/prices/${priceFilename}`)

          const filenameMatch = (priceFilename || '').match(/(\d{8})_(\d{4})/)
          if (filenameMatch && filenameMatch[1] && filenameMatch[2]) {
            const dateStr = filenameMatch[1]
            const timeStr = filenameMatch[2]
            const year = dateStr.substring(0, 4)
            const month = dateStr.substring(4, 6)
            const day = dateStr.substring(6, 8)
            const hour = timeStr.substring(0, 2)
            const minute = timeStr.substring(2, 4)
            this.pricesLastUpdate = `${day}.${month}.${year} ${hour}:${minute}`
          } else {
            this.pricesLastUpdate = null
          }

          this._rawPrices = priceRes.data

          // Cache the fetched data
          try {
            const toStore = {
              filename: priceFilename,
              pricesLastUpdate: this.pricesLastUpdate,
              data: priceRes.data
            }
            localStorage.setItem(storageKey, JSON.stringify(toStore))
          } catch (err) {
            // ignore storage errors
          }

          return priceRes.data
        } catch (errFetch) {
          // Fetch failed — if we have any cache, use it, even if filename differs
          if (cachedRaw && cachedRaw.data) {
            console.info(`Falling back to cached prices for server ${server} (cached filename ${cachedRaw.filename}) after fetch error`)
            this._rawPrices = cachedRaw.data
            this.pricesLastUpdate = cachedRaw.pricesLastUpdate || null
            return cachedRaw.data
          }
          throw errFetch
        }
      } catch (e) {
        console.error("Erreur chargement prix", e)
        this.pricesLastUpdate = null
      }
    }
  }
})
