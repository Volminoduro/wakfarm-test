<template>
  <div class="pt-20">
    <div class="fixed top-0 left-0 right-0 bg-white z-10 flex border-b px-6 py-3">
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
      <div class="ml-auto flex items-center gap-2">
        <button @click.prevent="toggleAll" class="p-2 rounded hover:bg-gray-100" :title="allExpanded ? 'Tout réduire' : 'Tout développer'">
          <svg v-if="!allExpanded" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="!dataStore.loaded">Chargement des données...</div>

    <div v-else-if="currentTab === 'run'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      <InstanceCard 
        v-for="inst in sortedInstances" 
        :key="inst.id"
        :instance="inst"
        :isExpanded="expanded.has(inst.id)"
        :names="dataStore.names"
        @toggle="toggleExpand(inst.id)"
      />
    </div>

    <div v-else>
      <p class="mb-4 p-6">Vos configurations personnalisées (Sauvegardées localement)</p>
      <div class="bg-yellow-50 p-4 border border-yellow-200 rounded m-6">
        Work in progress: Configuration horaire
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from '../stores/useDataStore'
import { useGlobalStore } from '../stores/useGlobalStore'
import InstanceCard from '../components/InstanceCard.vue'

const currentTab = ref('run')
const dataStore = useDataStore()
const globalStore = useGlobalStore()

// Charger les données au montage
onMounted(() => {
  const savedLanguage = localStorage.getItem('wakfarm_language') || 'fr'
  dataStore.loadAllData(globalStore.config.server, savedLanguage)
})

// Calculer et trier les instances dynamiquement
const sortedInstances = computed(() => {
  if (!dataStore.loaded) return []

  // Use precomputed totalKamas (already sorted here)
  return dataStore.instancesRefined
    .map(inst => ({ ...inst }))
    .sort((a, b) => (b.totalKamas || 0) - (a.totalKamas || 0))
})

// Persist expanded state across reloads
const LS_KEY = 'expandedInstances_v1'
const initial = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
const expanded = ref(new Set(initial))

function toggleExpand(id) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
  // reassign to trigger reactivity consumers
  expanded.value = new Set(expanded.value)
}

const allExpanded = computed(() => {
  if (!dataStore.loaded) return false
  const ids = dataStore.instancesRefined.map(i => i.id)
  if (ids.length === 0) return false
  return ids.every(id => expanded.value.has(id))
})

function toggleAll() {
  if (allExpanded.value) collapseAll()
  else expandAll()
}

function expandAll() {
  const ids = dataStore.instancesRefined.map(i => i.id)
  expanded.value = new Set(ids)
}

function collapseAll() {
  expanded.value = new Set()
}

// Keep localStorage in sync
watch(expanded, (val) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...val]))
  } catch (e) {
    // ignore storage errors
  }
}, { deep: true })

function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(num)
}
</script>

<style scoped>
</style>