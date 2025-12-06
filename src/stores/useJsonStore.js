import { defineStore } from 'pinia'
import axios from 'axios'
import { useAppStore } from './useAppStore'
import { watch } from 'vue'
import { STASIS_BONUS_MODULATED, STASIS_BONUS_NON_MODULATED, BOOSTER_BONUS, LEVEL_RANGES } from '@/constants'
import { calculateFinalQuantity, filterAndSortItems, processLoots, shouldIncludeLoot } from '@/utils/instanceProcessor'


export const useJsonStore = defineStore('data', {
  state: () => ({
    instancesRefined: [],
    servers: [],
    loaded: false,
    pricesLastUpdate: null,
    _rawInstances: [],
    _rawItems: [],
    _rawMapping: [],
    _rawLoots: [],
    _rawPrices: {},
    _bossMapping: {},
    _hasConfigWatcher: false
  }),
  getters: {
    // Expose price map as a getter for reuse across components
    priceMap(state) {
      if (Array.isArray(state._rawPrices)) {
        const map = {}
        state._rawPrices.forEach(p => {
          map[p.itemId] = p.price
        })
        return map
      }
      return state._rawPrices && typeof state._rawPrices === 'object' ? state._rawPrices : {}
    },

    // Expose item rarity map as a getter for reuse
    itemRarityMap(state) {
      const map = {}
      if (Array.isArray(state._rawItems)) {
        state._rawItems.forEach(item => {
          map[item.id] = item.rarity || 0
        })
      }
      return map
    },

    // Build and cache item-to-instances mapping
    itemToInstancesMap(state) {
      const loots = Array.isArray(state._rawLoots) ? state._rawLoots : []
      const mapping = Array.isArray(state._rawMapping) ? state._rawMapping : []

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

        // Charger les prix APRÈS avoir chargé la liste des serveurs
        const priceRes = await this.loadPricesWithDate(server)

        // Store raw fetched data so we can recompute when global config changes
        this._rawInstances = instRes.data
        this._rawItems = itemRes.data
        this._rawMapping = mappingRes.data
        this._rawLoots = lootRes.data
        this._rawPrices = priceRes
        this._bossMapping = bossMappingRes.data

        // Ajouter les bossId aux instances
        this._rawInstances = this._rawInstances.map(inst => ({
          ...inst,
          bossId: this._bossMapping[inst.id] || null
        }))

        // Process and store only instancesRefined (pass raw data)
        this.createInstanceData(
          this._rawInstances,
          this._rawItems,
          this._rawMapping,
          this._rawLoots,
          this._rawPrices
        )
        this.loaded = true

        // Setup a watcher to recompute instances when relevant global config keys change
        const appStore = useAppStore()
        if (!this._hasConfigWatcher) {
          this._hasConfigWatcher = true

          // Watch server separately to reload prices immediately
          watch(
            () => appStore.config.server,
            async (newServer, oldServer) => {
              if (newServer !== oldServer) {
                await this.loadPrices(newServer)
              }
            }
          )

          const configSelector = () => ({
            server: appStore.config.server,
            isBooster: appStore.config.isBooster,
            isModulated: appStore.config.isModulated,
            stasis: appStore.config.stasis,
            steles: appStore.config.steles,
            steleIntervention: appStore.config.steleIntervention,
            minItemProfit: appStore.config.minItemProfit,
            minDropRatePercent: appStore.config.minDropRatePercent,
            minInstanceTotal: appStore.config.minInstanceTotal,
            levelRanges: appStore.config.levelRanges
          })

          let idleHandle = null
          let timeoutHandle = null
          const scheduleRecompute = () => {
            try {
              if (typeof cancelIdleCallback !== 'undefined' && idleHandle != null) cancelIdleCallback(idleHandle)
            } catch (e) {}
            if (timeoutHandle != null) {
              clearTimeout(timeoutHandle)
              timeoutHandle = null
            }

            const doRecompute = () => {
              try {
                this.createInstanceData(this._rawInstances, this._rawItems, this._rawMapping, this._rawLoots, this._rawPrices)
              } catch (e) {
                console.error('Erreur recompute instances after config change', e)
              }
            }

            if (typeof requestIdleCallback !== 'undefined') {
              idleHandle = requestIdleCallback(() => doRecompute(), { timeout: 250 })
            } else {
              timeoutHandle = setTimeout(() => doRecompute(), 80)
            }
          }

          watch(
            configSelector,
            () => {
              scheduleRecompute()
            },
            { deep: true }
          )
        }
      } catch (e) {
        console.error("Erreur chargement données", e)
      }
    },

    // Helper: Process loots and build per-item breakdown has been extracted to utils

    createInstanceData(instances, items, mapping, loots, prices){
      const appStore = useAppStore()
      
      // Use getters for lookup maps
      const itemRarityMap = this.itemRarityMap
      const priceMap = this.priceMap
      
      // Filter out rifts (brèches) for rentability view
      const dungeonsOnly = instances.filter(inst => inst.isDungeon)
      
      // Build lookup maps
      const playersMap = {}
      const mappingMap = {}
      dungeonsOnly.forEach(inst => {
        playersMap[inst.id] = inst.players || 3
      })
      mapping.forEach(m => {
        mappingMap[m.instanceId] = m
      })

      // Gather loot entries for each instance
      const instancesRefined = dungeonsOnly.map(inst => {
        const instanceMapping = mappingMap[inst.id]
        const allLoots = []
        const players = playersMap[inst.id] || 1
        
        // Build instance-specific config (add isUltimate for rifts)
        const instanceConfig = {
          ...appStore.config,
          isUltimate: inst.isUltimate || false
        }

        if (instanceMapping?.monsters) {
          instanceMapping.monsters.forEach(monster => {
            loots
              .filter(loot => loot.monsterId === monster.monsterId)
              .forEach(loot => {
                loot.loots
                  .filter(lootEntry => {
                    const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                    return shouldIncludeLoot(lootEntry, itemRarity, instanceConfig)
                  })
                  .forEach(lootEntry => {
                    const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                    const finalQuantity = calculateFinalQuantity(lootEntry, itemRarity, monster.number, players)
                    
                    allLoots.push({
                      ...lootEntry,
                      quantity: finalQuantity,
                      monsterNumber: monster.number,
                      price: priceMap[lootEntry.itemId] || 0
                    })
                  })
              })
          })
        }

        return {
          id: inst.id,
          level: inst.level,
          isDungeon: inst.isDungeon,
          isUltimate: inst.isUltimate || false,
          bossId: inst.bossId || null,
          loots: allLoots
        }
      })

      // Build per-item breakdown and calculate total kamas for each instance
      const minProfit = appStore.config.minItemProfit || 0
      const minDropRate = (appStore.config.minDropRatePercent || 0) / 100

      const enriched = instancesRefined.map(inst => {
        const instanceConfig = {
          ...appStore.config,
          isUltimate: inst.isUltimate
        }

        const perItem = processLoots(inst.loots, instanceConfig, this.priceMap, this.itemRarityMap)
        const itemsBreakdown = filterAndSortItems(perItem, minProfit, minDropRate)

        const totalKamas = itemsBreakdown.reduce((sum, it) => sum + it.subtotal, 0)

        return {
          id: inst.id,
          level: inst.level,
          isDungeon: inst.isDungeon,
          isUltimate: inst.isUltimate,
          bossId: inst.bossId || null,
          loots: inst.loots,
          items: itemsBreakdown,
          totalKamas: Math.floor(totalKamas)
        }
      })

      // Apply instance-level filters
      const minInstanceTotal = appStore.config.minInstanceTotal || 0
      const activeLevelRanges = appStore.config.levelRanges || []

      if (activeLevelRanges.length === 0) {
        this.instancesRefined = []
        return enriched
      }

      let filteredEnriched = enriched.filter(inst => inst.totalKamas >= minInstanceTotal)

      if (activeLevelRanges.length < LEVEL_RANGES.length) {
        filteredEnriched = filteredEnriched.filter(inst => 
          activeLevelRanges.some(rangeIndex => {
            const range = LEVEL_RANGES[rangeIndex]
            return range && inst.level >= range.min && inst.level <= range.max
          })
        )
      }

      this.instancesRefined = filteredEnriched
      return enriched
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

        return priceRes.data
      } catch (e) {
        console.error("Erreur chargement prix", e)
        this.pricesLastUpdate = null
        return {}
      }
    },

    async loadPrices(server) {
      const prices = await this.loadPricesWithDate(server)
      this._rawPrices = prices
      this.createInstanceData(this._rawInstances, this._rawItems, this._rawMapping, this._rawLoots, this._rawPrices)
    },

    calculateInstanceForRun(instanceId, runConfig) {
      const instance = this._rawInstances.find(i => i.id === instanceId)
      if (!instance) return null

      const appStore = useAppStore()
      const itemRarityMap = this.itemRarityMap
      const priceMap = this.priceMap
      const players = instance.players || (instance.isDungeon ? 3 : 4)

      const instanceMapping = this._rawMapping.find(m => m.instanceId === instanceId)
      const allLoots = []

      if (instanceMapping?.monsters) {
        instanceMapping.monsters.forEach(monster => {
          this._rawLoots
            .filter(loot => loot.monsterId === monster.monsterId)
            .forEach(loot => {
              loot.loots
                .filter(lootEntry => {
                  const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                  return shouldIncludeLoot(lootEntry, itemRarity, runConfig)
                })
                .forEach(lootEntry => {
                  const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                  const finalQuantity = calculateFinalQuantity(lootEntry, itemRarity, monster.number, players)

                  allLoots.push({
                    ...lootEntry,
                    quantity: finalQuantity,
                    price: priceMap[lootEntry.itemId] || 0
                  })
                })
            })
        })
      }

      const perItem = processLoots(allLoots, runConfig, this.priceMap, this.itemRarityMap, runConfig)
      const minProfit = appStore.config.minItemProfit || 0
      const minDropRate = (appStore.config.minDropRatePercent || 0) / 100
      const itemsBreakdown = filterAndSortItems(perItem, minProfit, minDropRate)

      const totalKamas = itemsBreakdown.reduce((sum, it) => sum + it.subtotal, 0)

      return {
        id: instance.id,
        level: instance.level,
        bossId: instance.bossId || null,
        items: itemsBreakdown,
        totalKamas: Math.floor(totalKamas)
      }
    }
  }
})
