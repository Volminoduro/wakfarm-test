<script setup>
import { onMounted } from 'vue'
import { useDataStore } from './stores/useDataStore'
import { useGlobalStore } from './stores/useGlobalStore'
import { useLocalStorage } from './composables/useLocalStorage'
import { COLOR_CLASSES } from './constants/colors'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import RentabilityView from './views/RentabilityView.vue'
import RunsView from './views/RunsView.vue'
import PricesView from './views/PricesView.vue'

const dataStore = useDataStore()
const globalStore = useGlobalStore()

// Tab state with localStorage persistence
const mainTab = useLocalStorage('wakfarm_mainTab', 'rentability')
const subTab = useLocalStorage('wakfarm_subTab', 'run')

// Tab change handlers
const setMainTab = (tab) => { mainTab.value = tab }
const setSubTab = (tab) => { subTab.value = tab }

// Charger les données au montage
onMounted(() => {
  const savedLanguage = localStorage.getItem('wakfarm_language') || 'fr'
  dataStore.loadAllData(globalStore.config.server, savedLanguage)
})

// Note: expanded state is now managed directly in RentabilityView for better control with manual runs
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
        @change-sub-tab="setSubTab"
      />

      <!-- Runs Tab -->
      <RunsView v-else-if="mainTab === 'runs'" />

      <!-- Prices Tab -->
      <PricesView v-else-if="mainTab === 'prices'" />
    </main>
    
    <AppFooter />
  </div>
</template>
