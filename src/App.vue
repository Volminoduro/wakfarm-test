<script setup>
import { onMounted } from 'vue'
import { useGlobalStore } from './stores/useGlobalStore'
import { useLocalStorage } from './composables/useLocalStorage'
import { COLOR_CLASSES } from './constants/colors'
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import RentabilityRunView from './views/RentabilityRunView.vue'
import RentabilityHourView from './views/RentabilityHourView.vue'
import PricesView from './views/PricesView.vue'


const globalStore = useGlobalStore()
const jsonStore = globalStore.jsonStore

// Tab state with localStorage persistence
const mainTab = useLocalStorage('wakfarm_mainTab', 'rentability')

// Tab change handlers
const setMainTab = (tab) => { mainTab.value = tab }

// Charger les données au montage
onMounted(async () => {
  await globalStore.initData(globalStore.config.server)
})

// Note: expanded state is now managed directly in RentabilityView for better control with manual runs
</script>

<template>
  <div :class="['min-h-screen flex flex-col', COLOR_CLASSES.bgPrimary]">

    <AppHeader 
      :mainTab="mainTab"
      @change-main-tab="setMainTab"
    />
    
    <main class="flex-grow">
      <div v-if="!jsonStore.loaded" class="p-8 text-center">
        <p :class="['text-lg', COLOR_CLASSES.textLoading]">Chargement des données...</p>
      </div>

      <RentabilityRunView v-if="mainTab === 'rentability'" />

      <RentabilityHourView v-else-if="mainTab === 'runs'" />

      <PricesView v-else-if="mainTab === 'prices'" />
    </main>
    
    <AppFooter />
  </div>
</template>
