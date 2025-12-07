<template>
  <header ref="appHeaderRef" :class="['sticky top-0 left-0 right-0 shadow-xl z-40', COLOR_CLASSES.headerBg]">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-2 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <h1 :class="['text-4xl font-bold', COLOR_CLASSES.titleHeader]" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wakfarm</h1>
        
        <!-- Alerts handled by HeaderAlerts component -->
        <HeaderAlerts />
      </div>
      
      <LanguageSelector />
    </div>
    
    <FloatingFilter />
    
    <!-- Main Navigation Tabs -->
    <nav class="flex items-center">
      <button 
        @click="mainTab = 'rentability'" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', COLOR_CLASSES.tabSeparator, mainTab === 'rentability' ? COLOR_CLASSES.activeMainTab : COLOR_CLASSES.inactiveMainTab]"
        :style="`border-right-color: ${TAB_SEPARATOR} !important; ${mainTab === 'rentability' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''}`">
        {{ t('tab_rentability') }}
      </button>
      <button 
        @click="mainTab = 'runs'" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', COLOR_CLASSES.tabSeparator, mainTab === 'runs' ? COLOR_CLASSES.activeMainTab : COLOR_CLASSES.inactiveMainTab]"
        :style="`border-right-color: ${TAB_SEPARATOR} !important; ${mainTab === 'runs' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''}`">
        {{ t('tab_runs') }}
      </button>
      <button 
        @click="mainTab = 'prices'" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', mainTab === 'prices' ? COLOR_CLASSES.activeMainTab : COLOR_CLASSES.inactiveMainTab]"
        :style="mainTab === 'prices' ? `text-shadow: ${ACTIVE_TAB_TEXT_SHADOW};` : ''">
        {{ t('tab_prices') }}
      </button>
    </nav>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import FloatingFilter from '@/components/FloatingFilter.vue'
import HeaderAlerts from '@/components/HeaderAlerts.vue'
import { COLOR_CLASSES, TAB_SEPARATOR, ACTIVE_TAB_TEXT_SHADOW } from '@/constants/colors'
import { useNameStore } from '@/stores/useNameStore'
import { useLocalStorage } from '@/composables/useLocalStorage'

const mainTab = useLocalStorage('wakfarm_mainTab', 'rentability')
const nameStore = useNameStore()

const t = (key) => nameStore.names?.divers?.[key] || key

// Alerts are delegated to `HeaderAlerts` component

// Expose header height as a CSS variable so other views can stick just below it
const appHeaderRef = ref(null)
function updateHeaderHeight() {
  const h = appHeaderRef.value?.offsetHeight || 0
  document.documentElement.style.setProperty('--app-header-height', `${h}px`)
}

onMounted(() => {
  updateHeaderHeight()
  window.addEventListener('resize', updateHeaderHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHeaderHeight)
})
</script>
