import { defineStore } from 'pinia'
import axios from 'axios'

export const useDataStore = defineStore('data', {
  state: () => ({
    instancesRefined: [],
    names: {},
    loaded: false
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
        const namesMap = { items: {}, monsters: {}, instances: {} }

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

        // Process and store only instancesRefined (pass raw data)
        this.createInstanceData(
          instRes.data,
          mappingRes.data,
          lootRes.data,
          priceRes.data
        )
        this.loaded = true
      } catch (e) {
        console.error("Erreur chargement données", e)
      }
    },

    createInstanceData(instances, mapping, loots, prices){
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
      const instancesRefined = instances.map(inst => ({
        id: inst.id,
        level: inst.level,
        loots: mapping
          .filter(m => m.instanceId === inst.id)
          .map(m => {
            const monsterLoots = loots
              .filter(loot => loot.monsterId === m.monsterId)
              .map(loot => loot.loots)
            // Multiply quantity by monster count (m.number) and attach price
            return monsterLoots.flat().map(lootEntry => ({
              ...lootEntry,
              quantity: lootEntry.quantity * m.number,
              price: priceMap[lootEntry.itemId] || 0
            }))
          })
          .flat()
      }))

      // For each instance, build per-item subtotal and totalKamas
      const enriched = instancesRefined.map(inst => {
        const perItem = {}
        inst.loots.forEach(l => {
          const id = l.itemId
          const price = l.price || 0
          const qty = l.quantity || 0
          const rate = l.rate || 0
          const value = price * rate * qty

          if (!perItem[id]) {
            perItem[id] = {
              itemId: id,
              name: this.names && this.names.items ? this.names.items[id] || null : null,
              price: price,
              quantity: 0,
              subtotal: 0
            }
          }

          perItem[id].quantity += qty
          perItem[id].subtotal += value
        })

        const itemsBreakdown = Object.values(perItem).map(it => ({
          ...it,
          subtotal: Math.floor(it.subtotal),
          avg: Math.round((it.subtotal || 0) / (it.quantity || 1))
        })).sort((a, b) => b.subtotal - a.subtotal)

        const totalKamas = itemsBreakdown.reduce((s, it) => s + it.subtotal, 0)

        return {
          id: inst.id,
          level: inst.level,
          loots: inst.loots,
          items: itemsBreakdown,
          totalKamas: Math.floor(totalKamas)
        }
      })

      this.instancesRefined = enriched

      return enriched;
    },

    // Fonction clé : Estime les kamas pour une instance donnée
    calculateRunValue(instanceId, config) {
      if (!this.loaded) return 0;

      // Prefer precomputed totalKamas if present
      const inst = this.instancesRefined.find(i => i.id === instanceId)
      if (inst && typeof inst.totalKamas === 'number') return inst.totalKamas

      // Fallback: compute from loots
      let totalKamas = 0
      this.instancesRefined.filter(i => i.id === instanceId).forEach(i => {
        i.loots.forEach(loot => {
          totalKamas += (loot.price || 0) * (loot.rate || 0) * (loot.quantity || 0)
        })
      })

      return Math.floor(totalKamas)
    },

    async loadNames(lang = 'fr') {
      try {
        const basePath = import.meta.env.BASE_URL
        const nameRes = await axios.get(`${basePath}names/${lang}.json`)

        const rawNames = nameRes.data
        const namesMap = { items: {}, monsters: {}, instances: {} }

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