import { defineStore } from 'pinia'
import axios from 'axios'
import { useGlobalStore } from './useGlobalStore'
import { watch } from 'vue'
import { STASIS_BONUS_MODULATED, STASIS_BONUS_NON_MODULATED, BOOSTER_BONUS, LEVEL_RANGES } from '../constants'

// Fonction utilitaire pour parser les noms
function parseNames(rawNames) {
  const namesMap = { items: {}, monsters: {}, instances: {}, divers: {} }
  
  if (!rawNames || typeof rawNames !== 'object') return namesMap
  
  // Parse les tableaux par type
  const types = ['items', 'monsters', 'instances', 'divers']
  types.forEach(type => {
    if (Array.isArray(rawNames[type])) {
      rawNames[type].forEach(e => {
        if (e?.id != null) namesMap[type][e.id] = e.name
      })
    }
  })
  
  // Fallback pour les formats legacy (id->string directement)
  Object.entries(rawNames).forEach(([k, v]) => {
    if (typeof v === 'string') {
      namesMap.instances[k] = v
    }
  })
  
  return namesMap
}

export const useDataStore = defineStore('data', {
  state: () => ({
    instancesRefined: [],
    names: {},
    servers: [],
    loaded: false,
    pricesLastUpdate: null,
    _rawInstances: [],
    _rawItems: [],
    _rawMapping: [],
    _rawLoots: [],
    _rawPrices: {},
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
      const loots = state._rawLoots || []
      const mapping = state._rawMapping || []
      
      if (loots.length === 0 || mapping.length === 0) return {}
      
      // Build monster -> instances mapping
      const monsterToInstances = new Map()
      mapping.forEach(m => {
        m.monsters.forEach(monster => {
          const existing = monsterToInstances.get(monster.monsterId) || []
          existing.push(m.instanceId)
          monsterToInstances.set(monster.monsterId, existing)
        })
      })
      
      // Build item -> instances mapping
      const itemMap = new Map()
      loots.forEach(loot => {
        const instanceIds = monsterToInstances.get(loot.monsterId) || []
        
        loot.loots.forEach(drop => {
          const existing = itemMap.get(drop.itemId) || new Set()
          instanceIds.forEach(instId => existing.add(instId))
          itemMap.set(drop.itemId, existing)
        })
      })
      
      // Convert Map<itemId, Set<instanceId>> to plain object with arrays
      const result = {}
      itemMap.forEach((instanceSet, itemId) => {
        result[itemId] = Array.from(instanceSet)
      })
      
      return result
    }
  },
  actions: {
    async loadAllData(server, lang = 'fr') {
      try {
        const basePath = import.meta.env.BASE_URL
        const [instRes, itemRes, monsterRes, mappingRes, lootRes, nameRes, serversRes] = await Promise.all([
          axios.get(`${basePath}data/instances.json`),
          axios.get(`${basePath}data/items.json`),
          axios.get(`${basePath}data/monsters.json`),
          axios.get(`${basePath}data/mapping.json`),
          axios.get(`${basePath}data/loots.json`),
          axios.get(`${basePath}names/${lang}.json`),
          axios.get(`${basePath}data/servers.json`)
        ])
        
        this.names = parseNames(nameRes.data)
        this.servers = serversRes.data || []
        
        // Charger les prix APRÈS avoir chargé la liste des serveurs
        const priceRes = await this.loadPricesWithDate(server)

        // Store raw fetched data so we can recompute when global config changes
        this._rawInstances = instRes.data
        this._rawItems = itemRes.data
        this._rawMapping = mappingRes.data
        this._rawLoots = lootRes.data
        this._rawPrices = priceRes

        // Process and store only instancesRefined (pass raw data)
        this.createInstanceData(
          this._rawInstances,
          this._rawItems,
          this._rawMapping,
          this._rawLoots,
          this._rawPrices
        )
        this.loaded = true

        // Setup a single watcher to recompute instances when global config changes
        const globalStore = useGlobalStore()
        if (!this._hasConfigWatcher) {
          this._hasConfigWatcher = true
          watch(
            () => globalStore.config.server,
            async (newServer, oldServer) => {
              if (newServer !== oldServer) {
                await this.loadPrices(newServer)
              }
            }
          )
          watch(
            () => globalStore.config,
            (newVal) => {
              try {
                this.createInstanceData(this._rawInstances, this._rawItems, this._rawMapping, this._rawLoots, this._rawPrices)
              } catch (e) {
                console.error('Erreur recompute instances after config change', e)
              }
            },
            { deep: true }
          )
        }
      } catch (e) {
        console.error("Erreur chargement données", e)
      }
    },

    getStasisBonus(steles, isModulated){
      const bonusMap = isModulated ? STASIS_BONUS_MODULATED : STASIS_BONUS_NON_MODULATED
      return bonusMap[steles] || 0
    },

    // Helper: Compute adjusted drop rate based on config
    _computeAdjustedRate(baseRate, config) {
      // Rifts (brèches) have different bonus calculation
      if (config.isRift) {
        const finalWave = (config.startingWave || 1) + (config.wavesCompleted || 1)
        // Ultimate rifts: 18% per wave, normal rifts: 8% per wave
        const bonusPerWave = config.isUltimate ? 18 : 8
        const bonusPercent = (finalWave - 1) * bonusPerWave
        return baseRate * (1 + bonusPercent / 100)
      }

      // Dungeons use stasis/modulation/booster bonuses
      const globalStore = useGlobalStore()
      const stasisFactor = this.getStasisBonus(config.stasis || 0, !!config.isModulated)
      const boosterBonus = config.isBooster 
        ? (BOOSTER_BONUS[globalStore.config.server] || 1.25) 
        : 1
      const interventionBonus = config.intervention ? 1.10 : 1

      return Math.min(1, baseRate * stasisFactor * boosterBonus * interventionBonus)
    },

    // Helper: Check if loot should be included based on config filters
    _shouldIncludeLoot(lootEntry, itemRarity, config) {
      // Rifts (brèches) have different eligibility rules
      if (config.isRift) {
        // Legendary+ items (rarity >= 5): ultimate rifts need 4 waves, normal rifts need 9
        const requiredWaves = config.isUltimate ? 4 : 9
        if (itemRarity >= 5 && (config.wavesCompleted || 0) < requiredWaves) {
          return false
        }
        // Rifts ignore steles/stele intervention - all items eligible
        return true
      }

      // Dungeons use steles/stele intervention/stasis filters
      const configSteles = Number(config.steles || 0)
      const configSteleIntervention = Number(config.steleIntervention || 0)
      const configStasis = Number(config.stasis || 0)
      const lootStele = Number(lootEntry.stele || 0)
      const lootSteleIntervention = Number(lootEntry.steleIntervention || 0)
      const lootStasis = lootEntry.stasis !== undefined ? Number(lootEntry.stasis) : null

      // Check stele requirement
      const steleOk = lootStele <= configSteles

      // Check steleIntervention requirement
      const steleInterventionOk = config.intervention 
        ? lootSteleIntervention <= configSteleIntervention
        : lootSteleIntervention === 0

      // Check stasis requirement: if loot has a stasis requirement, config stasis must be >= that value
      const stasisOk = lootStasis !== null ? configStasis >= lootStasis : true

      // Items with rarity > 3 require stasis >= 3
      const rarityOk = itemRarity > 3 ? configStasis >= 3 : true

      return steleOk && steleInterventionOk && stasisOk && rarityOk
    },

    createInstanceData(instances, items, mapping, loots, prices){
      const globalStore = useGlobalStore()
      
      // Use getters for lookup maps
      const itemRarityMap = this.itemRarityMap
      const priceMap = this.priceMap
      
      // Build players count map
      const playersMap = {}
      instances.forEach(inst => {
        playersMap[inst.id] = inst.players || (inst.isDungeon ? 3 : 4)
      })

      // Gather loot entries for each instance
      const instancesRefined = instances.map(inst => {
        const instanceMapping = mapping.find(m => m.instanceId === inst.id)
        const allLoots = []
        const players = playersMap[inst.id] || 1
        
        // Build instance-specific config (add isUltimate for rifts)
        const instanceConfig = {
          ...globalStore.config,
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
                    return this._shouldIncludeLoot(lootEntry, itemRarity, instanceConfig)
                  })
                  .forEach(lootEntry => {
                    const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                    let finalQuantity
                    
                    // BonusPP (99999) is a percentage bonus, not an actual item drop
                    if (lootEntry.itemId === 99999) {
                      finalQuantity = lootEntry.quantity // Keep percentage as-is
                    } else {
                      const baseQuantity = lootEntry.quantity * monster.number
                      // Rarity 5 items: only 1 per team, otherwise multiply by players
                      finalQuantity = itemRarity === 5 ? baseQuantity : baseQuantity * players
                    }
                    
                    allLoots.push({
                      ...lootEntry,
                      quantity: finalQuantity,
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
          loots: allLoots
        }
      })

      // Build per-item breakdown and calculate total kamas for each instance
      const minProfit = Number(globalStore.config.minItemProfit || 0)
      const minDropRate = Number(globalStore.config.minDropRatePercent || 0) / 100

      const enriched = instancesRefined.map(inst => {
        // Get original instance for isUltimate
        const originalInst = instances.find(i => i.id === inst.id)
        
        // Build instance-specific config (add isUltimate for rifts)
        const instanceConfig = {
          ...globalStore.config,
          isUltimate: originalInst?.isUltimate || false
        }
        
        // Calculate BonusPP (item 99999) drop rate bonus
        let bonusPPMultiplier = 0
        inst.loots.forEach(l => {
          if (l.itemId === 99999) {
            const adjustedRate = this._computeAdjustedRate(l.rate || 0, instanceConfig)
            // quantity represents the percentage bonus (e.g., 20 = +20%)
            bonusPPMultiplier += adjustedRate * (l.quantity / 100)
          }
        })

        const perItem = new Map()

        // Aggregate loot by item
        inst.loots.forEach(l => {
          const itemId = l.itemId
          
          // Skip BonusPP item (99999) - it's only used for bonus calculation
          if (itemId === 99999) return

          const price = l.price || 0
          const qty = l.quantity || 0
          const baseRate = l.rate || 0
          let adjustedRate = this._computeAdjustedRate(baseRate, instanceConfig)
          
          // Apply BonusPP bonus to drop rate
          adjustedRate = adjustedRate * (1 + bonusPPMultiplier)
          
          // Cap drop rate at 100%
          adjustedRate = Math.min(adjustedRate, 1.0)
          
          const value = Math.floor(price * adjustedRate * qty)

          if (!perItem.has(itemId)) {
            perItem.set(itemId, {
              itemId,
              name: this.names?.items?.[itemId] || null,
              rate: adjustedRate,
              price,
              quantity: 0,
              subtotal: 0,
              stele: l.stele || 0,
              steleIntervention: l.steleIntervention || 0,
              rarity: itemRarityMap[itemId] || 0
            })
          }

          const item = perItem.get(itemId)
          item.quantity += qty
          item.subtotal += value
        })

        // Filter and sort items by profit
        const itemsBreakdown = Array.from(perItem.values())
          .filter(it => it.subtotal >= minProfit && (it.rate || 0) >= minDropRate)
          .sort((a, b) => {
            // Primary sort: by subtotal (kamas) descending
            if (b.subtotal !== a.subtotal) return b.subtotal - a.subtotal
            // Secondary sort: by drop rate descending
            if ((b.rate || 0) !== (a.rate || 0)) return (b.rate || 0) - (a.rate || 0)
            // Tertiary sort: by quantity descending
            return (b.quantity || 0) - (a.quantity || 0)
          })

        const totalKamas = itemsBreakdown.reduce((sum, it) => sum + it.subtotal, 0)

        return {
          id: inst.id,
          level: inst.level,
          isDungeon: inst.isDungeon,
          isUltimate: inst.isUltimate || false,
          loots: inst.loots,
          items: itemsBreakdown,
          totalKamas: Math.floor(totalKamas)
        }
      })

      // Apply instance-level filters
      const minInstanceTotal = Number(globalStore.config.minInstanceTotal || 0)
      const activeLevelRanges = globalStore.config.levelRanges || []

      let filteredEnriched = enriched.filter(inst => inst.totalKamas >= minInstanceTotal)

      // Apply level range filter
      if (activeLevelRanges.length === 0) {
        // No ranges selected = hide all
        filteredEnriched = []
      } else if (activeLevelRanges.length < LEVEL_RANGES.length) {
        // Some ranges selected = filter by range
        filteredEnriched = filteredEnriched.filter(inst => {
          return activeLevelRanges.some(rangeIndex => {
            const range = LEVEL_RANGES[rangeIndex]
            return range && inst.level >= range.min && inst.level <= range.max
          })
        })
      }
      // All ranges selected = no filtering

      this.instancesRefined = filteredEnriched
      return enriched
    },

    async loadPricesWithDate(server) {
      try {
        const basePath = import.meta.env.BASE_URL
        
        // Trouver le serveur dans la liste pour obtenir le nom du fichier
        const serverInfo = this.servers.find(s => s.id === server)
        const priceFilename = serverInfo?.price_file || `${server}.json`
        
        console.log("Loading prices from:", priceFilename)
        
        // Charger le fichier de prix
        const priceRes = await axios.get(`${basePath}data/prices/${priceFilename}`)
        
        // Extraire la date depuis le nom du fichier
        // Format attendu: servername_YYYYMMDD_HHMM.json
        const filenameMatch = priceFilename.match(/(\w+)_(\d{8})_(\d{4})/)
        
        if (filenameMatch && filenameMatch[2] && filenameMatch[3]) {
          // Format: servername_YYYYMMDD_HHMM
          const dateStr = filenameMatch[2] // YYYYMMDD
          const timeStr = filenameMatch[3] // HHMM
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

    async loadNames(lang = 'fr') {
      try {
        const basePath = import.meta.env.BASE_URL
        const nameRes = await axios.get(`${basePath}names/${lang}.json`)
        this.names = parseNames(nameRes.data)
      } catch (e) {
        console.error("Erreur chargement langue", e)
      }
    },

    // Calculate instance data for a specific run configuration
    calculateInstanceForRun(instanceId, runConfig) {
      const instance = this._rawInstances.find(i => i.id === instanceId)
      if (!instance) return null

      const globalStore = useGlobalStore()
      const itemRarityMap = this.itemRarityMap
      const priceMap = this.priceMap
      const players = instance.players || (instance.isDungeon ? 3 : 4)

      // Find mapping for this instance
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
                  return this._shouldIncludeLoot(lootEntry, itemRarity, runConfig)
                })
                .forEach(lootEntry => {
                  const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                  let finalQuantity
                  
                  // BonusPP (99999) is a percentage bonus, not an actual item drop
                  if (lootEntry.itemId === 99999) {
                    finalQuantity = lootEntry.quantity // Keep percentage as-is
                  } else {
                    const baseQuantity = lootEntry.quantity * monster.number
                    // Rarity 5 items: only 1 per team, otherwise multiply by players
                    finalQuantity = itemRarity === 5 ? baseQuantity : baseQuantity * players
                  }
                  
                  allLoots.push({
                    ...lootEntry,
                    quantity: finalQuantity,
                    price: priceMap[lootEntry.itemId] || 0
                  })
                })
            })
        })
      }

      // Calculate BonusPP (item 99999) drop rate bonus
      let bonusPPMultiplier = 0
      allLoots.forEach(l => {
        if (l.itemId === 99999) {
          const adjustedRate = this._computeAdjustedRate(l.rate || 0, runConfig)
          // quantity represents the percentage bonus (e.g., 20 = +20%)
          bonusPPMultiplier += adjustedRate * (l.quantity / 100)
        }
      })

      // Build per-item breakdown
      const perItem = new Map()

      allLoots.forEach(l => {
        const itemId = l.itemId
        
        // Skip BonusPP item (99999) - it's only used for bonus calculation
        if (itemId === 99999) return

        const price = l.price || 0
        const qty = l.quantity || 0
        const baseRate = l.rate || 0
        let adjustedRate = this._computeAdjustedRate(baseRate, runConfig)
        
        // Apply BonusPP bonus to drop rate
        adjustedRate = adjustedRate * (1 + bonusPPMultiplier)
        
        // Cap drop rate at 100%
        adjustedRate = Math.min(adjustedRate, 1.0)
        
        const value = Math.floor(price * adjustedRate * qty)

        if (!perItem.has(itemId)) {
          perItem.set(itemId, {
            itemId,
            name: this.names?.items?.[itemId] || null,
            rate: adjustedRate,
            price,
            quantity: 0,
            subtotal: 0,
            stele: l.stele || 0,
            steleIntervention: l.steleIntervention || 0,
            rarity: itemRarityMap[itemId] || 0
          })
        }

        const item = perItem.get(itemId)
        item.quantity += qty
        item.subtotal += value
      })

      // For rifts, multiply by number of waves completed (one loot iteration per wave)
      if (runConfig.isRift) {
        const wavesCompleted = runConfig.wavesCompleted || 1
        perItem.forEach(item => {
          item.quantity *= wavesCompleted
          item.subtotal *= wavesCompleted
        })
      }

      // Filter items (use global config filters)
      const minProfit = Number(globalStore.config.minItemProfit || 0)
      const minDropRate = Number(globalStore.config.minDropRatePercent || 0) / 100

      const itemsBreakdown = Array.from(perItem.values())
        .filter(it => it.subtotal >= minProfit && (it.rate || 0) >= minDropRate)
        .sort((a, b) => {
          // Primary sort: by subtotal (kamas) descending
          if (b.subtotal !== a.subtotal) return b.subtotal - a.subtotal
          // Secondary sort: by drop rate descending
          if ((b.rate || 0) !== (a.rate || 0)) return (b.rate || 0) - (a.rate || 0)
          // Tertiary sort: by quantity descending
          return (b.quantity || 0) - (a.quantity || 0)
        })

      const totalKamas = itemsBreakdown.reduce((sum, it) => sum + it.subtotal, 0)

      return {
        id: instance.id,
        level: instance.level,
        items: itemsBreakdown,
        totalKamas: Math.floor(totalKamas)
      }
    }
  }
})