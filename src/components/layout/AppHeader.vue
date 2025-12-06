<template>
  <header ref="appHeaderRef" :class="['sticky top-0 left-0 right-0 shadow-xl z-40', COLOR_CLASSES.headerBg]">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-2 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <h1 :class="['text-4xl font-bold', COLOR_CLASSES.titleHeader]" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wakfarm</h1>
        
        <!-- Alert Icon with Tooltip -->
        <div v-if="alertLevel" class="relative group">
          <svg 
            class="w-8 h-8 cursor-help transition-transform group-hover:scale-110" 
            :class="alertLevel === 'danger' ? 'text-red-500' : 'text-orange-500'"
            fill="currentColor" 
            viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          
          <!-- Tooltip -->
          <div class="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-96">
            <div class="bg-gray-900 text-white rounded-lg shadow-2xl p-4 border-2" 
                 :class="alertLevel === 'danger' ? 'border-red-500' : 'border-orange-500'">
              <ul class="space-y-2">
                <li v-for="(warning, index) in warnings" :key="index" class="flex items-start gap-2">
                  <span class="text-lg flex-shrink-0" :class="warning.type === 'danger' ? 'text-red-500' : 'text-orange-500'">
                    {{ warning.type === 'danger' ? '●' : '▲' }}
                  </span>
                  <span class="text-sm">{{ warning.message }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import FloatingFilter from '@/components/FloatingFilter.vue'
import { COLOR_CLASSES, TAB_SEPARATOR, ACTIVE_TAB_TEXT_SHADOW } from '@/constants/colors'
import { useNameStore } from '@/stores/useNameStore'
import { useLocalStorage } from '@/composables/useLocalStorage'

const mainTab = useLocalStorage('wakfarm_mainTab', 'rentability')
const nameStore = useNameStore()

const t = (key) => nameStore.names?.divers?.[key] || key

// System for warnings and alerts
const warnings = computed(() => {
  const list = []
  // Example: Add your warnings here
  // list.push({ type: 'warning', message: 'Ceci est un avertissement' })
  // list.push({ type: 'danger', message: 'Ceci est un danger' })
  return list
})

// Determine the severity level (danger > warning)
const alertLevel = computed(() => {
  if (warnings.value.length === 0) return null
  const hasDanger = warnings.value.some(w => w.type === 'danger')
  return hasDanger ? 'danger' : 'warning'
})

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
