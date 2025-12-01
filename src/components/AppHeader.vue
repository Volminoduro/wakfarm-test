<template>
  <header class="sticky top-0 left-0 right-0 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl z-40 border-b-2 border-amber-500">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-5 flex justify-between items-center border-b border-slate-700">
      <h1 class="text-4xl font-bold text-amber-400" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wakfarm</h1>
      <LanguageSelector />
    </div>
    
    <!-- Configuration -->
    <div class="px-8 py-7 border-b border-slate-700">
      <FloatingConfig />
    </div>
    
    <!-- Main Navigation Tabs -->
    <nav class="px-8 flex items-center border-b border-slate-700">
      <button 
        @click="emit('change-main-tab', 'rentability')" 
        :class="['flex-1 py-5 transition-all font-semibold text-lg', mainTab === 'rentability' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Rentabilité
      </button>
      <button 
        @click="emit('change-main-tab', 'runs')" 
        :class="['flex-1 py-5 transition-all font-semibold text-lg', mainTab === 'runs' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Runs
      </button>
      <button 
        @click="emit('change-main-tab', 'prices')" 
        :class="['flex-1 py-5 transition-all font-semibold text-lg', mainTab === 'prices' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Prix
      </button>
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

})

const emit = defineEmits(['change-main-tab'])
</script>

<style scoped>
</style>
