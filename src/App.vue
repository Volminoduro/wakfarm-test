<template>
  <div :class="['min-h-screen flex flex-col', COLOR_CLASSES.bgPrimary]">

    <AppHeader />
    
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

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { useJsonStore } from '@/stores/useJsonStore'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { COLOR_CLASSES } from '@/constants/colors'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import RentabilityRunView from '@/views/RentabilityRunView.vue'
import RentabilityHourView from '@/views/RentabilityHourView.vue'
import PricesView from '@/views/PricesView.vue'

const appStore = useAppStore()
const jsonStore = useJsonStore()

// Tab state with localStorage persistence (shared ref)
const mainTab = useLocalStorage('wakfarm_mainTab', 'rentability')

// Charger les données au montage
onMounted(async () => {
  await appStore.initData(appStore.config.server)
})

</script>
