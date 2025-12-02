<template>
  <header class="sticky top-0 left-0 right-0 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl z-40 border-b-2 border-amber-500">
    <!-- Top Bar: Title and Language Selector -->
    <div class="px-8 py-2 flex justify-between items-center">
      <h1 class="text-4xl font-bold text-amber-400" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Wakfarm</h1>
      <LanguageSelector />
    </div>
    
    <!-- Configuration -->
    <FloatingConfig />
    
    <!-- Main Navigation Tabs -->
    <nav class="px-1.5 flex items-center">
      <button 
        @click="emit('change-main-tab', 'rentability')" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', mainTab === 'rentability' ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Rentabilité
      </button>
      <button 
        @click="emit('change-main-tab', 'runs')" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', mainTab === 'runs' ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300']">
        Runs
      </button>
      <button 
        @click="emit('change-main-tab', 'prices')" 
        :class="['flex-1 py-2 transition-all font-semibold text-lg', mainTab === 'prices' ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300']">
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
