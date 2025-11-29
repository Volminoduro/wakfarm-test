import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalStore = defineStore('global', () => {
  // Configuration du bandeau
  const config = ref({
    stasis: 1,
    steles: 0,
    isBooster: true,
    intervention: false,
    server: 'pandora' // Pour charger le bon fichier de prix
  })

  // Configuration locale (pour l'onglet "Kamas par heure")
  // On chargera ça depuis le localStorage au montage
  const userRotations = ref([]) 

  function updateConfig(newConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  return { config, userRotations, updateConfig }
})