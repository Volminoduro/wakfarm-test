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

      console.log("prices :", prices);

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

      this.instancesRefined = instancesRefined
      console.log("instancesRefined :", instancesRefined);

      return instancesRefined;
    },

    // Fonction clé : Estime les kamas pour une instance donnée
    calculateRunValue(instanceId, config) {
        if (!this.loaded) return 0;

        let totalKamas = 0;

        this.instancesRefined.filter(inst => inst.id === instanceId).forEach(inst => {
            inst.loots.forEach(loot => {
                console.log("loot :", loot);
                totalKamas += loot.price * (loot.rate) * loot.quantity;
            });
        });

        return Math.floor(totalKamas);
    }
  }
})