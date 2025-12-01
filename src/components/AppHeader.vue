<template>
  <header class="fixed top-0 left-0 right-0 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl z-40 border-b-2 border-amber-500 overflow-hidden" style="height: 310px;">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-3 flex justify-between items-center border-b border-slate-700">
      <h1 class="text-3xl font-bold text-amber-400" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wakfarm</h1>
      <LanguageSelector />
    </div>
    
    <!-- Configuration -->
    <div class="px-8 py-4 border-b border-slate-700">
      <FloatingConfig />
    </div>
    
    <!-- Main Navigation Tabs -->
    <nav class="px-8 flex items-center border-b border-slate-700">
      <button 
        @click="emit('change-main-tab', 'rentability')" 
        :class="['px-6 py-3 transition-all font-semibold', mainTab === 'rentability' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Rentabilité
      </button>
      <button 
        @click="emit('change-main-tab', 'runs')" 
        :class="['px-6 py-3 transition-all font-semibold', mainTab === 'runs' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Runs
      </button>
      <button 
        @click="emit('change-main-tab', 'prices')" 
        :class="['px-6 py-3 transition-all font-semibold', mainTab === 'prices' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Prix
      </button>
    </nav>
    
    <!-- Sub Navigation - Always present to maintain fixed height -->
    <nav class="px-8 flex items-center bg-slate-800/50 border-b border-slate-700 h-10">
      <template v-if="mainTab === 'rentability'">
        <button 
          @click="emit('change-sub-tab', 'run')" 
          :class="['px-4 py-2 text-sm transition-all', subTab === 'run' ? 'border-b-2 border-amber-300 font-semibold text-amber-300' : 'text-slate-400 hover:text-amber-200']">
          Kamas / Run
        </button>
        <button 
          @click="emit('change-sub-tab', 'time')" 
          :class="['px-4 py-2 text-sm transition-all', subTab === 'time' ? 'border-b-2 border-amber-300 font-semibold text-amber-300' : 'text-slate-400 hover:text-amber-200']">
          Kamas / Heure
        </button>
        
        <div v-if="subTab === 'run'" class="ml-auto flex items-center gap-2">
          <button @click="emit('toggle-all')" class="p-2 rounded hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors" :title="allExpanded ? 'Tout réduire' : 'Tout développer'">
            <svg v-if="!allExpanded" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </template>
    </nav>
  </header>
</template>

<script setup>
import LanguageSelector from './LanguageSelector.vue'
import FloatingConfig from './FloatingConfig.vue'

const props = defineProps({
  mainTab: {
    type: String,
    required: true
  },
  subTab: {
    type: String,
    default: 'run'
  },
  allExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change-main-tab', 'change-sub-tab', 'toggle-all'])
</script>

<style scoped>
</style>
