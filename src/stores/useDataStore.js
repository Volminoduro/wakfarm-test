import { defineStore } from 'pinia'
import axios from 'axios'

export const useDataStore = defineStore('data', {
  state: () => ({
    instances: [],
      instancesRefined: [],
    items: [],
    monsters: [],
    mapping: {},
    loots: [],
    prices: {},
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

        this.instances = instRes.data
        this.items = itemRes.data
        this.monsters = monsterRes.data
        this.mapping = mappingRes.data
        this.loots = lootRes.data
        this.prices = priceRes.data
        this.names = nameRes.data
        this.createInstanceData();
        this.loaded = true
      } catch (e) {
        console.error("Erreur chargement données", e)
      }
    },

    createInstanceData(){
      // Build a lookup map for prices: { itemId: price }
      let priceMap = {};
      if (Array.isArray(this.prices)) {
        this.prices.forEach(p => {
          priceMap[p.itemId] = p.price
        })
      } else if (this.prices && typeof this.prices === 'object') {
        // if already an object map
        priceMap = this.prices
      }

      console.log("this.prices :", this.prices);

      // For each instance, gather all loot entries (from mapping -> loots)
      const instancesRefined = this.instances.map(inst => ({
        id: inst.id,
        level: inst.level,
        loots: this.mapping
          .filter(m => m.instanceId === inst.id)
          .map(m => {
            const monsterLoots = this.loots
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