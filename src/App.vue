<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from './stores/useDataStore'
import { useGlobalStore } from './stores/useGlobalStore'
import { useExpandableItems } from './composables/useExpandableItems'
import { STORAGE_KEYS } from './constants'
import { COLOR_CLASSES } from './constants/colors'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import RentabilityView from './views/RentabilityView.vue'
import RunsView from './views/RunsView.vue'
import PricesView from './views/PricesView.vue'

const dataStore = useDataStore()
const globalStore = useGlobalStore()

// Load saved tabs or use defaults
const savedMainTab = localStorage.getItem('wakfarm_mainTab') || 'rentability'
const savedSubTab = localStorage.getItem('wakfarm_subTab') || 'run'
const mainTab = ref(savedMainTab)
const subTab = ref(savedSubTab)

// Save tabs to localStorage when they change
const setMainTab = (tab) => {
  mainTab.value = tab
  localStorage.setItem('wakfarm_mainTab', tab)
}

const setSubTab = (tab) => {
  subTab.value = tab
  localStorage.setItem('wakfarm_subTab', tab)
}

// Charger les données au montage
onMounted(() => {
  const savedLanguage = localStorage.getItem('wakfarm_language') || 'fr'
  dataStore.loadAllData(globalStore.config.server, savedLanguage)
})

// Utiliser le composable pour gérer l'état d'expansion
const instances = computed(() => dataStore.instancesRefined)
const { expanded, toggleExpand, allExpanded, toggleAll } = useExpandableItems(
  STORAGE_KEYS.EXPANDED_INSTANCES,
  instances
)
</script>

<template>
  <div :class="['min-h-screen flex flex-col', COLOR_CLASSES.bgPrimary]">
    <AppHeader 
      :mainTab="mainTab"
      @change-main-tab="setMainTab"
    />
    
    <!-- Main Content -->
    <main class="flex-grow">
      <div v-if="!dataStore.loaded" class="p-8 text-center">
        <p :class="['text-lg', COLOR_CLASSES.textLoading]">Chargement des données...</p>
      </div>

      <!-- Rentability Tab -->
      <RentabilityView 
        v-if="mainTab === 'rentability'"
        :subTab="subTab"
        :expanded="expanded"
        :allExpanded="allExpanded"
        @toggleExpand="toggleExpand"
        @change-sub-tab="setSubTab"
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
