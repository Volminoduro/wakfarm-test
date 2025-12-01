import { defineStore } from 'pinia'
import axios from 'axios'
import { useGlobalStore } from './useGlobalStore'
import { watch } from 'vue'

export const useDataStore = defineStore('data', {
  state: () => ({
    instancesRefined: [],
    names: {},
    loaded: false,
    // keep raw fetched data so we can recompute when config changes
    _rawInstances: [],
    _rawMapping: [],
    _rawLoots: [],
    _rawPrices: {},
    _hasConfigWatcher: false
  }),
  actions: {
    async loadAllData(server, lang = 'fr') {
      try {
        const basePath = import.meta.env.BASE_URL
        const [instRes, itemRes, monsterRes, mappingRes, lootRes, priceRes, nameRes] = await Promise.all([
          axios.get(`${basePath}data/instances.json`),
          axios.get(`${basePath}data/items.json`),
          axios.get(`${basePath}data/monsters.json`),
          axios.get(`${basePath}data/mapping.json`),
          axios.get(`${basePath}data/loots.json`),
          axios.get(`${basePath}data/prices_${server}.json`),
          axios.get(`${basePath}names/${lang}.json`)
        ])

        // Normalize names into per-type maps so you can do:
        // dataStore.names.items[itemId], dataStore.names.monsters[monsterId], dataStore.names.instances[instanceId]
        const rawNames = nameRes.data
        const namesMap = { items: {}, monsters: {}, instances: {}, divers: {} }

        if (rawNames && typeof rawNames === 'object') {
          // If structure already grouped by type (common case)
          if (Array.isArray(rawNames.items)) {
            rawNames.items.forEach(e => { if (e && e.id != null) namesMap.items[e.id] = e.name })
          }
          if (Array.isArray(rawNames.monsters)) {
            rawNames.monsters.forEach(e => { if (e && e.id != null) namesMap.monsters[e.id] = e.name })
          }
          if (Array.isArray(rawNames.instances)) {
            rawNames.instances.forEach(e => { if (e && e.id != null) namesMap.instances[e.id] = e.name })
          }
          if (Array.isArray(rawNames.divers)) {
            rawNames.divers.forEach(e => { if (e && e.id != null) namesMap.divers[e.id] = e.name })
          }

          // If rawNames is a flat map of id->string, merge into instances map for backward compatibility
          Object.keys(rawNames).forEach(k => {
            const v = rawNames[k]
            if (typeof v === 'string') {
              // ambiguous: store under instances as fallback
              namesMap.instances[k] = v
            }
          })
        }

        this.names = namesMap

        // Store raw fetched data so we can recompute when global config changes
        this._rawInstances = instRes.data
        this._rawMapping = mappingRes.data
        this._rawLoots = lootRes.data
        this._rawPrices = priceRes.data

        // Process and store only instancesRefined (pass raw data)
        this.createInstanceData(
          this._rawInstances,
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
            () => globalStore.config,
            (newVal) => {
              try {
                this.createInstanceData(this._rawInstances, this._rawMapping, this._rawLoots, this._rawPrices)
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
      if(isModulated) {
        switch(steles){
          case 1: return 0.60
          case 2: return 1.00
          case 3: return 1.40
          case 4: return 2.50
          case 5: return 4.00
          case 6: return 5.50
          case 7: return 6.00
          case 8: return 6.50
          case 9: return 6.80
          case 10: return 7.10
        }
      } else {
        switch(steles){
          case 1: return 0.60
          case 2: return 1.00
          case 3: return 1.20
          case 4: return 1.60
          case 5: return 1.88
          case 6: return 2.00
          case 7: return 2.05
          case 8: return 2.10
          case 9: return 2.15
          case 10: return 2.20
        }
      }
    },

    createInstanceData(instances, mapping, loots, prices){
      // access global config for rate adjustments
      const globalStore = useGlobalStore()

      // helper: compute adjusted rate depending on stasis, steles, booster, intervention and modulation
      const computeAdjustedRate = (baseRate, cfg = {}) => {
        const stasis = Number(cfg.stasis || 0)
        const steles = Number(cfg.steles || 0)
        const isModulated = !!cfg.isModulated
        const intervention = !!cfg.intervention

        const stasisFactor = this.getStasisBonus(stasis, isModulated)
        const stelesBonus = 1

        var boosterBonus = 1
        if(globalStore.config.isBooster === true){
          if(globalStore.config.server === 'ogrest' || globalStore.config.server === 'neo-ogrest'){ 
            boosterBonus = 1.50
          } else {
            boosterBonus = 1.25
          }
        }
        
        const interventionBonus = intervention ? 1.10 : 1

        let adjusted = baseRate * stasisFactor * stelesBonus * boosterBonus * interventionBonus

        // clamp to reasonable bounds to avoid runaway values
        const max = 1
        if (adjusted > max) adjusted = max

        console.log(`Base rate: ${baseRate}, Adjusted rate: ${adjusted} (stasis: ${stasis}, modulated: ${isModulated}, boosterBonus: ${boosterBonus}, intervention: ${intervention})`)
        return adjusted
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
                const lootStele = Number(lootEntry.stele || 0)
                const lootSteleIntervention = Number(lootEntry.steleIntervention || 0)
                
                // Include loot only if its stele requirements are <= config
                const steleOk = lootStele <= configSteles
                
                // Check steleIntervention based on config
                const steleInterventionOk = globalStore.config.intervention 
                  ? lootSteleIntervention <= configSteleIntervention
                  : lootSteleIntervention === 0
                
                return steleOk && steleInterventionOk
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
              steleIntervention: l.steleIntervention || 0
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
      const filteredEnriched = enriched.filter(inst => (inst.totalKamas || 0) >= minInstanceTotal)

      this.instancesRefined = filteredEnriched

      return enriched;
    },

    async loadNames(lang = 'fr') {
      try {
        const basePath = import.meta.env.BASE_URL
        const nameRes = await axios.get(`${basePath}names/${lang}.json`)

        const rawNames = nameRes.data
        const namesMap = { items: {}, monsters: {}, instances: {}, divers: {} }

        if (rawNames && typeof rawNames === 'object') {
          if (Array.isArray(rawNames.items)) {
            rawNames.items.forEach(e => { if (e && e.id != null) namesMap.items[e.id] = e.name })
          }
          if (Array.isArray(rawNames.monsters)) {
            rawNames.monsters.forEach(e => { if (e && e.id != null) namesMap.monsters[e.id] = e.name })
          }
          if (Array.isArray(rawNames.instances)) {
            rawNames.instances.forEach(e => { if (e && e.id != null) namesMap.instances[e.id] = e.name })
          }
          if (Array.isArray(rawNames.divers)) {
            rawNames.divers.forEach(e => { if (e && e.id != null) namesMap.divers[e.id] = e.name })
          }

          Object.keys(rawNames).forEach(k => {
            const v = rawNames[k]
            if (typeof v === 'string') {
              namesMap.instances[k] = v
            }
          })
        }

        this.names = namesMap
      } catch (e) {
        console.error("Erreur chargement langue", e)
      }
    }
  }
})