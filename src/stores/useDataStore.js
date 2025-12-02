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

    createInstanceData(instances, items, mapping, loots, prices){
      // access global config for rate adjustments
      const globalStore = useGlobalStore()

      // Build a lookup map for item rarity: { itemId: rarity }
      const itemRarityMap = {}
      if (Array.isArray(items)) {
        items.forEach(item => {
          itemRarityMap[item.id] = item.rarity || 0
        })
      }

      // Calcule le taux ajusté en fonction de la config
      const computeAdjustedRate = (baseRate, cfg = {}) => {
        const stasis = Number(cfg.stasis || 0)
        const isModulated = !!cfg.isModulated
        const intervention = !!cfg.intervention

        const stasisFactor = this.getStasisBonus(stasis, isModulated)
        const boosterBonus = globalStore.config.isBooster 
          ? (BOOSTER_BONUS[globalStore.config.server] || 1.25) 
          : 1
        const interventionBonus = intervention ? 1.10 : 1

        return Math.min(1, baseRate * stasisFactor * boosterBonus * interventionBonus)
      }
      // Build a lookup map for prices: { itemId: price }
      let priceMap = {};
      if (Array.isArray(prices)) {
        prices.forEach(p => {
          priceMap[p.itemId] = p.price
        })
      } else if (prices && typeof prices === 'object') {
        // if already an object map
        priceMap = prices
      }

      // For each instance, gather all loot entries (from mapping -> loots)
      const instancesRefined = instances.map(inst => {
        // Find mapping for this instance
        const instanceMapping = mapping.find(m => m.instanceId === inst.id)
        
        let allLoots = []
        if (instanceMapping && instanceMapping.monsters) {
          instanceMapping.monsters.forEach(monster => {
            const monsterLoots = loots
              .filter(loot => loot.monsterId === monster.monsterId)
              .map(loot => loot.loots)
            allLoots.push(...monsterLoots.flat()
              // Filter by stele and steleIntervention configuration
              .filter(lootEntry => {
                const configSteles = Number(globalStore.config.steles || 0)
                const configSteleIntervention = Number(globalStore.config.steleIntervention || 0)
                const configStasis = Number(globalStore.config.stasis || 0)
                const lootStele = Number(lootEntry.stele || 0)
                const lootSteleIntervention = Number(lootEntry.steleIntervention || 0)
                const itemRarity = itemRarityMap[lootEntry.itemId] || 0
                
                // Include loot only if its stele requirements are <= config
                const steleOk = lootStele <= configSteles
                
                // Check steleIntervention based on config
                const steleInterventionOk = globalStore.config.intervention 
                  ? lootSteleIntervention <= configSteleIntervention
                  : lootSteleIntervention === 0
                
                // If rarity > 3, require stasis >= 3
                const rarityOk = itemRarity > 3 ? configStasis >= 3 : true
                
                return steleOk && steleInterventionOk && rarityOk
              })
              .map(lootEntry => ({
                ...lootEntry,
                quantity: lootEntry.quantity * monster.number,
                price: priceMap[lootEntry.itemId] || 0
              })))
          })
        }
        
        return {
          id: inst.id,
          level: inst.level,
          loots: allLoots
        }
      })

      // For each instance, build per-item subtotal and totalKamas
      const enriched = instancesRefined.map(inst => {
        const perItem = {}
        inst.loots.forEach(l => {
          const id = l.itemId
          const price = l.price || 0
          const qty = l.quantity || 0
          const baseRate = l.rate || 0
          const adjustedRate = computeAdjustedRate(baseRate, globalStore.config)
          const value = Math.floor(price * adjustedRate * qty)

          if (!perItem[id]) {
            perItem[id] = {
              itemId: id,
              name: this.names && this.names.items ? this.names.items[id] || null : null,
              rate: adjustedRate,
              price: price,
              quantity: 0,
              subtotal: 0,
              stele: l.stele || 0,
              steleIntervention: l.steleIntervention || 0,
              rarity: itemRarityMap[id] || 0
            }
          }

          perItem[id].quantity += qty
          perItem[id].subtotal += value
        })

        // apply item filters from global config
        const minProfit = Number(globalStore.config.minItemProfit || 0)
        const minDrop = Number(globalStore.config.minDropRatePercent || 0) / 100

        const itemsBreakdown = Object.values(perItem)
          .filter(it => it.subtotal >= minProfit && (it.rate || 0) >= minDrop)
          .sort((a, b) => b.subtotal - a.subtotal)

        const totalKamas = itemsBreakdown.reduce((s, it) => s + it.subtotal, 0)

        return {
          id: inst.id,
          level: inst.level,
          loots: inst.loots,
          items: itemsBreakdown,
          totalKamas: Math.floor(totalKamas)
        }
      })

      // apply instance-level filter (minInstanceTotal)
      const minInstanceTotal = Number(globalStore.config.minInstanceTotal || 0)
      let filteredEnriched = enriched.filter(inst => (inst.totalKamas || 0) >= minInstanceTotal)

      // apply level range filter
      const activeLevelRanges = globalStore.config.levelRanges || []
      // Si aucune tranche n'est sélectionnée, ne rien afficher
      if (activeLevelRanges.length === 0) {
        filteredEnriched = []
      } else if (activeLevelRanges.length < LEVEL_RANGES.length) {
        // Si certaines tranches sont sélectionnées, filtrer
        filteredEnriched = filteredEnriched.filter(inst => {
          const level = inst.level
          return activeLevelRanges.some(rangeIndex => {
            const range = LEVEL_RANGES[rangeIndex]
            return range && level >= range.min && level <= range.max
          })
        })
      }
      // Si toutes les tranches sont sélectionnées, ne pas filtrer (laisser tel quel)

      this.instancesRefined = filteredEnriched

      return enriched;
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
    }
  }
})