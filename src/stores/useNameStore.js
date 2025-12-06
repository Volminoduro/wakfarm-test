import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

function parseNames(rawNames) {
  const namesMap = { items: {}, monsters: {}, instances: {}, divers: {} }
  if (!rawNames || typeof rawNames !== 'object') return namesMap
  const types = ['items', 'monsters', 'instances', 'divers']
  types.forEach(type => {
    if (Array.isArray(rawNames[type])) {
      rawNames[type].forEach(e => {
        if (e?.id != null) namesMap[type][e.id] = e.name
      })
    }
  })
  Object.entries(rawNames).forEach(([k, v]) => {
    if (typeof v === 'string') {
      namesMap.instances[k] = v
    }
  })
  return namesMap
}

export const useNameStore = defineStore('names', () => {
  const names = ref({ items: {}, monsters: {}, instances: {}, divers: {} })

  async function loadNames(lang = 'fr') {
    try {
      const basePath = import.meta.env.BASE_URL
      const nameRes = await axios.get(`${basePath}names/${lang}.json`)
      names.value = parseNames(nameRes.data)
      return names.value
    } catch (e) {
      console.error('Erreur chargement noms', e)
      names.value = { items: {}, monsters: {}, instances: {}, divers: {} }
      return names.value
    }
  }

  return { names, loadNames }
})
