<template>
  <div class="p-6">
    <div class="flex border-b mb-4">
      <button 
        @click="currentTab = 'run'" 
        :class="['px-4 py-2', currentTab === 'run' ? 'border-b-2 border-blue-500 font-bold' : '']">
        Kamas / Run
      </button>
      <button 
        @click="currentTab = 'time'" 
        :class="['px-4 py-2', currentTab === 'time' ? 'border-b-2 border-blue-500 font-bold' : '']">
        Kamas / Heure
      </button>
    </div>

    <div v-if="!dataStore.loaded">Chargement des données...</div>

    <div v-else-if="currentTab === 'run'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="inst in sortedInstances" 
        :key="inst.id" 
        class="border p-4 rounded shadow hover:shadow-md transition bg-white">
        
        <h3 class="font-bold text-lg">{{ dataStore.names[inst.name_key] || inst.name_key }}</h3>
        <p class="text-gray-600">Niv. {{ inst.level }}</p>
        
        <div class="mt-4 text-right">
          <span class="text-2xl font-bold text-yellow-600">
            {{ formatNumber(inst.computedValue) }} K
          </span>
          <span class="text-xs text-gray-500 block">estimé par run</span>
        </div>
      </div>
    </div>

    <div v-else>
      <p class="mb-4">Vos configurations personnalisées (Sauvegardées localement)</p>
      <div class="bg-yellow-50 p-4 border border-yellow-200 rounded">
        Work in progress: Configuration horaire
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import { useGlobalStore } from '../stores/useGlobalStore'

const currentTab = ref('run')
const dataStore = useDataStore()
const globalStore = useGlobalStore()

// Charger les données au montage
onMounted(() => {
  dataStore.loadAllData(globalStore.config.server)
})

// Calculer et trier les instances dynamiquement
const sortedInstances = computed(() => {
  if (!dataStore.loaded) return []
 
  return dataStore.instances.map(inst => {
    return {
      ...inst,
      computedValue: dataStore.calculateRunValue(inst.id, globalStore.config)
    }
  }).sort((a, b) => b.computedValue - a.computedValue) // Du plus rentable au moins rentable
})

function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num)
}
</script>