import { defineStore } from 'pinia'
import axios from 'axios'
import { useAppStore } from './useAppStore'
import { watch } from 'vue'
import { LEVEL_RANGES } from '@/constants'
import { calculateFinalQuantity, filterAndSortItems, processLoots, shouldIncludeLoot } from '@/utils/instanceProcessor'


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
    _instancesBase: []
  }),
  getters: {
    // Expose price map as a getter for reuse across components
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

    // Expose item rarity map as a getter for reuse
    itemRarityMap() {
      const map = {}
      if (Array.isArray(this.rawItems)) {
        this.rawItems.forEach(item => {
          map[item.id] = item.rarity || 0
        })
      }
      return map
    },

    // Build and cache item-to-instances mapping
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
        await this.loadPricesWithDate(server)
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
                await this.loadPricesWithDate(newServer)
              }
            }
          )
        }

        // Process and store only _instancesBase (pass raw data)
        this.initiateInstancesBase(
          this.rawInstances,
          this._rawMapping,
          this._rawLoots,
        )
        this.loaded = true
      } catch (e) {
        console.error("Erreur chargement données", e)
      }
    },

    initiateInstancesBase(instances, mapping, loots){
      const itemRarityMap = this.itemRarityMap

      // Filter out rifts for base; keep metadata
      const dungeonsOnly = instances.filter(inst => inst.isDungeon)

      const mappingMap = {}
      mapping.forEach(m => { mappingMap[m.instanceId] = m })

      const instancesBase = dungeonsOnly.map(inst => {
        const instanceMapping = mappingMap[inst.id]
        const baseLoots = []

        if (instanceMapping?.monsters) {
          instanceMapping.monsters.forEach(monster => {
            loots
              .filter(loot => loot.monsterId === monster.monsterId)
              .forEach(loot => {
                (loot.loots || [])
                  .filter(lootEntry => {
                    const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                    const minimalConfig = { isRift: inst.isRift || false, isUltimate: inst.isUltimate || false, steles: 0, steleIntervention: 0, stasis: 0, isModulated: false }
                    return shouldIncludeLoot(lootEntry, itemRarity, minimalConfig)
                  })
                  .forEach(lootEntry => {
                    const baseQuantity = (lootEntry.quantity || 0) * (monster.number || 1)
                    baseLoots.push({
                      ...lootEntry,
                      baseQuantity,
                      monsterNumber: monster.number || 1
                    })
                  })
              })
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
      console.log('Instances de base initialisées', instancesBase)
      this._instancesBase = instancesBase
    },

    async loadPricesWithDate(server) {
      try {
        const basePath = import.meta.env.BASE_URL
        const serverInfo = this.servers.find(s => s.id === server)
        const priceFilename = serverInfo?.price_file || `${server}.json`

        const priceRes = await axios.get(`${basePath}data/prices/${priceFilename}`)
        const filenameMatch = priceFilename.match(/(\w+)_(\d{8})_(\d{4})/)

        if (filenameMatch && filenameMatch[2] && filenameMatch[3]) {
          const dateStr = filenameMatch[2]
          const timeStr = filenameMatch[3]
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
        return priceRes.data
      } catch (e) {
        console.error("Erreur chargement prix", e)
        this.pricesLastUpdate = null
      }
    },

    calculateInstanceForRun(instanceId, runConfig) {
      // Utiliser directement l'instance de base
      const baseInstance = this._instancesBase.find(i => i.id === instanceId)
      if (!baseInstance) return null

      const appStore = useAppStore()
      const itemRarityMap = this.itemRarityMap
      const priceMap = this.priceMap

      // Filtrer et recalculer les loots selon la config du run
      const allLoots = (baseInstance.loots || []).filter(l => {
        const itemRarity = itemRarityMap[l.itemId] || 0
        return shouldIncludeLoot(l, itemRarity, runConfig)
      }).map(l => {
        const itemRarity = itemRarityMap[l.itemId] || 0
        const finalQuantity = calculateFinalQuantity(l, itemRarity, l.monsterNumber, baseInstance.players)
        return { ...l, quantity: finalQuantity, price: priceMap[l.itemId] || 0 }
      })

      const perItem = processLoots(allLoots, runConfig, priceMap, itemRarityMap, runConfig)
      const minProfit = appStore.config.minItemProfit || 0
      const minDropRate = (appStore.config.minDropRatePercent || 0) / 100
      const itemsBreakdown = filterAndSortItems(perItem, minProfit, minDropRate)

      const totalKamas = itemsBreakdown.reduce((sum, it) => sum + it.subtotal, 0)

      return {
        id: baseInstance.id,
        level: baseInstance.level,
        bossId: baseInstance.bossId || null,
        players: baseInstance.players,
        items: itemsBreakdown,
        totalKamas: Math.floor(totalKamas)
      }
    }
    ,

    // Helper: compute enriched instances on demand from the base cache and a given config
    computeEnrichedFromConfig(config) {
      // config: same shape as appStore.config (isBooster, isModulated, minProfit, minDropRatePercent, etc.)
      const minProfit = config.minItemProfit || 0
      const minDropRate = (config.minDropRatePercent || 0) / 100

      const enriched = this._instancesBase.map(inst => {
        const allLoots = (inst.loots || []).map(l => {
          const itemRarity = this.itemRarityMap[l.itemId] || 0
          const finalQuantity = calculateFinalQuantity(l, itemRarity, l.monsterNumber, inst.players)
          return { ...l, quantity: finalQuantity, price: this.priceMap[l.itemId] || 0 }
        })

        const perItem = processLoots(allLoots, config, this.priceMap, this.itemRarityMap)
        const itemsBreakdown = filterAndSortItems(perItem, minProfit, minDropRate)
        const totalKamas = itemsBreakdown.reduce((sum, it) => sum + it.subtotal, 0)

        return {
          id: inst.id,
          level: inst.level,
          players: inst.players,
          isDungeon: inst.isDungeon,
          isUltimate: inst.isUltimate,
          bossId: inst.bossId || null,
          loots: allLoots,
          items: itemsBreakdown,
          totalKamas: Math.floor(totalKamas)
        }
      })

      // Apply instance-level filters based on config
      const minInstanceTotal = config.minInstanceTotal || 0
      const activeLevelRanges = config.levelRanges || []

      if (activeLevelRanges.length === 0) return []

      let filteredEnriched = enriched.filter(inst => inst.totalKamas >= minInstanceTotal)
      if (activeLevelRanges.length < LEVEL_RANGES.length) {
        filteredEnriched = filteredEnriched.filter(inst => 
          activeLevelRanges.some(rangeIndex => {
            const range = LEVEL_RANGES[rangeIndex]
            return range && inst.level >= range.min && inst.level <= range.max
          })
        )
      }

      return filteredEnriched
    }
  }
})
