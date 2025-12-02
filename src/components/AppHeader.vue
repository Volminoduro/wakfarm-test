<script setup>
import LanguageSelector from './LanguageSelector.vue'
import FloatingConfig from './FloatingConfig.vue'
import { COLOR_CLASSES, TAB_SEPARATOR, ACTIVE_TAB_TEXT_SHADOW } from '../constants/colors'

import { useDataStore } from '../stores/useDataStore'

const props = defineProps({
  mainTab: {
    type: String,
    required: true
  },

})

const emit = defineEmits(['change-main-tab'])
const dataStore = useDataStore()

const t = (key) => dataStore.names?.divers?.[key] || key
</script>

<template>
  <header :class="['sticky top-0 left-0 right-0 shadow-xl z-40', COLOR_CLASSES.headerBg]">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-2 flex justify-between items-center">
      <h1 :class="['text-4xl font-bold', COLOR_CLASSES.titleHeader]" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wakfarm</h1>
      <LanguageSelector />
    </div>
    
    <!-- Configuration -->
    <FloatingConfig />
    
    <!-- Main Navigation Tabs -->
    <nav class="flex items-center">
      <button 
        @click="emit('change-main-tab', 'rentability')" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', COLOR_CLASSES.tabSeparator, mainTab === 'rentability' ? COLOR_CLASSES.activeMainTab : COLOR_CLASSES.inactiveMainTab]"
        :style="`border-right-color: ${TAB_SEPARATOR} !important; ${mainTab === 'rentability' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''}`">
        {{ t('tab_rentability') }}
      </button>
      <button 
        @click="emit('change-main-tab', 'runs')" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', COLOR_CLASSES.tabSeparator, mainTab === 'runs' ? COLOR_CLASSES.activeMainTab : COLOR_CLASSES.inactiveMainTab]"
        :style="`border-right-color: ${TAB_SEPARATOR} !important; ${mainTab === 'runs' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''}`">
        {{ t('tab_runs') }}
      </button>
      <button 
        @click="emit('change-main-tab', 'prices')" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', mainTab === 'prices' ? COLOR_CLASSES.activeMainTab : COLOR_CLASSES.inactiveMainTab]"
        :style="mainTab === 'prices' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''">
        {{ t('tab_prices') }}
      </button>
    </nav>
  </header>
</template>
