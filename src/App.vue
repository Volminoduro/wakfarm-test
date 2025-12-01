<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore } from './stores/useDataStore'
import { useGlobalStore } from './stores/useGlobalStore'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import RentabilityView from './views/RentabilityView.vue'
import RunsView from './views/RunsView.vue'
import PricesView from './views/PricesView.vue'

const dataStore = useDataStore()
const globalStore = useGlobalStore()
const mainTab = ref('rentability')
const subTab = ref('run')

// Charger les données au montage
onMounted(() => {
  const savedLanguage = localStorage.getItem('wakfarm_language') || 'fr'
  dataStore.loadAllData(globalStore.config.server, savedLanguage)
})

// Calculer et trier les instances dynamiquement
const sortedInstances = computed(() => {
  if (!dataStore.loaded) return []
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
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-900">
    <AppHeader 
      :mainTab="mainTab"
      @change-main-tab="mainTab = $event"
    />
    
    <!-- Main Content -->
    <main class="flex-grow">
      <div v-if="!dataStore.loaded" class="p-8 text-center">
        <p class="text-amber-400 text-lg">Chargement des données...</p>
      </div>

      <!-- Rentability Tab -->
      <RentabilityView 
        v-if="mainTab === 'rentability'"
        :subTab="subTab"
        :expanded="expanded"
        :allExpanded="allExpanded"
        @toggleExpand="toggleExpand"
        @change-sub-tab="subTab = $event"
        @toggle-all="toggleAll"
      />

      <!-- Runs Tab -->
      <RunsView v-else-if="mainTab === 'runs'" />

      <!-- Prices Tab -->
      <PricesView v-else-if="mainTab === 'prices'" />
    </main>
    
    <AppFooter />
  </div>
</template>
